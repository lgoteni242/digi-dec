import "dotenv/config";
import { defineConfig } from "@prisma/config";

// Prisma 7 : l'URL de connexion ne vit plus dans schema.prisma (propriete `url`
// supprimee). Elle est fournie ici pour la CLI (migrate/studio) et via l'adapter
// better-sqlite3 pour le client applicatif (lib/db.ts).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
