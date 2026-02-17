import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let vapidConfigured = false;

function ensureVapidConfigured() {
  if (!vapidConfigured) {
    webpush.setVapidDetails(
      "mailto:contact@tribu-app.fr",
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
      process.env.VAPID_PRIVATE_KEY!
    );
    vapidConfigured = true;
  }
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

async function sendPush(endpoint: string, p256dh: string, auth: string, payload: PushPayload) {
  ensureVapidConfigured();
  try {
    await webpush.sendNotification(
      {
        endpoint,
        keys: { p256dh, auth },
      },
      JSON.stringify(payload)
    );
  } catch (err: unknown) {
    // Remove invalid subscriptions (410 Gone, 404)
    const statusCode = (err as { statusCode?: number })?.statusCode;
    if (statusCode === 410 || statusCode === 404) {
      await prisma.pushSubscription.delete({ where: { endpoint } }).catch(() => {});
    }
  }
}

export async function sendPushToGroup(groupId: string, payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany();

  for (const sub of subscriptions) {
    const groupIds = JSON.parse(sub.groupIds) as string[];
    if (groupIds.includes(groupId)) {
      await sendPush(sub.endpoint, sub.p256dh, sub.auth, payload);
    }
  }
}

export async function sendPushToUser(username: string, payload: PushPayload) {
  const subscriptions = await prisma.pushSubscription.findMany({
    where: { username },
  });

  for (const sub of subscriptions) {
    await sendPush(sub.endpoint, sub.p256dh, sub.auth, payload);
  }
}
