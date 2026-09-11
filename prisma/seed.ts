import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const YEAR = 2026;

// Avatar de demonstration : SVG inline encode en data URI. Les vraies photos
// arrivent par UploadThing (https://<app>.ufs.sh/f/...) ; ces placeholders
// servent uniquement a ce que le seed produise des fiches completes.
function demoPhoto(nom: string, prenom: string, sexe: string): string {
  const init = `${nom.charAt(0)}${prenom.charAt(0)}`.toUpperCase();
  const bg = sexe === "F" ? "#2b4a9b" : "#0A2472";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="400" viewBox="0 0 320 400">
<rect width="320" height="400" fill="${bg}"/>
<circle cx="160" cy="150" r="62" fill="#ffffff" opacity="0.92"/>
<path d="M40 400 a120 120 0 0 1 240 0 z" fill="#ffffff" opacity="0.92"/>
<text x="160" y="168" font-family="Arial,sans-serif" font-size="54" font-weight="bold" fill="${bg}" text-anchor="middle">${init}</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}


const AGENTS = [
  { nom: "Maloula", prenom: "Wamonia", sexe: "M", fonction: "Directeur General", departement: "Administration", telephone: "+242 068560588", email: "maloulawamonia@gmail.com", dateNaissance: "1982-04-11", dateEntree: "2019-01-15", cardModel: "portrait" },
  { nom: "Nkounkou", prenom: "Sylvie", sexe: "F", fonction: "Responsable Numerisation", departement: "Numerisation", telephone: "+242 066112233", email: "s.nkounkou@digiged.cg", dateNaissance: "1989-09-02", dateEntree: "2020-03-01", cardModel: "duo" },
  { nom: "Bahamboula", prenom: "Prince", sexe: "M", fonction: "Operateur de scan", departement: "Numerisation", telephone: "+242 065998877", email: "p.bahamboula@digiged.cg", dateNaissance: "1995-12-19", dateEntree: "2021-06-14", cardModel: "duo" },
  { nom: "Loubaki", prenom: "Chancelle", sexe: "F", fonction: "Technicienne OCR", departement: "Traitement & OCR", telephone: "+242 064553311", email: "c.loubaki@digiged.cg", dateNaissance: "1993-07-30", dateEntree: "2021-09-06", cardModel: "portrait" },
  { nom: "Mabiala", prenom: "Fresnel", sexe: "M", fonction: "Indexeur documentaire", departement: "Traitement & OCR", telephone: "+242 069441122", email: "f.mabiala@digiged.cg", dateNaissance: "1991-02-08", dateEntree: "2022-01-10", cardModel: "duo" },
  { nom: "Ossete", prenom: "Grace", sexe: "F", fonction: "Agent de collecte", departement: "Collecte", telephone: "+242 066778899", email: "g.ossete@digiged.cg", dateNaissance: "1997-05-23", dateEntree: "2022-04-04", cardModel: "duo" },
  { nom: "Ngoma", prenom: "Baudouin", sexe: "M", fonction: "Chef d'equipe Collecte", departement: "Collecte", telephone: "+242 065221144", email: "b.ngoma@digiged.cg", dateNaissance: "1987-11-17", dateEntree: "2020-08-24", cardModel: "portrait" },
  { nom: "Tsoumou", prenom: "Merveille", sexe: "F", fonction: "Archiviste", departement: "Mise a disposition", telephone: "+242 064667788", email: "m.tsoumou@digiged.cg", dateNaissance: "1994-03-05", dateEntree: "2022-10-03", cardModel: "duo" },
  { nom: "Kimbembe", prenom: "Rodrigue", sexe: "M", fonction: "Administrateur systeme", departement: "Informatique", telephone: "+242 069334455", email: "r.kimbembe@digiged.cg", dateNaissance: "1990-08-12", dateEntree: "2021-02-15", cardModel: "portrait" },
  { nom: "Bikindou", prenom: "Nadege", sexe: "F", fonction: "Developpeuse", departement: "Informatique", telephone: "+242 066889900", email: "n.bikindou@digiged.cg", dateNaissance: "1996-01-27", dateEntree: "2023-05-02", cardModel: "duo" },
  { nom: "Samba", prenom: "Aristide", sexe: "M", fonction: "Charge de clientele", departement: "Commercial", telephone: "+242 065443322", email: "a.samba@digiged.cg", dateNaissance: "1992-06-14", dateEntree: "2022-07-18", cardModel: "duo", statut: "inactif" },
  { nom: "Moukoko", prenom: "Laetitia", sexe: "F", fonction: "Assistante administrative", departement: "Administration", telephone: "+242 064119933", email: "l.moukoko@digiged.cg", dateNaissance: "1998-10-09", dateEntree: "2023-11-06", cardModel: "portrait", statut: "inactif" },
];

async function main() {
  await prisma.agent.deleteMany();

  let seq = 0;
  for (const a of AGENTS) {
    seq += 1;
    await prisma.agent.create({
      data: {
        matricule: `DGD-${YEAR}-${String(seq).padStart(4, "0")}`,
        nom: a.nom,
        prenom: a.prenom,
        sexe: a.sexe,
        fonction: a.fonction,
        departement: a.departement,
        telephone: a.telephone,
        email: a.email,
        dateNaissance: new Date(a.dateNaissance),
        dateEntree: new Date(a.dateEntree),
        statut: a.statut ?? "actif",
        cardModel: a.cardModel,
        cardColor: "#0A2472",
        photoUrl: demoPhoto(a.nom, a.prenom, a.sexe),
      },
    });
  }

  const total = await prisma.agent.count();
  const actifs = await prisma.agent.count({ where: { statut: "actif" } });
  console.log(`Seed termine : ${total} agents (${actifs} actifs).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
