import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Navbar from "@/components/Navbar";
import NotificationBanner from "@/components/NotificationBanner";
import { Providers } from "@/lib/providers";
import "./globals.css";

const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Coco — Copains du coin | Organisez les sorties entre parents de l'école",
  description:
    "Fini les 42 messages WhatsApp pour trouver une date. Organisez les sorties entre parents en 1 minute.",
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
        <Providers>
          <Navbar />
          {children}
          <NotificationBanner />
        </Providers>
      </body>
    </html>
  );
}
