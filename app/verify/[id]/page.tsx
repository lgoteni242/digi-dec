import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  ShieldCheck,
  ShieldAlert,
  BadgeCheck,
  Building2,
  Briefcase,
  CalendarDays,
  Hash,
  Phone,
  Mail,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { BRAND } from "@/lib/brand";
import { fullName, initials, formatDate } from "@/lib/utils";
import { DigigedMark } from "@/lib/card-templates";

export async function generateMetadata({ params }: PageProps<"/verify/[id]">): Promise<Metadata> {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({ where: { id }, select: { nom: true, prenom: true } });
  return {
    title: agent ? `${fullName(agent)} — Profil agent` : "Agent introuvable",
    // Page publique atteinte par scan : inutile de l'indexer.
    robots: { index: false, follow: false },
  };
}

function InfoRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: typeof Hash;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-slate-100 py-3 last:border-0">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--navy-soft)] text-[var(--navy)]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
        <span className={`block truncate text-sm font-medium text-slate-900 ${mono ? "font-mono" : ""}`}>
          {value}
        </span>
      </span>
    </div>
  );
}

// Page profil publique, atteinte en scannant le QR d'un badge. Elle présente
// l'agent (photo + identité + affectation) et surtout la validité de sa carte.
// Les données strictement personnelles (date de naissance, contacts privés) ne
// sont jamais exposées : seules les coordonnées professionnelles le sont.
export default async function VerifyPage({ params }: PageProps<"/verify/[id]">) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({
    where: { id },
    select: {
      nom: true,
      prenom: true,
      matricule: true,
      fonction: true,
      departement: true,
      photoUrl: true,
      statut: true,
      dateEntree: true,
      telephone: true,
      email: true,
    },
  });
  if (!agent) notFound();

  const actif = agent.statut === "actif";

  return (
    <div className="min-h-screen bg-slate-100 pb-10">
      {/* En-tête de marque */}
      <header className="bg-[var(--navy)] px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center gap-2.5 text-white">
          <DigigedMark size={30} light />
          <div className="leading-tight">
            <p className="text-base font-extrabold">
              DIGI<span className="text-[var(--green)]">GED</span>
            </p>
            <p className="text-[10px] uppercase tracking-wider text-white/60">Profil agent — vérification</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4">
        <div className="-mt-1 overflow-hidden rounded-b-2xl bg-white shadow-xl">
          {/* Bandeau de validité : information la plus importante du scan,
              lisible d'un coup d'œil et à distance. */}
          <div
            className={`flex items-center justify-center gap-2 px-5 py-3.5 text-sm font-extrabold uppercase tracking-wider text-white ${
              actif ? "bg-[var(--green)]" : "bg-slate-500"
            }`}
          >
            {actif ? <ShieldCheck className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />}
            {actif ? "Carte valide — agent actif" : "Carte non valide — agent inactif"}
          </div>

          {/* Bloc profil : photo mise en avant */}
          <div className="flex flex-col items-center bg-gradient-to-b from-[var(--navy-soft)] to-white px-6 pb-6 pt-7">
            <div className="relative">
              <div className="h-40 w-32 overflow-hidden rounded-2xl bg-white shadow-lg ring-4 ring-white">
                {agent.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={agent.photoUrl}
                    alt={`Photo de ${fullName(agent)}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[var(--navy-soft)] text-4xl font-bold text-[var(--navy)]">
                    {initials(agent)}
                  </div>
                )}
              </div>
              {actif && (
                <span
                  className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-[var(--green)] text-white shadow-md ring-4 ring-white"
                  title="Agent actif"
                >
                  <BadgeCheck className="h-5 w-5" />
                </span>
              )}
            </div>

            <h1 className="mt-5 text-center text-2xl font-bold uppercase leading-tight text-slate-900">
              {fullName(agent)}
            </h1>
            <p className="mt-1.5 text-center text-sm font-medium text-slate-600">{agent.fonction ?? "—"}</p>

            <span className="mt-3 rounded-full bg-white px-3.5 py-1.5 font-mono text-xs font-semibold text-[var(--navy)] shadow-sm ring-1 ring-slate-200">
              {agent.matricule}
            </span>
          </div>

          {/* Détail de l'affectation */}
          <div className="px-6 pb-2">
            <h2 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">Affectation</h2>
            <InfoRow icon={Briefcase} label="Fonction" value={agent.fonction ?? "Non renseignée"} />
            <InfoRow icon={Building2} label="Département" value={agent.departement ?? "Non renseigné"} />
            <InfoRow icon={CalendarDays} label="En fonction depuis" value={formatDate(agent.dateEntree)} />
            <InfoRow icon={Hash} label="Matricule" value={agent.matricule} mono />
          </div>

          {/* Coordonnées professionnelles — utiles pour joindre l'agent ou
              confirmer son intervention auprès de l'entreprise. */}
          {(agent.telephone || agent.email) && (
            <div className="px-6 pb-4 pt-2">
              <h2 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Contact professionnel
              </h2>
              {agent.telephone && (
                <a href={`tel:${agent.telephone.replace(/\s/g, "")}`} className="block transition hover:opacity-70">
                  <InfoRow icon={Phone} label="Téléphone" value={agent.telephone} />
                </a>
              )}
              {agent.email && (
                <a href={`mailto:${agent.email}`} className="block transition hover:opacity-70">
                  <InfoRow icon={Mail} label="Email" value={agent.email} />
                </a>
              )}
            </div>
          )}

          {!actif && (
            <div className="mx-6 mb-5 rounded-xl bg-slate-100 px-4 py-3.5">
              <p className="text-center text-xs leading-relaxed text-slate-600">
                <strong className="text-slate-800">Cet agent n&apos;est plus en activité chez {BRAND.name}.</strong>
                <br />
                Sa carte professionnelle n&apos;est plus valide. En cas de doute, contactez l&apos;administration
                aux coordonnées ci-dessous.
              </p>
            </div>
          )}

          <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 text-center">
            <p className="text-xs font-semibold text-slate-700">{BRAND.name}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{BRAND.tagline}</p>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              <a href={`tel:${BRAND.phone.split("/")[0].replace(/\s/g, "")}`} className="hover:underline">
                {BRAND.phone}
              </a>
              <br />
              <a href={`mailto:${BRAND.email}`} className="hover:underline">
                {BRAND.email}
              </a>
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-500">
          Page de vérification officielle — les informations affichées proviennent du registre du personnel
          {" "}
          {BRAND.name}.
        </p>
      </div>
    </div>
  );
}
