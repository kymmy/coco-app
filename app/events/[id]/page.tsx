"use client";

import { useEffect, useState, useTransition, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getEvent,
  getGroups,
  updateEvent,
  deleteEvent,
  deleteEventSeries,
  rsvpToEvent,
  unrsvpFromEvent,
  addComment,
  deleteComment,
  addChecklistItem,
  claimChecklistItem,
  removeChecklistItem,
  addEventPhoto,
  removeEventPhoto,
} from "@/lib/actions";
import { useT, useI18n } from "@/lib/i18n";
import { useToast } from "@/lib/toast";

const OUTDOOR_CATEGORIES = ["parc", "balade", "sport", "piscine"];

const AVATAR_COLORS = [
  "bg-coral-400", "bg-sky-400", "bg-mint-400", "bg-lavender-400",
  "bg-pink-400", "bg-amber-400", "bg-coral-500", "bg-sky-500",
];

function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function Avatar({ name }: { name: string }) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${nameToColor(name)}`}
      title={name}
    >
      {initial}
    </span>
  );
}

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: Date;
}

interface ChecklistItemType {
  id: string;
  label: string;
  claimedBy: string | null;
  quantity: number;
}

interface EventPhoto {
  id: string;
  data: string;
  author: string;
  createdAt: Date;
}

interface CocoEvent {
  id: string;
  title: string;
  date: Date;
  endDate: Date | null;
  location: string;
  latitude: number | null;
  longitude: number | null;
  eventLink: string;
  description: string;
  image: string | null;
  category: string;
  price: string;
  maxParticipants: number | null;
  organizer: string;
  ageMin: number | null;
  ageMax: number | null;
  seriesId: string | null;
  groupId: string | null;
  group: { id: string; name: string; code: string } | null;
  createdAt: Date;
  attendees: { coming: string[]; maybe: string[]; cant: string[]; waitlist: string[] };
  photos: EventPhoto[];
  comments: Comment[];
  checklist: ChecklistItemType[];
}

interface WeatherData {
  tempMax: number;
  tempMin: number;
  weatherCode: number;
}

function formatDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatTime(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatCommentDate(date: Date, locale: string): string {
  return new Intl.DateTimeFormat(locale === "en" ? "en-US" : "fr-FR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function toLocalDatetime(date: Date): string {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}



function buildGoogleCalendarUrl(event: CocoEvent): string {
  const start = new Date(event.date);
  const end = event.endDate
    ? new Date(event.endDate)
    : new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${fmt(start)}/${fmt(end)}`,
    location: event.location,
    details:
      event.description + (event.eventLink ? `\n\n${event.eventLink}` : ""),
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function downloadICS(event: CocoEvent) {
  const start = new Date(event.date);
  const end = event.endDate
    ? new Date(event.endDate)
    : new Date(start.getTime() + 2 * 60 * 60 * 1000);

  const fmt = (d: Date) =>
    d
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Coco//Coco Events//FR",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${event.title}`,
    `LOCATION:${event.location}`,
    `DESCRIPTION:${event.description.replace(/\n/g, "\\n")}${event.eventLink ? "\\n\\n" + event.eventLink : ""}`,
    `ORGANIZER:${event.organizer}`,
    `UID:${event.id}@coco`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${event.title.replace(/[^a-zA-Z0-9\u00C0-\u017F ]/g, "").replace(/\s+/g, "_")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatAgeRange(min: number | null, max: number | null, t: Function): string | null {
  if (min != null && max != null) return t("age.range", min, max);
  if (min != null) return t("age.from", min);
  if (max != null) return t("age.upTo", max);
  return null;
}

function weatherCodeToLabel(code: number, t: Function): string {
  if (code === 0) return t("weather.clearSky");
  if (code <= 3) return t("weather.partlyCloudy");
  if (code <= 48) return t("weather.fog");
  if (code <= 57) return t("weather.drizzle");
  if (code <= 67) return t("weather.rain");
  if (code <= 77) return t("weather.snow");
  if (code <= 82) return t("weather.showers");
  if (code <= 86) return t("weather.snowShowers");
  if (code <= 99) return t("weather.thunderstorm");
  return t("weather.unknown");
}

function weatherCodeToEmoji(code: number): string {
  if (code === 0) return "\u2600\uFE0F";
  if (code <= 3) return "\u26C5";
  if (code <= 48) return "\uD83C\uDF2B\uFE0F";
  if (code <= 57) return "\uD83C\uDF27\uFE0F";
  if (code <= 67) return "\uD83C\uDF27\uFE0F";
  if (code <= 77) return "\uD83C\uDF28\uFE0F";
  if (code <= 82) return "\uD83C\uDF26\uFE0F";
  if (code <= 86) return "\uD83C\uDF28\uFE0F";
  if (code <= 99) return "\u26C8\uFE0F";
  return "\uD83C\uDF21\uFE0F";
}

function compressImage(
  file: File,
  maxWidth = 800,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

const inputClass =
  "w-full rounded-xl border-2 border-coral-200 bg-coral-50 px-4 py-3 text-charcoal placeholder:text-charcoal-faint focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-200 transition-colors";

// ---------- Address autocomplete hook ----------

interface AddressSuggestion {
  label: string;
  context: string;
  lat: number;
  lng: number;
}

function useAddressSearch(query: string) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`,
          { signal: controller.signal }
        );
        const data = await res.json();
        setSuggestions(
          data.features.map(
            (f: {
              properties: { label: string; context: string };
              geometry: { coordinates: [number, number] };
            }) => ({
              label: f.properties.label,
              context: f.properties.context,
              lng: f.geometry.coordinates[0],
              lat: f.geometry.coordinates[1],
            })
          )
        );
      } catch (e) {
        if ((e as Error).name !== "AbortError") setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  return { suggestions, loading };
}

// ---------- Weather Preview ----------

function WeatherPreview({
  event,
}: {
  event: CocoEvent;
}) {
  const t = useT();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (
      !event.latitude ||
      !event.longitude ||
      !OUTDOOR_CATEGORIES.includes(event.category)
    ) {
      setLoading(false);
      return;
    }

    const eventDate = new Date(event.date);
    if (eventDate < new Date()) {
      setLoading(false);
      return;
    }

    const abortController = new AbortController();

    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${event.latitude}&longitude=${event.longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`,
      { signal: abortController.signal }
    )
      .then((res) => res.json())
      .then((data) => {
        if (!data.daily) return;

        const eventDateStr = eventDate.toISOString().slice(0, 10);
        const dayIndex = data.daily.time.indexOf(eventDateStr);

        if (dayIndex !== -1) {
          setWeather({
            tempMax: data.daily.temperature_2m_max[dayIndex],
            tempMin: data.daily.temperature_2m_min[dayIndex],
            weatherCode: data.daily.weathercode[dayIndex],
          });
        }
      })
      .catch(() => {
        // Silently fail - just don't show weather
      })
      .finally(() => setLoading(false));

    return () => abortController.abort();
  }, [event.latitude, event.longitude, event.category, event.date]);

  if (loading || !weather) return null;

  return (
    <div className="mb-4 inline-flex items-center gap-2 rounded-2xl bg-sky-50 px-4 py-2">
      <span className="text-2xl">{weatherCodeToEmoji(weather.weatherCode)}</span>
      <div>
        <p className="text-sm font-bold text-sky-700">
          {weather.tempMin}&deg; / {weather.tempMax}&deg;C
        </p>
        <p className="text-xs text-sky-500">
          {weatherCodeToLabel(weather.weatherCode, t)}
        </p>
      </div>
    </div>
  );
}

