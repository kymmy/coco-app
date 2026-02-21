"use client";

import { useT } from "@/lib/i18n";
import { useInView } from "@/lib/useInView";

export default function Community() {
  const t = useT();
  const { ref: gridRef, inView } = useInView();

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
      emoji: "❤️",
      title: t("community.bullet3Title"),
      description: t("community.bullet3Desc"),
      bg: "bg-pink-100",
      border: "border-pink-200",
    },
  ];

  return (
    <section className="px-6 py-20 sm:px-12 lg:px-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-4 text-center text-3xl font-extrabold text-charcoal sm:text-4xl">
          Une communauté de <span className="italic text-coral-500">confiance</span> 🤝
        </h2>
        <p className="mx-auto mb-14 max-w-xl text-center text-charcoal-muted">
          {t("community.subtitle")}
        </p>

        <div ref={gridRef} className="grid gap-6 sm:grid-cols-3">
          {bullets.map((bullet, i) => (
            <article
              key={bullet.emoji}
              className={`rounded-3xl border ${bullet.border} ${bullet.bg} p-6 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${inView === false ? "opacity-0" : ""}`}
              style={inView === true ? { animation: `fadeInUp 0.4s ease-out ${i * 100}ms backwards` } : undefined}
            >
              <div className="mb-4 text-4xl">{bullet.emoji}</div>
              <h3 className="mb-2 text-lg font-bold text-charcoal">
                {bullet.title}
              </h3>
              <p className="text-charcoal-muted">{bullet.description}</p>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-2xl text-center text-lg font-semibold text-charcoal-light">
          {t("community.conclusion")}
        </p>
      </div>
    </section>
  );
}
