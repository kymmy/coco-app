"use client";

import { useEffect, useState } from "react";
import { savePushSubscription } from "@/lib/actions";
import { useT } from "@/lib/i18n";

export default function NotificationBanner() {
  const [show, setShow] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const t = useT();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (Notification.permission === "granted") return;
    if (Notification.permission === "denied") return;

    // Only show if user has joined at least one group
    const groups = JSON.parse(localStorage.getItem("coco_groups") || "[]") as string[];
    if (groups.length === 0) return;

    // Only show once per session
    if (sessionStorage.getItem("coco_notif_dismissed")) return;

    setShow(true);
  }, []);

  async function handleEnable() {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setShow(false);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      const json = subscription.toJSON();
      const username = localStorage.getItem("coco_username") || "";
      const groupIds = JSON.parse(localStorage.getItem("coco_groups") || "[]") as string[];

      await savePushSubscription(
        { endpoint: json.endpoint!, keys: { p256dh: json.keys!.p256dh, auth: json.keys!.auth } },
        username,
        groupIds
      );

      setSubscribed(true);
      setTimeout(() => setShow(false), 2000);
    } catch {
      setShow(false);
    }
  }

  function handleDismiss() {
    sessionStorage.setItem("coco_notif_dismissed", "1");
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-[slideUp_0.3s_ease-out] rounded-2xl bg-card p-4 shadow-xl border-2 border-coral-200">
      {subscribed ? (
        <p className="text-center text-sm font-bold text-mint-500">
          {t("notif.enabled")}
        </p>
      ) : (
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔔</span>
          <div className="flex-1">
            <p className="text-sm font-bold text-charcoal">
              {t("notif.question")}
            </p>
            <p className="text-xs text-charcoal-muted">
              {t("notif.description")}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleEnable}
                className="rounded-full bg-coral-500 px-4 py-1.5 text-xs font-bold text-white transition-all hover:bg-coral-400 active:scale-95"
              >
                {t("notif.enable")}
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-full border border-charcoal-faint px-4 py-1.5 text-xs font-semibold text-charcoal-muted hover:bg-card-hover transition-colors"
              >
                {t("notif.later")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
