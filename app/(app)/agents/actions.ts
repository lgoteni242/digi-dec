"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { nextMatricule } from "@/lib/matricule";
import { DEPARTEMENTS, SEXES, STATUTS } from "@/lib/brand";
import { CARD_MODELS } from "@/lib/card-templates";

export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

// Un champ texte vide dans un FormData arrive comme "" : on le normalise en null
// pour ne pas stocker de chaînes vides dans des colonnes optionnelles.
const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable();

const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .refine((v) => v === null || !Number.isNaN(new Date(v).getTime()), "Date invalide.")
  .transform((v) => (v === null ? null : new Date(v)));

const AgentSchema = z.object({
  nom: z.string().trim().min(2, "Le nom est obligatoire (2 caractères minimum)."),
  prenom: z.string().trim().min(2, "Le prénom est obligatoire (2 caractères minimum)."),
  fonction: optionalText,
  departement: optionalText.refine(
    (v) => v === null || (DEPARTEMENTS as readonly string[]).includes(v),
    "Département inconnu."
  ),
  sexe: optionalText.refine((v) => v === null || (SEXES as readonly string[]).includes(v), "Sexe invalide."),
  telephone: optionalText,
  email: optionalText.refine(
    (v) => v === null || z.email().safeParse(v).success,
    "Adresse email invalide."
  ),
  dateNaissance: optionalDate,
  dateEntree: optionalDate,
  photoUrl: optionalText,
  statut: z.enum(STATUTS),
  cardModel: z.enum(CARD_MODELS.map((m) => m.id) as [string, ...string[]]),
  cardColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Couleur invalide.")
    .default("#0A2472"),
});

function parse(formData: FormData) {
  return AgentSchema.safeParse({
    nom: formData.get("nom") ?? "",
    prenom: formData.get("prenom") ?? "",
    fonction: formData.get("fonction") ?? "",
    departement: formData.get("departement") ?? "",
    sexe: formData.get("sexe") ?? "",
    telephone: formData.get("telephone") ?? "",
    email: formData.get("email") ?? "",
    dateNaissance: formData.get("dateNaissance") ?? "",
    dateEntree: formData.get("dateEntree") ?? "",
    photoUrl: formData.get("photoUrl") ?? "",
    statut: formData.get("statut") ?? "actif",
    cardModel: formData.get("cardModel") ?? "duo",
    cardColor: formData.get("cardColor") ?? "#0A2472",
  });
}

function toFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createAgent(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: "Veuillez corriger les champs signalés.", fieldErrors: toFieldErrors(parsed.error) };
  }

  let id: string;
  try {
    const agent = await prisma.agent.create({
      data: { ...parsed.data, matricule: await nextMatricule() },
      select: { id: true },
    });
    id = agent.id;
  } catch (e) {
    console.error("[createAgent]", e);
    return { error: "Impossible d'enregistrer l'agent. Réessayez." };
  }

  revalidatePath("/agents");
  revalidatePath("/");
  redirect(`/agents/${id}`);
}

export async function updateAgent(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = parse(formData);
  if (!parsed.success) {
    return { error: "Veuillez corriger les champs signalés.", fieldErrors: toFieldErrors(parsed.error) };
  }

  try {
    await prisma.agent.update({ where: { id }, data: parsed.data });
  } catch (e) {
    console.error("[updateAgent]", e);
    return { error: "Impossible de mettre à jour l'agent. Réessayez." };
  }

  revalidatePath("/agents");
  revalidatePath(`/agents/${id}`);
  revalidatePath(`/verify/${id}`);
  revalidatePath("/");
  redirect(`/agents/${id}`);
}

export async function deleteAgent(id: string) {
  try {
    await prisma.agent.delete({ where: { id } });
  } catch (e) {
    console.error("[deleteAgent]", e);
    throw new Error("Suppression impossible.");
  }
  revalidatePath("/agents");
  revalidatePath("/");
  redirect("/agents");
}

// Bascule actif/inactif depuis la liste, sans passer par le formulaire complet.
export async function toggleStatut(id: string) {
  const agent = await prisma.agent.findUnique({ where: { id }, select: { statut: true } });
  if (!agent) return;

  await prisma.agent.update({
    where: { id },
    data: { statut: agent.statut === "actif" ? "inactif" : "actif" },
  });

  revalidatePath("/agents");
  revalidatePath(`/agents/${id}`);
  revalidatePath(`/verify/${id}`);
  revalidatePath("/");
}
