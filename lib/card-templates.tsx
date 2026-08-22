// Bibliothèque des badges professionnels DIGIGED : 2 modèles (Duo, Portrait),
// chacun avec un recto et un verso, rendus en composants React à styles 100%
// inline (aucune classe Tailwind) sur un canevas fixe 300×478 (format CR80
// portrait). La même source sert l'aperçu à l'écran ET l'impression (copie du
// HTML rendu vers la fenêtre print), ce qui garantit que ce qui est imprimé
// correspond exactement à l'aperçu.
//
// Les styles doivent rester inline : à l'impression on sérialise ces composants
// avec renderToStaticMarkup vers une fenêtre vierge qui n'a pas la feuille
// Tailwind de l'app.

import React from "react";
import QRCode from "qrcode";
import { BRAND } from "@/lib/brand";

export const CARD_W = 300;
export const CARD_H = 478;

export interface CardAgent {
  fullName: string;
  matricule: string;
  fonction: string;
  departement: string;
  statut: string; // "actif" | "inactif"
  photoUrl?: string;
  color: string;
  qrCode: string; // URL de vérification encodée dans le QR
  companyName?: string;
  companyPhone?: string | null;
  companyEmail?: string | null;
}

export interface CardModelDef {
  id: string;
  label: string;
  description: string;
}

export const CARD_MODELS: CardModelDef[] = [
  { id: "duo", label: "Duo", description: "Bande latérale biseautée, photo intégrée" },
  { id: "portrait", label: "Portrait", description: "Photo pleine largeur en tête" },
];

export const DEFAULT_MODEL = "duo";

export function normalizeCardModel(id: string | null | undefined): string {
  return CARD_MODELS.some((m) => m.id === id) ? (id as string) : DEFAULT_MODEL;
}

// ── Briques partagées ─────────────────────────────────────────────────────────

function PhotoFill({ url, color }: { url?: string; color: string }) {
  if (url)
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />;
  return (
    <svg viewBox="0 0 64 64" width="70%" height="70%" fill={color} aria-hidden style={{ alignSelf: "flex-end" }}>
      <circle cx="32" cy="23" r="13" />
      <path d="M6 62 a26 26 0 0 1 52 0 z" />
    </svg>
  );
}

function Barcode({ color, height = 26 }: { color: string; height?: number }) {
  const bars = [2, 1, 3, 1, 2, 1, 2, 3, 1, 2];
  const heights = [100, 70, 100, 60, 90, 100, 75, 100, 65, 95];
  return (
    <div style={{ display: "flex", gap: 1.5, alignItems: "flex-end", height }}>
      {bars.map((w, i) => (
        <span key={i} style={{ width: w, height: `${heights[i]}%`, background: color, display: "block" }} />
      ))}
    </div>
  );
}

// Logo DIGIGED en pur SVG : la mosaïque verte (carrés qui se détachent) posée sur
// un bloc « document ». Vectoriel plutôt qu'une image pour rester net à
// l'impression et ne dépendre d'aucun fichier dans /public.
export function DigigedMark({ size = 32, light = false }: { size?: number; light?: boolean }) {
  const doc = light ? "#ffffff" : BRAND.navy;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden style={{ display: "block", flexShrink: 0 }}>
      <rect x="6" y="10" width="34" height="44" rx="3" fill={doc} />
      <rect x="13" y="21" width="20" height="3" rx="1.5" fill={light ? BRAND.navy : "#ffffff"} opacity="0.9" />
      <rect x="13" y="29" width="20" height="3" rx="1.5" fill={light ? BRAND.navy : "#ffffff"} opacity="0.9" />
      <rect x="13" y="37" width="13" height="3" rx="1.5" fill={light ? BRAND.navy : "#ffffff"} opacity="0.9" />
      <g fill={BRAND.green}>
        <rect x="38" y="8" width="9" height="9" rx="1.5" />
        <rect x="49" y="14" width="7" height="7" rx="1.5" opacity="0.9" />
        <rect x="40" y="22" width="6" height="6" rx="1.5" opacity="0.75" />
        <rect x="50" y="27" width="5" height="5" rx="1.5" opacity="0.6" />
        <rect x="44" y="33" width="4" height="4" rx="1" opacity="0.45" />
        <rect x="54" y="37" width="3.5" height="3.5" rx="1" opacity="0.3" />
      </g>
    </svg>
  );
}

