"use client";

import { useState, useRef, type FormEvent } from "react";

export default function FinalCTA() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string).trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Veuillez entrer une adresse email valide.");
      return;
    }

    // Store in localStorage
    const existing = JSON.parse(localStorage.getItem("coco_emails") || "[]");
    if (existing.includes(email)) {
      setError("Cette adresse est déjà inscrite !");
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
          Simplifiez l&apos;organisation.
          <br />
          Profitez du moment avec vos enfants.
        </h2>
        <p className="mx-auto mb-10 max-w-lg text-charcoal-muted">
          Laissez votre email pour être prévenu dès le lancement. Vous recevrez
          aussi une invitation agenda pour ne rien manquer. 📬
        </p>

        {submitted ? (
          <div className="rounded-3xl border border-mint-200 bg-mint-100 p-8 shadow-sm">
            <div className="mb-4 text-5xl">🎉</div>
            <h3 className="mb-2 text-xl font-bold text-charcoal">
              Merci ! Vous êtes sur la liste.
            </h3>
            <p className="text-charcoal-muted">
              On vous prévient dès que Coco est prêt. À très vite !
            </p>
          </div>
        ) : (
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-md flex-col gap-3 sm:flex-row"
          >
            <div className="flex-1">
              <input
                type="email"
                name="email"
                placeholder="votre@email.com"
                className="w-full rounded-full border border-coral-200 bg-white px-5 py-4 text-charcoal placeholder:text-charcoal-faint focus:border-coral-400 focus:outline-none focus:ring-2 focus:ring-coral-200"
              />
              {error && (
                <p className="mt-2 text-left text-sm text-pink-500">{error}</p>
              )}
            </div>
            <button
              type="submit"
              className="shrink-0 cursor-pointer rounded-full bg-coral-500 px-8 py-4 font-bold text-white shadow-lg transition-all hover:bg-coral-400 hover:shadow-xl active:scale-95"
            >
              Je m&apos;inscris 🚀
            </button>
          </form>
        )}

        <p className="mt-6 text-sm text-charcoal-faint">
          Pas de spam, promis. Juste une notification quand c&apos;est prêt. 🤞
        </p>
      </div>

      {/* Decorative circles */}
      <div className="absolute -top-10 -left-10 h-32 w-32 rounded-full bg-pink-200 opacity-40 blur-2xl" />
      <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-sky-200 opacity-40 blur-2xl" />
      <div className="absolute top-1/2 left-10 h-20 w-20 rounded-full bg-lavender-200 opacity-40 blur-xl" />
    </section>
  );
}
