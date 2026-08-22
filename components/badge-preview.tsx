"use client";

import { useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { toPng } from "html-to-image";
import { Printer, Download, RotateCw, Loader2 } from "lucide-react";
import { CardFace, CARD_PRINT_PAGE_CSS, type CardAgent } from "@/lib/card-templates";
import { slugFile } from "@/lib/utils";

// Ouvre une fenêtre vierge, y injecte le badge sérialisé + le CSS d'impression,
// puis déclenche l'impression. Les styles des cartes sont inline, donc rien de
// l'app n'a besoin d'être chargé dans cette fenêtre. « Enregistrer en PDF » dans
// le dialogue du navigateur suffit à obtenir un PDF : pas de lib PDF serveur.
export function printCards(
  cards: { model: string; agent: CardAgent }[],
  sides: ("recto" | "verso")[],
  title: string
) {
  const cells = cards
    .flatMap(({ model, agent }) =>
      sides.map(
        (side) =>
          `<div class="pc"><div class="cv">${renderToStaticMarkup(
            <CardFace model={model} side={side} s={agent} />
          )}</div></div>`
      )
    )
    .join("");

  const win = window.open("", "_blank");
  if (!win) {
    alert("Le navigateur a bloqué la fenêtre d'impression. Autorisez les pop-ups pour ce site.");
    return;
  }
  win.document.write(`<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"/><title>${title}</title>
<style>${CARD_PRINT_PAGE_CSS}</style></head>
<body><div class="flow">${cells}</div>
<script>window.onload = () => { window.print(); };<\/script>
</body></html>`);
  win.document.close();
}

export function BadgePreview({ model, agent }: { model: string; agent: CardAgent }) {
  const [side, setSide] = useState<"recto" | "verso">("recto");
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  async function download() {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      // pixelRatio 3 => ~900×1434 px, largement suffisant pour une impression
      // nette au format CR80 (≈ 300 dpi sur 54×86 mm).
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `badge_${slugFile(agent.matricule)}_${slugFile(agent.fullName)}_${side}.png`;
      a.click();
    } catch (e) {
      console.error("[BadgePreview.download]", e);
      alert("Le téléchargement a échoué. Si la photo vient d'être ajoutée, réessayez dans un instant.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <div ref={cardRef} className="overflow-hidden rounded-xl shadow-lg ring-1 ring-slate-200">
        <CardFace model={model} side={side} s={agent} />
      </div>

      <div className="no-print flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setSide((s) => (s === "recto" ? "verso" : "recto"))}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <RotateCw className="h-3.5 w-3.5" /> Voir le {side === "recto" ? "verso" : "recto"}
        </button>
        <button
          type="button"
          onClick={() => printCards([{ model, agent }], ["recto", "verso"], `Badge — ${agent.fullName}`)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--navy)] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[var(--navy-deep)]"
        >
          <Printer className="h-3.5 w-3.5" /> Imprimer
        </button>
        <button
          type="button"
          onClick={download}
          disabled={downloading}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--green)] px-3 py-2 text-xs font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          PNG
        </button>
      </div>
    </div>
  );
}
