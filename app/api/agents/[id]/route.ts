import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyUrl } from "@/lib/brand";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent) return Response.json({ error: "Agent introuvable." }, { status: 404 });
  return Response.json({ agent: { ...agent, verifyUrl: verifyUrl(agent.id) } });
}

const PatchSchema = z.object({
  nom: z.string().trim().min(2).optional(),
  prenom: z.string().trim().min(2).optional(),
  fonction: z.string().trim().nullish(),
  departement: z.string().trim().nullish(),
  sexe: z.enum(["M", "F"]).nullish(),
  telephone: z.string().trim().nullish(),
  email: z.email().nullish(),
  dateNaissance: z.coerce.date().nullish(),
  dateEntree: z.coerce.date().nullish(),
  photoUrl: z.url().nullish(),
  statut: z.enum(["actif", "inactif"]).optional(),
  cardModel: z.enum(["duo", "portrait"]).optional(),
  cardColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Validation echouee.", issues: parsed.error.issues }, { status: 422 });
  }

  try {
    const agent = await prisma.agent.update({ where: { id }, data: parsed.data });
    return Response.json({ agent: { ...agent, verifyUrl: verifyUrl(agent.id) } });
  } catch (e) {
    console.error("[PATCH /api/agents/:id]", e);
    return Response.json({ error: "Agent introuvable ou mise a jour impossible." }, { status: 404 });
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.agent.delete({ where: { id } });
    return Response.json({ success: true });
  } catch (e) {
    console.error("[DELETE /api/agents/:id]", e);
    return Response.json({ error: "Agent introuvable." }, { status: 404 });
  }
}
