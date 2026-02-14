"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const t = useT();
  const { resolvedTheme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`sticky top-0 z-50 border-b border-coral-100 bg-cream/80 backdrop-blur-md transition-shadow duration-200 ${scrolled ? "shadow-md" : ""}`}>
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-xl font-extrabold text-charcoal">
          Coco <span className="text-coral-500">🥥</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/groups"
            className={`rounded-full px-3 py-2 text-sm font-bold transition-all sm:px-4 ${
              pathname.startsWith("/groups")
                ? "bg-coral-500 text-white"
                : "text-charcoal-muted hover:bg-coral-100 hover:text-charcoal"
            }`}
          >
            {t("nav.groups")}
          </Link>
          <Link
            href="/events"
            className={`rounded-full px-3 py-2 text-sm font-bold transition-all sm:px-4 ${
              pathname.startsWith("/events")
                ? "bg-coral-500 text-white"
                : "text-charcoal-muted hover:bg-coral-100 hover:text-charcoal"
            }`}
          >
            {t("nav.events")}
          </Link>
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="rounded-full p-2 text-charcoal-muted transition-all hover:bg-coral-100 hover:text-charcoal"
            aria-label={resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
          >
            {resolvedTheme === "dark" ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
              </svg>
            )}
          </button>
          <Link
            href="/settings"
            className={`rounded-full p-2 transition-all ${
              pathname === "/settings"
                ? "bg-coral-500 text-white"
                : "text-charcoal-muted hover:bg-coral-100 hover:text-charcoal"
            }`}
            aria-label={t("nav.settings")}
            title={t("nav.settings")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Link>
          <Link
            href="/create"
            className={`rounded-full px-3 py-2 text-sm font-bold transition-all sm:px-4 ${
              pathname === "/create"
                ? "bg-coral-500 text-white"
                : "border-2 border-coral-500 text-coral-500 hover:bg-coral-50"
            }`}
          >
            {t("nav.create")}
          </Link>
        </div>
      </div>
    </nav>
  );
}
