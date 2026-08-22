import { ZipArchive } from "archiver";
import QRCode from "qrcode";
import { prisma } from "@/lib/db";
import { BRAND, verifyUrl } from "@/lib/brand";
import { fullName, slugFile } from "@/lib/utils";

// Export ZIP : un PNG de QR code par agent, nommé {matricule}_{NOM_Prenom}.png.
// L'archive est streamée vers la réponse plutôt que bufferisée en mémoire, pour
// rester constant en RAM même sur un export de tout l'effectif.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = url.searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  const dep = url.searchParams.get("dep") ?? "";
  const statut = url.searchParams.get("statut") ?? "";

  const agents = await prisma.agent.findMany({
    where: {
      ...(ids.length > 0 ? { id: { in: ids } } : {}),
      ...(dep ? { departement: dep } : {}),
      ...(statut ? { statut } : {}),
    },
    orderBy: [{ matricule: "asc" }],
    select: { id: true, nom: true, prenom: true, matricule: true, fonction: true, departement: true, statut: true },
  });

  if (agents.length === 0) {
    return Response.json({ error: "Aucun agent à exporter." }, { status: 400 });
  }

  // archiver v8 est ESM et expose des classes (plus de fabrique par defaut) :
  // ZipArchive etend Transform, on branche donc ses evenements sur le ReadableStream.
  const archive = new ZipArchive({ zlib: { level: 9 } });

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      archive.on("data", (chunk: Buffer) => controller.enqueue(new Uint8Array(chunk)));
      archive.on("end", () => controller.close());
      archive.on("warning", (err) => console.warn("[qr-zip] warning", err));
      archive.on("error", (err) => {
        console.error("[qr-zip] error", err);
        controller.error(err);
      });

      void (async () => {
        const index: string[] = ["matricule;nom;fonction;departement;statut;url_verification"];

        for (const a of agents) {
          const target = verifyUrl(a.id);
          const png = await QRCode.toBuffer(target, {
            type: "png",
            width: 600,
            margin: 2,
            errorCorrectionLevel: "M",
            color: { dark: BRAND.navy, light: "#FFFFFF" },
          });
          archive.append(png, { name: `${slugFile(a.matricule)}_${slugFile(fullName(a))}.png` });
          index.push(
            [a.matricule, fullName(a), a.fonction ?? "", a.departement ?? "", a.statut, target]
              .map((v) => String(v).replaceAll(";", ","))
              .join(";")
          );
        }

        // Feuille de correspondance : sans elle, un dossier de QR codes est
        // difficilement exploitable par un tiers (import badgeuse, pointage…).
        archive.append("﻿" + index.join("\r\n"), { name: "index.csv" });
        await archive.finalize();
      })();
    },
    cancel() {
      archive.abort();
    },
  });

  const stamp = new Date().toISOString().slice(0, 10);
  return new Response(stream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="digiged_qrcodes_${stamp}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
