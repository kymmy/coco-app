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
              🇫🇷
            </span>
            <div>
              <p className="text-sm font-bold text-charcoal">{t("about.hostingProvider")}</p>
              <p className="text-xs text-charcoal-muted">{t("about.hostingLocation")}</p>
            </div>
          </div>
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
