"use client";

import { useEffect, useState, useTransition } from "react";
import { getEvents, subscribeToEvent } from "@/lib/actions";
import Link from "next/link";

const CATEGORY_LABELS: Record<string, string> = {
  parc: "🌳 Parc / Plein air",
  sport: "⚽ Sport",
  musee: "🎨 Musée / Expo",
  spectacle: "🎭 Spectacle",
  restaurant: "🍕 Restaurant / Goûter",
  atelier: "✂️ Atelier / Loisir créatif",
  piscine: "🏊 Piscine / Baignade",
  balade: "🚶 Balade / Rando",
  autre: "📌 Autre",
};

const CATEGORY_OPTIONS = [
  { value: "", label: "Toutes" },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
];

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
  attendees: string[];
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

function formatAgeRange(
  min: number | null,
  max: number | null
): string | null {
  if (min != null && max != null) return `${min}–${max} ans`;
  if (min != null) return `dès ${min} ans`;
  if (max != null) return `jusqu'à ${max} ans`;
  return null;
}

function EventCard({ event: initial }: { event: CocoEvent }) {
  const [event, setEvent] = useState(initial);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [name, setName] = useState("");
  const [justSubscribed, setJustSubscribed] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("coco_username");
    if (saved) setName(saved);
  }, []);

  function handleSubscribe() {
    if (!name.trim()) return;
    localStorage.setItem("coco_username", name.trim());
    startTransition(async () => {
      const result = await subscribeToEvent(event.id, name.trim());
      if (result.error) {
        setSubscribeError(result.error);
      } else {
        setEvent((prev) => ({ ...prev, attendees: result.attendees }));
        setName("");
        setShowSubscribe(false);
        setJustSubscribed(true);
        setSubscribeError(null);
      }
    });
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
    <div
      className={`overflow-hidden rounded-3xl bg-white shadow-md transition-shadow hover:shadow-lg ${isPast ? "opacity-60" : ""}`}
    >
      <Link href={`/events/${event.id}`} className="block">
        {event.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image}
            alt={event.title}
            className="h-48 w-full object-cover"
          />
        )}
      </Link>

      <div className="p-6">
        {/* Badges row */}
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
          {event.group && (
            <span className="inline-block rounded-full bg-coral-50 px-3 py-1 text-xs font-bold text-charcoal-muted">
              🏫 {event.group.name}
            </span>
          )}
        </div>

        {/* Title (clickable) */}
        <Link href={`/events/${event.id}`}>
          <h2 className="mb-1 text-xl font-extrabold text-charcoal hover:text-coral-500 transition-colors">
            {event.title}
          </h2>
        </Link>

        <p className="mb-1 text-sm text-charcoal-light">
          📍 {event.location}
        </p>

        <p className="mb-1 text-sm font-semibold text-coral-500">
          📅 {formatDateFR(event.date)}
          {event.endDate && ` → ${formatTimeFR(event.endDate)}`}
        </p>

        <p className="mb-3 text-sm text-charcoal-muted">
          Organisé par{" "}
          <span className="font-semibold text-charcoal">
            {event.organizer}
          </span>
        </p>

        <p className="mb-4 line-clamp-2 text-charcoal-light">
          {event.description}
        </p>

        {event.eventLink && (
          <a
            href={event.eventLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 inline-block text-sm font-semibold text-sky-500 hover:underline"
          >
            🔗 Voir le lien
          </a>
        )}

        {/* Participants */}
        <div className="mb-4">
          <p className="mb-1 text-xs font-bold text-charcoal-muted uppercase">
            {event.attendees.length} participant
            {event.attendees.length !== 1 ? "s" : ""}
            {spotsLeft != null && (
              <span
                className={`ml-1 ${spotsLeft <= 2 && spotsLeft > 0 ? "text-pink-500" : ""}`}
              >
                {isFull
                  ? " — complet"
                  : ` — ${spotsLeft} place${spotsLeft !== 1 ? "s" : ""} restante${spotsLeft !== 1 ? "s" : ""}`}
              </span>
            )}
          </p>
          {event.attendees.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
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
        </div>

        {subscribeError && (
          <div className="mb-3 rounded-xl bg-pink-50 px-4 py-2 text-sm font-semibold text-pink-500">
            {subscribeError}
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
              <div className="rounded-xl bg-pink-50 px-4 py-3 text-center text-sm font-semibold text-pink-500">
                Cette sortie est complète
              </div>
            )}

            {showSubscribe && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
                  placeholder="Votre prénom"
                  autoFocus
                  className="flex-1 rounded-xl border-2 border-coral-200 bg-coral-50 px-4 py-2.5 text-charcoal placeholder:text-charcoal-faint focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-200 transition-colors"
                />
                <button
                  onClick={handleSubscribe}
                  disabled={isPending || !name.trim()}
                  className="rounded-full bg-coral-500 px-5 py-2.5 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95 disabled:opacity-50"
                >
                  {isPending ? "..." : "OK"}
                </button>
                <button
                  onClick={() => setShowSubscribe(false)}
                  className="rounded-full border-2 border-charcoal-faint px-4 py-2.5 text-sm font-semibold text-charcoal-muted hover:bg-gray-50 transition-colors"
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

        {/* View detail link */}
        <Link
          href={`/events/${event.id}`}
          className="mt-4 inline-block text-sm font-semibold text-coral-500 hover:text-coral-400 transition-colors"
        >
          Voir les détails &rarr;
        </Link>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const [allEvents, setAllEvents] = useState<CocoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showPast, setShowPast] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [hasGroups, setHasGroups] = useState(true);

  useEffect(() => {
    const groupIds = JSON.parse(localStorage.getItem("coco_groups") || "[]") as string[];
    setHasGroups(groupIds.length > 0);
    getEvents(groupIds.length > 0 ? groupIds : undefined).then((data) => {
      setAllEvents(data);
      setLoading(false);
    });
  }, []);

  const now = new Date();
  const filtered = allEvents.filter((e) => {
    if (categoryFilter && e.category !== categoryFilter) return false;
    return true;
  });

  const upcoming = filtered
    .filter((e) => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const past = filtered
    .filter((e) => new Date(e.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const hasGeoEvents = allEvents.some((e) => e.latitude && e.longitude);

  return (
    <main className="min-h-screen bg-gradient-to-b from-coral-100 to-cream px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="mb-2 inline-flex items-center text-sm font-semibold text-coral-500 hover:text-coral-400 transition-colors"
            >
              <span className="mr-1">&larr;</span> Accueil
            </Link>
            <h1 className="text-3xl font-extrabold text-charcoal sm:text-4xl">
              Les sorties <span className="text-coral-500">🎈</span>
            </h1>
          </div>
          <Link
            href="/create"
            className="rounded-full bg-coral-500 px-6 py-3 font-bold text-white shadow-lg transition-all hover:bg-coral-400 hover:shadow-xl active:scale-95"
          >
            + Nouvelle
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-full border-2 border-coral-200 bg-white px-4 py-2 text-sm font-semibold text-charcoal cursor-pointer focus:border-coral-500 focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          {hasGeoEvents && (
            <div className="flex rounded-full border-2 border-coral-200 bg-white overflow-hidden">
              <button
                onClick={() => setView("list")}
                className={`px-4 py-2 text-sm font-semibold transition-colors ${view === "list" ? "bg-coral-500 text-white" : "text-charcoal-muted hover:bg-coral-50"}`}
              >
                Liste
              </button>
              <button
                onClick={() => setView("map")}
                className={`px-4 py-2 text-sm font-semibold transition-colors ${view === "map" ? "bg-coral-500 text-white" : "text-charcoal-muted hover:bg-coral-50"}`}
              >
                Carte
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="py-20 text-center text-charcoal-muted">
            Chargement...
          </div>
        ) : !hasGroups && allEvents.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-md">
            <p className="mb-2 text-5xl">🏫</p>
            <p className="text-lg font-bold text-charcoal">
              Rejoignez un groupe pour voir les sorties
            </p>
            <p className="mt-1 text-charcoal-muted">
              Créez ou rejoignez un groupe de parents pour commencer.
            </p>
            <Link
              href="/groups"
              className="mt-6 inline-flex rounded-full bg-coral-500 px-8 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95"
            >
              Mes groupes 👨‍👩‍👧‍👦
            </Link>
          </div>
        ) : allEvents.length === 0 ? (
          <div className="rounded-3xl bg-white p-12 text-center shadow-md">
            <p className="mb-2 text-5xl">🦗</p>
            <p className="text-lg font-bold text-charcoal">
              Aucune sortie pour le moment
            </p>
            <p className="mt-1 text-charcoal-muted">
              Soyez le premier a proposer une sortie !
            </p>
            <Link
              href="/create"
              className="mt-6 inline-flex rounded-full bg-coral-500 px-8 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95"
            >
              Proposer une sortie 🎉
            </Link>
          </div>
        ) : view === "map" ? (
          <MapView events={upcoming} />
        ) : (
          <>
            {/* Upcoming events */}
            {upcoming.length === 0 && past.length > 0 && (
              <div className="mb-6 rounded-3xl bg-white p-8 text-center shadow-md">
                <p className="text-charcoal-muted">
                  Aucune sortie à venir
                  {categoryFilter ? " dans cette catégorie" : ""}.
                </p>
              </div>
            )}

            {upcoming.length > 0 && (
              <div className="mb-8 space-y-6">
                {upcoming.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}

            {/* Past events */}
            {past.length > 0 && (
              <div>
                <button
                  onClick={() => setShowPast(!showPast)}
                  className="mb-4 flex items-center gap-2 text-sm font-bold text-charcoal-muted hover:text-charcoal transition-colors"
                >
                  <span
                    className={`inline-block transition-transform ${showPast ? "rotate-90" : ""}`}
                  >
                    ▶
                  </span>
                  Sorties passées ({past.length})
                </button>
                {showPast && (
                  <div className="space-y-6">
                    {past.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

// ---------- Map View (lazy-loaded) ----------

function MapView({ events }: { events: CocoEvent[] }) {
  const [MapComponent, setMapComponent] = useState<React.ComponentType<{
    events: CocoEvent[];
  }> | null>(null);

  useEffect(() => {
    import("@/components/EventMap").then((mod) => {
      setMapComponent(() => mod.default);
    });
  }, []);

  if (!MapComponent) {
    return (
      <div className="flex h-96 items-center justify-center rounded-3xl bg-white shadow-md">
        <p className="text-charcoal-muted">Chargement de la carte...</p>
      </div>
    );
  }

  return <MapComponent events={events} />;
}
