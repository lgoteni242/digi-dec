import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { verifyUrl } from "@/lib/brand";
import { fullName } from "@/lib/utils";
import { ExportClient, type ExportAgent } from "./export-client";

export const metadata: Metadata = { title: "Export QR codes" };

export default async function ExportPage() {
  const rows = await prisma.agent.findMany({
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });

  const agents: ExportAgent[] = rows.map((a) => ({
    id: a.id,
    matricule: a.matricule,
    fullName: fullName(a),
    fonction: a.fonction ?? "—",
    departement: a.departement ?? "",
    statut: a.statut,
    photoUrl: a.photoUrl,
    cardModel: a.cardModel,
    cardColor: a.cardColor,
    verifyUrl: verifyUrl(a.id),
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-[var(--navy)]">Export en masse</h1>
      <p className="mb-7 text-sm text-slate-600">
        Générez les QR codes de tout ou partie des agents : archive ZIP, planche de QR codes ou planche de badges
        prêts à découper.
      </p>

      <ExportClient agents={agents} />
    </div>
  );
}
