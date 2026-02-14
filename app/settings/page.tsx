"use client";

import { useEffect, useState, useTransition } from "react";
import { getGroups } from "@/lib/actions";
import { savePushSubscription } from "@/lib/actions";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";
import type { ThemeMode } from "@/lib/theme";
import type { Locale } from "@/lib/i18n";

interface Group {
  id: string;
  name: string;
  code: string;
  createdAt: Date;
}

const inputClass =
  "w-full rounded-xl border-2 border-coral-200 bg-coral-50 px-4 py-3 text-charcoal placeholder:text-charcoal-faint focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-200 transition-colors";

function getJoinedGroupIds(): string[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("coco_groups");
  return raw ? (JSON.parse(raw) as string[]) : [];
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { locale, setLocale, t } = useI18n();
  const [username, setUsername] = useState("");
  const [saved, setSaved] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | "unsupported">("default");
  const [notifBusy, setNotifBusy] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Load username from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("coco_username") || "";
    setUsername(stored);
  }, []);

  // Load groups from localStorage + server
  useEffect(() => {
    const ids = getJoinedGroupIds();
    if (ids.length > 0) {
      getGroups(ids).then((data) => {
        setGroups(data);
        setLoadingGroups(false);
      });
    } else {
      setLoadingGroups(false);
    }
  }, []);

  // Detect notification permission
  useEffect(() => {
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      setNotifPermission("unsupported");
    } else {
      setNotifPermission(Notification.permission);
    }
  }, []);

  function handleSaveUsername() {
    localStorage.setItem("coco_username", username.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleLeaveGroup(groupId: string) {
    const ids = getJoinedGroupIds().filter((id) => id !== groupId);
    localStorage.setItem("coco_groups", JSON.stringify(ids));
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  }

  async function handleEnableNotifications() {
    setNotifBusy(true);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      setNotifPermission(permission);

      if (permission !== "granted") {
        setNotifBusy(false);
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      const json = subscription.toJSON();
      const storedUsername = localStorage.getItem("coco_username") || "";
      const groupIds = getJoinedGroupIds();

      await savePushSubscription(
        {
          endpoint: json.endpoint!,
          keys: { p256dh: json.keys!.p256dh!, auth: json.keys!.auth! },
        },
        storedUsername,
        groupIds
      );

      setNotifSuccess(true);
      setTimeout(() => setNotifSuccess(false), 3000);
    } catch {
      // silently fail
    }
    setNotifBusy(false);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-coral-100 to-cream px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <h1 className="mb-2 text-3xl font-extrabold text-charcoal">
          {t("settings.title")}
        </h1>
        <p className="mb-8 text-charcoal-muted">
          {t("settings.subtitle")}
        </p>

        {/* ===== Display name ===== */}
        <section className="mb-6 rounded-3xl bg-card p-6 shadow-md">
          <h2 className="mb-4 text-lg font-extrabold text-charcoal">
            {t("settings.displayName")}
          </h2>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSaveUsername()}
            placeholder={t("settings.namePlaceholder")}
            className={inputClass}
          />
          <button
            onClick={handleSaveUsername}
            className="mt-3 w-full rounded-full bg-coral-500 px-6 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95 disabled:opacity-50"
          >
            {saved ? t("settings.saved") : t("settings.save")}
          </button>
        </section>

        {/* ===== Joined groups ===== */}
        <section className="mb-6 rounded-3xl bg-card p-6 shadow-md">
          <h2 className="mb-4 text-lg font-extrabold text-charcoal">
            {t("settings.myGroups")}
          </h2>

          {loadingGroups ? (
            <p className="text-sm text-charcoal-muted">{t("settings.loading")}</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-charcoal-muted">
              {t("settings.noGroups")}
            </p>
          ) : (
            <ul className="space-y-3">
              {groups.map((group) => (
                <li
                  key={group.id}
                  className="flex items-center justify-between rounded-xl border-2 border-coral-100 px-4 py-3"
                >
                  <div>
                    <span className="font-bold text-charcoal">
                      {group.name}
                    </span>
                    <span className="ml-2 rounded-lg bg-coral-50 px-2 py-0.5 font-mono text-xs font-bold tracking-wider text-coral-500">
                      {group.code}
                    </span>
                  </div>
                  <button
                    onClick={() => handleLeaveGroup(group.id)}
                    className="text-xs font-semibold text-charcoal-faint hover:text-pink-500 transition-colors"
                  >
                    {t("settings.leave")}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* ===== Notifications ===== */}
        <section className="mb-6 rounded-3xl bg-card p-6 shadow-md">
          <h2 className="mb-4 text-lg font-extrabold text-charcoal">
            {t("settings.notifications")}
          </h2>

          {notifPermission === "unsupported" ? (
            <p className="text-sm text-charcoal-muted">
              {t("settings.notifUnsupported")}
            </p>
          ) : (
            <>
              <div className="mb-4 flex items-center gap-3">
                <span className="text-sm text-charcoal-muted">{t("settings.status")}</span>
                {notifPermission === "granted" ? (
                  <span className="rounded-full bg-mint-100 px-3 py-1 text-xs font-bold text-mint-600">
                    {t("settings.notifEnabled")}
                  </span>
                ) : notifPermission === "denied" ? (
                  <span className="rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-500">
                    {t("settings.notifBlocked")}
                  </span>
                ) : (
                  <span className="rounded-full bg-coral-50 px-3 py-1 text-xs font-bold text-coral-500">
                    {t("settings.notifOff")}
                  </span>
                )}
              </div>

              {notifPermission === "denied" ? (
                <p className="text-sm text-charcoal-muted">
                  {t("settings.notifBlockedDesc")}
                </p>
              ) : (
                <button
                  onClick={handleEnableNotifications}
                  disabled={notifBusy}
                  className="w-full rounded-full border-2 border-coral-500 px-6 py-3 font-bold text-coral-500 transition-all hover:bg-coral-50 active:scale-95 disabled:opacity-50"
                >
                  {notifBusy
                    ? t("settings.enabling")
                    : notifSuccess
                      ? t("settings.notifEnabledMsg")
                      : notifPermission === "granted"
                        ? t("settings.resync")
                        : t("settings.enableNotif")}
                </button>
              )}
            </>
          )}
        </section>

        {/* ===== Appearance ===== */}
        <section className="mb-6 rounded-3xl bg-card p-6 shadow-md">
          <h2 className="mb-4 text-lg font-extrabold text-charcoal">
            {t("settings.appearance")}
          </h2>

          {/* Theme toggle */}
          <div className="mb-4">
            <p className="mb-2 text-sm font-bold text-charcoal">{t("settings.theme")}</p>
            <div className="flex rounded-full border-2 border-coral-200 overflow-hidden">
              {(["light", "dark", "system"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setTheme(mode)}
                  className={`flex-1 px-4 py-2.5 text-sm font-semibold transition-colors ${
                    theme === mode
                      ? "bg-coral-500 text-white"
                      : "text-charcoal-muted hover:bg-coral-50"
                  }`}
                >
                  {mode === "light" ? t("settings.light") : mode === "dark" ? t("settings.dark") : t("settings.auto")}
                </button>
              ))}
            </div>
          </div>

          {/* Language toggle */}
          <div>
            <p className="mb-2 text-sm font-bold text-charcoal">{t("settings.language")}</p>
            <div className="flex rounded-full border-2 border-coral-200 overflow-hidden">
              {(["fr", "en"] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => setLocale(lang)}
                  className={`flex-1 px-4 py-2.5 text-sm font-semibold transition-colors ${
                    locale === lang
                      ? "bg-coral-500 text-white"
                      : "text-charcoal-muted hover:bg-coral-50"
                  }`}
                >
                  {lang === "fr" ? "Fran\u00e7ais" : "English"}
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
