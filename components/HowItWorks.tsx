"use client";

import { useT } from "@/lib/i18n";

export default function HowItWorks() {
  const t = useT();

  const steps = [
    {
      number: "1",
      emoji: "🏫",
      title: t("how.step1Title"),
      description: t("how.step1Desc"),
      bg: "bg-coral-100",
      bubbleBg: "bg-coral-500",
      accent: "text-coral-500",
    },
    {
      number: "2",
      emoji: "📍",
      title: t("how.step2Title"),
      description: t("how.step2Desc"),
      bg: "bg-mint-100",
      bubbleBg: "bg-mint-500",
      accent: "text-mint-500",
    },
    {
      number: "3",
      emoji: "🎉",
      title: t("how.step3Title"),
      description: t("how.step3Desc"),
      bg: "bg-sky-100",
      bubbleBg: "bg-sky-500",
      accent: "text-sky-500",
    },
  ];

  return (
    <section className="bg-warm-white px-6 py-20 sm:px-12 lg:px-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-4 text-center text-3xl font-extrabold text-charcoal sm:text-4xl">
          {t("how.title")}
        </h2>
        <p className="mx-auto mb-14 max-w-xl text-center text-charcoal-muted">
          {t("how.subtitle")}
        </p>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.number}
              className={`relative rounded-3xl ${step.bg} p-8 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div
                className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full ${step.bubbleBg} text-2xl font-extrabold text-white shadow-md`}
              >
                {step.number}
              </div>

              <div className="mb-3 text-3xl">{step.emoji}</div>

              <h3 className="mb-3 text-xl font-bold text-charcoal">
                {step.title}
              </h3>

              <p className="text-charcoal-muted">{step.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
