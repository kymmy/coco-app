const painPoints = [
  {
    emoji: "💬",
    title: "Trop de messages",
    description: "Les groupes WhatsApp qui débordent pour caler un simple goûter au parc.",
    bg: "bg-pink-100",
    border: "border-pink-200",
  },
  {
    emoji: "🗓️",
    title: "Impossible de trouver une date",
    description: "Entre le judo, la danse et les week-ends chez mamie, trouver un créneau est un casse-tête.",
    bg: "bg-sky-100",
    border: "border-sky-200",
  },
  {
    emoji: "👥",
    title: "On connaît peu de parents",
    description: "Difficile d'organiser quand on ne connaît pas les autres familles de la classe.",
    bg: "bg-mint-100",
    border: "border-mint-200",
  },
  {
    emoji: "⏰",
    title: "Toujours les mêmes qui organisent",
    description: "La charge mentale retombe toujours sur 2-3 parents motivés. Ce n'est pas tenable.",
    bg: "bg-lavender-100",
    border: "border-lavender-200",
  },
];

export default function WhySection() {
  return (
    <section className="px-6 py-20 sm:px-12 lg:px-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-4 text-center text-3xl font-extrabold text-charcoal sm:text-4xl">
          Organiser une sortie, c&apos;est pas censé être compliqué 🤯
        </h2>
        <p className="mx-auto mb-14 max-w-2xl text-center text-charcoal-muted">
          Pourtant, entre les parents, ça l&apos;est toujours.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {painPoints.map((point) => (
            <div
              key={point.title}
              className={`rounded-3xl border ${point.border} ${point.bg} p-6 shadow-sm transition-shadow hover:shadow-md`}
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
          Coco, c&apos;est{" "}
          <span className="font-bold text-coral-500">simple</span>,{" "}
          <span className="font-bold text-sky-500">local</span>,{" "}
          <span className="font-bold text-lavender-500">privé</span> et{" "}
          <span className="font-bold text-mint-500">sans friction</span>.
          Juste ce qu&apos;il faut pour se retrouver.
        </p>
      </div>
    </section>
  );
}
