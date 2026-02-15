"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { sendPushToGroup, sendPushToUser } from "@/lib/push";

// ==================== HELPERS ====================

/** Strip HTML tags from user input to prevent XSS */
function sanitize(input: string): string {
  return input.replace(/<[^>]*>/g, "").trim();
}

// ==================== RATE LIMITING ====================

const MAX_EVENTS_PER_HOUR = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MIN_SUBMIT_TIME_MS = 3_000; // 3 seconds minimum between form load and submit

/** In-memory store: IP → list of creation timestamps */
const rateLimitMap = new Map<string, number[]>();

function getClientIp(hdrs: Headers): string {
  return (
    hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    hdrs.get("x-real-ip") ||
    "unknown"
  );
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  // Keep only timestamps within the window
  const recent = timestamps.filter((t) => now - t < RATE_WINDOW_MS);
  rateLimitMap.set(ip, recent);
  return recent.length >= MAX_EVENTS_PER_HOUR;
}

function recordCreation(ip: string) {
  const timestamps = rateLimitMap.get(ip) || [];
  timestamps.push(Date.now());
  rateLimitMap.set(ip, timestamps);
}

// ==================== GROUPS ====================

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function createGroup(name: string) {
  if (!name.trim()) return { error: "Le nom du groupe est requis." };

  let code = generateCode();
  let exists = await prisma.group.findUnique({ where: { code } });
  while (exists) {
    code = generateCode();
    exists = await prisma.group.findUnique({ where: { code } });
  }

  const group = await prisma.group.create({
    data: { name: sanitize(name), code },
  });

  return { group };
}

export async function joinGroup(code: string) {
  if (!code.trim()) return { error: "Le code est requis." };

  const group = await prisma.group.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!group) return { error: "Code introuvable. Vérifiez et réessayez." };

  return { group };
}

export async function getGroup(id: string) {
  return prisma.group.findUnique({ where: { id } });
}

export async function getGroups(ids: string[]) {
  if (ids.length === 0) return [];
  return prisma.group.findMany({ where: { id: { in: ids } } });
}

// ==================== EVENTS ====================

export async function createEvent(formData: FormData) {
  // Anti-spam: honeypot field — bots fill this, humans don't see it
  const honeypot = formData.get("website") as string | null;
  if (honeypot) {
    // Silently pretend success so bots don't adapt
    redirect("/events");
  }

  // Anti-spam: timestamp check — reject if submitted too fast
  const loadedAt = formData.get("_t") as string | null;
  if (loadedAt) {
    const elapsed = Date.now() - parseInt(loadedAt, 10);
    if (elapsed < MIN_SUBMIT_TIME_MS) {
      return { error: "Veuillez patienter quelques secondes avant de soumettre." };
    }
  }

  // Anti-spam: IP-based rate limiting
  const hdrs = await headers();
  const ip = getClientIp(hdrs);
  if (isRateLimited(ip)) {
    return { error: "Trop de sorties créées récemment. Réessayez dans quelques minutes." };
  }

  const title = formData.get("title") as string;
  const date = formData.get("date") as string;
  const endDate = formData.get("endDate") as string | null;
  const location = formData.get("location") as string;
  const latitude = formData.get("latitude") as string | null;
  const longitude = formData.get("longitude") as string | null;
  const eventLink = formData.get("eventLink") as string;
  const description = formData.get("description") as string;
  const image = formData.get("image") as string | null;
  const category = formData.get("category") as string;
  const price = formData.get("price") as string;
  const maxParticipants = formData.get("maxParticipants") as string | null;
  const organizer = formData.get("organizer") as string;
  const ageMin = formData.get("ageMin") as string | null;
  const ageMax = formData.get("ageMax") as string | null;
  const groupId = formData.get("groupId") as string | null;
  const recurrence = formData.get("recurrence") as string | null;
  const recurrenceCount = formData.get("recurrenceCount") as string | null;
  const customIntervalDays = formData.get("customIntervalDays") as string | null;

  if (!title || !date || !location || !description || !organizer) {
    return { error: "Titre, date, lieu, description et organisateur sont requis." };
  }

  const baseData = {
    title: sanitize(title),
    location: sanitize(location),
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
    eventLink: eventLink || "",
    description: sanitize(description),
    image: image || null,
    category: category || "autre",
    price: price || "Gratuit",
    maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : null,
    organizer: sanitize(organizer),
    ageMin: ageMin ? parseInt(ageMin, 10) : null,
    ageMax: ageMax ? parseInt(ageMax, 10) : null,
    groupId: groupId || null,
  };

  if (recurrence && recurrence !== "none" && recurrenceCount) {
    const count = Math.min(parseInt(recurrenceCount, 10), 52);
    const seriesId = crypto.randomUUID();
    const startDate = new Date(date);
    const endDateParsed = endDate ? new Date(endDate) : null;
    const duration = endDateParsed
      ? endDateParsed.getTime() - startDate.getTime()
      : 0;

    const intervalDays =
      recurrence === "custom" && customIntervalDays
        ? Math.max(1, Math.min(365, parseInt(customIntervalDays, 10)))
        : recurrence === "weekly" ? 7 : recurrence === "biweekly" ? 14 : 30;

    for (let i = 0; i < count; i++) {
      const eventDate = new Date(
        startDate.getTime() + i * intervalDays * 24 * 60 * 60 * 1000
      );
      const eventEnd = duration
        ? new Date(eventDate.getTime() + duration)
        : null;

      await prisma.event.create({
        data: { ...baseData, date: eventDate, endDate: eventEnd, seriesId },
      });
    }
  } else {
    await prisma.event.create({
      data: {
        ...baseData,
        date: new Date(date),
        endDate: endDate ? new Date(endDate) : null,
        seriesId: null,
      },
    });
  }

  // Record successful creation for rate limiting
  recordCreation(ip);

  // Push notification to group members
  if (groupId) {
    sendPushToGroup(groupId, {
      title: `Nouvelle sortie : ${sanitize(title)}`,
      body: `${sanitize(organizer)} propose "${sanitize(title)}" — ${sanitize(location)}`,
      url: "/events",
    }).catch(() => {});
  }

  redirect("/events");
}

