import { useEffect, useRef, useState } from "react";
import { validarImagen } from "@/lib/imagenes";

/** Dirección temporal para mostrar un archivo elegido antes de subirlo. */
export function useVistaArchivo(archivo: File | null | undefined): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!archivo || typeof URL.createObjectURL !== "function") {
      setUrl(null);
      return;
    }
    const nueva = URL.createObjectURL(archivo);
    setUrl(nueva);
    return () => URL.revokeObjectURL(nueva);
  }, [archivo]);
  return url;
}

/**
 * Elegir (o quitar) una imagen. No sube nada: avisa del archivo elegido y quien guarda
 * el formulario hace la subida. `actual` es la URL que ya tiene guardada, si hay.
 */
export function SelectorImagen({
  etiqueta,
  actual,
  archivo,
  quitar,
  onArchivo,
  onQuitar,
  bloqueado = false,
}: {
  etiqueta: string;
  actual?: string | null;
  archivo: File | null;
  quitar: boolean;
  onArchivo: (a: File | null) => void;
  onQuitar: (q: boolean) => void;
  bloqueado?: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const entrada = useRef<HTMLInputElement>(null);
  const vista = useVistaArchivo(archivo);
  const mostrada = vista ?? (quitar ? null : (actual ?? null));

  const alElegir = (a: File | undefined) => {
    if (!a) return;
    const problema = validarImagen(a);
    if (problema) {
      setError(problema);
      if (entrada.current) entrada.current.value = "";
      return;
    }
    setError(null);
    onQuitar(false);
    onArchivo(a);
  };

  const alQuitar = () => {
    setError(null);
    onArchivo(null);
    onQuitar(true);
    if (entrada.current) entrada.current.value = "";
  };

  return (
    <div className="text-sm">
      <span className="mb-1 block font-medium text-foreground">{etiqueta}</span>
      <div className="flex items-center gap-3">
        {mostrada && (
          <img
            src={mostrada}
            alt={`Vista de ${etiqueta}`}
            className="size-14 shrink-0 rounded-lg border border-border object-cover"
          />
        )}
        <input
          ref={entrada}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-label={etiqueta}
          disabled={bloqueado}
          onChange={(e) => alElegir(e.target.files?.[0])}
          className="block w-full text-xs text-muted-foreground file:mr-3 file:rounded-full file:border file:border-border file:bg-card file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-foreground"
        />
        {mostrada && (
          <button
            type="button"
            onClick={alQuitar}
            disabled={bloqueado}
            className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:border-destructive/50 disabled:opacity-60"
          >
            Quitar
          </button>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">JPG, PNG o WebP, hasta 5 MB.</p>
      {error && (
        <p role="alert" className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
