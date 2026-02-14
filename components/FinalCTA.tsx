"use client";

import { useState, useRef, type FormEvent } from "react";
import { useT } from "@/lib/i18n";

export default function FinalCTA() {
  const t = useT();
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string).trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError(t("cta.errorEmail"));
      return;
    }

    // Store in localStorage
    const existing = JSON.parse(localStorage.getItem("coco_emails") || "[]");
    if (existing.includes(email)) {
      setError(t("cta.errorDuplicate"));
      return;
    }
    existing.push(email);
    localStorage.setItem("coco_emails", JSON.stringify(existing));

    setSubmitted(true);
    formRef.current?.reset();
  };

  return (
    <section
      id="final-cta"
      className="relative overflow-hidden bg-gradient-to-b from-coral-100 to-cream px-6 py-20 sm:px-12 lg:px-24"
    >
      <div className="mx-auto max-w-2xl text-center">
        <div className="mb-4 text-5xl">🎈</div>
        <h2 className="mb-4 text-3xl font-extrabold text-charcoal sm:text-4xl">
          {t("cta.title1")}
          <br />
          {t("cta.title2")}
        </h2>
        <p className="mx-auto mb-10 max-w-lg text-charcoal-muted">
          {t("cta.subtitle")}
        </p>

        {submitted ? (
          <div className="rounded-3xl border border-mint-200 bg-mint-100 p-8 shadow-sm" role="status" aria-live="polite">
            <div className="mb-4 text-5xl">🎉</div>
            <h3 className="mb-2 text-xl font-bold text-charcoal">
              {t("cta.thankTitle")}
            </h3>
            <p className="text-charcoal-muted">
              {t("cta.thankDesc")}
            </p>
          </div>
        ) : (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <div className="flex-1 text-left">
              <label htmlFor="cta-email" className="mb-1 block text-sm font-semibold text-charcoal-muted">
                Email
              </label>
              <input
                id="cta-email"
                type="email"
                name="email"
                placeholder="votre@email.com"
                className="w-full rounded-full border border-coral-200 bg-card px-5 py-4 text-charcoal placeholder:text-charcoal-faint focus:border-coral-400 focus:outline-none focus:ring-2 focus:ring-coral-200"
                aria-invalid={error ? "true" : "false"}
                aria-describedby={error ? "cta-email-error" : undefined}
              />
              {error && (
                <p id="cta-email-error" className="mt-2 text-sm text-pink-500" role="alert">{error}</p>
              )}
            </div>
            <button
              type="submit"
              className="shrink-0 cursor-pointer rounded-full bg-coral-500 px-8 py-4 font-bold text-white shadow-lg transition-all hover:bg-coral-400 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-300 focus-visible:ring-offset-2 active:scale-95"
            >
              {t("cta.submit")}
            </button>
          </form>
        )}

        <p className="mt-6 text-sm text-charcoal-faint">
          {t("cta.nospam")}
        </p>
      </div>

      {/* Decorative circles */}
      <div className="pointer-events-none absolute -top-10 -left-10 h-32 w-32 rounded-full bg-pink-200 opacity-40 blur-2xl" />
      <div className="pointer-events-none absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-sky-200 opacity-40 blur-2xl" />
      <div className="pointer-events-none absolute top-1/2 left-10 h-20 w-20 rounded-full bg-lavender-200 opacity-40 blur-xl" />
    </section>
  );
}