function formatRsvps(rsvps: { name: string; status: string }[]) {
  return {
    coming: rsvps.filter((r) => r.status === "coming").map((r) => r.name),
    maybe: rsvps.filter((r) => r.status === "maybe").map((r) => r.name),
    cant: rsvps.filter((r) => r.status === "cant").map((r) => r.name),
    waitlist: rsvps.filter((r) => r.status === "waitlist").map((r) => r.name),
  };
}

export async function getEvents(groupIds?: string[]) {
  const groupFilter =
    groupIds && groupIds.length > 0
      ? { OR: [{ groupId: { in: groupIds } }, { groupId: null }] }
      : {};

  const events = await prisma.event.findMany({
    where: { ...groupFilter, deletedAt: null },
    orderBy: { date: "asc" },
    include: { group: true, rsvps: true },
  });

  return events.map((e) => ({
    ...e,
    attendees: formatRsvps(e.rsvps),
    rsvps: undefined,
  }));
}

export async function getEvent(id: string) {
  const event = await prisma.event.findFirst({
    where: { id, deletedAt: null },
    include: {
      comments: { orderBy: { createdAt: "asc" } },
      checklist: true,
      group: true,
      rsvps: true,
      photos: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!event) return null;

  return {
    ...event,
    attendees: formatRsvps(event.rsvps),
    rsvps: undefined,
  };
}

export async function updateEvent(id: string, formData: FormData) {
  const title = formData.get("title") as string;
  const date = formData.get("date") as string;
  const endDate = formData.get("endDate") as string | null;
  const location = formData.get("location") as string;
  const latitude = formData.get("latitude") as string | null;
  const longitude = formData.get("longitude") as string | null;
  const eventLink = formData.get("eventLink") as string;
  const description = formData.get("description") as string;
  const image = formData.get("image") as string | null;
  const category = formData.get("category") as string;
  const price = formData.get("price") as string;
  const maxParticipants = formData.get("maxParticipants") as string | null;
  const organizer = formData.get("organizer") as string;
  const ageMin = formData.get("ageMin") as string | null;
  const ageMax = formData.get("ageMax") as string | null;
  const groupId = formData.get("groupId") as string | null;

  if (!title || !date || !location || !description || !organizer) {
    return { error: "Titre, date, lieu, description et organisateur sont requis." };
  }

  const existingEvent = await prisma.event.findUnique({ where: { id } });
  const finalImage = image || existingEvent?.image || null;

  const updatedEvent = await prisma.event.update({
    where: { id },
    data: {
      title: sanitize(title),
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : null,
      location: sanitize(location),
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      eventLink: eventLink || "",
      description: sanitize(description),
      image: finalImage,
      category: category || "autre",
      price: price || "Gratuit",
      maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : null,
      organizer: sanitize(organizer),
      ageMin: ageMin ? parseInt(ageMin, 10) : null,
      ageMax: ageMax ? parseInt(ageMax, 10) : null,
      groupId: groupId || null,
    },
    include: { rsvps: true },
  });

  // Notify attendees that the event was updated
  const attendeeNames = updatedEvent.rsvps
    .filter((r) => r.status === "coming" || r.status === "maybe")
    .map((r) => r.name);
  const toNotify = [...new Set(attendeeNames)].filter(
    (n) => n.toLowerCase() !== sanitize(organizer).toLowerCase()
  );
  for (const user of toNotify) {
    sendPushToUser(user, {
      title: `Sortie modifiée : ${updatedEvent.title}`,
      body: `📍 ${updatedEvent.location}`,
      url: `/events/${id}`,
    }).catch(() => {});
  }

  return { success: true };
}

export async function deleteEvent(id: string) {
  await prisma.event.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  redirect("/events");
}

export async function deleteEventSeries(seriesId: string) {
  await prisma.event.updateMany({
    where: { seriesId, deletedAt: null },
    data: { deletedAt: new Date() },
  });
  redirect("/events");
}

// ==================== RSVP ====================

export async function rsvpToEvent(
  eventId: string,
  name: string,
  status: "coming" | "maybe" | "cant"
) {
  if (!name.trim()) return { error: "Le prénom est requis." };

  const cleanName = sanitize(name);

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { rsvps: true },
  });
  if (!event) return { error: "Événement introuvable." };

  const comingCount = event.rsvps.filter((r) => r.status === "coming").length;
  const existingRsvp = event.rsvps.find(
    (r) => r.name.toLowerCase() === cleanName.toLowerCase()
  );

  // Check capacity for new "coming" RSVPs — put on waitlist if full
  let finalStatus: string = status;
  if (
    status === "coming" &&
    event.maxParticipants &&
    comingCount >= event.maxParticipants &&
    (!existingRsvp || existingRsvp.status !== "coming")
  ) {
    finalStatus = "waitlist";
  }

  await prisma.rsvp.upsert({
    where: {
      eventId_name: { eventId, name: cleanName },
    },
    update: { status: finalStatus },
    create: { eventId, name: cleanName, status: finalStatus },
  });

  // Notify organizer for "coming" RSVPs
  if (finalStatus === "coming") {
    sendPushToUser(event.organizer, {
      title: `${cleanName} s'est inscrit(e) !`,
      body: `${cleanName} participe à "${event.title}"`,
      url: `/events/${eventId}`,
    }).catch(() => {});
  }

  const rsvps = await prisma.rsvp.findMany({ where: { eventId } });
  return {
    attendees: formatRsvps(rsvps),
    wasWaitlisted: finalStatus === "waitlist",
  };
}

