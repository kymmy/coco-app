"use client";

import { useState, useRef, useEffect, useCallback, useTransition, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createEvent, getEvent, getGroups } from "@/lib/actions";
import Link from "next/link";
import { useT } from "@/lib/i18n";

interface Group {
  id: string;
  name: string;
  code: string;
}

interface AddressSuggestion {
  label: string;
  context: string;
  lat: number;
  lng: number;
}

interface EventDefaults {
  title: string;
  category: string;
  date: string;
  endDate: string;
  price: string;
  maxParticipants: string;
  ageMin: string;
  ageMax: string;
  description: string;
  eventLink: string;
  recurrenceCount: string;
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

function compressImage(file: File, maxWidth = 800, quality = 0.8): Promise<string> {
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

function CreateEventForm() {
  const t = useT();
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get("duplicate");

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

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [location, setLocation] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { suggestions, loading } = useAddressSearch(location);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [organizer, setOrganizer] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [defaults, setDefaults] = useState<EventDefaults | null>(
    duplicateId ? null : {
      title: "",
      category: "autre",
      date: "",
      endDate: "",
      price: "Gratuit",
      maxParticipants: "",
      ageMin: "",
      ageMax: "",
      description: "",
      eventLink: "",
      recurrenceCount: "4",
    }
  );

  const isDuplicate = !!duplicateId;

  // Auto-fill organizer and load groups from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("tribu_username");
    if (saved) setOrganizer(saved);

    const groupIds = JSON.parse(localStorage.getItem("tribu_groups") || "[]") as string[];
    if (groupIds.length > 0) {
      getGroups(groupIds).then(setMyGroups);
    }
  }, []);

