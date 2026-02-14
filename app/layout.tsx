import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Navbar from "@/components/Navbar";
import NotificationBanner from "@/components/NotificationBanner";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import { Providers } from "@/lib/providers";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Coco — Copains du coin | Organisez les sorties entre copains du quartier",
  description:
    "Fini les 42 messages WhatsApp pour trouver une date. Organisez les sorties entre copains du quartier en 1 minute.",
  openGraph: {
    title: "Coco — Copains du coin",
    description:
      "Organisez les sorties entre copains du quartier en 1 minute. Proposez, rassemblez, profitez.",
    siteName: "Coco",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Coco — Copains du coin",
    description:
      "Organisez les sorties entre copains du quartier en 1 minute.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={nunito.className} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#FF6B6B" />
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        {/* Prevent dark mode flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("coco_theme");var d=window.matchMedia("(prefers-color-scheme:dark)").matches;if(t==="dark"||(t!=="light"&&d))document.documentElement.classList.add("dark");var l=localStorage.getItem("coco_locale");if(l==="en")document.documentElement.lang="en"}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased">
        {/* Skip to content — visible on Tab for keyboard users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-full focus:bg-coral-500 focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white focus:shadow-lg"
        >
          Aller au contenu
        </a>
        <Providers>
          <Navbar />
          <div id="main-content">
            {children}
          </div>
          <NotificationBanner />
          <PwaInstallPrompt />
        </Providers>
      </body>
    </html>
  );
}
