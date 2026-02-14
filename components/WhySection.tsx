"use client";

import { useT } from "@/lib/i18n";
import { useInView } from "@/lib/useInView";

export default function WhySection() {
  const t = useT();
  const { ref: gridRef, inView } = useInView();

  const painPoints = [
    {
      emoji: "💬",
      title: t("why.pain1Title"),
      description: t("why.pain1Desc"),
      bg: "bg-pink-100",
      border: "border-pink-200",
    },
    {
      emoji: "🗓️",
      title: t("why.pain2Title"),
      description: t("why.pain2Desc"),
      bg: "bg-sky-100",
      border: "border-sky-200",
    },
    {
      emoji: "👥",
      title: t("why.pain3Title"),
      description: t("why.pain3Desc"),
      bg: "bg-mint-100",
      border: "border-mint-200",
    },
    {
      emoji: "⏰",
      title: t("why.pain4Title"),
      description: t("why.pain4Desc"),
      bg: "bg-lavender-100",
      border: "border-lavender-200",
    },
  ];

  return (
    <section className="px-6 py-20 sm:px-12 lg:px-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-4 text-center text-3xl font-extrabold text-charcoal sm:text-4xl">
          {t("why.title")}
        </h2>
        <p className="mx-auto mb-14 max-w-2xl text-center text-charcoal-muted">
          {t("why.subtitle")}
        </p>

        <div ref={gridRef} className="grid gap-6 sm:grid-cols-2">
          {painPoints.map((point, i) => (
            <div
              key={point.emoji}
              className={`rounded-3xl border ${point.border} ${point.bg} p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${inView === false ? "opacity-0" : ""}`}
              style={inView === true ? { animation: `fadeInUp 0.4s ease-out ${i * 100}ms backwards` } : undefined}
            >
              <div className="mb-4 text-4xl">{point.emoji}</div>
              <h3 className="mb-2 text-lg font-bold text-charcoal">
                {point.title}
              </h3>
              <p className="text-charcoal-muted">{point.description}</p>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-2xl text-center text-lg text-charcoal-muted">
          {t("why.cocoIs",
            `__SIMPLE__`,
            `__LOCAL__`,
            `__PRIVATE__`,
            `__FRICTIONLESS__`
          ).split("__SIMPLE__").flatMap((part, i) =>
            i === 0 ? [part] : [
              <span key="simple" className="font-bold text-coral-500">{t("why.simple")}</span>,
              part
            ]
          ).flatMap((part) =>
            typeof part === "string"
              ? part.split("__LOCAL__").flatMap((subpart, i) =>
                  i === 0 ? [subpart] : [
                    <span key="local" className="font-bold text-sky-500">{t("why.local")}</span>,
                    subpart
                  ]
                )
              : [part]
          ).flatMap((part) =>
            typeof part === "string"
              ? part.split("__PRIVATE__").flatMap((subpart, i) =>
                  i === 0 ? [subpart] : [
                    <span key="private" className="font-bold text-lavender-500">{t("why.private")}</span>,
                    subpart
                  ]
                )
              : [part]
          ).flatMap((part) =>
            typeof part === "string"
              ? part.split("__FRICTIONLESS__").flatMap((subpart, i) =>
                  i === 0 ? [subpart] : [
                    <span key="frictionless" className="font-bold text-mint-500">{t("why.frictionless")}</span>,
                    subpart
                  ]
                )
              : [part]
          )}
        </p>
      </div>
    </section>
  );
}
