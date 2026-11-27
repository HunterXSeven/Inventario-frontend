import { useCallback, useEffect, useState } from "react";
import { Eye, EyeOff, Plus, Settings, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import type { NegocioGuardado } from "@/lib/auth";
import { textoSobre } from "@/lib/colores";
import {
  cambiarVisibilidadModulo,
  crearModulo,
  eliminarModulo,
  listarModulosConfig,
} from "@/lib/configuracion";
import { mensajeDeError } from "@/lib/gestor";
import type { Modulo } from "@/lib/gestor";
import { AlertaError, BotonIcono, IconoModulo, claseInput } from "@/components/gestor/comunes";

/**
 * Configurar → lista de módulos.
 * Ojo tachado = ocultar/mostrar, tacho = eliminar, engranaje = campos del módulo.
 */
export function ConfigModulos({
  negocio,
  onAbrirCampos,
  onCambio,
  onSesionVencida,
}: {
  negocio: NegocioGuardado;
  onAbrirCampos: (modulo: Modulo) => void;
  /** Avisa que cambió el menú (se creó, ocultó o eliminó un módulo). */
  onCambio: () => void;
  onSesionVencida: () => void;
}) {
  const [modulos, setModulos] = useState<Modulo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [ocupadoId, setOcupadoId] = useState<number | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);

  const manejarError = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && e.status === 401) onSesionVencida();
      else setError(mensajeDeError(e));
    },
    [onSesionVencida],
  );

  const cargar = useCallback(async () => {
    try {
      setModulos(await listarModulosConfig());
    } catch (e) {
      manejarError(e);
    }
  }, [manejarError]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    if (guardando) return;
    if (!nombre.trim()) {
      setError("Escribe el nombre del módulo.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await crearModulo(nombre);
      setNombre("");
      setCreando(false);
      await cargar();
      onCambio();
    } catch (err) {
      manejarError(err);
    } finally {
      setGuardando(false);
    }
  };

  /** Ejecuta una acción sobre un módulo, y luego recarga la lista y el menú. */
  const accion = async (m: Modulo, hacer: () => Promise<void>) => {
    if (ocupadoId !== null) return;
    setOcupadoId(m.id);
    setError(null);
    try {
      await hacer();
      setConfirmandoId(null);
      await cargar();
      onCambio();
    } catch (err) {
      manejarError(err);
    } finally {
      setOcupadoId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {negocio.nombre} <span className="mx-1">›</span>{" "}
            <span className="text-foreground">Configurar</span>
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">Módulos</h1>
          <p className="mt-1 text-muted-foreground">
            Oculta los que no uses, crea los tuyos y define los campos de cada uno.
          </p>
        </div>
        {!creando && (
          <button
            type="button"
            onClick={() => {
              setCreando(true);
              setError(null);
            }}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{
              backgroundColor: negocio.colorSecundario,
              color: textoSobre(negocio.colorSecundario),
            }}
          >
            <Plus className="size-4" />
            Nuevo
          </button>
        )}
      </div>

      {error && (
        <div className="mt-6">
          <AlertaError mensaje={error} onCerrar={() => setError(null)} />
        </div>
      )}

      {creando && (
        <form
          onSubmit={(e) => void crear(e)}
          className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <label htmlFor="nombre-modulo" className="text-sm font-medium text-foreground">
            Nombre del módulo
          </label>
          <input
            id="nombre-modulo"
            autoFocus
            value={nombre}
            maxLength={50}
            placeholder="Ej. Clientes"
            onChange={(e) => setNombre(e.target.value)}
            className={cn(claseInput, "min-w-0 flex-1 sm:w-auto")}
          />
          <button
            type="submit"
            disabled={guardando}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setCreando(false);
              setNombre("");
              setError(null);
            }}
            className="rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold text-foreground"
          >
            Cancelar
          </button>
        </form>
      )}

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {modulos === null && !error && (
          <div className="space-y-3 p-4" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/70" />
            ))}
          </div>
        )}

        <ul>
          {modulos?.map((m) => {
            const esSistema = m.predefinido !== null;
            const ocupado = ocupadoId === m.id;
            return (
              <li
                key={m.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 border-b border-border/70 px-4 py-3 last:border-0",
                  !m.visible && "bg-muted/40",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground",
                    !m.visible && "opacity-50",
                  )}
                >
                  <IconoModulo modulo={m} className="size-5" />
                </span>

                <div className={cn("min-w-0 flex-1", !m.visible && "opacity-60")}>
                  <p className="truncate font-semibold text-foreground">{m.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {esSistema ? "Predefinido" : "Personalizado"}
                    {!m.visible && " · Oculto"}
                  </p>
                </div>

                {confirmandoId === m.id ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-foreground">¿Eliminar {m.nombre}?</span>
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => void accion(m, () => eliminarModulo(m.id))}
                      className="rounded-full bg-destructive px-4 py-1.5 font-semibold text-destructive-foreground disabled:opacity-60"
                    >
                      Sí, eliminar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoId(null)}
                      className="rounded-full border border-border bg-card px-4 py-1.5 font-semibold text-foreground"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <BotonIcono
                      titulo={
                        !m.ocultable
                          ? "Este módulo no se puede ocultar"
                          : m.visible
                            ? "Ocultar módulo"
                            : "Mostrar módulo"
                      }
                      disabled={!m.ocultable || ocupado}
                      onClick={() =>
                        void accion(m, () => cambiarVisibilidadModulo(m.id, !m.visible))
                      }
                    >
                      {m.visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </BotonIcono>
                    <BotonIcono
                      titulo={
                        esSistema ? "Los módulos predefinidos no se eliminan" : "Eliminar módulo"
                      }
                      disabled={esSistema || ocupado}
                      peligro
                      onClick={() => setConfirmandoId(m.id)}
                    >
                      <Trash2 className="size-4" />
                    </BotonIcono>
                    <BotonIcono
                      titulo={`Campos de ${m.nombre}`}
                      disabled={ocupado}
                      onClick={() => onAbrirCampos(m)}
                    >
                      <Settings className="size-4" />
                    </BotonIcono>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
