import Link from "next/link";
import { Users, UserCheck, UserX, Building2, ArrowRight, UserPlus, QrCode } from "lucide-react";
import { prisma } from "@/lib/db";
import { BRAND } from "@/lib/brand";
import { fullName, initials, formatDate } from "@/lib/utils";
import { StatutBadge } from "@/components/statut-badge";

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  tone: "navy" | "green" | "slate";
}) {
  const tones = {
    navy: "bg-[var(--navy-soft)] text-[var(--navy)]",
    green: "bg-[var(--green-soft)] text-[#237a17]",
    slate: "bg-slate-100 text-slate-500",
  };
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const [total, actifs, byDep, recents] = await Promise.all([
    prisma.agent.count(),
    prisma.agent.count({ where: { statut: "actif" } }),
    prisma.agent.groupBy({
      by: ["departement"],
      _count: { _all: true },
      orderBy: { _count: { departement: "desc" } },
    }),
    prisma.agent.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
  ]);

  const inactifs = total - actifs;
  const maxDep = Math.max(1, ...byDep.map((d) => d._count._all));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-7 rounded-2xl bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] p-7 text-white shadow-lg">
        <h1 className="text-2xl font-bold">Tableau de bord</h1>
        <p className="mt-1 max-w-xl text-sm text-white/70">
          {BRAND.tagline}. Enregistrez vos agents, générez leurs badges professionnels et exportez leurs QR codes.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/agents/nouveau"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--green)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <UserPlus className="h-4 w-4" /> Enregistrer un agent
          </Link>
          <Link
            href="/export"
            className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
          >
            <QrCode className="h-4 w-4" /> Exporter les QR codes
          </Link>
        </div>
      </div>

      <div className="mb-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total agents" value={total} icon={Users} tone="navy" />
        <StatCard label="Actifs" value={actifs} icon={UserCheck} tone="green" />
        <StatCard label="Inactifs" value={inactifs} icon={UserX} tone="slate" />
        <StatCard label="Départements" value={byDep.filter((d) => d.departement).length} icon={Building2} tone="navy" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-[var(--navy)]">
            Effectif par département
          </h2>
          {byDep.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun agent enregistré.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {byDep.map((d) => (
                <li key={d.departement ?? "none"}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-700">{d.departement ?? "Non renseigné"}</span>
                    <span className="font-semibold text-slate-900">{d._count._all}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-[var(--navy)]"
                      style={{ width: `${(d._count._all / maxDep) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-[var(--navy)]">Derniers enregistrés</h2>
            <Link
              href="/agents"
              className="inline-flex items-center gap-1 text-xs font-medium text-[var(--navy)] hover:underline"
            >
              Tout voir <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recents.length === 0 ? (
            <p className="text-sm text-slate-500">
              Aucun agent.{" "}
              <Link href="/agents/nouveau" className="font-medium text-[var(--navy)] hover:underline">
                Commencer
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recents.map((a) => (
                <li key={a.id}>
                  <Link href={`/agents/${a.id}`} className="flex items-center gap-3 py-2.5 transition hover:opacity-80">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--navy-soft)] text-xs font-bold text-[var(--navy)]">
                      {a.photoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.photoUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials(a)
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">{fullName(a)}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {a.fonction ?? "—"} · {formatDate(a.createdAt)}
                      </span>
                    </span>
                    <StatutBadge statut={a.statut} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