// ---------- Photo Gallery ----------

function PhotoGallery({
  eventId,
  photos: initialPhotos,
  isOrganizer,
}: {
  eventId: string;
  photos: EventPhoto[];
  isOrganizer: boolean;
}) {
  const t = useT();
  const [photos, setPhotos] = useState(initialPhotos);
  const [isPending, startTransition] = useTransition();
  const [username, setUsername] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<EventPhoto | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("coco_username");
    if (saved) setUsername(saved);
  }, []);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !username) return;

    let imageData: string;
    try {
      imageData = await compressImage(file);
    } catch {
      const reader = new FileReader();
      imageData = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }

    startTransition(async () => {
      const result = await addEventPhoto(eventId, imageData, username);
      if (result.photo) {
        setPhotos((prev) => [result.photo, ...prev]);
      }
    });

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemove(photoId: string) {
    startTransition(async () => {
      await removeEventPhoto(photoId);
      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    });
  }

  return (
    <div>
      <h3 className="mb-4 text-lg font-extrabold text-charcoal">
        {t("photos.title")} ({photos.length})
      </h3>

      {username && (
        <div className="mb-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className="rounded-full bg-coral-500 px-5 py-2.5 text-sm font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95 disabled:opacity-50"
          >
            {isPending ? t("photos.uploading") : t("photos.addPhoto")}
          </button>
        </div>
      )}

      {photos.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.data}
                alt={`Photo par ${photo.author}`}
                className="h-40 w-full cursor-pointer object-cover transition-transform hover:scale-105"
                loading="lazy"
                onClick={() => setLightboxPhoto(photo)}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2">
                <p className="text-xs font-semibold text-white">
                  {photo.author}
                </p>
              </div>
              {(isOrganizer ||
                username.toLowerCase() === photo.author.toLowerCase()) && (
                <button
                  onClick={() => handleRemove(photo.id)}
                  disabled={isPending}
                  className="absolute top-2 right-2 rounded-full bg-white/80 px-2 py-1 text-xs font-bold text-pink-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-card disabled:opacity-50"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setLightboxPhoto(null)}
        >
          <button
            onClick={() => setLightboxPhoto(null)}
            className="absolute top-4 right-4 rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/40"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightboxPhoto.data}
            alt={`Photo par ${lightboxPhoto.author}`}
            className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="absolute bottom-6 text-sm font-semibold text-white/80">
            {lightboxPhoto.author}
          </p>
        </div>
      )}

      {photos.length === 0 && (
        <p className="text-sm text-charcoal-muted">
          {t("photos.noPhotos")}
        </p>
      )}
    </div>
  );
}

// ---------- Edit Form ----------

