import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function fullName(a: { nom: string; prenom: string }): string {
  return `${a.nom.toUpperCase()} ${a.prenom}`.trim();
}

export function initials(a: { nom: string; prenom: string }): string {
  return `${a.nom.charAt(0)}${a.prenom.charAt(0)}`.toUpperCase() || "?";
}

export function formatDate(d: Date | string | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Valeur d'un <input type="date"> (yyyy-mm-dd) a partir d'une Date.
export function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

// Nom de fichier sur pour l'export ZIP : accents retires (decomposition NFD puis
// suppression des diacritiques U+0300-U+036F), tout le reste en underscores.
export function slugFile(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
