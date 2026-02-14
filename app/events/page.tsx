"use client";

import { useEffect, useState, useTransition } from "react";
import { getEvents, rsvpToEvent, unrsvpFromEvent } from "@/lib/actions";
import Link from "next/link";
import { useT, useI18n } from "@/lib/i18n";

const EVENTS_PER_PAGE = 10;

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
  max: number | null,
  t: (key: string, ...args: (string | number)[]) => string
): string | null {
  if (min != null && max != null) return t("age.range", min, max);
  if (min != null) return t("age.from", min);
  if (max != null) return t("age.upTo", max);
  return null;
}

function isUserInAttendees(
  attendees: CocoEvent["attendees"],
  username: string
): boolean {
  const lower = username.toLowerCase();
  return (
    attendees.coming.some((n) => n.toLowerCase() === lower) ||
    attendees.maybe.some((n) => n.toLowerCase() === lower) ||
    attendees.cant.some((n) => n.toLowerCase() === lower) ||
    attendees.waitlist.some((n) => n.toLowerCase() === lower)
  );
}

// ---------- Share Button ----------

function ShareButton({ event }: { event: CocoEvent }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  const eventUrl = typeof window !== "undefined"
    ? `${window.location.origin}/events/${event.id}`
    : `/events/${event.id}`;
  const shareText = `${event.title} — ${event.location}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n${eventUrl}`)}`;

  async function handleCopyLink() {
    await navigator.clipboard.writeText(eventUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex gap-1.5">
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white transition-all hover:opacity-90 active:scale-95"
        title={t("share.whatsapp")}
      >
        WhatsApp
      </a>
      <button
        onClick={handleCopyLink}
        className="rounded-full border border-coral-200 px-3 py-1.5 text-xs font-semibold text-charcoal-muted transition-all hover:bg-coral-50 active:scale-95"
        title={t("share.copyLink")}
      >
        {copied ? t("share.copied") : t("share.copyLink")}
      </button>
    </div>
  );
}

// ---------- Event Card ----------

function EventCard({ event: initial }: { event: CocoEvent }) {
  const t = useT();
  const { locale } = useI18n();
  const [event, setEvent] = useState(initial);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [rsvpStatus, setRsvpStatus] = useState<"coming" | "maybe" | null>(
    null
  );
  const [name, setName] = useState("");
  const [justSubscribed, setJustSubscribed] = useState(false);
  const [wasWaitlisted, setWasWaitlisted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  const CATEGORY_LABELS: Record<string, string> = {
    parc: t("cat.parc"),
    sport: t("cat.sport"),
    musee: t("cat.musee"),
    spectacle: t("cat.spectacle"),
    restaurant: t("cat.restaurant"),
    atelier: t("cat.atelier"),
    piscine: t("cat.piscine"),
    balade: t("cat.balade"),
    autre: t("cat.autre"),
  };

  useEffect(() => {
    const saved = localStorage.getItem("coco_username");
    if (saved) setName(saved);
  }, []);

  const storedUsername =
    typeof window !== "undefined"
      ? localStorage.getItem("coco_username") || ""
      : "";
  const alreadyRegistered =
    storedUsername.trim() !== "" &&
    isUserInAttendees(event.attendees, storedUsername);

  function handleRsvp(status: "coming" | "maybe") {
    if (name.trim()) {
      doRsvp(status);
    } else {
      setRsvpStatus(status);
      setShowSubscribe(true);
    }
  }

  function doRsvp(status: "coming" | "maybe") {
    if (!name.trim()) return;
    localStorage.setItem("coco_username", name.trim());
    startTransition(async () => {
      const result = await rsvpToEvent(event.id, name.trim(), status);
      if (result.error) {
        setSubscribeError(result.error);
      } else {
        setEvent((prev) => ({ ...prev, attendees: result.attendees! }));
        setShowSubscribe(false);
        setRsvpStatus(null);
        setJustSubscribed(true);
        setWasWaitlisted(result.wasWaitlisted || false);
        setSubscribeError(null);
      }
    });
  }

  function handleUnrsvp() {
    const username = localStorage.getItem("coco_username");
    if (!username) return;
    startTransition(async () => {
      const result = await unrsvpFromEvent(event.id, username.trim());
      if (result.error) {
        setSubscribeError(result.error);
      } else {
        setEvent((prev) => ({ ...prev, attendees: result.attendees! }));
        setJustSubscribed(false);
        setWasWaitlisted(false);
        setSubscribeError(null);
      }
    });
  }

  function handleNameSubmit() {
    if (!name.trim() || !rsvpStatus) return;
    doRsvp(rsvpStatus);
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

  return (
    <div
      className={`overflow-hidden rounded-3xl bg-card shadow-md transition-shadow hover:shadow-lg ${isPast ? "opacity-60" : ""}`}
    >
      <Link href={`/events/${event.id}`} className="block">
        {event.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.image}
            alt={event.title}
            className="h-48 w-full object-cover"
            loading="lazy"
          />
        )}
      </Link>

      <div className="p-6">
        {/* Badges row */}
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
          📅 {formatDate(event.date, locale)}
          {event.endDate && ` → ${formatTime(event.endDate, locale)}`}
        </p>

        <p className="mb-3 text-sm text-charcoal-muted">
          {t("events.organizedBy")}{" "}
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
            🔗 {t("events.viewLink")}
          </a>
        )}

        {/* Share buttons */}
        <div className="mb-4">
          <ShareButton event={event} />
        </div>

        {/* Participants */}
        <div className="mb-4">
          <p className="mb-1 text-xs font-bold text-charcoal-muted uppercase">
            {event.attendees.coming.length}{" "}
            {event.attendees.coming.length !== 1
              ? t("events.participants")
              : t("events.participant")}
            {spotsLeft != null && (
              <span
                className={`ml-1 ${spotsLeft <= 2 && spotsLeft > 0 ? "text-pink-500" : ""}`}
              >
                {isFull
                  ? ` — ${t("events.full")}`
                  : ` — ${spotsLeft === 1 ? t("events.spotLeft", spotsLeft) : t("events.spotsLeft", spotsLeft)}`}
              </span>
            )}
          </p>

          {/* Coming attendees */}
          {event.attendees.coming.length > 0 && (
            <div className="mb-1">
              <p className="text-[10px] font-semibold text-mint-500 uppercase mb-0.5">
                {t("events.coming")}
              </p>
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

          {/* Maybe attendees */}
          {event.attendees.maybe.length > 0 && (
            <div className="mt-1">
              <p className="text-[10px] font-semibold text-amber-500 uppercase mb-0.5">
                {t("events.maybe")}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {event.attendees.maybe.map((a) => (
                  <span
                    key={a}
                    className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-600"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Waitlist */}
          {event.attendees.waitlist.length > 0 && (
            <div className="mt-1">
              <p className="text-[10px] font-semibold text-charcoal-muted uppercase mb-0.5">
                {t("events.waitlistCount", event.attendees.waitlist.length)}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {event.attendees.waitlist.map((a) => (
                  <span
                    key={a}
                    className="inline-block rounded-full bg-coral-50 px-3 py-1 text-xs font-semibold text-charcoal-muted"
                  >
                    {a}
                  </span>
                ))}
              </div>
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
            {/* Already registered: show cancel button */}
            {alreadyRegistered && !justSubscribed && (
              <button
                onClick={handleUnrsvp}
                disabled={isPending}
                className="w-full rounded-full border-2 border-pink-300 bg-pink-50 px-6 py-3 font-bold text-pink-500 shadow transition-all hover:bg-pink-100 active:scale-95 disabled:opacity-50"
              >
                {isPending ? "..." : t("events.cancelReg")}
              </button>
            )}

            {/* Not registered, not full: show RSVP buttons */}
            {!alreadyRegistered &&
              !showSubscribe &&
              !justSubscribed &&
              !isFull && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRsvp("coming")}
                    className="flex-1 rounded-full bg-coral-500 px-6 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 hover:shadow-md active:scale-95"
                  >
                    {t("events.imComing")}
                  </button>
                  <button
                    onClick={() => handleRsvp("maybe")}
                    className="flex-1 rounded-full border-2 border-amber-300 bg-amber-50 px-6 py-3 font-bold text-amber-600 shadow transition-all hover:bg-amber-100 hover:shadow-md active:scale-95"
                  >
                    {t("events.maybeComing")}
                  </button>
                </div>
              )}

            {/* Full: show waitlist button */}
            {isFull && !alreadyRegistered && !justSubscribed && (
              <div className="space-y-2">
                <div className="rounded-xl bg-pink-50 px-4 py-3 text-center text-sm font-semibold text-pink-500">
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

            {showSubscribe && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                  placeholder={t("events.firstName")}
                  autoFocus
                  className="flex-1 rounded-xl border-2 border-coral-200 bg-coral-50 px-4 py-2.5 text-charcoal placeholder:text-charcoal-faint focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-200 transition-colors"
                />
                <button
                  onClick={handleNameSubmit}
                  disabled={isPending || !name.trim()}
                  className="rounded-full bg-coral-500 px-5 py-2.5 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95 disabled:opacity-50"
                >
                  {isPending ? "..." : "OK"}
                </button>
                <button
                  onClick={() => {
                    setShowSubscribe(false);
                    setRsvpStatus(null);
                  }}
                  className="rounded-full border-2 border-charcoal-faint px-4 py-2.5 text-sm font-semibold text-charcoal-muted hover:bg-card-hover transition-colors"
                >
                  {t("events.cancel")}
                </button>
              </div>
            )}

            {justSubscribed && !wasWaitlisted && (
              <a
                href={buildGoogleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-full bg-sky-500 px-6 py-3 font-bold text-white shadow transition-all hover:bg-sky-400 hover:shadow-md active:scale-95"
              >
                {t("events.addGCal")}
              </a>
            )}

            {justSubscribed && wasWaitlisted && (
              <div className="rounded-xl bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-600">
                {t("events.onWaitlist")}
              </div>
            )}
          </div>
        )}

        {/* View detail link */}
        <Link
          href={`/events/${event.id}`}
          className="mt-4 inline-block text-sm font-semibold text-coral-500 hover:text-coral-400 transition-colors"
        >
          {t("events.viewDetails")} &rarr;
        </Link>
      </div>
    </div>
  );
}

// ---------- Calendar View ----------

function CalendarView({ events }: { events: CocoEvent[] }) {
  const t = useT();
  const { locale } = useI18n();
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startOffset = (firstDay.getDay() + 6) % 7; // Monday = 0
  const daysInMonth = lastDay.getDate();

  const monthLabel = new Intl.DateTimeFormat(locale === "en" ? "en-US" : "fr-FR", {
    month: "long",
    year: "numeric",
  }).format(currentMonth);

  const dayNames = locale === "en"
    ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    : ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

  // Map events by day
  const eventsByDay: Record<number, CocoEvent[]> = {};
  for (const event of events) {
    const d = new Date(event.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!eventsByDay[day]) eventsByDay[day] = [];
      eventsByDay[day].push(event);
    }
  }

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const selectedEvents = selectedDay ? eventsByDay[selectedDay] || [] : [];

  function prevMonth() {
    setCurrentMonth(new Date(year, month - 1, 1));
    setSelectedDay(null);
  }

  function nextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1));
    setSelectedDay(null);
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="rounded-3xl bg-card p-6 shadow-md">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-full p-2 text-charcoal-muted hover:bg-coral-50 transition-colors"
        >
          &larr;
        </button>
        <h3 className="text-lg font-extrabold text-charcoal capitalize">
          {monthLabel}
        </h3>
        <button
          onClick={nextMonth}
          className="rounded-full p-2 text-charcoal-muted hover:bg-coral-50 transition-colors"
        >
          &rarr;
        </button>
      </div>

      {/* Day names */}
      <div className="mb-2 grid grid-cols-7 gap-1 text-center">
        {dayNames.map((d) => (
          <div key={d} className="text-xs font-bold text-charcoal-muted py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEvents = eventsByDay[day] || [];
          const isToday = isCurrentMonth && today.getDate() === day;
          const isSelected = selectedDay === day;

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={`relative flex flex-col items-center rounded-xl py-2 text-sm font-semibold transition-colors ${
                isSelected
                  ? "bg-coral-500 text-white"
                  : isToday
                    ? "bg-coral-100 text-coral-500"
                    : dayEvents.length > 0
                      ? "bg-coral-50 text-charcoal hover:bg-coral-100"
                      : "text-charcoal-muted hover:bg-card-hover"
              }`}
            >
              {day}
              {dayEvents.length > 0 && (
                <div className="mt-0.5 flex gap-0.5">
                  {dayEvents.slice(0, 3).map((_, j) => (
                    <span
                      key={j}
                      className={`h-1 w-1 rounded-full ${isSelected ? "bg-white" : "bg-coral-500"}`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day events */}
      {selectedDay !== null && (
        <div className="mt-4 border-t border-coral-100 pt-4">
          {selectedEvents.length === 0 ? (
            <p className="text-sm text-charcoal-muted text-center">
              {t("events.noEventsThisDay")}
            </p>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block rounded-2xl bg-coral-50 px-4 py-3 transition-colors hover:bg-coral-100"
                >
                  <p className="text-sm font-bold text-charcoal">
                    {event.title}
                  </p>
                  <p className="text-xs text-charcoal-muted">
                    📍 {event.location} — {formatDate(event.date, locale)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---------- Main Page ----------

export default function EventsPage() {
  const t = useT();
  const { locale } = useI18n();
  const [allEvents, setAllEvents] = useState<CocoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPast, setShowPast] = useState(false);
  const [view, setView] = useState<"list" | "map" | "calendar">("list");
  const [hasGroups, setHasGroups] = useState(true);
  const [visibleCount, setVisibleCount] = useState(EVENTS_PER_PAGE);

  const CATEGORY_LABELS: Record<string, string> = {
    parc: t("cat.parc"),
    sport: t("cat.sport"),
    musee: t("cat.musee"),
    spectacle: t("cat.spectacle"),
    restaurant: t("cat.restaurant"),
    atelier: t("cat.atelier"),
    piscine: t("cat.piscine"),
    balade: t("cat.balade"),
    autre: t("cat.autre"),
  };
  const CATEGORY_OPTIONS = [
    { value: "", label: t("cat.all") },
    ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({ value, label })),
  ];

  useEffect(() => {
    const groupIds = JSON.parse(localStorage.getItem("coco_groups") || "[]") as string[];
    setHasGroups(groupIds.length > 0);
    getEvents(groupIds.length > 0 ? groupIds : undefined).then((data) => {
      setAllEvents(data);
      setLoading(false);
    });
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    setVisibleCount(EVENTS_PER_PAGE);
  }, [categoryFilter, searchQuery]);

  const now = new Date();
  const filtered = allEvents.filter((e) => {
    if (categoryFilter && e.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const matchesTitle = e.title.toLowerCase().includes(q);
      const matchesLocation = e.location.toLowerCase().includes(q);
      const matchesDescription = e.description.toLowerCase().includes(q);
      if (!matchesTitle && !matchesLocation && !matchesDescription) return false;
    }
    return true;
  });

  const upcoming = filtered
    .filter((e) => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const past = filtered
    .filter((e) => new Date(e.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const hasGeoEvents = allEvents.some((e) => e.latitude && e.longitude);

  const visibleUpcoming = upcoming.slice(0, visibleCount);
  const hasMore = upcoming.length > visibleCount;

  return (
    <main className="min-h-screen bg-gradient-to-b from-coral-100 to-cream px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/"
              className="mb-2 inline-flex items-center text-sm font-semibold text-coral-500 hover:text-coral-400 transition-colors"
            >
              <span className="mr-1">&larr;</span> {t("events.home")}
            </Link>
            <h1 className="text-3xl font-extrabold text-charcoal sm:text-4xl">
              {t("events.title")} <span className="text-coral-500">🎈</span>
            </h1>
          </div>
          <Link
            href="/create"
            className="rounded-full bg-coral-500 px-6 py-3 font-bold text-white shadow-lg transition-all hover:bg-coral-400 hover:shadow-xl active:scale-95"
          >
            {t("events.new")}
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("events.search")}
            className="flex-1 min-w-[180px] rounded-full border-2 border-coral-200 bg-card px-4 py-2 text-sm text-charcoal placeholder:text-charcoal-faint focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-200 transition-colors"
          />

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-full border-2 border-coral-200 bg-card px-4 py-2 text-sm font-semibold text-charcoal cursor-pointer focus:border-coral-500 focus:outline-none"
          >
            {CATEGORY_OPTIONS.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>

          <div className="flex rounded-full border-2 border-coral-200 bg-card overflow-hidden">
            <button
              onClick={() => setView("list")}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${view === "list" ? "bg-coral-500 text-white" : "text-charcoal-muted hover:bg-coral-50"}`}
            >
              {t("events.list")}
            </button>
            <button
              onClick={() => setView("calendar")}
              className={`px-4 py-2 text-sm font-semibold transition-colors ${view === "calendar" ? "bg-coral-500 text-white" : "text-charcoal-muted hover:bg-coral-50"}`}
            >
              {t("events.calendar")}
            </button>
            {hasGeoEvents && (
              <button
                onClick={() => setView("map")}
                className={`px-4 py-2 text-sm font-semibold transition-colors ${view === "map" ? "bg-coral-500 text-white" : "text-charcoal-muted hover:bg-coral-50"}`}
              >
                {t("events.map")}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-charcoal-muted">
            {t("events.loading")}
          </div>
        ) : !hasGroups && allEvents.length === 0 ? (
          <div className="rounded-3xl bg-card p-12 text-center shadow-md">
            <p className="mb-2 text-5xl">🏫</p>
            <p className="text-lg font-bold text-charcoal">
              {t("events.joinGroup")}
            </p>
            <p className="mt-1 text-charcoal-muted">
              {t("events.joinGroupDesc")}
            </p>
            <Link
              href="/groups"
              className="mt-6 inline-flex rounded-full bg-coral-500 px-8 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95"
            >
              {t("events.myGroups")}
            </Link>
          </div>
        ) : allEvents.length === 0 ? (
          <div className="rounded-3xl bg-card p-12 text-center shadow-md">
            <p className="mb-2 text-5xl">🦗</p>
            <p className="text-lg font-bold text-charcoal">
              {t("events.noEvents")}
            </p>
            <p className="mt-1 text-charcoal-muted">
              {t("events.noEventsDesc")}
            </p>
            <Link
              href="/create"
              className="mt-6 inline-flex rounded-full bg-coral-500 px-8 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95"
            >
              {t("events.proposeEvent")}
            </Link>
          </div>
        ) : view === "map" ? (
          <MapView events={upcoming} />
        ) : view === "calendar" ? (
          <CalendarView events={[...upcoming, ...past]} />
        ) : (
          <>
            {/* Upcoming events */}
            {upcoming.length === 0 && past.length > 0 && (
              <div className="mb-6 rounded-3xl bg-card p-8 text-center shadow-md">
                <p className="text-charcoal-muted">
                  {t("events.noUpcoming")}
                  {categoryFilter ? ` ${t("events.inCategory")}` : ""}.
                </p>
              </div>
            )}

            {visibleUpcoming.length > 0 && (
              <div className="mb-8 space-y-6">
                {visibleUpcoming.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            )}

            {/* Load more */}
            {hasMore && (
              <div className="mb-8 text-center">
                <p className="mb-2 text-xs text-charcoal-muted">
                  {t("events.showingCount", visibleCount, upcoming.length)}
                </p>
                <button
                  onClick={() => setVisibleCount((c) => c + EVENTS_PER_PAGE)}
                  className="rounded-full border-2 border-coral-200 px-6 py-3 font-bold text-coral-500 transition-all hover:bg-coral-50 active:scale-95"
                >
                  {t("events.loadMore")}
                </button>
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
                  {t("events.pastEvents")} ({past.length})
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
  const t = useT();
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
      <div className="flex h-96 items-center justify-center rounded-3xl bg-card shadow-md">
        <p className="text-charcoal-muted">{t("events.loadingMap")}</p>
      </div>
    );
  }

  return <MapComponent events={events} />;
}