export async function unrsvpFromEvent(eventId: string, name: string) {
  if (!name.trim()) return { error: "Le prénom est requis." };

  const cleanName = sanitize(name);

  // Check if the user being removed was "coming"
  const removedRsvp = await prisma.rsvp
    .findUnique({
      where: { eventId_name: { eventId, name: cleanName } },
    })
    .catch(() => null);

  await prisma.rsvp
    .delete({
      where: { eventId_name: { eventId, name: cleanName } },
    })
    .catch(() => {});

  // Promote first waitlisted user if a "coming" user left
  if (removedRsvp?.status === "coming") {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (event?.maxParticipants) {
      const currentComing = await prisma.rsvp.count({
        where: { eventId, status: "coming" },
      });

      if (currentComing < event.maxParticipants) {
        const firstWaitlisted = await prisma.rsvp.findFirst({
          where: { eventId, status: "waitlist" },
          orderBy: { id: "asc" },
        });

        if (firstWaitlisted) {
          await prisma.rsvp.update({
            where: { id: firstWaitlisted.id },
            data: { status: "coming" },
          });

          sendPushToUser(firstWaitlisted.name, {
            title: "Une place s'est libérée !",
            body: `Vous êtes maintenant inscrit(e) à "${event.title}"`,
            url: `/events/${eventId}`,
          }).catch(() => {});
        }
      }
    }
  }

  const rsvps = await prisma.rsvp.findMany({ where: { eventId } });
  return { attendees: formatRsvps(rsvps) };
}

