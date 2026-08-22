import { AppNav } from "@/components/app-nav";
import { BRAND } from "@/lib/brand";

// Layout de l'application interne (tableau de bord, agents, export).
// La page publique /verify/[id] vit hors de ce groupe : elle n'hérite donc ni de
// la navigation ni du pied de page internes.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <AppNav />
      <main className="flex-1">{children}</main>
      <footer className="no-print border-t border-slate-200 bg-white py-5">
        <div className="mx-auto max-w-6xl px-4 text-center text-xs text-slate-500">
          {BRAND.name} — {BRAND.tagline}. {BRAND.phone} · {BRAND.email}
        </div>
      </footer>
    </>
  );
}
