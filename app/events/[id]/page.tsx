"use client";

import { useEffect, useState, useTransition, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getEvent,
  updateEvent,
  deleteEvent,
  rsvpToEvent,
  unrsvpFromEvent,
  addComment,
  addChecklistItem,
  claimChecklistItem,
  removeChecklistItem,
  addEventPhoto,
  removeEventPhoto,
} from "@/lib/actions";

const CATEGORIES = [
  { value: "parc", label: "🌳 Parc / Plein air" },
  { value: "sport", label: "⚽ Sport" },
  { value: "musee", label: "🎨 Musée / Expo" },
  { value: "spectacle", label: "🎭 Spectacle" },
  { value: "restaurant", label: "🍕 Restaurant / Goûter" },
  { value: "atelier", label: "✂️ Atelier / Loisir créatif" },
  { value: "piscine", label: "🏊 Piscine / Baignade" },
  { value: "balade", label: "🚶 Balade / Rando" },
  { value: "autre", label: "📌 Autre" },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label])
);

const OUTDOOR_CATEGORIES = ["parc", "balade", "sport", "piscine"];

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
  attendees: { coming: string[]; maybe: string[]; cant: string[] };
  photos: EventPhoto[];
  comments: Comment[];
  checklist: ChecklistItemType[];
}

interface WeatherData {
  tempMax: number;
  tempMin: number;
  weatherCode: number;
}

