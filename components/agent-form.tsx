"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { Loader2, Save } from "lucide-react";
import { PhotoUploadField } from "@/components/photo-upload";
import { CardFace, CARD_MODELS, type CardAgent } from "@/lib/card-templates";
import { DEPARTEMENTS, SEXES, BRAND, verifyUrl } from "@/lib/brand";
import type { ActionState } from "@/app/(app)/agents/actions";
import { toDateInput } from "@/lib/utils";

export interface AgentFormValues {
  id?: string;
  matricule?: string;
  nom: string;
  prenom: string;
  sexe: string | null;
  fonction: string | null;
  departement: string | null;
  telephone: string | null;
  email: string | null;
  dateNaissance: Date | string | null;
  dateEntree: Date | string | null;
  photoUrl: string | null;
  statut: string;
  cardModel: string;
  cardColor: string;
}

const PRESET_COLORS = [
  { hex: BRAND.navy, label: "Marine DIGIGED" },
  { hex: BRAND.navyDeep, label: "Marine profond" },
  { hex: BRAND.green, label: "Vert DIGIGED" },
  { hex: "#0f3d78", label: "Bleu acier" },
  { hex: "#0f172a", label: "Ardoise" },
];

const EMPTY: AgentFormValues = {
  nom: "",
  prenom: "",
  sexe: null,
  fonction: null,
  departement: null,
  telephone: null,
  email: null,
  dateNaissance: null,
  dateEntree: null,
  photoUrl: null,
  statut: "actif",
  cardModel: "duo",
  cardColor: BRAND.navy,
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-2 rounded-lg bg-[var(--navy)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--navy-deep)] disabled:opacity-60"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {pending ? "Enregistrement…" : label}
    </button>
  );
}

