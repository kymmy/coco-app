"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4">
      <div className="rounded-3xl bg-card p-12 text-center shadow-lg">
        <p className="mb-2 text-5xl">😵</p>
        <h2 className="mb-2 text-xl font-extrabold text-charcoal">
          Oups, quelque chose s&apos;est mal pass&eacute;
        </h2>
        <p className="mb-6 text-charcoal-muted">
          Une erreur inattendue est survenue.
        </p>
        <button
          onClick={reset}
          className="rounded-full bg-coral-500 px-8 py-3 font-bold text-white shadow transition-all hover:bg-coral-400 active:scale-95"
        >
          R&eacute;essayer
        </button>
      </div>
    </div>
  );
}