function formatDateFR(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatTimeFR(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function formatCommentDate(date: Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
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
  link.download = `${event.title.replace(/[^a-zA-Z0-9À-ÿ ]/g, "").replace(/\s+/g, "_")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function formatAgeRange(min: number | null, max: number | null): string | null {
  if (min != null && max != null) return `${min}–${max} ans`;
  if (min != null) return `dès ${min} ans`;
  if (max != null) return `jusqu'à ${max} ans`;
  return null;
}

function weatherCodeToLabel(code: number): string {
  if (code === 0) return "Ciel dégagé";
  if (code <= 3) return "Partiellement nuageux";
  if (code <= 48) return "Brouillard";
  if (code <= 57) return "Bruine";
  if (code <= 67) return "Pluie";
  if (code <= 77) return "Neige";
  if (code <= 82) return "Averses";
  if (code <= 86) return "Averses de neige";
  if (code <= 99) return "Orage";
  return "Inconnu";
}

function weatherCodeToEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 57) return "🌧️";
  if (code <= 67) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌦️";
  if (code <= 86) return "🌨️";
  if (code <= 99) return "⛈️";
  return "🌡️";
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
          {weather.tempMin}° / {weather.tempMax}°C
        </p>
        <p className="text-xs text-sky-500">
          {weatherCodeToLabel(weather.weatherCode)}
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
  const [photos, setPhotos] = useState(initialPhotos);
  const [isPending, startTransition] = useTransition();
  const [username, setUsername] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        Photos ({photos.length})
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
            {isPending ? "Envoi..." : "Ajouter une photo 📸"}
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
                className="h-40 w-full object-cover"
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
                  className="absolute top-2 right-2 rounded-full bg-white/80 px-2 py-1 text-xs font-bold text-pink-500 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-white disabled:opacity-50"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && (
        <p className="text-sm text-charcoal-muted">
          Aucune photo pour le moment. Partagez vos souvenirs !
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
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState(event.location);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    event.latitude && event.longitude
      ? { lat: event.latitude, lng: event.longitude }
      : null
  );
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { suggestions, loading } = useAddressSearch(location);
  const wrapperRef = useRef<HTMLDivElement>(null);

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
        <label htmlFor="edit-title" className="mb-1 block text-sm font-bold text-charcoal">Titre *</label>
        <input type="text" id="edit-title" name="title" required defaultValue={event.title} className={inputClass} />
      </div>

      <div>
        <label htmlFor="edit-category" className="mb-1 block text-sm font-bold text-charcoal">Catégorie</label>
        <select id="edit-category" name="category" defaultValue={event.category} className={`${inputClass} cursor-pointer`}>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="edit-organizer" className="mb-1 block text-sm font-bold text-charcoal">Organisateur *</label>
        <input type="text" id="edit-organizer" name="organizer" required defaultValue={event.organizer} className={inputClass} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="edit-date" className="mb-1 block text-sm font-bold text-charcoal">Début *</label>
          <input type="datetime-local" id="edit-date" name="date" required defaultValue={toLocalDatetime(event.date)} className={inputClass} />
        </div>
        <div>
          <label htmlFor="edit-endDate" className="mb-1 block text-sm font-bold text-charcoal">Fin</label>
          <input type="datetime-local" id="edit-endDate" name="endDate" defaultValue={event.endDate ? toLocalDatetime(event.endDate) : ""} className={inputClass} />
        </div>
      </div>

      <div ref={wrapperRef} className="relative">
        <label htmlFor="edit-location" className="mb-1 block text-sm font-bold text-charcoal">Lieu *</label>
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
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border-2 border-coral-200 bg-white shadow-lg">
            {loading && suggestions.length === 0 && (
              <li className="px-4 py-3 text-sm text-charcoal-muted">Recherche...</li>
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
          <label htmlFor="edit-price" className="mb-1 block text-sm font-bold text-charcoal">Tarif</label>
          <input type="text" id="edit-price" name="price" defaultValue={event.price} className={inputClass} />
        </div>
        <div>
          <label htmlFor="edit-max" className="mb-1 block text-sm font-bold text-charcoal">Places max</label>
          <input type="number" id="edit-max" name="maxParticipants" min="2" defaultValue={event.maxParticipants ?? ""} className={inputClass} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="edit-ageMin" className="mb-1 block text-sm font-bold text-charcoal">Âge min</label>
          <input type="number" id="edit-ageMin" name="ageMin" min="0" max="17" defaultValue={event.ageMin ?? ""} className={inputClass} />
        </div>
        <div>
          <label htmlFor="edit-ageMax" className="mb-1 block text-sm font-bold text-charcoal">Âge max</label>
          <input type="number" id="edit-ageMax" name="ageMax" min="0" max="17" defaultValue={event.ageMax ?? ""} className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="edit-description" className="mb-1 block text-sm font-bold text-charcoal">Description *</label>
        <textarea id="edit-description" name="description" required rows={4} defaultValue={event.description} className={`${inputClass} resize-none`} />
      </div>

      <div>
        <label htmlFor="edit-eventLink" className="mb-1 block text-sm font-bold text-charcoal">Lien externe</label>
        <input type="url" id="edit-eventLink" name="eventLink" defaultValue={event.eventLink} className={inputClass} />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex-1 rounded-full bg-coral-500 px-6 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95 disabled:opacity-50"
        >
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border-2 border-charcoal-faint px-6 py-3 font-semibold text-charcoal-muted hover:bg-gray-50 transition-colors"
        >
          Annuler
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

  return (
    <div>
      <h3 className="mb-4 text-lg font-extrabold text-charcoal">
        Discussion ({comments.length})
      </h3>

      {comments.length > 0 && (
        <div className="mb-4 space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="rounded-2xl bg-coral-50 px-4 py-3">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-bold text-charcoal">
                  {c.author}
                </span>
                <span className="text-xs text-charcoal-faint">
                  {formatCommentDate(c.createdAt)}
                </span>
              </div>
              <p className="text-sm text-charcoal-light">{c.content}</p>
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
          placeholder="Votre prénom"
          className={inputClass}
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            placeholder="Votre message..."
            className={`flex-1 ${inputClass}`}
          />
          <button
            onClick={handleSubmit}
            disabled={isPending || !author.trim() || !content.trim()}
            className="rounded-full bg-coral-500 px-5 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95 disabled:opacity-50"
          >
            {isPending ? "..." : "Envoyer"}
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
  const [items, setItems] = useState(initialChecklist);
  const [newLabel, setNewLabel] = useState("");
  const [isPending, startTransition] = useTransition();
  const [username, setUsername] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("coco_username");
    if (saved) setUsername(saved);
  }, []);

  function handleAdd() {
    if (!newLabel.trim()) return;
    startTransition(async () => {
      const result = await addChecklistItem(eventId, newLabel.trim());
      if (result.item) {
        setItems((prev) => [...prev, result.item]);
        setNewLabel("");
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
        Qui apporte quoi ? ({items.filter((i) => i.claimedBy).length}/{items.length})
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
                  {item.claimedBy ? "✅" : "📋"}
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
                  </span>
                  {item.claimedBy && (
                    <span className="ml-2 text-xs font-semibold text-mint-500">
                      — {item.claimedBy}
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
                    Je m&apos;en charge
                  </button>
                )}
                {item.claimedBy === username && (
                  <button
                    onClick={() => handleUnclaim(item.id)}
                    disabled={isPending}
                    className="rounded-full border border-charcoal-faint px-3 py-1.5 text-xs font-semibold text-charcoal-muted hover:bg-white transition-colors disabled:opacity-50"
                  >
                    Annuler
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
          placeholder="ex: Gâteau, boissons, ballon..."
          className={`flex-1 ${inputClass}`}
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
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [event, setEvent] = useState<CocoEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showRsvp, setShowRsvp] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<"coming" | "maybe">("coming");
  const [subscribeName, setSubscribeName] = useState("");
  const [justSubscribed, setJustSubscribed] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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
      event.attendees.cant.some((n) => n.toLowerCase() === saved)
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
        setSubscribeError(null);
      }
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteEvent(id);
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

  function isOrganizer(): boolean {
    if (!event) return false;
    const saved = localStorage.getItem("coco_username");
    return saved?.toLowerCase() === event.organizer.toLowerCase();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-coral-100 to-cream px-4 py-12">
        <div className="mx-auto max-w-2xl py-20 text-center text-charcoal-muted">
          Chargement...
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-coral-100 to-cream px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl bg-white p-12 text-center shadow-md">
            <p className="mb-2 text-5xl">🤷</p>
            <p className="text-lg font-bold text-charcoal">
              Événement introuvable
            </p>
            <Link
              href="/events"
              className="mt-6 inline-flex rounded-full bg-coral-500 px-8 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95"
            >
              Retour aux sorties
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
  const ageRange = formatAgeRange(event.ageMin, event.ageMax);
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
          <span className="mr-1">&larr;</span> Toutes les sorties
        </Link>

        <div className="overflow-hidden rounded-3xl bg-white shadow-lg">
          {event.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.image}
              alt={event.title}
              className="h-64 w-full object-cover"
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
                    {isPast ? "Passée" : "A venir"}
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
                      Gratuit
                    </span>
                  )}
                  {ageRange && (
                    <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-500">
                      👶 {ageRange}
                    </span>
                  )}
                  {event.seriesId && (
                    <span className="inline-block rounded-full bg-sky-100 px-3 py-1 text-xs font-bold text-sky-500">
                      🔁 Récurrent
                    </span>
                  )}
                </div>

                <h1 className="mb-2 text-2xl font-extrabold text-charcoal sm:text-3xl">
                  {event.title}
                </h1>

                <p className="mb-1 text-charcoal-light">📍 {event.location}</p>

                <p className="mb-1 font-semibold text-coral-500">
                  📅 {formatDateFR(event.date)}
                  {event.endDate && ` → ${formatTimeFR(event.endDate)}`}
                </p>

                {/* Weather Preview for future outdoor events */}
                {!isPast &&
                  OUTDOOR_CATEGORIES.includes(event.category) &&
                  event.latitude &&
                  event.longitude && (
                    <WeatherPreview event={event} />
                  )}

                <p className="mb-4 text-sm text-charcoal-muted">
                  Organisé par{" "}
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
                    🔗 Voir le lien
                  </a>
                )}

                {/* Action buttons: share + calendar + edit/delete/duplicate */}
                <div className="mb-6 flex flex-wrap gap-2">
                  <button
                    onClick={handleShare}
                    className="rounded-full border-2 border-coral-200 px-5 py-2 text-sm font-bold text-coral-500 transition-all hover:bg-coral-50 active:scale-95"
                  >
                    {shared ? "Lien copié ✓" : "Partager 🔗"}
                  </button>

                  <a
                    href={buildGoogleCalendarUrl(event)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-full border-2 border-sky-200 px-5 py-2 text-sm font-bold text-sky-500 transition-all hover:bg-sky-100 active:scale-95"
                  >
                    Google Calendar 📅
                  </a>

                  <button
                    onClick={() => downloadICS(event)}
                    className="rounded-full border-2 border-lavender-200 px-5 py-2 text-sm font-bold text-lavender-500 transition-all hover:bg-lavender-100 active:scale-95"
                  >
                    Télécharger .ics 📥
                  </button>

                  {isOrganizer() && (
                    <>
                      <button
                        onClick={() => setEditing(true)}
                        className="rounded-full border-2 border-lavender-200 px-5 py-2 text-sm font-bold text-lavender-500 transition-all hover:bg-lavender-100 active:scale-95"
                      >
                        Modifier ✏️
                      </button>
                      <button
                        onClick={() => router.push(`/create?duplicate=${event.id}`)}
                        className="rounded-full border-2 border-sky-200 px-5 py-2 text-sm font-bold text-sky-500 hover:bg-sky-100"
                      >
                        Dupliquer 📋
                      </button>
                      {!showDeleteConfirm ? (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="rounded-full border-2 border-pink-200 px-5 py-2 text-sm font-bold text-pink-500 transition-all hover:bg-pink-100 active:scale-95"
                        >
                          Supprimer 🗑️
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-pink-500 font-semibold">Confirmer ?</span>
                          <button
                            onClick={handleDelete}
                            disabled={isPending}
                            className="rounded-full bg-pink-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-pink-400 active:scale-95 disabled:opacity-50"
                          >
                            {isPending ? "..." : "Oui, supprimer"}
                          </button>
                          <button
                            onClick={() => setShowDeleteConfirm(false)}
                            className="rounded-full border-2 border-charcoal-faint px-4 py-2 text-sm font-semibold text-charcoal-muted hover:bg-gray-50"
                          >
                            Non
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Participants */}
                <div className="mb-6 rounded-2xl bg-coral-50 p-4">
                  <p className="mb-2 text-sm font-bold text-charcoal">
                    {event.attendees.coming.length} participant
                    {event.attendees.coming.length !== 1 ? "s" : ""}
                    {spotsLeft != null && (
                      <span
                        className={`ml-1 ${spotsLeft <= 2 && spotsLeft > 0 ? "text-pink-500" : "text-charcoal-muted"}`}
                      >
                        {isFull
                          ? " — complet"
                          : ` — ${spotsLeft} place${spotsLeft !== 1 ? "s" : ""} restante${spotsLeft !== 1 ? "s" : ""}`}
                      </span>
                    )}
                  </p>

                  {/* Coming */}
                  {event.attendees.coming.length > 0 && (
                    <div className="mb-2">
                      <p className="mb-1 text-xs font-bold text-mint-500">Je viens</p>
                      <div className="flex flex-wrap gap-1.5">
                        {event.attendees.coming.map((a) => (
                          <span
                            key={a}
                            className="inline-block rounded-full bg-mint-100 px-3 py-1 text-xs font-semibold text-mint-500"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Maybe */}
                  {event.attendees.maybe.length > 0 && (
                    <div className="mb-2">
                      <p className="mb-1 text-xs font-bold text-amber-500">Peut-être</p>
                      <div className="flex flex-wrap gap-1.5">
                        {event.attendees.maybe.map((a) => (
                          <span
                            key={a}
                            className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-500"
                          >
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Can't */}
                  {event.attendees.cant.length > 0 && (
                    <div className="mb-2">
                      <p className="mb-1 text-xs font-bold text-pink-500">Ne peut pas</p>
                      <div className="flex flex-wrap gap-1.5">
                        {event.attendees.cant.map((a) => (
                          <span
                            key={a}
                            className="inline-block rounded-full bg-pink-100 px-3 py-1 text-xs font-semibold text-pink-500"
                          >
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
                            Je viens ✋
                          </button>
                          <button
                            onClick={() => handleRsvp("maybe")}
                            className="flex-1 rounded-full border-2 border-amber-300 px-6 py-3 font-bold text-amber-500 shadow transition-all hover:bg-amber-50 hover:shadow-md active:scale-95"
                          >
                            Peut-être 🤔
                          </button>
                        </div>
                      )}

                      {isFull && !userAlreadyRsvped && !justSubscribed && (
                        <div className="rounded-xl bg-pink-100 px-4 py-3 text-center text-sm font-semibold text-pink-500">
                          Cette sortie est complète
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
                              placeholder="Votre prénom"
                              autoFocus
                              className="flex-1 rounded-xl border-2 border-coral-200 bg-white px-4 py-2.5 text-charcoal placeholder:text-charcoal-faint focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-200 transition-colors"
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
                              className="rounded-full border-2 border-charcoal-faint px-4 py-2.5 text-sm font-semibold text-charcoal-muted hover:bg-white transition-colors"
                            >
                              Annuler
                            </button>
                          </div>
                          <p className="text-xs text-charcoal-muted">
                            {rsvpStatus === "coming"
                              ? "Vous confirmez votre venue ✋"
                              : "Vous indiquez un peut-être 🤔"}
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
                          {isPending ? "..." : "Annuler inscription"}
                        </button>
                      )}

                      {justSubscribed && (
                        <div className="space-y-2">
                          <a
                            href={buildGoogleCalendarUrl(event)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex w-full items-center justify-center rounded-full bg-sky-500 px-6 py-3 font-bold text-white shadow transition-all hover:bg-sky-400 hover:shadow-md active:scale-95"
                          >
                            Ajouter a Google Calendar 📅
                          </a>
                          <button
                            onClick={() => downloadICS(event)}
                            className="inline-flex w-full items-center justify-center rounded-full border-2 border-lavender-200 px-6 py-3 font-bold text-lavender-500 transition-all hover:bg-lavender-100 active:scale-95"
                          >
                            Télécharger .ics 📥
                          </button>
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
