"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

export default function Hero() {
  const t = useT();

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-coral-100 to-cream px-6 pt-20 pb-24 sm:px-12 lg:px-24">
      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-block rounded-full bg-coral-200 px-4 py-1.5 text-sm font-bold text-coral-500">
          {t("hero.badge")}
        </div>

        <h1 className="mb-6 text-4xl leading-tight font-extrabold tracking-tight text-charcoal sm:text-5xl lg:text-6xl">
          {t("hero.title")}
          <span className="text-coral-500">{t("hero.titleAccent")}</span>
        </h1>

        <p className="mx-auto mb-10 max-w-xl text-lg text-charcoal-muted sm:text-xl">
          {t("hero.subtitle")}
        </p>

        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/groups"
            className="inline-flex items-center rounded-full bg-coral-500 px-8 py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-coral-400 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-300 focus-visible:ring-offset-2 active:scale-95"
          >
            {t("hero.ctaJoin")}
            <span className="ml-2 text-xl">👋</span>
          </Link>
          <Link
            href="/create"
            className="inline-flex items-center rounded-full border-2 border-coral-500 px-8 py-4 text-lg font-bold text-coral-500 transition-all hover:bg-coral-50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-300 focus-visible:ring-offset-2 active:scale-95"
          >
            {t("hero.ctaCreate")}
            <span className="ml-2 text-xl">🎉</span>
          </Link>
        </div>
      </div>

      {/* Decorative colored circles */}
      <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-pink-200 opacity-50 blur-2xl" />
      <div className="pointer-events-none absolute top-10 right-10 h-24 w-24 rounded-full bg-sky-200 opacity-50 blur-2xl" />
      <div className="pointer-events-none absolute -right-16 -bottom-16 h-56 w-56 rounded-full bg-mint-200 opacity-50 blur-2xl" />
      <div className="pointer-events-none absolute bottom-20 left-16 h-20 w-20 rounded-full bg-lavender-200 opacity-50 blur-2xl" />
      <div className="pointer-events-none absolute top-32 right-1/4 h-16 w-16 rounded-full bg-coral-200 opacity-60 blur-xl" />
    </section>
  );
}
