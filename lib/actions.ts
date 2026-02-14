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

  // Generate unique code
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
    attendees: "[]",
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

    const events = [];
    for (let i = 0; i < count; i++) {
      const eventDate = new Date(
        startDate.getTime() + i * intervalDays * 24 * 60 * 60 * 1000
      );
      const eventEnd = duration
        ? new Date(eventDate.getTime() + duration)
        : null;

      events.push({ ...baseData, date: eventDate, endDate: eventEnd, seriesId });
    }

    await prisma.event.createMany({ data: events });
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

export async function getEvents(groupIds?: string[]) {
  const where = groupIds && groupIds.length > 0
    ? { groupId: { in: groupIds } }
    : {};

  const events = await prisma.event.findMany({
    where,
    orderBy: { date: "asc" },
    include: { group: true },
  });

  return events.map((e) => ({
    ...e,
    attendees: JSON.parse(e.attendees) as string[],
  }));
}

export async function getEvent(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      comments: { orderBy: { createdAt: "asc" } },
      checklist: true,
      group: true,
    },
  });

  if (!event) return null;

  return {
    ...event,
    attendees: JSON.parse(event.attendees) as string[],
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

// ==================== SUBSCRIBE ====================

export async function subscribeToEvent(eventId: string, name: string) {
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { error: "Événement introuvable.", attendees: [] as string[] };

  const attendees = JSON.parse(event.attendees) as string[];
  if (attendees.includes(name)) return { attendees };

  if (event.maxParticipants && attendees.length >= event.maxParticipants) {
    return { error: "Cette sortie est complète.", attendees };
  }

  attendees.push(name);

  await prisma.event.update({
    where: { id: eventId },
    data: { attendees: JSON.stringify(attendees) },
  });

  // Notify organizer
  sendPushToUser(event.organizer, {
    title: `${name} s'est inscrit(e) !`,
    body: `${name} participe à "${event.title}"`,
    url: `/events/${eventId}`,
  }).catch(() => {});

  return { attendees };
}

// ==================== COMMENTS ====================

export async function addComment(eventId: string, author: string, content: string) {
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
  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (event) {
    const attendees = JSON.parse(event.attendees) as string[];
    const toNotify = [...new Set([event.organizer, ...attendees])].filter(
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
