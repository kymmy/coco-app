import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import Navbar from "@/components/Navbar";
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
    <html lang="fr" className={nunito.className}>
      <body className="antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
