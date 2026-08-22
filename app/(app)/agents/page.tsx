import type { Metadata } from "next";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { Search, IdCard, Users, UserRound } from "lucide-react";
import { prisma } from "@/lib/db";
import { DEPARTEMENTS } from "@/lib/brand";
import { fullName, initials, formatDate } from "@/lib/utils";
import { StatutBadge } from "@/components/statut-badge";

export const metadata: Metadata = { title: "Agents" };

const PAGE_SIZE = 12;

export default async function AgentsPage({ searchParams }: PageProps<"/agents">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const dep = typeof sp.dep === "string" ? sp.dep : "";
  const statut = typeof sp.statut === "string" ? sp.statut : "";
  const page = Math.max(1, Number.parseInt(typeof sp.page === "string" ? sp.page : "1", 10) || 1);

  // SQLite ne supporte pas `mode: "insensitive"` dans Prisma : on rend la
  // recherche insensible à la casse en comparant sur une version minuscule via
  // un OR sur les variantes courantes (saisie brute, minuscules, capitalisée).
  const variants = q ? Array.from(new Set([q, q.toLowerCase(), q.toUpperCase(), q[0].toUpperCase() + q.slice(1).toLowerCase()])) : [];

  const where: Prisma.AgentWhereInput = {
    ...(dep ? { departement: dep } : {}),
    ...(statut ? { statut } : {}),
    ...(q
      ? {
          OR: variants.flatMap((v) => [
            { nom: { contains: v } },
            { prenom: { contains: v } },
            { matricule: { contains: v } },
          ]),
        }
      : {}),
  };

  const [agents, total] = await Promise.all([
    prisma.agent.findMany({
      where,
      orderBy: [{ nom: "asc" }, { prenom: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.agent.count({ where }),
  ]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (q) u.set("q", q);
    if (dep) u.set("dep", dep);
    if (statut) u.set("statut", statut);
    if (p > 1) u.set("page", String(p));
    const s = u.toString();
    return s ? `/agents?${s}` : "/agents";
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[var(--navy)]">Agents</h1>
          <p className="text-sm text-slate-600">
            {total} agent{total > 1 ? "s" : ""} {q || dep || statut ? "correspondant aux filtres" : "enregistrés"}
          </p>
        </div>
        <Link
          href="/export"
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Export en masse
        </Link>
      </div>

      {/* Filtres — formulaire GET : les critères restent dans l'URL, donc partageables */}
      <form method="get" className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Rechercher un nom, prénom ou matricule…"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy)]/20"
          />
        </div>
        <select
          name="dep"
          defaultValue={dep}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--navy)]"
        >
          <option value="">Tous les départements</option>
          {DEPARTEMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          name="statut"
          defaultValue={statut}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--navy)]"
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actifs</option>
          <option value="inactif">Inactifs</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-[var(--navy)] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[var(--navy-deep)]"
        >
          Filtrer
        </button>
      </form>

      {agents.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="font-medium text-slate-700">Aucun agent trouvé</p>
          <p className="mt-1 text-sm text-slate-500">
            {q || dep || statut ? (
              <>
                Aucun résultat pour ces filtres.{" "}
                <Link href="/agents" className="font-medium text-[var(--navy)] hover:underline">
                  Réinitialiser
                </Link>
              </>
            ) : (
              <Link href="/agents/nouveau" className="font-medium text-[var(--navy)] hover:underline">
                Enregistrer le premier agent
              </Link>
            )}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Agent</th>
                <th className="hidden px-4 py-3 font-semibold sm:table-cell">Matricule</th>
                <th className="hidden px-4 py-3 font-semibold md:table-cell">Département</th>
                <th className="hidden px-4 py-3 font-semibold lg:table-cell">Entrée</th>
                <th className="px-4 py-3 font-semibold">Statut</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {agents.map((a) => (
                <tr key={a.id} className="transition hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--navy-soft)] text-xs font-bold text-[var(--navy)]">
                        {a.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.photoUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                          initials(a)
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/agents/${a.id}`} className="block truncate font-semibold text-slate-900 hover:text-[var(--navy)] hover:underline">
                          {fullName(a)}
                        </Link>
                        <span className="block truncate text-xs text-slate-500">{a.fonction ?? "—"}</span>
                      </div>
                    </div>
                  </td>
                  <td className="hidden px-4 py-3 font-mono text-xs text-slate-600 sm:table-cell">{a.matricule}</td>
                  <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{a.departement ?? "—"}</td>
                  <td className="hidden px-4 py-3 text-slate-600 lg:table-cell">{formatDate(a.dateEntree)}</td>
                  <td className="px-4 py-3">
                    <StatutBadge statut={a.statut} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={`/verify/${a.id}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Ouvrir la page profil (celle atteinte en scannant le QR)"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <UserRound className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Profil</span>
                      </a>
                      <Link
                        href={`/agents/${a.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        <IdCard className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Badge</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav className="mt-5 flex items-center justify-center gap-2 text-sm">
          <Link
            href={qs(Math.max(1, page - 1))}
            aria-disabled={page === 1}
            className={`rounded-lg border px-3 py-1.5 ${page === 1 ? "pointer-events-none border-slate-200 text-slate-300" : "border-slate-300 text-slate-700 hover:bg-white"}`}
          >
            Précédent
          </Link>
          <span className="px-2 text-slate-600">
            Page {page} / {pages}
          </span>
          <Link
            href={qs(Math.min(pages, page + 1))}
            aria-disabled={page === pages}
            className={`rounded-lg border px-3 py-1.5 ${page === pages ? "pointer-events-none border-slate-200 text-slate-300" : "border-slate-300 text-slate-700 hover:bg-white"}`}
          >
            Suivant
          </Link>
        </nav>
      )}
    </div>
  );
}
