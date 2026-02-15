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
        <p>{t("footer.text", new Date().getFullYear())}</p>
        <Link
          href="/about"
          className="mt-3 inline-block text-sm font-semibold text-coral-500 transition-colors hover:text-coral-400"
        >
          {t("footer.about")}
        </Link>
      </footer>
    </main>
  );
}
