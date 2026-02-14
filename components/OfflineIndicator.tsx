"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

export default function OfflineIndicator() {
  const t = useT();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);

    function handleOnline() { setOffline(false); }
    function handleOffline() { setOffline(true); }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[60] bg-charcoal px-4 py-2 text-center text-sm font-bold text-white">
      {t("pwa.offline")}
    </div>
  );
}
