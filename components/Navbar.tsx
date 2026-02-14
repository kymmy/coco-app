"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <nav className="sticky top-0 z-50 border-b border-coral-100 bg-cream/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="text-xl font-extrabold text-charcoal">
          Coco <span className="text-coral-500">🥥</span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/groups"
            className={`rounded-full px-3 py-2 text-sm font-bold transition-all sm:px-4 ${
              pathname.startsWith("/groups")
                ? "bg-coral-500 text-white"
                : "text-charcoal-muted hover:bg-coral-100 hover:text-charcoal"
            }`}
          >
            Groupes
          </Link>
          <Link
            href="/events"
            className={`rounded-full px-3 py-2 text-sm font-bold transition-all sm:px-4 ${
              pathname.startsWith("/events")
                ? "bg-coral-500 text-white"
                : "text-charcoal-muted hover:bg-coral-100 hover:text-charcoal"
            }`}
          >
            Sorties
          </Link>
          <Link
            href="/create"
            className={`rounded-full px-3 py-2 text-sm font-bold transition-all sm:px-4 ${
              pathname === "/create"
                ? "bg-coral-500 text-white"
                : "border-2 border-coral-500 text-coral-500 hover:bg-coral-50"
            }`}
          >
            + Créer
          </Link>
        </div>
      </div>
    </nav>
  );
}