  // Fetch event data for duplication
  useEffect(() => {
    if (!duplicateId) return;

    getEvent(duplicateId).then((event) => {
      if (!event) return;

      // Set controlled state
      setOrganizer(event.organizer);
      setLocation(event.location);
      if (event.latitude != null && event.longitude != null) {
        setCoords({ lat: event.latitude, lng: event.longitude });
      }
      if (event.groupId) {
        setSelectedGroupId(event.groupId);
      }
      // Don't copy recurrence — the duplicate is a new single event
      setRecurrence("none");

      // Set image if present
      if (event.image) {
        setImagePreview(event.image);
        setImageData(event.image);
      }

      // Set defaults for uncontrolled inputs
      setDefaults({
        title: event.title,
        category: event.category,
        date: "",
        endDate: "",
        price: event.price,
        maxParticipants: event.maxParticipants != null ? String(event.maxParticipants) : "",
        ageMin: event.ageMin != null ? String(event.ageMin) : "",
        ageMax: event.ageMax != null ? String(event.ageMax) : "",
        description: event.description,
        eventLink: event.eventLink,
        recurrenceCount: "4",
      });
    });
  }, [duplicateId]);

  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
      setShowSuggestions(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty && !isPending) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isPending]);

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) {
      setImagePreview(null);
      setImageData(null);
      return;
    }
    try {
      const compressed = await compressImage(file);
      setImagePreview(compressed);
      setImageData(compressed);
    } catch {
      // Fallback to raw if compression fails
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageData(result);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleSubmit(formData: FormData) {
    formData.set("location", location);
    if (coords) {
      formData.set("latitude", String(coords.lat));
      formData.set("longitude", String(coords.lng));
    }
    if (imageData) {
      formData.set("image", imageData);
    } else {
      formData.delete("image");
    }
    // Save organizer name
    const org = formData.get("organizer") as string;
    if (org) localStorage.setItem("tribu_username", org);

    startTransition(async () => {
      const result = await createEvent(formData);
      if (result?.error) {
        setError(result.error);
      }
      // On success, createEvent redirects
    });
  }

  // Wait for defaults to load before rendering the form
  if (!defaults) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-coral-100 to-cream px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          <div className="rounded-3xl bg-card p-8 shadow-lg text-center">
            <p className="text-charcoal-muted">{t("events.loading")}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-coral-100 to-cream px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center text-sm font-semibold text-coral-500 hover:text-coral-400 transition-colors"
        >
          <span className="mr-1">&larr;</span> {t("create.back")}
        </Link>

        <div className="rounded-3xl bg-card p-8 shadow-lg">
          <h1 className="mb-2 text-3xl font-extrabold text-charcoal">
            {isDuplicate ? (
              <>{t("create.duplicateTitle")} <span className="text-coral-500">📋</span></>
            ) : (
              <>{t("create.createTitle")} <span className="text-coral-500">🎉</span></>
            )}
          </h1>
          <p className="mb-8 text-charcoal-muted">
            {t("create.subtitle")}
          </p>

          {error && (
            <div className="mb-6 rounded-xl bg-pink-50 px-4 py-3 text-sm font-semibold text-pink-500">
              {error}
            </div>
          )}

          <form action={handleSubmit} className="space-y-6" key={duplicateId || "new"} onChange={() => !isDirty && setIsDirty(true)}>
            {/* Anti-spam: honeypot (invisible to users, bots fill it) */}
            <div aria-hidden="true" className="absolute left-[-9999px] opacity-0 h-0 overflow-hidden">
              <label htmlFor="website">Website</label>
              <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
            {/* Anti-spam: form load timestamp */}
            <input type="hidden" name="_t" value={String(Date.now())} />

            {/* Title */}
            <div>
              <label htmlFor="title" className="mb-1 block text-sm font-bold text-charcoal">
                {t("create.eventTitle")}
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                defaultValue={defaults.title}
                placeholder={t("create.eventTitlePlaceholder")}
                className={inputClass}
              />
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="mb-1 block text-sm font-bold text-charcoal">
                {t("create.category")}
              </label>
              <select
                id="category"
                name="category"
                defaultValue={defaults.category}
                className={`${inputClass} cursor-pointer`}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Organizer */}
            <div>
              <label htmlFor="organizer" className="mb-1 block text-sm font-bold text-charcoal">
                {t("create.firstName")}
              </label>
              <input
                type="text"
                id="organizer"
                name="organizer"
                required
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder={t("create.firstNamePlaceholder")}
                className={inputClass}
              />
            </div>

            {/* Group selector */}
            {myGroups.length > 0 && (
              <div>
                <label htmlFor="groupId" className="mb-1 block text-sm font-bold text-charcoal">
                  {t("create.group")}
                </label>
                <select
                  id="groupId"
                  name="groupId"
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="">{t("create.noGroup")}</option>
                  {myGroups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Date row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="date" className="mb-1 block text-sm font-bold text-charcoal">
                  {t("create.start")}
                </label>
                <input
                  type="datetime-local"
                  id="date"
                  name="date"
                  required
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (!endDate) setEndDate(e.target.value);
                  }}
                  className={`${inputClass} datetime-input`}
                />
              </div>
              <div>
                <label htmlFor="endDate" className="mb-1 block text-sm font-bold text-charcoal">
                  {t("create.end")}
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  name="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`${inputClass} datetime-input`}
                />
              </div>
            </div>

            {/* Recurrence */}
            <div>
              <label htmlFor="recurrence" className="mb-1 block text-sm font-bold text-charcoal">
                {t("create.recurrence")}
              </label>
              <select
                id="recurrence"
                name="recurrence"
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value)}
                className={`${inputClass} cursor-pointer`}
              >
                <option value="none">{t("create.singleEvent")}</option>
                <option value="weekly">{t("create.weekly")}</option>
                <option value="biweekly">{t("create.biweekly")}</option>
                <option value="monthly">{t("create.monthly")}</option>
                <option value="custom">{t("create.custom")}</option>
              </select>
              {recurrence !== "none" && (
                <div className="mt-2 space-y-2">
                  {recurrence === "custom" && (
                    <div>
                      <label htmlFor="customIntervalDays" className="mb-1 block text-xs font-bold text-charcoal-muted">
                        {t("create.everyXDays")}
                      </label>
                      <input
                        type="number"
                        id="customIntervalDays"
                        name="customIntervalDays"
                        min="1"
                        max="365"
                        defaultValue="7"
                        className={inputClass}
                      />
                    </div>
                  )}
                  <div>
                    <label htmlFor="recurrenceCount" className="mb-1 block text-xs font-bold text-charcoal-muted">
                      {t("create.occurrences")}
                    </label>
                    <input
                      type="number"
                      id="recurrenceCount"
                      name="recurrenceCount"
                      min="2"
                      max="52"
                      defaultValue={defaults.recurrenceCount}
                      className={inputClass}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Location with autocomplete */}
            <div ref={wrapperRef} className="relative">
              <label htmlFor="location" className="mb-1 block text-sm font-bold text-charcoal">
                {t("create.location")}
              </label>
              <input
                type="text"
                id="location"
                required
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setShowSuggestions(true);
                  setCoords(null);
                }}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder={t("create.locationPlaceholder")}
                autoComplete="off"
                className={inputClass}
              />
              {showSuggestions && (suggestions.length > 0 || loading) && (
                <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border-2 border-coral-200 bg-card shadow-lg">
                  {loading && suggestions.length === 0 && (
                    <li className="px-4 py-3 text-sm text-charcoal-muted">
                      {t("create.searching")}
                    </li>
                  )}
                  {suggestions.map((s) => (
                    <li key={s.label}>
                      <button
                        type="button"
                        onClick={() => {
                          setLocation(s.label);
                          setCoords({ lat: s.lat, lng: s.lng });
                          setShowSuggestions(false);
                        }}
                        className="w-full px-4 py-3 text-left transition-colors hover:bg-coral-50"
                      >
                        <span className="block text-sm font-semibold text-charcoal">
                          {s.label}
                        </span>
                        <span className="block text-xs text-charcoal-muted">
                          {s.context}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Price + Max participants row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="price" className="mb-1 block text-sm font-bold text-charcoal">
                  {t("create.price")}
                </label>
                <input
                  type="text"
                  id="price"
                  name="price"
                  placeholder={t("create.pricePlaceholder")}
                  defaultValue={defaults.price}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="maxParticipants" className="mb-1 block text-sm font-bold text-charcoal">
                  {t("create.maxSpots")}
                </label>
                <input
                  type="number"
                  id="maxParticipants"
                  name="maxParticipants"
                  min="2"
                  defaultValue={defaults.maxParticipants}
                  placeholder={t("create.unlimited")}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Age range */}
            <div>
              <label className="mb-1 block text-sm font-bold text-charcoal">
                {t("create.ageRange")}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <input
                    type="number"
                    id="ageMin"
                    name="ageMin"
                    min="0"
                    max="17"
                    defaultValue={defaults.ageMin}
                    placeholder={t("create.min")}
                    className={inputClass}
                  />
                  <span className="absolute top-1/2 right-4 -translate-y-1/2 text-xs text-charcoal-faint">
                    {t("create.years")}
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    id="ageMax"
                    name="ageMax"
                    min="0"
                    max="17"
                    defaultValue={defaults.ageMax}
                    placeholder={t("create.max")}
                    className={inputClass}
                  />
                  <span className="absolute top-1/2 right-4 -translate-y-1/2 text-xs text-charcoal-faint">
                    {t("create.years")}
                  </span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="mb-1 block text-sm font-bold text-charcoal">
                {t("create.description")}
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                defaultValue={defaults.description}
                placeholder={t("create.descriptionPlaceholder")}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Event link */}
            <div>
              <label htmlFor="eventLink" className="mb-1 block text-sm font-bold text-charcoal">
                {t("create.externalLink")}
              </label>
              <input
                type="url"
                id="eventLink"
                name="eventLink"
                defaultValue={defaults.eventLink}
                placeholder="https://..."
                className={inputClass}
              />
            </div>

            {/* Image */}
            <div>
              <label htmlFor="image" className="mb-1 block text-sm font-bold text-charcoal">
                {t("create.image")}
              </label>
              <p className="mb-2 text-xs text-charcoal-faint">
                {t("create.imageHint")}
              </p>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full rounded-xl border-2 border-coral-200 bg-coral-50 px-4 py-3 text-charcoal file:mr-4 file:rounded-full file:border-0 file:bg-coral-500 file:px-4 file:py-1.5 file:text-sm file:font-bold file:text-white file:cursor-pointer hover:file:bg-coral-400 focus:outline-none transition-colors"
              />
              {imagePreview && (
                <div className="mt-3 overflow-hidden rounded-2xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-48 w-full object-cover"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-full bg-coral-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-coral-400 hover:shadow-xl active:scale-95 disabled:opacity-50"
            >
              {isPending
                ? t("create.publishing")
                : isDuplicate
                  ? t("create.publishCopy")
                  : t("create.publishEvent")}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}

export default function CreateEventPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-gradient-to-b from-coral-100 to-cream px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-xl">
            <div className="rounded-3xl bg-card p-8 shadow-lg text-center">
              <p className="text-charcoal-muted">...</p>
            </div>
          </div>
        </main>
      }
    >
      <CreateEventForm />
    </Suspense>
  );
}
