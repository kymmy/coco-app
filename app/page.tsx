"use client";

import Link from "next/link";
import Hero from "@/components/Hero";
import WhySection from "@/components/WhySection";
import HowItWorks from "@/components/HowItWorks";
import Community from "@/components/Community";
import SocialProof from "@/components/SocialProof";
import FinalCTA from "@/components/FinalCTA";
import { useT } from "@/lib/i18n";
import { useTheme } from "@/lib/theme";

function WaveDivider({ color = "var(--color-cream)", flip = false }: { color?: string; flip?: boolean }) {
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
  const t = useT();
  useTheme();

  return (
    <main className="min-h-screen">
      <Hero />
      <WaveDivider color="var(--color-cream)" />
      <WhySection />
      <WaveDivider color="var(--color-warm-white)" />
      <HowItWorks />
      <WaveDivider color="var(--color-cream)" flip />
      <Community />
      <WaveDivider color="var(--color-warm-white)" />
      <SocialProof />
      <WaveDivider color="var(--color-cream)" flip />
      <FinalCTA />

      <footer className="bg-cream px-6 py-8 text-center text-sm text-charcoal-faint">
        <div className="mb-4">
          <Link
            href="/events"
            className="inline-flex items-center rounded-full border-2 border-coral-200 px-6 py-2.5 text-sm font-bold text-coral-500 transition-all hover:bg-coral-50 hover:shadow-md active:scale-95"
          >
            {t("hero.ctaViewEvents")} <span className="ml-2">🎈</span>
          </Link>
        </div>
        <p>{t("footer.text", new Date().getFullYear())}</p>
      </footer>
    </main>
  );
}
