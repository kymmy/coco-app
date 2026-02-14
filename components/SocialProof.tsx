"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { useInView } from "@/lib/useInView";

function AnimatedValue({ value, animate }: { value: string; animate: boolean }) {
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!animate) return;

    const match = value.match(/(\d+)/);
    if (!match) {
      setDisplay(value);
      return;
    }

    const target = parseInt(match[1]);
    const prefix = value.slice(0, match.index);
    const suffix = value.slice(match.index! + match[1].length);
    const steps = 24;
    const interval = 800 / steps;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const progress = 1 - Math.pow(1 - step / steps, 3);
      const current = Math.round(target * progress);
      setDisplay(`${prefix}${current}${suffix}`);
      if (step >= steps) clearInterval(timer);
    }, interval);

    return () => clearInterval(timer);
  }, [animate, value]);

  return <>{display}</>;
}

export default function SocialProof() {
  const t = useT();
  const { ref: gridRef, inView } = useInView();

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

        <div ref={gridRef} className="grid gap-8 md:grid-cols-3">
          {stats.map((stat, i) => (
            <article
              key={stat.label}
              className={`rounded-3xl border ${stat.border} ${stat.bg} p-8 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${inView === false ? "opacity-0" : ""}`}
              style={inView === true ? { animation: `fadeInUp 0.4s ease-out ${i * 120}ms backwards` } : undefined}
            >
              <div className={`mb-2 text-4xl font-extrabold ${stat.accent}`}>
                <AnimatedValue value={stat.value} animate={inView === true} />
              </div>
              <div className="mb-2 text-lg font-bold text-charcoal">
                {stat.label}
              </div>
              <p className="text-sm text-charcoal-muted">{stat.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
