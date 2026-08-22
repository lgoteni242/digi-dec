import { prisma } from "@/lib/db";

// Matricule DIGIGED : DGD-{annee}-{sequence sur 4}. La sequence repart a 1 chaque
// annee civile. On prend le plus grand matricule existant de l'annee plutot qu'un
// COUNT : supprimer un agent ne doit jamais reattribuer son numero.
export async function nextMatricule(year = new Date().getFullYear()): Promise<string> {
  const prefix = `DGD-${year}-`;

  const last = await prisma.agent.findFirst({
    where: { matricule: { startsWith: prefix } },
    orderBy: { matricule: "desc" },
    select: { matricule: true },
  });

  const lastSeq = last ? Number.parseInt(last.matricule.slice(prefix.length), 10) : 0;
  const seq = Number.isNaN(lastSeq) ? 1 : lastSeq + 1;

  return `${prefix}${String(seq).padStart(4, "0")}`;
}