// QR réel et scannable encodant `value` (l'URL /verify/{id}). Rendu en SVG à
// partir de la matrice de modules générée par la lib `qrcode` (API synchrone
// QRCode.create), pour rester compatible avec le rendu serveur
// (renderToStaticMarkup utilisé à l'impression) sans génération asynchrone.
function qrMatrix(value: string): boolean[][] {
  const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const g: boolean[][] = [];
  for (let r = 0; r < n; r++) {
    const row: boolean[] = [];
    for (let c = 0; c < n; c++) row.push(!!qr.modules.get(r, c));
    g.push(row);
  }
  return g;
}

export function QrCode({
  value,
  size = 110,
  dark = BRAND.navy,
  light = "transparent",
}: {
  value: string;
  size?: number;
  dark?: string;
  light?: string;
}) {
  const m = qrMatrix(value);
  const n = m.length;
  // Quiet zone de 2 modules (marge minimale recommandée) pour fiabiliser le scan.
  const quiet = 2;
  const total = n + quiet * 2;
  return (
    <svg viewBox={`0 0 ${total} ${total}`} width={size} height={size} shapeRendering="crispEdges" aria-hidden>
      <rect width={total} height={total} fill={light} />
      {m.flatMap((row, r) =>
        row.map((on, c) =>
          on ? <rect key={`${r}-${c}`} x={c + quiet} y={r + quiet} width={1} height={1} fill={dark} /> : null
        )
      )}
    </svg>
  );
}

// Pastille de statut : verte pour un agent actif, grise/rouge sinon. Elle apparaît
// sur les deux rectos pour qu'un contrôle visuel rapide suffise, sans scan.
function StatutPill({ statut, onDark = false }: { statut: string; onDark?: boolean }) {
  const actif = statut === "actif";
  const bg = actif ? BRAND.green : onDark ? "rgba(255,255,255,.22)" : "#e2e5ec";
  const fg = actif ? "#ffffff" : onDark ? "rgba(255,255,255,.9)" : "#6b7280";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: bg,
        color: fg,
        fontSize: 8,
        fontWeight: 800,
        letterSpacing: 1,
        textTransform: "uppercase",
        padding: "3px 8px",
        borderRadius: 20,
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: fg, display: "block" }} />
      {actif ? "Actif" : "Inactif"}
    </span>
  );
}

// ── Verso commun aux deux modèles ─────────────────────────────────────────────

