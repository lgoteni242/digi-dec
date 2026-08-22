import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Power, ExternalLink, UserRound } from "lucide-react";
import { prisma } from "@/lib/db";
import { BRAND, verifyUrl } from "@/lib/brand";
import { fullName, formatDate } from "@/lib/utils";
import { BadgePreview } from "@/components/badge-preview";
import { StatutBadge } from "@/components/statut-badge";
import { deleteAgent, toggleStatut } from "@/app/(app)/agents/actions";
import type { CardAgent } from "@/lib/card-templates";

export async function generateMetadata({ params }: PageProps<"/agents/[id]">): Promise<Metadata> {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({ where: { id }, select: { nom: true, prenom: true } });
  return { title: agent ? fullName(agent) : "Agent introuvable" };
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className="text-right text-sm text-slate-900">{value || "—"}</span>
    </div>
  );
}

export default async function AgentDetailPage({ params }: PageProps<"/agents/[id]">) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent) notFound();

  const card: CardAgent = {
    fullName: fullName(agent),
    matricule: agent.matricule,
    fonction: agent.fonction ?? "—",
    departement: agent.departement ?? "—",
    statut: agent.statut,
    photoUrl: agent.photoUrl ?? undefined,
    color: agent.cardColor,
    qrCode: verifyUrl(agent.id),
    companyName: BRAND.name,
    companyPhone: BRAND.phone,
    companyEmail: BRAND.email,
  };

  // Server Actions liées à cet agent : définies ici pour capturer l'id sans
  // passer par un champ caché côté client.
  async function doToggle() {
    "use server";
    await toggleStatut(id);
  }
  async function doDelete() {
    "use server";
    await deleteAgent(id);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/agents"
        className="no-print mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-[var(--navy)]"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux agents
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--navy)]">{fullName(agent)}</h1>
            <StatutBadge statut={agent.statut} />
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {agent.fonction ?? "Fonction non renseignée"}
            {agent.departement ? ` · ${agent.departement}` : ""} ·{" "}
            <span className="font-mono text-xs">{agent.matricule}</span>
          </p>
        </div>

        <div className="no-print flex flex-wrap items-center gap-2">
          <a
            href={`/verify/${agent.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--green)] px-3.5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <UserRound className="h-4 w-4" /> Profil public
          </a>
          <Link
            href={`/agents/${agent.id}/edit`}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Pencil className="h-4 w-4" /> Modifier
          </Link>
          <form action={doToggle}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Power className="h-4 w-4" />
              {agent.statut === "actif" ? "Désactiver" : "Activer"}
            </button>
          </form>
          <form action={doDelete}>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3.5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" /> Supprimer
            </button>
          </form>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-[var(--navy)]">Informations</h2>
          <Row label="Matricule" value={<span className="font-mono">{agent.matricule}</span>} />
          <Row label="Nom" value={agent.nom} />
          <Row label="Prénom" value={agent.prenom} />
          <Row label="Sexe" value={agent.sexe === "M" ? "Masculin" : agent.sexe === "F" ? "Féminin" : null} />
          <Row label="Date de naissance" value={formatDate(agent.dateNaissance)} />
          <Row label="Fonction" value={agent.fonction} />
          <Row label="Département" value={agent.departement} />
          <Row label="Téléphone" value={agent.telephone} />
          <Row
            label="Email"
            value={
              agent.email ? (
                <a href={`mailto:${agent.email}`} className="text-[var(--navy)] hover:underline">
                  {agent.email}
                </a>
              ) : null
            }
          />
          <Row label="Entrée en fonction" value={formatDate(agent.dateEntree)} />
          <Row label="Enregistré le" value={formatDate(agent.createdAt)} />
          <Row
            label="Page profil (scan QR)"
            value={
              <a
                href={`/verify/${agent.id}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[var(--navy)] hover:underline"
              >
                Ouvrir la page <ExternalLink className="h-3 w-3" />
              </a>
            }
          />
        </section>

        <aside>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Badge professionnel</p>
          <BadgePreview model={agent.cardModel} agent={card} />
        </aside>
      </div>
    </div>
  );
}