function Field({
  label,
  htmlFor,
  error,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wide text-slate-600">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-[var(--navy)] focus:ring-2 focus:ring-[var(--navy)]/20";

export function AgentForm({
  action,
  initial,
  submitLabel,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  initial?: AgentFormValues;
  submitLabel: string;
}) {
  const base = initial ?? EMPTY;
  const [state, formAction] = useActionState<ActionState, FormData>(action, {});

  // État local uniquement pour ce que l'aperçu du badge doit refléter en direct.
  const [photoUrl, setPhotoUrl] = useState<string | null>(base.photoUrl);
  const [nom, setNom] = useState(base.nom);
  const [prenom, setPrenom] = useState(base.prenom);
  const [fonction, setFonction] = useState(base.fonction ?? "");
  const [departement, setDepartement] = useState(base.departement ?? "");
  const [statut, setStatut] = useState(base.statut);
  const [cardModel, setCardModel] = useState(base.cardModel);
  const [cardColor, setCardColor] = useState(base.cardColor);

  const err = state.fieldErrors ?? {};

  const preview: CardAgent = {
    fullName: `${nom.toUpperCase()} ${prenom}`.trim() || "NOM Prénom",
    matricule: base.matricule ?? "DGD-____-____",
    fonction: fonction || "Fonction",
    departement: departement || "Département",
    statut,
    photoUrl: photoUrl ?? undefined,
    color: cardColor,
    qrCode: verifyUrl(base.id ?? "apercu"),
    companyName: BRAND.name,
    companyPhone: BRAND.phone,
    companyEmail: BRAND.email,
  };

  return (
    <form action={formAction} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      {/* Colonne formulaire */}
      <div className="flex flex-col gap-6">
        {state.error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {state.error}
          </p>
        )}

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-[var(--navy)]">Identité</h2>

          <PhotoUploadField
            value={photoUrl}
            onChange={setPhotoUrl}
            initials={`${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase() || "?"}
          />
          <input type="hidden" name="photoUrl" value={photoUrl ?? ""} />

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Nom" htmlFor="nom" error={err.nom} required>
              <input
                id="nom"
                name="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className={inputCls}
                autoComplete="family-name"
                required
              />
            </Field>
            <Field label="Prénom" htmlFor="prenom" error={err.prenom} required>
              <input
                id="prenom"
                name="prenom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                className={inputCls}
                autoComplete="given-name"
                required
              />
            </Field>
            <Field label="Date de naissance" htmlFor="dateNaissance" error={err.dateNaissance}>
              <input
                id="dateNaissance"
                name="dateNaissance"
                type="date"
                defaultValue={toDateInput(base.dateNaissance)}
                className={inputCls}
              />
            </Field>
            <Field label="Sexe" htmlFor="sexe" error={err.sexe}>
              <select id="sexe" name="sexe" defaultValue={base.sexe ?? ""} className={inputCls}>
                <option value="">—</option>
                {SEXES.map((s) => (
                  <option key={s} value={s}>
                    {s === "M" ? "Masculin" : "Féminin"}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-[var(--navy)]">
            Fonction & coordonnées
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fonction / Poste" htmlFor="fonction" error={err.fonction}>
              <input
                id="fonction"
                name="fonction"
                value={fonction}
                onChange={(e) => setFonction(e.target.value)}
                className={inputCls}
                placeholder="Opérateur de scan"
              />
            </Field>
            <Field label="Département" htmlFor="departement" error={err.departement}>
              <select
                id="departement"
                name="departement"
                value={departement}
                onChange={(e) => setDepartement(e.target.value)}
                className={inputCls}
              >
                <option value="">—</option>
                {DEPARTEMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Téléphone" htmlFor="telephone" error={err.telephone}>
              <input
                id="telephone"
                name="telephone"
                defaultValue={base.telephone ?? ""}
                className={inputCls}
                placeholder="+242 06 000 00 00"
              />
            </Field>
            <Field label="Email" htmlFor="email" error={err.email}>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={base.email ?? ""}
                className={inputCls}
                placeholder="prenom.nom@digiged.cg"
              />
            </Field>
            <Field label="Date d'entrée en fonction" htmlFor="dateEntree" error={err.dateEntree}>
              <input
                id="dateEntree"
                name="dateEntree"
                type="date"
                defaultValue={toDateInput(base.dateEntree)}
                className={inputCls}
              />
            </Field>
            <Field label="Statut" htmlFor="statut" error={err.statut}>
              <select
                id="statut"
                name="statut"
                value={statut}
                onChange={(e) => setStatut(e.target.value)}
                className={inputCls}
              >
                <option value="actif">Actif</option>
                <option value="inactif">Inactif</option>
              </select>
            </Field>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-[var(--navy)]">Badge</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Modèle de carte" htmlFor="cardModel">
              <select
                id="cardModel"
                name="cardModel"
                value={cardModel}
                onChange={(e) => setCardModel(e.target.value)}
                className={inputCls}
              >
                {CARD_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} — {m.description}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Couleur dominante" htmlFor="cardColor">
              <div className="flex items-center gap-2">
                <input
                  id="cardColor"
                  name="cardColor"
                  type="color"
                  value={cardColor}
                  onChange={(e) => setCardColor(e.target.value.toUpperCase())}
                  className="h-9 w-12 cursor-pointer rounded border border-slate-300 bg-white p-1"
                />
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_COLORS.map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      title={p.label}
                      aria-label={p.label}
                      onClick={() => setCardColor(p.hex)}
                      className="h-7 w-7 rounded-full border-2 border-white shadow ring-1 ring-slate-300 transition hover:scale-110"
                      style={{ background: p.hex }}
                    />
                  ))}
                </div>
              </div>
            </Field>
          </div>
        </section>

        <div className="flex items-center gap-3">
          <SubmitButton label={submitLabel} />
          <Link
            href={base.id ? `/agents/${base.id}` : "/agents"}
            className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Annuler
          </Link>
        </div>
      </div>

      {/* Colonne aperçu — se met à jour en direct pendant la saisie */}
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Aperçu du badge</p>
        <div className="overflow-hidden rounded-xl shadow-lg ring-1 ring-slate-200">
          <CardFace model={cardModel} side="recto" s={preview} />
        </div>
        <p className="mt-3 text-xs leading-relaxed text-slate-500">
          Le matricule est généré automatiquement à l&apos;enregistrement. Le QR code pointe vers la page
          publique de vérification de l&apos;agent.
        </p>
      </aside>
    </form>
  );
}
