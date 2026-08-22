import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// Un seul endpoint : la photo d'identite de l'agent, apposee sur son badge.
// awaitServerData: false => le client recupere l'URL des la fin du transfert,
// sans attendre le retour du callback serveur.
export const ourFileRouter = {
  agentPhoto: f(
    { image: { maxFileSize: "4MB", maxFileCount: 1 } },
    { awaitServerData: false }
  ).onUploadComplete(async ({ file }) => {
    return { url: file.ufsUrl };
  }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
