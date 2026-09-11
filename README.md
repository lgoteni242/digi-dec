# DIGIGED — Gestion des agents

Application interne de **DIGIGED** (digitalisation & numérisation d'archives) : enregistrement des
agents, génération automatique de leur badge professionnel avec QR code, et export en masse des QR
codes pour le contrôle d'accès et la vérification d'identité.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions, Turbopack) |
| Base de données | SQLite via Prisma 7 (`@prisma/adapter-better-sqlite3`) |
| Style | Tailwind CSS v4 |
| Photos | UploadThing |
| QR codes | `qrcode` (SVG synchrone sur les badges, PNG pour l'export) |
| Export ZIP | `archiver` |

## Démarrage

```bash
npm install

# 1. Variables d'environnement
cp .env.example .env
#    puis renseigner UPLOADTHING_TOKEN (https://uploadthing.com/dashboard)

# 2. Base de données (crée dev.db à la racine)
npx prisma migrate dev
npm run db:seed        # 12 agents de démonstration

# 3. Lancer
npm run dev
```

L'application est disponible sur http://localhost:3000.

### Variables d'environnement

| Variable | Rôle |
|---|---|
| `DATABASE_URL` | Chemin de la base SQLite — `file:./dev.db` |
| `UPLOADTHING_TOKEN` | Jeton UploadThing pour l'upload des photos |
| `NEXT_PUBLIC_APP_URL` | **URL publique de l'app** — encodée dans les QR codes des badges |

> ⚠️ `NEXT_PUBLIC_APP_URL` doit correspondre à l'adresse réellement servie. Les badges déjà imprimés
> encodent l'URL en vigueur au moment de l'impression : changer cette valeur n'invalide pas la base,
> mais les anciens QR continueront de pointer vers l'ancienne adresse.

## Fonctionnalités

- **Tableau de bord** (`/`) — effectifs total / actifs / inactifs, répartition par département, derniers enregistrés.
- **Agents** (`/agents`) — liste paginée, recherche (nom, prénom, matricule), filtres département + statut.
- **Enregistrement** (`/agents/nouveau`) — formulaire complet avec upload de photo et **aperçu du badge en direct**.
- **Fiche agent** (`/agents/[id]`) — informations, badge recto/verso, impression, téléchargement PNG, activation/désactivation, suppression.
- **Page profil publique** (`/verify/[id]`) — **c'est la page atteinte en scannant le QR d'un badge**. Elle affiche la photo, l'identité, l'affectation, les contacts professionnels et surtout la **validité de la carte** (bandeau vert « agent actif » / gris « carte non valide »). Elle n'expose aucune donnée personnelle sensible (ni date de naissance, ni contacts privés) et n'est pas indexable.
- **Export en masse** (`/export`) — sélection par département/statut, puis trois formats :
  1. **ZIP de PNG** — un QR par agent (`MATRICULE_NOM_Prenom.png`) + un `index.csv` de correspondance ;
  2. **Planche de QR codes** — grille A4 imprimable (nom + matricule sous chaque code) ;
  3. **Planche de badges** — grille A4 de cartes au format CR80, recto / verso / recto+verso.

### Accéder à la page profil d'un agent

Trois chemins mènent à `/verify/[id]` :

- **Scanner le QR code** du badge imprimé (usage terrain prévu) ;
- Bouton **« Profil public »** sur la fiche de l'agent ;
- Bouton **« Profil »** dans la colonne d'actions de la liste des agents.

## Badges

Deux modèles, définis dans [`lib/card-templates.tsx`](lib/card-templates.tsx) :

- **Duo** — bande latérale biseautée bicolore, photo intégrée, QR central ;
- **Portrait** — photo pleine largeur en tête, informations en dessous.

Chacun a un **recto** (identité) et un **verso** commun (QR grand format, mentions légales, contacts
DIGIGED). Le modèle et la couleur dominante sont réglables par agent.

Points d'implémentation à connaître avant de modifier ce fichier :

- Les cartes sont rendues sur un canevas fixe **300 × 478 px** (CR80 portrait, imprimé en 54 × 86 mm)
  avec des **styles 100 % inline** — à l'impression, les composants sont sérialisés
  (`renderToStaticMarkup`) vers une fenêtre vierge qui n'a pas la feuille Tailwind de l'app.
- `print-color-adjust: exact` dans `CARD_PRINT_PAGE_CSS` est **obligatoire** : sans lui les
  navigateurs suppriment les fonds colorés à l'impression et les cartes sortent en blanc.
- Les QR sont générés en **SVG synchrone** (`QRCode.create`) pour rester compatibles avec le rendu
  serveur, sans génération asynchrone.

L'impression ne dépend d'aucune bibliothèque PDF : la fenêtre d'impression du navigateur permet
d'« Enregistrer au format PDF ».

## API REST

Exposée pour des intégrations externes (badgeuse, pointage). L'interface interne passe, elle, par des
Server Actions.

| Méthode | Route | Rôle |
|---|---|---|
| `GET` | `/api/agents?q=&dep=&statut=` | Liste filtrée (chaque agent inclut son `verifyUrl`) |
| `POST` | `/api/agents` | Création (matricule généré automatiquement) |
| `GET` `PATCH` `DELETE` | `/api/agents/[id]` | Lecture / mise à jour / suppression |
| `GET` | `/api/export/qr-zip?ids=&dep=&statut=` | Archive ZIP des QR codes |

## Matricules

Format `DGD-{année}-{séquence sur 4}` (ex. `DGD-2026-0001`), généré côté serveur par
[`lib/matricule.ts`](lib/matricule.ts). La séquence se base sur le plus grand matricule existant de
l'année — supprimer un agent ne réattribue jamais son numéro.

## Scripts

```bash
npm run dev          # serveur de développement
npm run build        # build de production (valide aussi TypeScript)
npm run lint         # ESLint
npm run db:seed      # données de démonstration
npm run db:migrate   # prisma migrate dev
npm run db:studio    # explorateur de base Prisma
npm run db:reset     # réinitialise la base
```

## Structure

```
app/
  (app)/                    groupe portant la nav + le pied de page internes
    page.tsx                tableau de bord
    agents/                 liste, création, fiche, édition, Server Actions
    export/                 export en masse
  verify/[id]/              page profil publique (hors du groupe : aucune nav interne)
  api/                      agents, export ZIP, uploadthing
components/                 formulaire, upload photo, aperçu badge, nav
lib/
  card-templates.tsx        modèles de badges + QR + CSS d'impression
  brand.ts                  charte DIGIGED, départements, verifyUrl()
  db.ts  matricule.ts  utils.ts  uploadthing*.ts
prisma/                     schema.prisma, migrations, seed.ts
```

La base SQLite est le fichier **`dev.db`** à la racine du projet (ignoré par git).
