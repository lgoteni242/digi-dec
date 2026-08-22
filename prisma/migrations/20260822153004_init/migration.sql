-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matricule" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "dateNaissance" DATETIME,
    "sexe" TEXT,
    "fonction" TEXT,
    "departement" TEXT,
    "telephone" TEXT,
    "email" TEXT,
    "dateEntree" DATETIME,
    "photoUrl" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'actif',
    "cardModel" TEXT NOT NULL DEFAULT 'duo',
    "cardColor" TEXT NOT NULL DEFAULT '#0A2472',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_matricule_key" ON "Agent"("matricule");

-- CreateIndex
CREATE INDEX "Agent_nom_idx" ON "Agent"("nom");

-- CreateIndex
CREATE INDEX "Agent_departement_idx" ON "Agent"("departement");

-- CreateIndex
CREATE INDEX "Agent_statut_idx" ON "Agent"("statut");
