"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

function isInStandaloneMode() {
  if (typeof window === "undefined") return false;
  return (
    ("standalone" in window.navigator && (window.navigator as any).standalone) ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

export default function PwaInstallPrompt() {
  const t = useT();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem("tribu_pwa_dismissed")) return;
    if (isInStandaloneMode()) return;

    if (isIos()) {
      // Show iOS-specific install guide after 3 seconds
      const timer = setTimeout(() => setShowIosPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android/desktop: use beforeinstallprompt
    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (dismissed) return null;
  if (!deferredPrompt && !showIosPrompt) return null;

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem("tribu_pwa_dismissed", "1");
    setDeferredPrompt(null);
    setShowIosPrompt(false);
  }

  // iOS install guide
  if (showIosPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm animate-[fadeInUp_0.3s_ease-out] rounded-2xl border border-coral-200 bg-card p-4 shadow-xl sm:left-auto sm:right-6 sm:bottom-6">
        <p className="mb-2 text-sm font-bold text-charcoal">
          {t("pwa.install")}
        </p>
        <p className="mb-3 text-xs text-charcoal-muted leading-relaxed">
          {t("pwa.iosGuide")}
        </p>
        <button
          onClick={handleDismiss}
          className="w-full rounded-full border border-coral-200 px-4 py-2 text-sm font-semibold text-charcoal-muted transition-colors hover:bg-coral-50"
        >
          {t("pwa.dismiss")}
        </button>
      </div>
    );
  }

  // Android/desktop install prompt
  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm animate-[fadeInUp_0.3s_ease-out] rounded-2xl border border-coral-200 bg-card p-4 shadow-xl sm:left-auto sm:right-6 sm:bottom-6">
      <p className="mb-3 text-sm font-bold text-charcoal">
        {t("pwa.install")}
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleInstall}
          className="flex-1 rounded-full bg-coral-500 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-coral-400 active:scale-95"
        >
          {t("pwa.installButton")}
        </button>
        <button
          onClick={handleDismiss}
          className="rounded-full border border-coral-200 px-4 py-2 text-sm font-semibold text-charcoal-muted transition-colors hover:bg-coral-50"
        >
          {t("pwa.dismiss")}
        </button>
      </div>
    </div>
  );
}
