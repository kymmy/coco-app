"use client";

import { useT } from "@/lib/i18n";

export default function Community() {
  const t = useT();

  const bullets = [
    {
      emoji: "🔒",
      title: t("community.bullet1Title"),
      description: t("community.bullet1Desc"),
      bg: "bg-lavender-100",
      border: "border-lavender-200",
    },
    {
      emoji: "📍",
      title: t("community.bullet2Title"),
      description: t("community.bullet2Desc"),
      bg: "bg-sky-100",
      border: "border-sky-200",
    },
    {
      emoji: "🛡️",
      title: t("community.bullet3Title"),
      description: t("community.bullet3Desc"),
      bg: "bg-mint-100",
      border: "border-mint-200",
    },
    {
      emoji: "❤️",
      title: t("community.bullet4Title"),
      description: t("community.bullet4Desc"),
      bg: "bg-pink-100",
      border: "border-pink-200",
    },
  ];

  return (
    <section className="px-6 py-20 sm:px-12 lg:px-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-4 text-center text-3xl font-extrabold text-charcoal sm:text-4xl">
          {t("community.title")}
        </h2>
        <p className="mx-auto mb-14 max-w-xl text-center text-charcoal-muted">
          {t("community.subtitle")}
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {bullets.map((bullet) => (
            <div
              key={bullet.emoji}
              className={`flex gap-4 rounded-3xl border ${bullet.border} ${bullet.bg} p-5 shadow-sm transition-shadow hover:shadow-md`}
            >
              <div className="mt-0.5 text-3xl">{bullet.emoji}</div>
              <div>
                <h3 className="mb-1 font-bold text-charcoal">
                  {bullet.title}
                </h3>
                <p className="text-charcoal-muted">{bullet.description}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-2xl text-center text-lg font-semibold text-charcoal-light">
          {t("community.conclusion")}
        </p>
      </div>
    </section>
  );
}
