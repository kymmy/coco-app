"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

// ---------- Create ----------

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

      events.push({
        ...baseData,
        date: eventDate,
        endDate: eventEnd,
        seriesId,
      });
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

  redirect("/events");
}

// ---------- Read ----------

export async function getEvents() {
  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
  });

  return events.map((e) => ({
    ...e,
    attendees: JSON.parse(e.attendees) as string[],
  }));
}

export async function getEvent(id: string) {
  const event = await prisma.event.findUnique({
    where: { id },
    include: { comments: { orderBy: { createdAt: "asc" } } },
  });

  if (!event) return null;

  return {
    ...event,
    attendees: JSON.parse(event.attendees) as string[],
  };
}

// ---------- Update ----------

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

  // Keep existing image if no new one provided
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

// ---------- Delete ----------

export async function deleteEvent(id: string) {
  await prisma.event.delete({ where: { id } });
  redirect("/events");
}

// ---------- Subscribe ----------

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

  return { attendees };
}

// ---------- Comments ----------

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

  return { comment };
}
