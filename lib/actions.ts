"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { sendPushToGroup, sendPushToUser } from "@/lib/push";

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
    data: { name: name.trim(), code },
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

  if (!title || !date || !location || !description || !organizer) {
    return { error: "Titre, date, lieu, description et organisateur sont requis." };
  }

  const baseData = {
    title,
    location,
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
    eventLink: eventLink || "",
    description,
    image: image || null,
    category: category || "autre",
    price: price || "Gratuit",
    maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : null,
    organizer,
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
      recurrence === "weekly" ? 7 : recurrence === "biweekly" ? 14 : 30;

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

  // Push notification to group members
  if (groupId) {
    sendPushToGroup(groupId, {
      title: `Nouvelle sortie : ${title}`,
      body: `${organizer} propose "${title}" — ${location}`,
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
  };
}

export async function getEvents(groupIds?: string[]) {
  const where =
    groupIds && groupIds.length > 0
      ? { OR: [{ groupId: { in: groupIds } }, { groupId: null }] }
      : {};

  const events = await prisma.event.findMany({
    where,
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
  const event = await prisma.event.findUnique({
    where: { id },
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

  if (!title || !date || !location || !description || !organizer) {
    return { error: "Titre, date, lieu, description et organisateur sont requis." };
  }

  const existingEvent = await prisma.event.findUnique({ where: { id } });
  const finalImage = image || existingEvent?.image || null;

  await prisma.event.update({
    where: { id },
    data: {
      title,
      date: new Date(date),
      endDate: endDate ? new Date(endDate) : null,
      location,
      latitude: latitude ? parseFloat(latitude) : null,
      longitude: longitude ? parseFloat(longitude) : null,
      eventLink: eventLink || "",
      description,
      image: finalImage,
      category: category || "autre",
      price: price || "Gratuit",
      maxParticipants: maxParticipants ? parseInt(maxParticipants, 10) : null,
      organizer,
      ageMin: ageMin ? parseInt(ageMin, 10) : null,
      ageMax: ageMax ? parseInt(ageMax, 10) : null,
    },
  });

  return { success: true };
}

export async function deleteEvent(id: string) {
  await prisma.event.delete({ where: { id } });
  redirect("/events");
}

// ==================== RSVP ====================

export async function rsvpToEvent(
  eventId: string,
  name: string,
  status: "coming" | "maybe" | "cant"
) {
  if (!name.trim()) return { error: "Le prénom est requis." };

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { rsvps: true },
  });
  if (!event) return { error: "Événement introuvable." };

  const comingCount = event.rsvps.filter((r) => r.status === "coming").length;
  const existingRsvp = event.rsvps.find(
    (r) => r.name.toLowerCase() === name.trim().toLowerCase()
  );

  // Check capacity for new "coming" RSVPs
  if (
    status === "coming" &&
    event.maxParticipants &&
    comingCount >= event.maxParticipants &&
    (!existingRsvp || existingRsvp.status !== "coming")
  ) {
    return { error: "Cette sortie est complète." };
  }

  await prisma.rsvp.upsert({
    where: {
      eventId_name: { eventId, name: name.trim() },
    },
    update: { status },
    create: { eventId, name: name.trim(), status },
  });

  // Notify organizer for "coming" RSVPs
  if (status === "coming") {
    sendPushToUser(event.organizer, {
      title: `${name.trim()} s'est inscrit(e) !`,
      body: `${name.trim()} participe à "${event.title}"`,
      url: `/events/${eventId}`,
    }).catch(() => {});
  }

  const rsvps = await prisma.rsvp.findMany({ where: { eventId } });
  return { attendees: formatRsvps(rsvps) };
}

export async function unrsvpFromEvent(eventId: string, name: string) {
  if (!name.trim()) return { error: "Le prénom est requis." };

  await prisma.rsvp
    .delete({
      where: { eventId_name: { eventId, name: name.trim() } },
    })
    .catch(() => {});

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

  const comment = await prisma.comment.create({
    data: {
      eventId,
      author: author.trim(),
      content: content.trim(),
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
      (n) => n !== author.trim()
    );
    for (const user of toNotify) {
      sendPushToUser(user, {
        title: `Nouveau message de ${author.trim()}`,
        body: content.trim().slice(0, 100),
        url: `/events/${eventId}`,
      }).catch(() => {});
    }
  }

  return { comment };
}

// ==================== CHECKLIST ====================

export async function addChecklistItem(eventId: string, label: string) {
  if (!label.trim()) return { error: "Intitulé requis." };

  const item = await prisma.checklistItem.create({
    data: { eventId, label: label.trim() },
  });

  return { item };
}

export async function claimChecklistItem(itemId: string, username: string) {
  const item = await prisma.checklistItem.update({
    where: { id: itemId },
    data: { claimedBy: username || null },
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
    data: { eventId, data, author: author.trim() },
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