function EditForm({
  event,
  onCancel,
  onSaved,
}: {
  event: CocoEvent;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState(event.location);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    event.latitude && event.longitude
      ? { lat: event.latitude, lng: event.longitude }
      : null
  );
  const [selectedGroupId, setSelectedGroupId] = useState(event.groupId || "");
  const [myGroups, setMyGroups] = useState<{ id: string; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { suggestions, loading } = useAddressSearch(location);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const groupIds = JSON.parse(localStorage.getItem("coco_groups") || "[]") as string[];
    if (groupIds.length > 0) {
      getGroups(groupIds).then(setMyGroups);
    }
  }, []);

  const CATEGORIES = [
    { value: "atelier", label: t("cat.atelier") },
    { value: "balade", label: t("cat.balade") },
    { value: "brunch", label: t("cat.brunch") },
    { value: "gouter", label: t("cat.gouter") },
    { value: "musee", label: t("cat.musee") },
    { value: "parc", label: t("cat.parc") },
    { value: "piscine", label: t("cat.piscine") },
    { value: "restaurant", label: t("cat.restaurant") },
    { value: "spectacle", label: t("cat.spectacle") },
    { value: "sport", label: t("cat.sport") },
    { value: "autre", label: t("cat.autre") },
  ];

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
      setShowSuggestions(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  function handleSubmit(formData: FormData) {
    formData.set("location", location);
    if (coords) {
      formData.set("latitude", String(coords.lat));
      formData.set("longitude", String(coords.lng));
    }
    startTransition(async () => {
      const result = await updateEvent(event.id, formData);
      if (result?.error) {
        setError(result.error);
      } else {
        onSaved();
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-pink-50 px-4 py-3 text-sm font-semibold text-pink-500">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="edit-title" className="mb-1 block text-sm font-bold text-charcoal">{t("edit.title")}</label>
        <input type="text" id="edit-title" name="title" required defaultValue={event.title} className={inputClass} />
      </div>

      <div>
        <label htmlFor="edit-category" className="mb-1 block text-sm font-bold text-charcoal">{t("edit.category")}</label>
        <select id="edit-category" name="category" defaultValue={event.category} className={`${inputClass} cursor-pointer`}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="edit-organizer" className="mb-1 block text-sm font-bold text-charcoal">{t("edit.organizer")}</label>
        <input type="text" id="edit-organizer" name="organizer" required defaultValue={event.organizer} className={inputClass} />
      </div>

      {myGroups.length > 0 && (
        <div>
          <label htmlFor="edit-groupId" className="mb-1 block text-sm font-bold text-charcoal">{t("create.group")}</label>
          <select
            id="edit-groupId"
            name="groupId"
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className={`${inputClass} cursor-pointer`}
          >
            <option value="">{t("create.noGroup")}</option>
            {myGroups.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="edit-date" className="mb-1 block text-sm font-bold text-charcoal">{t("edit.start")}</label>
          <input type="datetime-local" id="edit-date" name="date" required defaultValue={toLocalDatetime(event.date)} className={`${inputClass} datetime-input`} />
        </div>
        <div>
          <label htmlFor="edit-endDate" className="mb-1 block text-sm font-bold text-charcoal">{t("edit.end")}</label>
          <input type="datetime-local" id="edit-endDate" name="endDate" defaultValue={event.endDate ? toLocalDatetime(event.endDate) : ""} className={`${inputClass} datetime-input`} />
        </div>
      </div>

      <div ref={wrapperRef} className="relative">
        <label htmlFor="edit-location" className="mb-1 block text-sm font-bold text-charcoal">{t("edit.location")}</label>
        <input
          type="text"
          id="edit-location"
          required
          value={location}
          onChange={(e) => { setLocation(e.target.value); setShowSuggestions(true); }}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          autoComplete="off"
          className={inputClass}
        />
        {showSuggestions && (suggestions.length > 0 || loading) && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border-2 border-coral-200 bg-card shadow-lg">
            {loading && suggestions.length === 0 && (
              <li className="px-4 py-3 text-sm text-charcoal-muted">{t("edit.searching")}</li>
            )}
            {suggestions.map((s) => (
              <li key={s.label}>
                <button
                  type="button"
                  onClick={() => { setLocation(s.label); setCoords({ lat: s.lat, lng: s.lng }); setShowSuggestions(false); }}
                  className="w-full px-4 py-3 text-left transition-colors hover:bg-coral-50"
                >
                  <span className="block text-sm font-semibold text-charcoal">{s.label}</span>
                  <span className="block text-xs text-charcoal-muted">{s.context}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="edit-price" className="mb-1 block text-sm font-bold text-charcoal">{t("edit.price")}</label>
          <input type="text" id="edit-price" name="price" defaultValue={event.price} className={inputClass} />
        </div>
        <div>
          <label htmlFor="edit-max" className="mb-1 block text-sm font-bold text-charcoal">{t("edit.maxSpots")}</label>
          <input type="number" id="edit-max" name="maxParticipants" min="2" defaultValue={event.maxParticipants ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="edit-ageMin" className="mb-1 block text-sm font-bold text-charcoal">{t("edit.ageMin")}</label>
          <input type="number" id="edit-ageMin" name="ageMin" min="0" max="17" defaultValue={event.ageMin ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="edit-ageMax" className="mb-1 block text-sm font-bold text-charcoal">{t("edit.ageMax")}</label>
          <input type="number" id="edit-ageMax" name="ageMax" min="0" max="17" defaultValue={event.ageMax ?? ""} className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="edit-description" className="mb-1 block text-sm font-bold text-charcoal">{t("edit.description")}</label>
        <textarea id="edit-description" name="description" required rows={4} defaultValue={event.description} className={`${inputClass} resize-none`} />
      </div>

      <div>
        <label htmlFor="edit-eventLink" className="mb-1 block text-sm font-bold text-charcoal">{t("edit.externalLink")}</label>
        <input type="url" id="edit-eventLink" name="eventLink" defaultValue={event.eventLink} className={inputClass} />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-full bg-coral-500 px-6 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95 disabled:opacity-50"
        >
          {isPending ? t("edit.saving") : t("edit.save")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border-2 border-charcoal-faint px-6 py-3 font-semibold text-charcoal-muted hover:bg-card-hover transition-colors"
        >
          {t("edit.cancel")}
        </button>
      </div>
    </form>
  );
}

// ---------- Comment Section ----------

function CommentSection({
  eventId,
  comments: initialComments,
}: {
  eventId: string;
  comments: Comment[];
}) {
  const t = useT();
  const { locale } = useI18n();
  const [comments, setComments] = useState(initialComments);
  const [author, setAuthor] = useState("");
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("coco_username");
    if (saved) setAuthor(saved);
  }, []);

  function handleSubmit() {
    if (!author.trim() || !content.trim()) return;
    localStorage.setItem("coco_username", author.trim());
    startTransition(async () => {
      const result = await addComment(eventId, author.trim(), content.trim());
      if (result.error) {
        setError(result.error);
      } else if (result.comment) {
        setComments((prev) => [...prev, result.comment]);
        setContent("");
        setError(null);
      }
    });
  }

  function handleDelete(commentId: string) {
    startTransition(async () => {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    });
  }

  const currentUser = typeof window !== "undefined" ? localStorage.getItem("coco_username") || "" : "";

  return (
    <div>
      <h3 className="mb-4 text-lg font-extrabold text-charcoal">
        {t("comments.title")} ({comments.length})
      </h3>

      {comments.length > 0 && (
        <div className="mb-4 space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-2xl bg-coral-50 px-4 py-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-bold text-charcoal">
                  {c.author}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-charcoal-faint">
                    {formatCommentDate(c.createdAt, locale)}
                  </span>
                  {currentUser && currentUser.toLowerCase() === c.author.toLowerCase() && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      disabled={isPending}
                      className="text-xs text-charcoal-faint hover:text-pink-500 transition-colors disabled:opacity-50"
                      title={t("comments.delete")}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-charcoal-light">
                {c.content.split(/(@\w+)/g).map((part, i) =>
                  /^@\w+$/.test(part) ? (
                    <span key={i} className="font-bold text-coral-500">{part}</span>
                  ) : (
                    part
                  )
                )}
              </p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mb-3 rounded-xl bg-pink-50 px-4 py-2 text-sm font-semibold text-pink-500">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <input
          type="text"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          placeholder={t("comments.firstName")}
          className={inputClass}
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder={t("comments.message")}
            className={`flex-1 ${inputClass}`}
          />
          <button
            onClick={handleSubmit}
            disabled={isPending || !author.trim() || !content.trim()}
            className="rounded-full bg-coral-500 px-5 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95 disabled:opacity-50"
          >
            {isPending ? "..." : t("comments.send")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Checklist Section ----------

function ChecklistSection({
  eventId,
  checklist: initialChecklist,
  isOrganizer,
}: {
  eventId: string;
  checklist: ChecklistItemType[];
  isOrganizer: boolean;
}) {
  const t = useT();
  const [items, setItems] = useState(initialChecklist);
  const [newLabel, setNewLabel] = useState("");
  const [newQuantity, setNewQuantity] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [username, setUsername] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("coco_username");
    if (saved) setUsername(saved);
  }, []);

  function handleAdd() {
    if (!newLabel.trim()) return;
    startTransition(async () => {
      const result = await addChecklistItem(eventId, newLabel.trim(), newQuantity);
      if (result.item) {
        setItems((prev) => [...prev, result.item]);
        setNewLabel("");
        setNewQuantity(1);
      }
    });
  }

  function handleClaim(itemId: string) {
    if (!username) return;
    startTransition(async () => {
      const result = await claimChecklistItem(itemId, username);
      if (result.item) {
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? result.item : i))
        );
      }
    });
  }

  function handleUnclaim(itemId: string) {
    startTransition(async () => {
      const result = await claimChecklistItem(itemId, "");
      if (result.item) {
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...result.item, claimedBy: null } : i))
        );
      }
    });
  }

  function handleRemove(itemId: string) {
    startTransition(async () => {
      await removeChecklistItem(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    });
  }

  return (
    <div>
      <h3 className="mb-4 text-lg font-extrabold text-charcoal">
        {t("checklist.title")} ({items.filter((i) => i.claimedBy).length}/{items.length})
      </h3>

      {items.length > 0 && (
        <div className="mb-4 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between rounded-2xl px-4 py-3 ${
                item.claimedBy ? "bg-mint-100" : "bg-coral-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`text-lg ${item.claimedBy ? "opacity-50" : ""}`}>
                  {item.claimedBy ? "\u2705" : "\uD83D\uDCCB"}
                </span>
                <div>
                  <span
                    className={`text-sm font-semibold ${
                      item.claimedBy
                        ? "text-charcoal-muted line-through"
                        : "text-charcoal"
                    }`}
                  >
                    {item.label}
                    {item.quantity > 1 && (
                      <span className="ml-1 text-xs text-charcoal-muted">
                        (x{item.quantity})
                      </span>
                    )}
                  </span>
                  {item.claimedBy && (
                    <span className="ml-2 text-xs font-semibold text-mint-500">
                      &mdash; {item.claimedBy}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!item.claimedBy && username && (
                  <button
                    onClick={() => handleClaim(item.id)}
                    disabled={isPending}
                    className="rounded-full bg-coral-500 px-3 py-1.5 text-xs font-bold text-white transition-all hover:bg-coral-400 active:scale-95 disabled:opacity-50"
                  >
                    {t("checklist.illTakeCare")}
                  </button>
                )}
                {item.claimedBy === username && (
                  <button
                    onClick={() => handleUnclaim(item.id)}
                    disabled={isPending}
                    className="rounded-full border border-charcoal-faint px-3 py-1.5 text-xs font-semibold text-charcoal-muted hover:bg-card transition-colors disabled:opacity-50"
                  >
                    {t("checklist.cancel")}
                  </button>
                )}
                {isOrganizer && (
                  <button
                    onClick={() => handleRemove(item.id)}
                    disabled={isPending}
                    className="text-xs text-charcoal-faint hover:text-pink-500 transition-colors disabled:opacity-50"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new item */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder={t("checklist.placeholder")}
          className={`flex-1 ${inputClass}`}
        />
        <input
          type="number"
          value={newQuantity}
          onChange={(e) => setNewQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          min="1"
          max="99"
          className="w-14 shrink-0 rounded-xl border-2 border-coral-200 bg-coral-50 px-2 py-3 text-center text-charcoal focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-200 transition-colors [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          title={t("checklist.quantity")}
        />
        <button
          onClick={handleAdd}
          disabled={isPending || !newLabel.trim()}
          className="rounded-full bg-coral-500 px-5 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95 disabled:opacity-50"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ---------- Main Page ----------

export default function EventDetailPage() {
  const t = useT();
  const { locale } = useI18n();
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const CATEGORIES = [
    { value: "atelier", label: t("cat.atelier") },
    { value: "balade", label: t("cat.balade") },
    { value: "brunch", label: t("cat.brunch") },
    { value: "gouter", label: t("cat.gouter") },
    { value: "musee", label: t("cat.musee") },
    { value: "parc", label: t("cat.parc") },
    { value: "piscine", label: t("cat.piscine") },
    { value: "restaurant", label: t("cat.restaurant") },
    { value: "spectacle", label: t("cat.spectacle") },
    { value: "sport", label: t("cat.sport") },
    { value: "autre", label: t("cat.autre") },
  ];
  const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
    CATEGORIES.map((c) => [c.value, c.label])
  );

  const [event, setEvent] = useState<CocoEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showRsvp, setShowRsvp] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<"coming" | "maybe">("coming");
  const [subscribeName, setSubscribeName] = useState("");
  const [justSubscribed, setJustSubscribed] = useState(false);
  const [wasWaitlisted, setWasWaitlisted] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteSeriesConfirm, setShowDeleteSeriesConfirm] = useState(false);
  const [shared, setShared] = useState(false);

  const loadEvent = useCallback(() => {
    getEvent(id).then((data) => {
      setEvent(data as CocoEvent | null);
      setLoading(false);
    });
  }, [id]);

  useEffect(() => {
    loadEvent();
  }, [loadEvent]);

  useEffect(() => {
    const saved = localStorage.getItem("coco_username");
    if (saved) setSubscribeName(saved);
  }, []);

  function getUsernameFromStorage(): string {
    return localStorage.getItem("coco_username") || "";
  }

  function isUserInAnyList(): boolean {
    if (!event) return false;
    const saved = getUsernameFromStorage().toLowerCase();
    if (!saved) return false;
    return (
      event.attendees.coming.some((n) => n.toLowerCase() === saved) ||
      event.attendees.maybe.some((n) => n.toLowerCase() === saved) ||
      event.attendees.cant.some((n) => n.toLowerCase() === saved) ||
      event.attendees.waitlist.some((n) => n.toLowerCase() === saved)
    );
  }

  function handleRsvp(status: "coming" | "maybe") {
    const name = subscribeName.trim();
    if (!name) {
      setRsvpStatus(status);
      setShowRsvp(true);
      return;
    }
    localStorage.setItem("coco_username", name);
    startTransition(async () => {
      const result = await rsvpToEvent(id, name, status);
      if (result.error) {
        setSubscribeError(result.error);
      } else if (result.attendees) {
        setEvent((prev) =>
          prev ? { ...prev, attendees: result.attendees } : prev
        );
        setShowRsvp(false);
        setJustSubscribed(true);
        setWasWaitlisted(result.wasWaitlisted || false);
        setSubscribeError(null);
      }
    });
  }

  function handleUnrsvp() {
    const name = getUsernameFromStorage().trim();
    if (!name) return;
    startTransition(async () => {
      const result = await unrsvpFromEvent(id, name);
      if (result.error) {
        setSubscribeError(result.error);
      } else if (result.attendees) {
        setEvent((prev) =>
          prev ? { ...prev, attendees: result.attendees } : prev
        );
        setJustSubscribed(false);
        setWasWaitlisted(false);
        setSubscribeError(null);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteEvent(id);
    });
  }

  function handleDeleteSeries() {
    if (!event?.seriesId) return;
    startTransition(async () => {
      await deleteEventSeries(event.seriesId!);
    });
  }

  async function handleShare() {
    const url = window.location.href;
    const text = event ? `${event.title} — ${event.location}` : "Sortie Coco";

    if (navigator.share) {
      try {
        await navigator.share({ title: text, url });
        return;
      } catch {
        // User cancelled or not supported, fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(url);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
  }

  function handleShareWhatsApp() {
    if (!event) return;
    const url = window.location.href;
    const text = `${event.title} — ${event.location}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
    window.open(whatsappUrl, "_blank");
  }

  function isOrganizer(): boolean {
    if (!event) return false;
    const saved = localStorage.getItem("coco_username");
    return saved?.toLowerCase() === event.organizer.toLowerCase();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-coral-100 to-cream px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 h-4 w-32 rounded bg-coral-100" />
          <div className="animate-pulse overflow-hidden rounded-3xl bg-card shadow-lg">
            <div className="h-64 w-full bg-coral-100" />
            <div className="p-6 sm:p-8">
              <div className="mb-3 flex gap-2">
                <div className="h-6 w-16 rounded-full bg-coral-100" />
                <div className="h-6 w-24 rounded-full bg-lavender-100" />
                <div className="h-6 w-14 rounded-full bg-mint-100" />
              </div>
              <div className="mb-2 h-8 w-3/4 rounded-lg bg-coral-100" />
              <div className="mb-1 h-5 w-1/2 rounded bg-coral-50" />
              <div className="mb-1 h-5 w-2/3 rounded bg-coral-50" />
              <div className="mb-4 h-5 w-1/3 rounded bg-coral-50" />
              <div className="mb-6 space-y-2">
                <div className="h-4 w-full rounded bg-coral-50" />
                <div className="h-4 w-full rounded bg-coral-50" />
                <div className="h-4 w-2/3 rounded bg-coral-50" />
              </div>
              <div className="mb-6 flex flex-wrap gap-2">
                <div className="h-10 w-28 rounded-full bg-coral-100" />
                <div className="h-10 w-28 rounded-full bg-sky-100" />
                <div className="h-10 w-28 rounded-full bg-lavender-100" />
              </div>
              <div className="rounded-2xl bg-coral-50 p-4">
                <div className="mb-2 h-4 w-1/3 rounded bg-coral-100" />
                <div className="flex gap-1.5">
                  <div className="h-7 w-16 rounded-full bg-mint-100" />
                  <div className="h-7 w-20 rounded-full bg-mint-100" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-coral-100 to-cream px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl bg-card p-12 text-center shadow-md">
            <p className="mb-2 text-5xl">🤷</p>
            <p className="text-lg font-bold text-charcoal">
              {t("detail.notFound")}
            </p>
            <Link
              href="/events"
              className="mt-6 inline-flex rounded-full bg-coral-500 px-8 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95"
            >
              {t("detail.backToEvents")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const isPast = new Date(event.date) < new Date();
  const isFull =
    event.maxParticipants != null &&
    event.attendees.coming.length >= event.maxParticipants;
  const ageRange = formatAgeRange(event.ageMin, event.ageMax, t);
  const spotsLeft =
    event.maxParticipants != null
      ? event.maxParticipants - event.attendees.coming.length
      : null;
  const userAlreadyRsvped = isUserInAnyList();

  return (
    <main className="min-h-screen bg-gradient-to-b from-coral-100 to-cream px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/events"
          className="mb-6 inline-flex items-center text-sm font-semibold text-coral-500 hover:text-coral-400 transition-colors"
        >
          <span className="mr-1">&larr;</span> {t("detail.allEvents")}
        </Link>

        <div className="overflow-hidden rounded-3xl bg-card shadow-lg">
          {event.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.image}
              alt={event.title}
              className="h-64 w-full object-cover"
              loading="lazy"
            />
          )}

          <div className="p-6 sm:p-8">
            {editing ? (
              <EditForm
                event={event}
                onCancel={() => setEditing(false)}
                onSaved={() => {
                  setEditing(false);
                  loadEvent();
                }}
              />
            ) : (
              <>
                {/* Badges */}
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-block rounded-full bg-coral-100 px-3 py-1 text-xs font-bold text-coral-500">
                    {isPast ? t("events.past") : t("events.upcoming")}
                  </span>
                  <span className="inline-block rounded-full bg-lavender-100 px-3 py-1 text-xs font-bold text-lavender-500">
                    {CATEGORY_LABELS[event.category] || event.category}
                  </span>
                  {event.price && event.price !== "Gratuit" ? (
                    <span className="inline-block rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-500">
                      💰 {event.price}
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-mint-100 px-3 py-1 text-xs font-bold text-mint-500">
                      {t("events.free")}
                    </span>
                  )}
                  {ageRange && (
                    <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-500">
                      👶 {ageRange}
                    </span>
                  )}
                  {event.seriesId && (
                    <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-500">
                      🔁 {t("events.recurring")}
                    </span>
                  )}
                </div>

                <h1 className="mb-2 text-2xl font-extrabold text-charcoal sm:text-3xl">
                  {event.title}
                </h1>

                <p className="mb-1 text-charcoal-light">📍 {event.location}</p>

                <p className="mb-1 font-semibold text-coral-500">
                  📅 {formatDate(event.date, locale)}
                  {event.endDate && ` \u2192 ${formatTime(event.endDate, locale)}`}
                </p>

                {/* Weather Preview for future outdoor events */}
                {!isPast &&
                  OUTDOOR_CATEGORIES.includes(event.category) &&
                  event.latitude &&
                  event.longitude && (
                    <WeatherPreview event={event} />
                  )}

                <p className="mb-4 text-sm text-charcoal-muted">
                  {t("events.organizedBy")}{" "}
                  <span className="font-semibold text-charcoal">
                    {event.organizer}
                  </span>
                </p>

                <p className="mb-6 whitespace-pre-line text-charcoal-light">
                  {event.description}
                </p>

                {event.eventLink && (
                  <a
                    href={event.eventLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-6 inline-block text-sm font-semibold text-sky-500 hover:underline"
                  >
                    🔗 {t("events.viewLink")}
                  </a>
                )}

                {/* Action buttons: share + calendar + edit/delete/duplicate */}
                <div className="mb-6 flex flex-wrap gap-2">
                  <button
                    onClick={handleShare}
                    className="rounded-full border-2 border-coral-200 px-5 py-2 text-sm font-bold text-coral-500 transition-all hover:bg-coral-50 active:scale-95"
                  >
                    {shared ? t("detail.linkCopied") : t("detail.share")}
                  </button>

                  <button
                    onClick={handleShareWhatsApp}
                    className="rounded-full bg-[#25D366] px-5 py-2 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                  >
                    WhatsApp
                  </button>

                  <a
                    href={buildGoogleCalendarUrl(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border-2 border-sky-200 px-5 py-2 text-sm font-bold text-sky-500 transition-all hover:bg-sky-100 active:scale-95"
                  >
                    {t("detail.gCal")}
                  </a>

                  <button
                    onClick={() => downloadICS(event)}
                    className="rounded-full border-2 border-lavender-200 px-5 py-2 text-sm font-bold text-lavender-500 transition-all hover:bg-lavender-100 active:scale-95"
                  >
                    {t("detail.downloadIcs")}
                  </button>

                  {isOrganizer() && (
                    <>
                      <button
                        onClick={() => setEditing(true)}
                        className="rounded-full border-2 border-lavender-200 px-5 py-2 text-sm font-bold text-lavender-500 transition-all hover:bg-lavender-100 active:scale-95"
                      >
                        {t("detail.edit")}
                      </button>
                      <button
                        onClick={() => router.push(`/create?duplicate=${event.id}`)}
                        className="rounded-full border-2 border-sky-200 px-5 py-2 text-sm font-bold text-sky-500 hover:bg-sky-100"
                      >
                        {t("detail.duplicate")}
                      </button>
                      {!showDeleteConfirm ? (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="rounded-full border-2 border-pink-200 px-5 py-2 text-sm font-bold text-pink-500 transition-all hover:bg-pink-100 active:scale-95"
                        >
                          {t("detail.delete")}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-pink-500 font-semibold">{t("detail.confirm")}</span>
                          <button
                            onClick={handleDelete}
                            disabled={isPending}
                            className="rounded-full bg-pink-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-pink-400 active:scale-95 disabled:opacity-50"
                          >
                            {isPending ? "..." : t("detail.yesDelete")}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="rounded-full border-2 border-charcoal-faint px-4 py-2 text-sm font-semibold text-charcoal-muted hover:bg-card-hover"
                          >
                            {t("detail.no")}
                          </button>
                        </div>
                      )}
                      {event.seriesId && (
                        !showDeleteSeriesConfirm ? (
                          <button
                            onClick={() => setShowDeleteSeriesConfirm(true)}
                            className="rounded-full border-2 border-pink-200 px-5 py-2 text-sm font-bold text-pink-500 transition-all hover:bg-pink-100 active:scale-95"
                          >
                            {t("detail.deleteSeries")}
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-pink-500 font-semibold">{t("detail.deleteSeriesConfirm")}</span>
                            <button
                              onClick={handleDeleteSeries}
                              disabled={isPending}
                              className="rounded-full bg-pink-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-pink-400 active:scale-95 disabled:opacity-50"
                            >
                              {isPending ? "..." : t("detail.yesDeleteSeries")}
                            </button>
                            <button
                              onClick={() => setShowDeleteSeriesConfirm(false)}
                              className="rounded-full border-2 border-charcoal-faint px-4 py-2 text-sm font-semibold text-charcoal-muted hover:bg-card-hover"
                            >
                              {t("detail.no")}
                            </button>
                          </div>
                        )
                      )}
                    </>
                  )}
                </div>

                {/* Participants */}
                <div className="mb-6 rounded-2xl bg-coral-50 p-4">
                  <p className="mb-2 text-sm font-bold text-charcoal">
                    {event.attendees.coming.length} {event.attendees.coming.length !== 1 ? t("events.participants") : t("events.participant")}
                    {spotsLeft != null && (
                      <span
                        className={`ml-1 ${spotsLeft <= 2 && spotsLeft > 0 ? "text-pink-500" : "text-charcoal-muted"}`}
                      >
                        {isFull
                          ? ` — ${t("events.full")}`
                          : ` — ${spotsLeft === 1 ? t("events.spotLeft", spotsLeft) : t("events.spotsLeft", spotsLeft)}`}
                      </span>
                    )}
                  </p>

                  {/* Coming */}
                  {event.attendees.coming.length > 0 && (
                    <div className="mb-2">
                      <p className="mb-1 text-xs font-bold text-mint-500">{t("events.coming")}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {event.attendees.coming.map((a) => (
                          <span
                            key={a}
                            className="inline-flex items-center gap-1.5 rounded-full bg-mint-100 py-1 pl-1 pr-3 text-xs font-semibold text-mint-500"
                          >
                            <Avatar name={a} />
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Maybe */}
                  {event.attendees.maybe.length > 0 && (
                    <div className="mb-2">
                      <p className="mb-1 text-xs font-bold text-amber-500">{t("events.maybe")}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {event.attendees.maybe.map((a) => (
                          <span
                            key={a}
                            className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 py-1 pl-1 pr-3 text-xs font-semibold text-amber-500"
                          >
                            <Avatar name={a} />
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Can't */}
                  {event.attendees.cant.length > 0 && (
                    <div className="mb-2">
                      <p className="mb-1 text-xs font-bold text-pink-500">{t("events.cantMakeIt")}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {event.attendees.cant.map((a) => (
                          <span
                            key={a}
                            className="inline-flex items-center gap-1.5 rounded-full bg-pink-100 py-1 pl-1 pr-3 text-xs font-semibold text-pink-500"
                          >
                            <Avatar name={a} />
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Waitlist */}
                  {event.attendees.waitlist.length > 0 && (
                    <div className="mb-2">
                      <p className="mb-1 text-xs font-bold text-charcoal-muted">
                        {t("events.waitlistCount", event.attendees.waitlist.length)}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {event.attendees.waitlist.map((a) => (
                          <span
                            key={a}
                            className="inline-flex items-center gap-1.5 rounded-full bg-coral-50 py-1 pl-1 pr-3 text-xs font-semibold text-charcoal-muted"
                          >
                            <Avatar name={a} />
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {!isPast && (
                    <div className="mt-3 space-y-3">
                      {/* RSVP buttons - show if user hasn't RSVP'd yet */}
                      {!userAlreadyRsvped && !showRsvp && !justSubscribed && !isFull && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRsvp("coming")}
                            className="flex-1 rounded-full bg-coral-500 px-6 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 hover:shadow-md active:scale-95"
                          >
                            {t("events.imComing")}
                          </button>
                          <button
                            onClick={() => handleRsvp("maybe")}
                            className="flex-1 rounded-full border-2 border-amber-300 px-6 py-3 font-bold text-amber-500 shadow transition-all hover:bg-amber-50 hover:shadow-md active:scale-95"
                          >
                            {t("events.maybeComing")}
                          </button>
                        </div>
                      )}

                      {isFull && !userAlreadyRsvped && !justSubscribed && (
                        <div className="space-y-2">
                          <div className="rounded-xl bg-pink-100 px-4 py-3 text-center text-sm font-semibold text-pink-500">
                            {t("events.eventFull")}
                          </div>
                          <button
                            onClick={() => handleRsvp("coming")}
                            className="w-full rounded-full border-2 border-coral-300 bg-coral-50 px-6 py-3 font-bold text-coral-500 shadow transition-all hover:bg-coral-100 active:scale-95"
                          >
                            {t("events.joinWaitlist")}
                          </button>
                        </div>
                      )}

                      {subscribeError && (
                        <div className="rounded-xl bg-pink-50 px-4 py-2 text-sm font-semibold text-pink-500">
                          {subscribeError}
                        </div>
                      )}

                      {/* Name input for RSVP */}
                      {showRsvp && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={subscribeName}
                              onChange={(e) => setSubscribeName(e.target.value)}
                              onKeyDown={(e) =>
                                e.key === "Enter" && handleRsvp(rsvpStatus)
                              }
                              placeholder={t("events.firstName")}
                              autoFocus
                              className="flex-1 rounded-xl border-2 border-coral-200 bg-card px-4 py-2.5 text-charcoal placeholder:text-charcoal-faint focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-200 transition-colors"
                            />
                            <button
                              onClick={() => handleRsvp(rsvpStatus)}
                              disabled={isPending || !subscribeName.trim()}
                              className="rounded-full bg-coral-500 px-5 py-2.5 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95 disabled:opacity-50"
                            >
                              {isPending ? "..." : "OK"}
                            </button>
                            <button
                              onClick={() => setShowRsvp(false)}
                              className="rounded-full border-2 border-charcoal-faint px-4 py-2.5 text-sm font-semibold text-charcoal-muted hover:bg-card transition-colors"
                            >
                              {t("events.cancel")}
                            </button>
                          </div>
                          <p className="text-xs text-charcoal-muted">
                            {rsvpStatus === "coming"
                              ? t("detail.confirmComing")
                              : t("detail.confirmMaybe")}
                          </p>
                        </div>
                      )}

                      {/* Cancel RSVP button */}
                      {userAlreadyRsvped && !justSubscribed && (
                        <button
                          onClick={handleUnrsvp}
                          disabled={isPending}
                          className="w-full rounded-full border-2 border-pink-200 px-6 py-3 font-bold text-pink-500 transition-all hover:bg-pink-50 active:scale-95 disabled:opacity-50"
                        >
                          {isPending ? "..." : t("events.cancelReg")}
                        </button>
                      )}

                      {justSubscribed && !wasWaitlisted && (
                        <div className="space-y-2">
                          <a
                            href={buildGoogleCalendarUrl(event)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex w-full items-center justify-center rounded-full bg-sky-500 px-6 py-3 font-bold text-white shadow transition-all hover:bg-sky-400 hover:shadow-md active:scale-95"
                          >
                            {t("events.addGCal")}
                          </a>
                          <button
                            onClick={() => downloadICS(event)}
                            className="inline-flex w-full items-center justify-center rounded-full border-2 border-lavender-200 px-6 py-3 font-bold text-lavender-500 transition-all hover:bg-lavender-100 active:scale-95"
                          >
                            {t("detail.downloadIcs")}
                          </button>
                        </div>
                      )}

                      {/* Share buttons */}
                      <div className="flex gap-2">
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(`${event.title} — ${new Date(event.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} @ ${event.location}\n${window.location.href}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 rounded-full bg-[#25D366] px-4 py-2.5 text-center text-sm font-bold text-white transition-all hover:bg-[#20bd5a] active:scale-95"
                        >
                          {t("events.shareWhatsApp")}
                        </a>
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(window.location.href);
                            toast(t("events.linkCopied"));
                          }}
                          className="rounded-full border-2 border-coral-200 px-4 py-2.5 text-sm font-bold text-coral-500 transition-all hover:bg-coral-50 active:scale-95"
                        >
                          {t("events.copyLink")}
                        </button>
                      </div>

                      {justSubscribed && wasWaitlisted && (
                        <div className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-600">
                          {t("events.onWaitlist")}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Checklist */}
                <div className="mb-6">
                  <ChecklistSection
                    eventId={event.id}
                    checklist={event.checklist}
                    isOrganizer={isOrganizer()}
                  />
                </div>

                {/* Photo Gallery - only for past events */}
                {isPast && (
                  <div className="mb-6">
                    <PhotoGallery
                      eventId={event.id}
                      photos={event.photos}
                      isOrganizer={isOrganizer()}
                    />
                  </div>
                )}

                {/* Comments */}
                <CommentSection
                  eventId={event.id}
                  comments={event.comments}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
