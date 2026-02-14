"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n";

export default function NotFound() {
  const t = useT();

  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4">
      <div className="rounded-3xl bg-card p-12 text-center shadow-lg">
        <p className="mb-4 text-6xl">🔍</p>
        <h1 className="mb-2 text-2xl font-extrabold text-charcoal">
          {t("notFound.title")}
        </h1>
        <p className="mb-8 text-charcoal-muted">
          {t("notFound.description")}
        </p>
        <Link
          href="/"
          className="inline-flex items-center rounded-full bg-coral-500 px-8 py-3 font-bold text-white shadow-lg transition-all hover:bg-coral-400 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-300 focus-visible:ring-offset-2 active:scale-95"
        >
          {t("notFound.back")}
        </Link>
      </div>
    </main>
  );
}
