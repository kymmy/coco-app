const steps = [
  {
    number: "1",
    emoji: "🏫",
    title: "Créez ou rejoignez un groupe",
    description:
      "Créez un groupe pour votre école ou classe et partagez le code d'invitation avec les autres parents.",
    bg: "bg-coral-100",
    bubbleBg: "bg-coral-500",
    accent: "text-coral-500",
  },
  {
    number: "2",
    emoji: "📍",
    title: "Proposez une sortie",
    description:
      "Parc, goûter, musée, piscine… Créez une sortie en quelques secondes et les parents du groupe sont prévenus.",
    bg: "bg-mint-100",
    bubbleBg: "bg-mint-500",
    accent: "text-mint-500",
  },
  {
    number: "3",
    emoji: "🎉",
    title: "Organisez-vous ensemble",
    description:
      "Inscrivez-vous, précisez qui apporte quoi, recevez un rappel la veille. Vous n'avez plus qu'à en profiter !",
    bg: "bg-sky-100",
    bubbleBg: "bg-sky-500",
    accent: "text-sky-500",
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-warm-white px-6 py-20 sm:px-12 lg:px-24">
      <div className="mx-auto max-w-5xl">
        <h2 className="mb-4 text-center text-3xl font-extrabold text-charcoal sm:text-4xl">
          Comment ça marche&nbsp;? 🧩
        </h2>
        <p className="mx-auto mb-14 max-w-xl text-center text-charcoal-muted">
          3 étapes, zéro prise de tête.
        </p>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`relative rounded-3xl ${step.bg} p-8 text-center shadow-sm transition-shadow hover:shadow-md`}
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
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
