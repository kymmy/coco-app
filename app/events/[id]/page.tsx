"use client";

import { useEffect, useState, useTransition, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getEvent,
  updateEvent,
  deleteEvent,
  subscribeToEvent,
  addComment,
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

interface Comment {
  id: string;
  author: string;
  content: string;
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
  createdAt: Date;
  attendees: string[];
  comments: Comment[];
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

function formatAgeRange(min: number | null, max: number | null): string | null {
  if (min != null && max != null) return `${min}–${max} ans`;
  if (min != null) return `dès ${min} ans`;
  if (max != null) return `jusqu'à ${max} ans`;
  return null;
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

// ---------- Main Page ----------

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [event, setEvent] = useState<CocoEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [subscribeName, setSubscribeName] = useState("");
  const [justSubscribed, setJustSubscribed] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [shared, setShared] = useState(false);

  const loadEvent = useCallback(() => {
    getEvent(id).then((data) => {
      setEvent(data);
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

  function handleSubscribe() {
    if (!subscribeName.trim()) return;
    localStorage.setItem("coco_username", subscribeName.trim());
    startTransition(async () => {
      const result = await subscribeToEvent(id, subscribeName.trim());
      if (result.error) {
        setSubscribeError(result.error);
      } else {
        setEvent((prev) =>
          prev ? { ...prev, attendees: result.attendees } : prev
        );
        setSubscribeName("");
        setShowSubscribe(false);
        setJustSubscribed(true);
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
    event.attendees.length >= event.maxParticipants;
  const ageRange = formatAgeRange(event.ageMin, event.ageMax);
  const spotsLeft =
    event.maxParticipants != null
      ? event.maxParticipants - event.attendees.length
      : null;

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

                {/* Action buttons: share + edit/delete */}
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

                  {isOrganizer() && (
                    <>
                      <button
                        onClick={() => setEditing(true)}
                        className="rounded-full border-2 border-lavender-200 px-5 py-2 text-sm font-bold text-lavender-500 transition-all hover:bg-lavender-100 active:scale-95"
                      >
                        Modifier ✏️
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
                    {event.attendees.length} participant
                    {event.attendees.length !== 1 ? "s" : ""}
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

                  {event.attendees.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {event.attendees.map((a) => (
                        <span
                          key={a}
                          className="inline-block rounded-full bg-mint-100 px-3 py-1 text-xs font-semibold text-mint-500"
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  )}

                  {!isPast && (
                    <div className="space-y-3">
                      {!showSubscribe && !justSubscribed && !isFull && (
                        <button
                          onClick={() => setShowSubscribe(true)}
                          className="w-full rounded-full bg-coral-500 px-6 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 hover:shadow-md active:scale-95"
                        >
                          S&apos;inscrire 🙋
                        </button>
                      )}

                      {isFull && !justSubscribed && (
                        <div className="rounded-xl bg-pink-100 px-4 py-3 text-center text-sm font-semibold text-pink-500">
                          Cette sortie est complète
                        </div>
                      )}

                      {subscribeError && (
                        <div className="rounded-xl bg-pink-50 px-4 py-2 text-sm font-semibold text-pink-500">
                          {subscribeError}
                        </div>
                      )}

                      {showSubscribe && (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={subscribeName}
                            onChange={(e) => setSubscribeName(e.target.value)}
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleSubscribe()
                            }
                            placeholder="Votre prénom"
                            autoFocus
                            className="flex-1 rounded-xl border-2 border-coral-200 bg-white px-4 py-2.5 text-charcoal placeholder:text-charcoal-faint focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-200 transition-colors"
                          />
                          <button
                            onClick={handleSubscribe}
                            disabled={isPending || !subscribeName.trim()}
                            className="rounded-full bg-coral-500 px-5 py-2.5 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95 disabled:opacity-50"
                          >
                            {isPending ? "..." : "OK"}
                          </button>
                          <button
                            onClick={() => setShowSubscribe(false)}
                            className="rounded-full border-2 border-charcoal-faint px-4 py-2.5 text-sm font-semibold text-charcoal-muted hover:bg-white transition-colors"
                          >
                            Annuler
                          </button>
                        </div>
                      )}

                      {justSubscribed && (
                        <a
                          href={buildGoogleCalendarUrl(event)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex w-full items-center justify-center rounded-full bg-sky-500 px-6 py-3 font-bold text-white shadow transition-all hover:bg-sky-400 hover:shadow-md active:scale-95"
                        >
                          Ajouter a Google Calendar 📅
                        </a>
                      )}
                    </div>
                  )}
                </div>

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
