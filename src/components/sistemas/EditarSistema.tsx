import { useState } from "react";
import type { FormEvent } from "react";
import { AlertaError, claseInput } from "@/components/gestor/comunes";
import { SelectorImagen } from "@/components/gestor/SelectorImagen";
import { editarSistema, invalidarSesion } from "@/lib/auth";
import { quitarLogo, subirLogo } from "@/lib/imagenes";
import type { NegocioGuardado } from "@/lib/auth";

const REGEX_COLOR = /^#[0-9a-fA-F]{6}$/;

export function validarSistema(d: {
  nombre: string;
  colorPrimario: string;
  colorSecundario: string;
}): string | null {
  const nombre = d.nombre.trim();
  if (!nombre) return "Ingresa el nombre del negocio.";
  if (nombre.length > 255) return "El nombre no puede superar los 255 caracteres.";
  if (!REGEX_COLOR.test(d.colorPrimario) || !REGEX_COLOR.test(d.colorSecundario))
    return "Elige colores válidos.";
  return null;
}

/** Formulario para cambiar el nombre, el logo y los colores de un sistema ya creado. */
export function EditarSistema({
  negocio,
  onListo,
  onCancelar,
}: {
  negocio: NegocioGuardado;
  onListo: () => void;
  onCancelar: () => void;
}) {
  const [datos, setDatos] = useState({
    nombre: negocio.nombre,
    colorPrimario: negocio.colorPrimario,
    colorSecundario: negocio.colorSecundario,
  });
  const [logo, setLogo] = useState<File | null>(null);
  const [quitarLogoActual, setQuitarLogoActual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cambiar = (campo: keyof typeof datos, valor: string) =>
    setDatos((d) => ({ ...d, [campo]: valor }));

  const alEnviar = async (e: FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    const problema = validarSistema(datos);
    if (problema) {
      setError(problema);
      return;
    }
    setError(null);
    setGuardando(true);
    const r = await editarSistema(negocio.id, datos);
    if (!r.ok) {
      setGuardando(false);
      setError(r.error);
      return;
    }
    try {
      if (logo) await subirLogo(negocio.id, logo);
      else if (quitarLogoActual) await quitarLogo(negocio.id);
      invalidarSesion();
    } catch (e) {
      setGuardando(false);
      setError(
        `Se guardaron los datos, pero el logo no se pudo cambiar. ${e instanceof Error ? e.message : ""}`.trim(),
      );
      return;
    }
    onListo();
  };

  return (
    <form
      onSubmit={(e) => void alEnviar(e)}
      noValidate
      className="rounded-2xl border border-primary/40 bg-card p-5 shadow-sm sm:col-span-2 lg:col-span-3"
    >
      <h2 className="text-base font-semibold text-foreground">Editar {negocio.nombre}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-foreground">Nombre del negocio</span>
          <input
            type="text"
            aria-label="Nombre del negocio"
            value={datos.nombre}
            onChange={(e) => cambiar("nombre", e.target.value)}
            className={claseInput}
          />
        </label>
        <SelectorImagen
          etiqueta="Logo (opcional)"
          actual={negocio.logoUrl}
          archivo={logo}
          quitar={quitarLogoActual}
          onArchivo={setLogo}
          onQuitar={setQuitarLogoActual}
          bloqueado={guardando}
        />
        {(
          [
            ["colorPrimario", "Color principal"],
            ["colorSecundario", "Color secundario"],
          ] as const
        ).map(([campo, etiqueta]) => (
          <label key={campo} className="flex items-center gap-3 text-sm">
            <input
              type="color"
              aria-label={etiqueta}
              value={datos[campo]}
              onChange={(e) => cambiar(campo, e.target.value)}
              className="size-10 cursor-pointer rounded-lg border border-border bg-background p-0.5"
            />
            <span className="font-medium text-foreground">{etiqueta}</span>
            <span className="text-muted-foreground">{datos[campo]}</span>
          </label>
        ))}
      </div>
      {error && (
        <div className="mt-4">
          <AlertaError mensaje={error} />
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={guardando}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          disabled={guardando}
          className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 disabled:opacity-60"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
