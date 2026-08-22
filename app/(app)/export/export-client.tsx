"use client";

import { useMemo, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FileArchive, Printer, IdCard, Loader2 } from "lucide-react";
import {
  QrCode,
  QR_SHEET_PAGE_CSS,
  normalizeCardModel,
  type CardAgent,
} from "@/lib/card-templates";
import { printCards } from "@/components/badge-preview";
import { StatutBadge } from "@/components/statut-badge";
import { BRAND } from "@/lib/brand";
import { DEPARTEMENTS } from "@/lib/brand";

export interface ExportAgent {
  id: string;
  matricule: string;
  fullName: string;
  fonction: string;
  departement: string;
  statut: string;
  photoUrl: string | null;
  cardModel: string;
  cardColor: string;
  verifyUrl: string;
}

type PrintSide = "recto" | "verso" | "both";

export function ExportClient({ agents }: { agents: ExportAgent[] }) {
  const [dep, setDep] = useState("");
  const [statut, setStatut] = useState("");
  const [selected, setSelected] = useState<Set<string>>(() => new Set(agents.map((a) => a.id)));
  const [side, setSide] = useState<PrintSide>("recto");
  const [zipping, setZipping] = useState(false);

  const visible = useMemo(
    () => agents.filter((a) => (!dep || a.departement === dep) && (!statut || a.statut === statut)),
    [agents, dep, statut]
  );

  const chosen = useMemo(() => visible.filter((a) => selected.has(a.id)), [visible, selected]);
  const allVisibleSelected = visible.length > 0 && visible.every((a) => selected.has(a.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) visible.forEach((a) => next.delete(a.id));
      else visible.forEach((a) => next.add(a.id));
      return next;
    });
  }

  function toCard(a: ExportAgent): CardAgent {
    return {
      fullName: a.fullName,
      matricule: a.matricule,
      fonction: a.fonction,
      departement: a.departement,
      statut: a.statut,
      photoUrl: a.photoUrl ?? undefined,
      color: a.cardColor,
      qrCode: a.verifyUrl,
      companyName: BRAND.name,
      companyPhone: BRAND.phone,
      companyEmail: BRAND.email,
    };
  }

  // 1) ZIP de PNG — délégué au serveur (route /api/export/qr-zip) : la génération
  // PNG et la compression n'ont rien à faire dans le navigateur.
  function downloadZip() {
    if (chosen.length === 0) return;
    setZipping(true);
    const ids = chosen.map((a) => a.id).join(",");
    // Ancre synthetique plutot qu'une navigation : la reponse est un
    // Content-Disposition: attachment, il ne faut surtout pas la faire passer par
    // le routeur Next (qui tenterait de la rendre comme une page).
    const a = document.createElement("a");
    a.href = `/api/export/qr-zip?ids=${encodeURIComponent(ids)}`;
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Aucun evenement de fin de telechargement n'est expose au JS : on relache
    // l'etat apres un court delai, le temps que le navigateur prenne la main.
    window.setTimeout(() => setZipping(false), 2500);
  }

  // 2) Planche PDF de QR codes : grille 4 colonnes, imprimable / « Enregistrer en PDF ».
  function printQrSheet() {
    if (chosen.length === 0) return;
    const cells = chosen
      .map(
        (a) => `<div class="qc">
          ${renderToStaticMarkup(<QrCode value={a.verifyUrl} size={104} dark={BRAND.navy} light="#ffffff" />)}
          <div class="nm">${escapeHtml(a.fullName)}</div>
          <div class="mt">${escapeHtml(a.matricule)}</div>
          <div class="fn">${escapeHtml(a.fonction)}</div>
        </div>`
      )
      .join("");

    const win = window.open("", "_blank");
    if (!win) {
      alert("Le navigateur a bloqué la fenêtre d'impression. Autorisez les pop-ups pour ce site.");
      return;
    }
    win.document.write(`<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/><title>DIGIGED — Planche de QR codes</title>
<style>${QR_SHEET_PAGE_CSS}</style></head>
<body><div class="sheet">${cells}</div>
<script>window.onload = () => { window.print(); };<\/script>
</body></html>`);
    win.document.close();
  }

  // 3) Planche de badges complets : réutilise le CSS d'impression des cartes.
  function printBadgeSheet() {
    if (chosen.length === 0) return;
    const sides: ("recto" | "verso")[] = side === "both" ? ["recto", "verso"] : [side];
    printCards(
      chosen.map((a) => ({ model: normalizeCardModel(a.cardModel), agent: toCard(a) })),
      sides,
      "DIGIGED — Planche de badges"
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* Sélection */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <select
            value={dep}
            onChange={(e) => setDep(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--navy)]"
          >
            <option value="">Tous les départements</option>
            {DEPARTEMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={statut}
            onChange={(e) => setStatut(e.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--navy)]"
          >
            <option value="">Tous les statuts</option>
            <option value="actif">Actifs</option>
            <option value="inactif">Inactifs</option>
          </select>
          <button
            type="button"
            onClick={toggleAllVisible}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {allVisibleSelected ? "Tout désélectionner" : "Tout sélectionner"}
          </button>
          <span className="ml-auto text-sm text-slate-600">
            <strong className="text-[var(--navy)]">{chosen.length}</strong> / {visible.length} sélectionné
            {chosen.length > 1 ? "s" : ""}
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {visible.length === 0 ? (
            <p className="p-8 text-center text-sm text-slate-500">Aucun agent ne correspond à ces filtres.</p>
          ) : (
            <ul className="max-h-[28rem] divide-y divide-slate-100 overflow-y-auto">
              {visible.map((a) => (
                <li key={a.id}>
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => toggle(a.id)}
                      className="h-4 w-4 accent-[var(--navy)]"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">{a.fullName}</span>
                      <span className="block truncate text-xs text-slate-500">
                        <span className="font-mono">{a.matricule}</span> · {a.departement || "—"}
                      </span>
                    </span>
                    <StatutBadge statut={a.statut} />
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Actions d'export */}
      <aside className="flex flex-col gap-3 lg:sticky lg:top-24 lg:self-start">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-[var(--navy)]">Exporter</h2>
          <p className="mb-4 text-xs text-slate-500">
            {chosen.length === 0 ? "Sélectionnez au moins un agent." : `${chosen.length} agent(s) sélectionné(s).`}
          </p>

          <button
            type="button"
            onClick={downloadZip}
            disabled={chosen.length === 0 || zipping}
            className="mb-2 flex w-full items-center gap-2 rounded-lg bg-[var(--navy)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--navy-deep)] disabled:opacity-50"
          >
            {zipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileArchive className="h-4 w-4" />}
            ZIP des QR codes (PNG)
          </button>

          <button
            type="button"
            onClick={printQrSheet}
            disabled={chosen.length === 0}
            className="mb-4 flex w-full items-center gap-2 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <Printer className="h-4 w-4" />
            Planche PDF de QR codes
          </button>

          <div className="border-t border-slate-100 pt-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-600">
              Faces à imprimer
            </label>
            <select
              value={side}
              onChange={(e) => setSide(e.target.value as PrintSide)}
              className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[var(--navy)]"
            >
              <option value="recto">Recto seul</option>
              <option value="verso">Verso seul</option>
              <option value="both">Recto + verso</option>
            </select>
            <button
              type="button"
              onClick={printBadgeSheet}
              disabled={chosen.length === 0}
              className="flex w-full items-center gap-2 rounded-lg bg-[var(--green)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
            >
              <IdCard className="h-4 w-4" />
              Planche de badges
            </button>
          </div>
        </div>

        <p className="px-1 text-xs leading-relaxed text-slate-500">
          Les planches s&apos;ouvrent dans une fenêtre d&apos;impression : choisissez «&nbsp;Enregistrer au format
          PDF&nbsp;» comme destination pour obtenir un fichier. Le ZIP contient aussi un <code>index.csv</code> de
          correspondance.
        </p>
      </aside>
    </div>
  );
}

// Les valeurs sont injectées dans le HTML de la fenêtre d'impression via
// document.write : elles doivent être échappées (un nom peut contenir & ou ').
function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
