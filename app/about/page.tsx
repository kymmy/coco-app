"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n";

export default function AboutPage() {
  const { t } = useI18n();

  return (
    <main className="min-h-screen bg-gradient-to-b from-coral-100 to-cream px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <img src="/logo.svg" alt="Coco" className="mx-auto mb-4 h-20 w-20 drop-shadow-lg" />
          <h1 className="mb-2 text-3xl font-extrabold text-charcoal">
            {t("about.title")}
          </h1>
          <p className="text-charcoal-muted">{t("about.subtitle")}</p>
        </div>

        {/* What is Coco */}
        <section className="mb-6 rounded-3xl bg-card p-6 shadow-md">
          <h2 className="mb-3 text-lg font-extrabold text-charcoal">
            {t("about.whatTitle")}
          </h2>
          <p className="mb-3 leading-relaxed text-charcoal-muted">
            {t("about.whatDesc1")}
          </p>
          <p className="leading-relaxed text-charcoal-muted">
            {t("about.whatDesc2")}
          </p>
        </section>

        {/* Our values */}
        <section className="mb-6 rounded-3xl bg-card p-6 shadow-md">
          <h2 className="mb-4 text-lg font-extrabold text-charcoal">
            {t("about.valuesTitle")}
          </h2>
          <ul className="space-y-3">
            {(["simple", "local", "private", "family"] as const).map((v) => (
              <li key={v} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-coral-100 text-sm">
                  {v === "simple" && "✨"}
                  {v === "local" && "📍"}
                  {v === "private" && "🔒"}
                  {v === "family" && "👨‍👩‍👧‍👦"}
                </span>
                <div>
                  <p className="font-bold text-charcoal">
                    {t(`about.value_${v}_title`)}
                  </p>
                  <p className="text-sm text-charcoal-muted">
                    {t(`about.value_${v}_desc`)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Contact */}
        <section className="mb-6 rounded-3xl bg-card p-6 shadow-md">
          <h2 className="mb-3 text-lg font-extrabold text-charcoal">
            {t("about.contactTitle")}
          </h2>
          <p className="mb-4 text-charcoal-muted">
            {t("about.contactDesc")}
          </p>
          <a
            href="mailto:coucou@coco-app.fr"
            className="inline-flex items-center gap-2 rounded-full bg-coral-500 px-6 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            coucou@coco-app.fr
          </a>
        </section>

        {/* Hosting */}
        <section className="mb-6 rounded-3xl bg-card p-6 shadow-md">
          <h2 className="mb-3 text-lg font-extrabold text-charcoal">
            {t("about.hostingTitle")}
          </h2>
          <p className="mb-3 leading-relaxed text-charcoal-muted">
            {t("about.hostingDesc")}
          </p>
          <div className="flex items-center gap-3 rounded-xl border-2 border-coral-100 px-4 py-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm">
              🇪🇺
            </span>
            <div>
              <p className="text-sm font-bold text-charcoal">{t("about.hostingProvider")}</p>
              <p className="text-xs text-charcoal-muted">{t("about.hostingLocation")}</p>
            </div>
          </div>
        </section>

        {/* Source code */}
        <section className="mb-6 rounded-3xl bg-card p-6 shadow-md">
          <h2 className="mb-3 text-lg font-extrabold text-charcoal">
            {t("about.sourceTitle")}
          </h2>
          <p className="mb-4 text-charcoal-muted">
            {t("about.sourceDesc")}
          </p>
          <a
            href="https://github.com/kymmy/coco-app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border-2 border-coral-500 px-6 py-3 font-bold text-coral-500 transition-all hover:bg-coral-50 active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
              <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.12.83-.26.83-.57L9 20.93c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.09-.73.09-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.31-5.47-1.34-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 6.02 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.62-5.48 5.92.42.36.81 1.1.81 2.22l-.01 3.29c0 .31.2.69.82.57A12 12 0 0 0 12 .3" />
            </svg>
            GitHub
          </a>
        </section>

        {/* Back link */}
        <div className="text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border-2 border-coral-200 px-6 py-2.5 text-sm font-bold text-coral-500 transition-all hover:bg-coral-50 active:scale-95"
          >
            {t("about.backHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}
