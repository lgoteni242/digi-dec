// Charte graphique DIGIGED, extraite du flyer officiel (logo mosaïque verte sur
// fond bleu marine). Source unique de vérité : les cartes, le shell de l'app et
// la page publique de vérification lisent toutes ces valeurs.

export const BRAND = {
  name: "DIGIGED",
  tagline: "Digitalisation & numérisation des archives",
  slogan: "Préservez. Valorisez. Accédez.",
  navy: "#0A2472",
  navyDeep: "#071A52",
  green: "#3DAE2B",
  greenSoft: "#4CAF50",
  phone: "+242 068560588 / 044660044",
  email: "maloulawamonia@gmail.com",
} as const;

export const DEPARTEMENTS = [
  "Collecte",
  "Numérisation",
  "Traitement & OCR",
  "Mise à disposition",
  "Administration",
  "Informatique",
  "Commercial",
] as const;

export const STATUTS = ["actif", "inactif"] as const;
export const SEXES = ["M", "F"] as const;

// URL encodée dans le QR code du badge : elle ouvre la page publique de
// vérification. On lit NEXT_PUBLIC_APP_URL pour que les badges imprimés depuis
// un déploiement pointent vers ce déploiement et non vers localhost.
export function verifyUrl(agentId: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${base}/verify/${agentId}`;
}
