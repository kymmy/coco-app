"use client";

import { useT } from "@/lib/i18n";

export default function SocialProof() {
  const t = useT();

  const stats = [
    {
      value: t("social.stat1Value"),
      label: t("social.stat1Label"),
      description: t("social.stat1Desc"),
      bg: "bg-coral-100",
      border: "border-coral-200",
      accent: "text-coral-500",
    },
    {
      value: t("social.stat2Value"),
      label: t("social.stat2Label"),
      description: t("social.stat2Desc"),
      bg: "bg-sky-100",
      border: "border-sky-200",
      accent: "text-sky-500",
    },
    {
      value: t("social.stat3Value"),
      label: t("social.stat3Label"),
      description: t("social.stat3Desc"),
      bg: "bg-mint-100",
      border: "border-mint-200",
      accent: "text-mint-500",
    },
  ];

  return (
    <section className="bg-warm-white px-6 py-20 sm:px-12 lg:px-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-4 text-center text-3xl font-extrabold text-charcoal sm:text-4xl">
          {t("social.title")}
        </h2>
        <p className="mx-auto mb-14 max-w-xl text-center text-charcoal-muted">
          {t("social.subtitle")}
        </p>

        <div className="grid gap-8 md:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-3xl border ${stat.border} ${stat.bg} p-8 text-center shadow-sm transition-shadow hover:shadow-md`}
            >
              <div className={`mb-2 text-4xl font-extrabold ${stat.accent}`}>
                {stat.value}
              </div>
              <div className="mb-2 text-lg font-bold text-charcoal">
                {stat.label}
              </div>
              <p className="text-sm text-charcoal-muted">{stat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
