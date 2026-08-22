"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, QrCode, UserPlus } from "lucide-react";
import { DigigedMark } from "@/lib/card-templates";
import { BRAND } from "@/lib/brand";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard, exact: true },
  { href: "/agents", label: "Agents", icon: Users, exact: false },
  { href: "/export", label: "Export QR", icon: QrCode, exact: false },
];

export function AppNav() {
  const pathname = usePathname();

  // La page publique de vérification (scan du QR) ne doit pas exposer la
  // navigation interne : elle est consultée par des tiers.
  if (pathname.startsWith("/verify")) return null;

  return (
    <header className="no-print sticky top-0 z-40 border-b border-white/10 bg-[var(--navy)] text-white shadow-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5">
          <DigigedMark size={30} light />
          <span className="leading-tight">
            <span className="block text-base font-extrabold tracking-tight">
              DIGI<span className="text-[var(--green)]">GED</span>
            </span>
            <span className="block text-[10px] font-medium uppercase tracking-wider text-white/60">
              Gestion des agents
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {LINKS.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                  active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>

        <Link
          href="/agents/nouveau"
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-[var(--green)] px-3.5 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
        >
          <UserPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Nouvel agent</span>
        </Link>
      </div>
      <div className="h-1 bg-gradient-to-r from-[var(--green)] via-[var(--green)] to-transparent" aria-hidden />
      <span className="sr-only">{BRAND.tagline}</span>
    </header>
  );
}