function Verso({ s }: { s: CardAgent }) {
  const c = s.color;
  const company = s.companyName ?? BRAND.name;
  const rules = [
    "Cette carte est strictement personnelle et demeure la propriété de DIGIGED.",
    "Elle doit être présentée à toute réquisition lors des interventions sur site.",
    "En cas de perte ou de vol, informez immédiatement l'administration.",
    "Elle doit être restituée en cas de fin de contrat ou de départ de l'entreprise.",
  ];
  const contact = [s.companyPhone, s.companyEmail].filter(Boolean) as string[];

  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        background: "#fff",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui,sans-serif",
      }}
    >
      <div style={{ background: c, color: "#fff", padding: "14px 22px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <DigigedMark size={22} light />
          <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: 0.4 }}>{company}</span>
        </div>
        <div
          style={{
            fontSize: 7.5,
            letterSpacing: 1.6,
            textTransform: "uppercase",
            opacity: 0.85,
            marginTop: 4,
            fontWeight: 600,
          }}
        >
          Carte professionnelle · Verso
        </div>
      </div>
      <div style={{ height: 4, background: BRAND.green }} />

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "14px 22px 0" }}>
        <div style={{ background: "#f7f8fb", border: "1px solid #e6e8ef", borderRadius: 10, padding: 9 }}>
          <QrCode value={s.qrCode} size={100} dark={c} />
        </div>
        <div style={{ fontSize: 7.5, color: "#9292a8", marginTop: 6, letterSpacing: 0.3, textAlign: "center" }}>
          Scannez pour vérifier l&apos;identité de l&apos;agent
        </div>
      </div>

      <div style={{ padding: "12px 22px 0" }}>
        {rules.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 7, marginBottom: 5 }}>
            <span
              style={{
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: BRAND.green,
                marginTop: 4.5,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 8.2, lineHeight: 1.45, color: "#12122b", opacity: 0.85 }}>{r}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "auto", padding: "0 22px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 10 }}>
          <div>
            <div style={{ fontSize: 8, letterSpacing: 1, textTransform: "uppercase", color: "#9292a8", fontWeight: 700 }}>
              Titulaire
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#12122b", marginTop: 2 }}>{s.fullName}</div>
            <div style={{ fontSize: 9, color: "#9292a8", marginTop: 1, fontFamily: "monospace" }}>{s.matricule}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ width: 92, borderBottom: "1px dashed #9292a8", height: 26 }} />
            <div
              style={{
                fontSize: 7.5,
                letterSpacing: 1,
                textTransform: "uppercase",
                color: "#9292a8",
                fontWeight: 600,
                marginTop: 3,
              }}
            >
              La Direction
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #e6e8ef", padding: "9px 0 14px" }}>
          <div style={{ fontSize: 8, color: "#9292a8", lineHeight: 1.5 }}>
            En cas de découverte, merci de rapporter cette carte à :{" "}
            <span style={{ color: "#12122b", fontWeight: 600 }}>{company}</span>
            {contact.length > 0 && <> · {contact.join(" · ")}</>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Rectos : 2 modèles ────────────────────────────────────────────────────────

type P = { s: CardAgent };

function Duo({ s }: P) {
  const c = s.color;
  const company = s.companyName ?? BRAND.name;
  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        background: "#fff",
        overflow: "hidden",
        display: "flex",
        fontFamily: "system-ui,sans-serif",
        position: "relative",
      }}
    >
      <div
        style={{
          width: 118,
          background: `linear-gradient(160deg, ${c} 0%, ${BRAND.navyDeep} 100%)`,
          clipPath: "polygon(0 0, 100% 0, 78% 100%, 0 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "20px 0",
          position: "relative",
        }}
      >
        <DigigedMark size={30} light />
        <div
          style={{
            marginTop: "auto",
            marginBottom: "auto",
            width: 84,
            height: 104,
            border: "2.5px solid rgba(255,255,255,.5)",
            borderRadius: 8,
            background: "rgba(255,255,255,.14)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            overflow: "hidden",
            color: "rgba(255,255,255,.7)",
            marginLeft: -8,
          }}
        >
          <PhotoFill url={s.photoUrl} color="rgba(255,255,255,.7)" />
        </div>
        <div
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            fontSize: 8.5,
            letterSpacing: 2.5,
            textTransform: "uppercase",
            fontWeight: 700,
            color: "rgba(255,255,255,.75)",
            position: "absolute",
            left: 8,
            bottom: 20,
          }}
        >
          {company}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "22px 20px 18px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
          <div style={{ fontSize: 8, letterSpacing: 1.4, textTransform: "uppercase", color: c, fontWeight: 800 }}>
            Carte professionnelle
          </div>
          <StatutPill statut={s.statut} />
        </div>

        <div
          style={{
            fontSize: 18,
            fontWeight: 800,
            color: "#161a24",
            lineHeight: 1.15,
            marginTop: 9,
            textTransform: "uppercase",
            letterSpacing: -0.2,
          }}
        >
          {s.fullName}
        </div>
        <div style={{ fontSize: 11, color: "#5a6170", fontWeight: 600, marginTop: 5, lineHeight: 1.3 }}>
          {s.fonction}
        </div>

        {/* QR centre dans l'espace libre : il occupe la zone morte entre l'identite
            et le bloc d'informations, et reste assez grand pour etre scanne. */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px 0 6px",
          }}
        >
          <div style={{ padding: 6, background: "#f7f8fb", border: "1px solid #edeff4", borderRadius: 8 }}>
            <QrCode value={s.qrCode} size={82} dark={c} />
          </div>
        </div>

        <div>
          {(
            [
              ["Département", s.departement],
              ["Matricule", s.matricule],
            ] as const
          ).map(([k, val], i) => (
            <div key={i} style={{ padding: "8px 0", borderTop: "1px solid #edeff4" }}>
              <div
                style={{
                  fontSize: 7.5,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  color: "#9aa1b2",
                  fontWeight: 700,
                }}
              >
                {k}
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#161a24",
                  marginTop: 1,
                  fontFamily: k === "Matricule" ? "monospace" : undefined,
                }}
              >
                {val || "—"}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 10 }}>
            <Barcode color={c} height={22} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Portrait({ s }: P) {
  const c = s.color;
  const company = s.companyName ?? BRAND.name;
  return (
    <div
      style={{
        width: CARD_W,
        height: CARD_H,
        background: "#fff",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        fontFamily: "system-ui,sans-serif",
      }}
    >
      <div
        style={{
          position: "relative",
          height: 226,
          background: `linear-gradient(150deg,${c}33,${c}18)`,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          overflow: "hidden",
          color: `${c}66`,
        }}
      >
        {s.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={s.photoUrl}
            alt=""
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <svg viewBox="0 0 64 64" width="56%" height="80%" fill={`${c}55`} aria-hidden>
            <circle cx="32" cy="23" r="13" />
            <path d="M6 62 a26 26 0 0 1 52 0 z" />
          </svg>
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(7,26,82,.55) 0%, transparent 32%, transparent 52%, rgba(7,26,82,.78) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 16,
            right: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#fff",
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <DigigedMark size={20} light />
            <span style={{ fontSize: 11.5, fontWeight: 800, textShadow: "0 1px 6px rgba(0,0,0,.4)" }}>{company}</span>
          </span>
          <StatutPill statut={s.statut} onDark />
        </div>
        <div style={{ position: "absolute", bottom: 12, left: 18, right: 18, color: "#fff" }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: -0.4,
              textShadow: "0 1px 8px rgba(0,0,0,.45)",
              textTransform: "uppercase",
              lineHeight: 1.15,
            }}
          >
            {s.fullName}
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.94, marginTop: 3 }}>{s.fonction}</div>
        </div>
      </div>
      <div style={{ height: 5, background: BRAND.green }} />

      <div style={{ flex: 1, padding: "14px 22px 0" }}>
        <div style={{ fontSize: 8, letterSpacing: 1.4, textTransform: "uppercase", color: c, fontWeight: 800 }}>
          Carte professionnelle
        </div>
        {(
          [
            ["Matricule", s.matricule],
            ["Département", s.departement],
            ["Fonction", s.fonction],
          ] as const
        ).map(([k, val], i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 10,
              padding: "9px 0",
              borderBottom: "1px solid #eef0f4",
            }}
          >
            <span style={{ fontSize: 10, color: "#96a0b0", fontWeight: 600, flexShrink: 0 }}>{k}</span>
            <span
              style={{
                fontSize: 11.5,
                color: "#141824",
                fontWeight: 700,
                textAlign: "right",
                fontFamily: k === "Matricule" ? "monospace" : undefined,
              }}
            >
              {val || "—"}
            </span>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: "10px 22px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <Barcode color={c} height={22} />
        <QrCode value={s.qrCode} size={54} dark={c} />
      </div>
    </div>
  );
}

