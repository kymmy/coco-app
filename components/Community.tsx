const bullets = [
  {
    emoji: "🔒",
    title: "Privé par défaut",
    description: "Seuls les parents de l'école peuvent voir et rejoindre les sorties.",
    bg: "bg-lavender-100",
    border: "border-lavender-200",
  },
  {
    emoji: "📍",
    title: "100% local",
    description: "Votre école, votre quartier, vos voisins. Pas un réseau social de plus.",
    bg: "bg-sky-100",
    border: "border-sky-200",
  },
  {
    emoji: "🛡️",
    title: "Aucune pub, aucun tracking",
    description: "Vos données restent les vôtres. Pas de pub, pas de revente.",
    bg: "bg-mint-100",
    border: "border-mint-200",
  },
  {
    emoji: "❤️",
    title: "Fait pour les familles",
    description: "Conçu par des parents, pour des parents. Simple, bienveillant, efficace.",
    bg: "bg-pink-100",
    border: "border-pink-200",
  },
];

export default function Community() {
  return (
    <section className="px-6 py-20 sm:px-12 lg:px-24">
      <div className="mx-auto max-w-4xl">
        <h2 className="mb-4 text-center text-3xl font-extrabold text-charcoal sm:text-4xl">
          Une communauté de confiance 🤝
        </h2>
        <p className="mx-auto mb-14 max-w-xl text-center text-charcoal-muted">
          Coco crée un espace sûr et chaleureux pour les parents de votre école.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          {bullets.map((bullet) => (
            <div
              key={bullet.title}
              className={`flex gap-4 rounded-3xl border ${bullet.border} ${bullet.bg} p-5 shadow-sm transition-shadow hover:shadow-md`}
            >
              <div className="mt-0.5 text-3xl">{bullet.emoji}</div>
              <div>
                <h3 className="mb-1 font-bold text-charcoal">
                  {bullet.title}
                </h3>
                <p className="text-charcoal-muted">{bullet.description}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="mx-auto mt-12 max-w-2xl text-center text-lg font-semibold text-charcoal-light">
          Parce que les meilleurs souvenirs d&apos;enfance se créent ensemble,
          en toute simplicité. 🌈
        </p>
      </div>
    </section>
  );
}
