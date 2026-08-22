"use client";

import { useState, useRef, useEffect } from "react";
import { uploadFiles } from "@/lib/uploadthing-client";
import { Camera, Loader2, X } from "lucide-react";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  initials?: string;
  disabled?: boolean;
}

// Champ photo *contrôlé* : il téléverse le fichier vers UploadThing puis remonte
// l'URL finale au formulaire parent, qui la persiste avec le reste des champs.
// (La variante de saas-school patchait directement un élève déjà en base ; ici la
// même UI doit servir aussi bien à la création qu'à l'édition.)
export function PhotoUploadField({ value, onChange, initials = "?", disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  // Aperçu local affiché uniquement pendant le téléversement ; le reste du temps
  // l'image vient de la prop `value`. Éviter un état miroir synchronisé par
  // useEffect supprime un rendu en cascade (et l'avertissement React associé).
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = localPreview ?? value;

  // Les URL d'objet local créées pour l'aperçu sont révoquées à la fin de
  // l'upload (ou au démontage) pour ne pas fuiter de mémoire.
  const objectUrlRef = useRef<string | null>(null);
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const localUrl = URL.createObjectURL(file);
    objectUrlRef.current = localUrl;
    setLocalPreview(localUrl);
    setUploading(true);

    try {
      const res = await uploadFiles("agentPhoto", { files: [file] });
      const url = res[0]?.ufsUrl;
      if (!url) throw new Error("Aucune URL retournée par UploadThing.");
      onChange(url);
    } catch (err) {
      console.error("[PhotoUploadField]", err);
      setError(err instanceof Error ? err.message : "Erreur lors du téléversement.");
    } finally {
      setLocalPreview(null);
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function clear() {
    onChange(null);
    setLocalPreview(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="flex items-start gap-4">
      <div
        role="button"
        tabIndex={0}
        aria-label="Choisir une photo"
        onClick={() => !uploading && !disabled && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !uploading && !disabled) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className="group relative flex h-32 w-26 flex-shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-2xl font-bold text-slate-400 transition hover:border-[var(--navy)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--navy)]"
        style={{ width: 104, height: 128 }}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Aperçu de la photo" className="h-full w-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}

        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {uploading ? (
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          ) : (
            <Camera className="h-6 w-6 text-white" />
          )}
        </div>

        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
          </div>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled || uploading}
          onChange={handleFile}
        />
      </div>

      <div className="flex flex-col gap-1 pt-1">
        <p className="text-sm font-medium text-slate-700">Photo de l&apos;agent</p>
        <p className="text-xs text-slate-500">JPG ou PNG, 4 Mo maximum. Cadrage portrait recommandé.</p>
        {uploading && <p className="text-xs text-slate-500">Téléversement en cours…</p>}
        {preview && !uploading && (
          <button
            type="button"
            onClick={clear}
            className="mt-1 inline-flex w-fit items-center gap-1 text-xs font-medium text-red-600 hover:underline"
          >
            <X className="h-3 w-3" /> Retirer la photo
          </button>
        )}
        {error && <p className="text-xs font-medium text-red-600">{error}</p>}
      </div>
    </div>
  );
}
