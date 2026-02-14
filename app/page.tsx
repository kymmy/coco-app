import Link from "next/link";
import Hero from "@/components/Hero";
import WhySection from "@/components/WhySection";
import HowItWorks from "@/components/HowItWorks";
import Community from "@/components/Community";
import SocialProof from "@/components/SocialProof";
import FinalCTA from "@/components/FinalCTA";

function WaveDivider({ color = "#FFFBF5", flip = false }: { color?: string; flip?: boolean }) {
  return (
    <div className={`leading-[0] ${flip ? "rotate-180" : ""}`}>
      <svg
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        className="block h-[40px] w-full sm:h-[60px] lg:h-[80px]"
      >
        <path
          d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z"
          fill={color}
        />
      </svg>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <WaveDivider color="#FFFDF7" />
      <WhySection />
      <WaveDivider color="#FFFBF5" />
      <HowItWorks />
      <WaveDivider color="#FFFDF7" flip />
      <Community />
      <WaveDivider color="#FFFBF5" />
      <SocialProof />
      <WaveDivider color="#FFFDF7" flip />
      <FinalCTA />

      <footer className="bg-cream px-6 py-8 text-center text-sm text-charcoal-faint">
        <div className="mb-4">
          <Link
            href="/events"
            className="inline-flex items-center rounded-full bg-coral-100 px-6 py-2.5 text-sm font-bold text-coral-500 transition-all hover:bg-coral-200"
          >
            Voir les sorties 🎈
          </Link>
        </div>
        <p>Coco &mdash; Copains du coin &copy; {new Date().getFullYear()} &mdash; Fait avec amour par des parents, pour des parents.</p>
      </footer>
    </main>
  );
}
