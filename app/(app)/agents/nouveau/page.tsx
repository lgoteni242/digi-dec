import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AgentForm } from "@/components/agent-form";
import { createAgent } from "@/app/(app)/agents/actions";

export const metadata: Metadata = { title: "Nouvel agent" };

export default function NouvelAgentPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/agents"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 transition hover:text-[var(--navy)]"
      >
        <ArrowLeft className="h-4 w-4" /> Retour aux agents
      </Link>

      <h1 className="mb-1 text-2xl font-bold text-[var(--navy)]">Enregistrer un agent</h1>
      <p className="mb-7 text-sm text-slate-600">
        Le matricule et le QR code sont générés automatiquement à l&apos;enregistrement.
      </p>

      <AgentForm action={createAgent} submitLabel="Enregistrer l'agent" />
    </div>
  );
}
