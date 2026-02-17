"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const { locale, setLocale, t } = useI18n();
  const { resolvedTheme, setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

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
      <div className="mx-auto flex max-w-5xl items-center justify-between px-3 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 text-xl font-extrabold text-charcoal">
          <img src="/logo.svg" alt="Tribu" className="h-8 w-8" />
          <span className="hidden sm:inline">Tribu</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-3">
          <Link
            href="/groups"
            className={`rounded-full px-2.5 py-1.5 text-xs font-bold transition-all sm:px-4 sm:py-2 sm:text-sm ${
              pathname.startsWith("/groups")
                ? "bg-coral-500 text-white"
                : "text-charcoal-muted hover:bg-coral-100 hover:text-charcoal"
            }`}
          >
            {t("nav.groups")}
          </Link>
          <Link
            href="/events"
            className={`rounded-full px-2.5 py-1.5 text-xs font-bold transition-all sm:px-4 sm:py-2 sm:text-sm ${
              pathname.startsWith("/events")
                ? "bg-coral-500 text-white"
                : "text-charcoal-muted hover:bg-coral-100 hover:text-charcoal"
            }`}
          >
            {t("nav.events")}
          </Link>
          {/* Desktop-only: language, theme, about, settings */}
          <button
            onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
            className="hidden rounded-full px-1.5 py-1.5 text-xs font-bold text-charcoal-muted transition-all hover:bg-coral-100 hover:text-charcoal sm:inline-flex sm:px-2"
            aria-label={locale === "fr" ? "Switch to English" : "Passer en français"}
          >
            {locale === "fr" ? "EN" : "FR"}
          </button>
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="hidden rounded-full p-1.5 text-charcoal-muted transition-all hover:bg-coral-100 hover:text-charcoal sm:inline-flex sm:p-2"
            aria-label={resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
          >
            {resolvedTheme === "dark" ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-5 sm:w-5">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 sm:h-5 sm:w-5">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
              </svg>
            )}
          </button>
          <Link
            href="/about"
            className={`hidden rounded-full p-1.5 transition-all sm:inline-flex sm:p-2 ${
              pathname === "/about"
                ? "bg-coral-500 text-white"
                : "text-charcoal-muted hover:bg-coral-100 hover:text-charcoal"
            }`}
            aria-label={t("nav.about")}
            title={t("nav.about")}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 sm:h-5 sm:w-5"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
          </Link>
          <Link
            href="/settings"
            className={`hidden rounded-full p-1.5 transition-all sm:inline-flex sm:p-2 ${
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
              className="h-4 w-4 sm:h-5 sm:w-5"
            >
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </Link>
          {/* Hamburger button (mobile only) */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-full p-1.5 text-charcoal-muted transition-all hover:bg-coral-100 hover:text-charcoal sm:hidden"
            aria-label="Menu"
          >
            {menuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
          <Link
            href="/create"
            className={`rounded-full px-2.5 py-1.5 text-xs font-bold transition-all sm:px-4 sm:py-2 sm:text-sm ${
              pathname === "/create"
                ? "bg-coral-500 text-white"
                : "border-2 border-coral-500 text-coral-500 hover:bg-coral-50"
            }`}
          >
            {t("nav.create")}
          </Link>
        </div>
      </div>
      {/* Mobile dropdown menu */}
      {menuOpen && (
        <div className="border-t border-coral-100 bg-cream/80 backdrop-blur-md sm:hidden">
          <div className="mx-auto flex max-w-5xl flex-col px-3 py-2">
            <button
              onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-charcoal-muted transition-all hover:bg-coral-100 hover:text-charcoal"
            >
              <span className="flex h-5 w-5 items-center justify-center text-xs">
                {locale === "fr" ? "EN" : "FR"}
              </span>
              {locale === "fr" ? "Switch to English" : "Passer en français"}
            </button>
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold text-charcoal-muted transition-all hover:bg-coral-100 hover:text-charcoal"
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
              {resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <Link
              href="/about"
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${
                pathname === "/about"
                  ? "bg-coral-500 text-white"
                  : "text-charcoal-muted hover:bg-coral-100 hover:text-charcoal"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4M12 8h.01" />
              </svg>
              {t("nav.about")}
            </Link>
            <Link
              href="/settings"
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition-all ${
                pathname === "/settings"
                  ? "bg-coral-500 text-white"
                  : "text-charcoal-muted hover:bg-coral-100 hover:text-charcoal"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {t("nav.settings")}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