// ==================== COMMENTS ====================

export async function addComment(
  eventId: string,
  author: string,
  content: string
) {
  if (!author.trim() || !content.trim()) {
    return { error: "Nom et message requis." };
  }

  const cleanAuthor = sanitize(author);
  const cleanContent = sanitize(content);

  const comment = await prisma.comment.create({
    data: {
      eventId,
      author: cleanAuthor,
      content: cleanContent,
    },
  });

  // Notify attendees + organizer
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { rsvps: true },
  });
  if (event) {
    const names = event.rsvps.map((r) => r.name);
    const toNotify = [...new Set([event.organizer, ...names])].filter(
      (n) => n !== cleanAuthor
    );
    for (const user of toNotify) {
      sendPushToUser(user, {
        title: `Nouveau message de ${cleanAuthor}`,
        body: cleanContent.slice(0, 100),
        url: `/events/${eventId}`,
      }).catch(() => {});
    }
  }

  return { comment };
}

export async function deleteComment(commentId: string) {
  await prisma.comment.delete({ where: { id: commentId } });
  return { success: true };
}

// ==================== CHECKLIST ====================

export async function addChecklistItem(
  eventId: string,
  label: string,
  quantity: number = 1
) {
  if (!label.trim()) return { error: "Intitulé requis." };

  const item = await prisma.checklistItem.create({
    data: {
      eventId,
      label: sanitize(label),
      quantity: Math.max(1, Math.min(quantity, 99)),
    },
  });

  return { item };
}

export async function claimChecklistItem(itemId: string, username: string) {
  const item = await prisma.checklistItem.update({
    where: { id: itemId },
    data: { claimedBy: username ? sanitize(username) : null },
  });
  return { item };
}

export async function removeChecklistItem(itemId: string) {
  await prisma.checklistItem.delete({ where: { id: itemId } });
  return { success: true };
}

// ==================== PHOTOS ====================

export async function addEventPhoto(
  eventId: string,
  data: string,
  author: string
) {
  if (!data || !author.trim()) return { error: "Photo et auteur requis." };

  const photo = await prisma.eventPhoto.create({
    data: { eventId, data, author: sanitize(author) },
  });

  return { photo };
}

export async function removeEventPhoto(photoId: string) {
  await prisma.eventPhoto.delete({ where: { id: photoId } });
  return { success: true };
}

// ==================== REMINDERS ====================

export async function sendEventReminders() {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const events = await prisma.event.findMany({
    where: {
      date: { gte: now, lte: tomorrow },
      reminderSent: false,
      deletedAt: null,
    },
    include: { rsvps: true },
  });

  for (const event of events) {
    const attendeeNames = event.rsvps
      .filter((r) => r.status === "coming" || r.status === "maybe")
      .map((r) => r.name);

    for (const name of attendeeNames) {
      sendPushToUser(name, {
        title: `Rappel : ${event.title} demain !`,
        body: `📍 ${event.location}`,
        url: `/events/${event.id}`,
      }).catch(() => {});
    }

    await prisma.event.update({
      where: { id: event.id },
      data: { reminderSent: true },
    });
  }

  return { reminded: events.length };
}

// ==================== PUSH SUBSCRIPTIONS ====================

export async function savePushSubscription(
  subscription: { endpoint: string; keys: { p256dh: string; auth: string } },
  username: string,
  groupIds: string[]
) {
  await prisma.pushSubscription.upsert({
    where: { endpoint: subscription.endpoint },
    update: {
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      username,
      groupIds: JSON.stringify(groupIds),
    },
    create: {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      username,
      groupIds: JSON.stringify(groupIds),
    },
  });

  return { success: true };
}
