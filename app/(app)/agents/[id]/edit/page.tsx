import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/db";
import { AgentForm } from "@/components/agent-form";
import { updateAgent, type ActionState } from "@/app/(app)/agents/actions";
import { fullName } from "@/lib/utils";

export async function generateMetadata({ params }: PageProps<"/agents/[id]/edit">): Promise<Metadata> {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({ where: { id }, select: { nom: true, prenom: true } });
  return { title: agent ? `Modifier ${fullName(agent)}` : "Agent introuvable" };
}

export default async function EditAgentPage({ params }: PageProps<"/agents/[id]/edit">) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent) notFound();

  // On lie l'id à l'action côté serveur : le client n'envoie jamais l'identifiant
  // de la ligne à modifier.
  async function action(prev: ActionState, formData: FormData): Promise<ActionState> {
    "use server";
    return updateAgent(id, prev, formData);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href={`/agents/${agent.id}`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-[var(--navy)]"
      >
        <ArrowLeft className="h-4 w-4" /> Retour à la fiche
      </Link>

      <h1 className="mb-1 text-2xl font-bold text-[var(--navy)]">Modifier {fullName(agent)}</h1>
      <p className="mb-7 text-sm text-slate-600">
        Matricule <span className="font-mono">{agent.matricule}</span> — il ne change pas lors d&apos;une
        modification.
      </p>

      <AgentForm action={action} initial={agent} submitLabel="Enregistrer les modifications" />
    </div>
  );
}
