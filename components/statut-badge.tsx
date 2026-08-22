import { cn } from "@/lib/utils";

export function StatutBadge({ statut, className }: { statut: string; className?: string }) {
  const actif = statut === "actif";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        actif ? "bg-[var(--green-soft)] text-[#237a17]" : "bg-slate-100 text-slate-500",
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", actif ? "bg-[var(--green)]" : "bg-slate-400")} />
      {actif ? "Actif" : "Inactif"}
    </span>
  );
}
