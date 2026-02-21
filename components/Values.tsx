"use client";

import { useT } from "@/lib/i18n";
import { useInView } from "@/lib/useInView";

export default function Values() {
  const t = useT();
  const { ref: gridRef, inView } = useInView();

  const values = [
    {
      emoji: "🔕",
      title: t("values.value1Title"),
      description: t("values.value1Desc"),
      bg: "bg-amber-100",
      border: "border-amber-200",
    },
    {
      emoji: "🛡️",
      title: t("values.value2Title"),
      description: t("values.value2Desc"),
      bg: "bg-mint-100",
      border: "border-mint-200",
    },
    {
      emoji: "⚡",
      title: t("values.value3Title"),
      description: t("values.value3Desc"),
      bg: "bg-sky-100",
      border: "border-sky-200",
    },
  ];

  return (
    <section className="bg-warm-white px-6 py-20 sm:px-12 lg:px-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-4 text-center text-3xl font-extrabold text-charcoal sm:text-4xl">
          Votre temps, <span className="italic text-coral-500">votre attention</span>.
        </h2>
        <p className="mx-auto mb-14 max-w-2xl text-center text-lg text-charcoal-muted">
          {t("values.subtitle")}
        </p>

        <div ref={gridRef} className="grid gap-6 sm:grid-cols-3">
          {values.map((value, i) => (
            <article
              key={value.emoji}
              className={`rounded-3xl border ${value.border} ${value.bg} p-6 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${inView === false ? "opacity-0" : ""}`}
              style={inView === true ? { animation: `fadeInUp 0.4s ease-out ${i * 120}ms backwards` } : undefined}
            >
              <div className="mb-4 text-4xl">{value.emoji}</div>
              <h3 className="mb-2 text-lg font-bold text-charcoal">
                {value.title}
              </h3>
              <p className="text-charcoal-muted">{value.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
