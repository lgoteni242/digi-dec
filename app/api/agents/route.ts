import { z } from "zod";
import { prisma } from "@/lib/db";
import { nextMatricule } from "@/lib/matricule";
import { verifyUrl } from "@/lib/brand";

// API de lecture/creation exposee pour des usages externes (badgeuse, pointage,
// integration tierce). L'UI interne passe, elle, par les Server Actions.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const dep = url.searchParams.get("dep") ?? "";
  const statut = url.searchParams.get("statut") ?? "";
  const q = url.searchParams.get("q")?.trim() ?? "";

  const agents = await prisma.agent.findMany({
    where: {
      ...(dep ? { departement: dep } : {}),
      ...(statut ? { statut } : {}),
      ...(q
        ? { OR: [{ nom: { contains: q } }, { prenom: { contains: q } }, { matricule: { contains: q } }] }
        : {}),
    },
    orderBy: [{ nom: "asc" }, { prenom: "asc" }],
  });

  return Response.json({
    count: agents.length,
    agents: agents.map((a) => ({ ...a, verifyUrl: verifyUrl(a.id) })),
  });
}

const CreateSchema = z.object({
  nom: z.string().trim().min(2),
  prenom: z.string().trim().min(2),
  fonction: z.string().trim().nullish(),
  departement: z.string().trim().nullish(),
  sexe: z.enum(["M", "F"]).nullish(),
  telephone: z.string().trim().nullish(),
  email: z.email().nullish(),
  dateNaissance: z.coerce.date().nullish(),
  dateEntree: z.coerce.date().nullish(),
  photoUrl: z.url().nullish(),
  statut: z.enum(["actif", "inactif"]).default("actif"),
  cardModel: z.enum(["duo", "portrait"]).default("duo"),
  cardColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#0A2472"),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation echouee.", issues: parsed.error.issues }, { status: 422 });
  }

  try {
    const agent = await prisma.agent.create({
      data: { ...parsed.data, matricule: await nextMatricule() },
    });
    return Response.json({ agent: { ...agent, verifyUrl: verifyUrl(agent.id) } }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/agents]", e);
    return Response.json({ error: "Creation impossible." }, { status: 500 });
  }
}