// ── Point d'entrée unique ─────────────────────────────────────────────────────

const RECTOS: Record<string, (p: P) => React.ReactElement> = {
  duo: Duo,
  portrait: Portrait,
};

export function CardFace({ model, side, s }: { model: string; side: "recto" | "verso"; s: CardAgent }) {
  const id = normalizeCardModel(model);
  if (side === "verso") return <Verso s={s} />;
  const Recto = RECTOS[id] ?? Duo;
  return <Recto s={s} />;
}

// ── CSS de la fenêtre d'impression ────────────────────────────────────────────
// print-color-adjust:exact est OBLIGATOIRE : sans lui les navigateurs suppriment
// les fonds/couleurs à l'impression (les cartes sortiraient en blanc).
// 3 colonnes de 54mm (162mm + marges) : 4 colonnes débordaient de la page A4.

export const CARD_PRINT_SCALE = ((54 / 25.4) * 96) / CARD_W; // ≈ 0.6803

export const CARD_PRINT_PAGE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0;
      -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { font-family: Arial, sans-serif; background: #fff; }
  .flow, .sheet { display: grid; grid-template-columns: repeat(3, 54mm); gap: 5mm; padding: 5mm; justify-content: center; }
  .sheet { page-break-after: always; }
  .pc { width: 54mm; height: 86mm; overflow: hidden; page-break-inside: avoid; position: relative; }
  .pc > .cv { transform: scale(${CARD_PRINT_SCALE.toFixed(4)}); transform-origin: top left; width: ${CARD_W}px; height: ${CARD_H}px; }
  @page { size: A4; margin: 8mm; }
  @media print { body { background: #fff; } }
`;

// Planche de QR codes seuls (export en masse) : grille 4 colonnes, chaque cellule
// porte le QR + le nom + le matricule pour rester exploitable après découpe.
export const QR_SHEET_PAGE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0;
      -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  body { font-family: Arial, sans-serif; background: #fff; color: #12122b; }
  .sheet { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6mm; padding: 6mm; }
  .qc { border: 1px dashed #c9cede; border-radius: 3mm; padding: 4mm 2mm; text-align: center;
        page-break-inside: avoid; display: flex; flex-direction: column; align-items: center; gap: 2mm; }
  .qc .nm { font-size: 8pt; font-weight: 700; line-height: 1.2; }
  .qc .mt { font-size: 7pt; font-family: monospace; color: #6b7280; }
  .qc .fn { font-size: 6.5pt; color: #9292a8; line-height: 1.2; }
  @page { size: A4; margin: 8mm; }
`;
