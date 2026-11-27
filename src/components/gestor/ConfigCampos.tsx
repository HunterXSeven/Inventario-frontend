import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  CircleDollarSign,
  Eye,
  EyeOff,
  Hash,
  Image as ImagenIcono,
  Pencil,
  Plus,
  Trash2,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api";
import type { NegocioGuardado } from "@/lib/auth";
import { textoSobre } from "@/lib/colores";
import {
  TIPOS_CAMPO,
  cambiarVisibilidadCampo,
  crearCampo,
  editarCampo,
  eliminarCampo,
  esDeSistema,
  listarCamposConfig,
  puedeSerFiltrable,
} from "@/lib/configuracion";
import type { CampoConfig, DatosCampo } from "@/lib/configuracion";
import { mensajeDeError } from "@/lib/gestor";
import type { Modulo, TipoCampo } from "@/lib/gestor";
import { AlertaError, BotonIcono, IconoModulo, claseInput } from "@/components/gestor/comunes";

function IconoTipo({ tipo, className }: { tipo: TipoCampo; className?: string }) {
  switch (tipo) {
    case "numero":
      return <Hash className={className} />;
    case "decimal":
      return <CircleDollarSign className={className} />;
    case "fecha":
      return <Calendar className={className} />;
    case "imagen":
      return <ImagenIcono className={className} />;
    default:
      return <Type className={className} />;
  }
}

const etiquetaTipo = (tipo: TipoCampo) =>
  TIPOS_CAMPO.find((t) => t.valor === tipo)?.etiqueta ?? tipo;

const datosVacios: DatosCampo = { nombre: "", tipo: "texto", filtrable: false };

/** Nombre, tipo y filtrable de un campo. En un campo de sistema solo se puede cambiar el nombre. */
function FormularioCampo({
  datos,
  soloNombre,
  guardando,
  onCambiar,
  onGuardar,
  onCancelar,
}: {
  datos: DatosCampo;
  soloNombre: boolean;
  guardando: boolean;
  onCambiar: (d: DatosCampo) => void;
  onGuardar: () => void;
  onCancelar: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onGuardar();
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <label className="block min-w-48 flex-1 text-sm font-medium text-foreground">
        Nombre del campo
        <input
          autoFocus
          value={datos.nombre}
          maxLength={50}
          placeholder="Ej. Teléfono"
          onChange={(e) => onCambiar({ ...datos, nombre: e.target.value })}
          className={cn(claseInput, "mt-1")}
        />
      </label>

      {!soloNombre && (
        <>
          <label className="block text-sm font-medium text-foreground">
            Tipo
            <select
              value={datos.tipo}
              onChange={(e) => {
                const tipo = e.target.value as TipoCampo;
                onCambiar({
                  ...datos,
                  tipo,
                  filtrable: puedeSerFiltrable(tipo) && datos.filtrable,
                });
              }}
              className={cn(claseInput, "mt-1")}
            >
              {TIPOS_CAMPO.map((t) => (
                <option key={t.valor} value={t.valor}>
                  {t.etiqueta}
                </option>
              ))}
            </select>
          </label>

          <label
            className={cn(
              "flex items-center gap-2 pb-2 text-sm font-medium text-foreground",
              !puedeSerFiltrable(datos.tipo) && "opacity-50",
            )}
            title={
              puedeSerFiltrable(datos.tipo)
                ? "Permite buscar y filtrar registros por este campo"
                : "Un campo de imagen no puede ser filtrable"
            }
          >
            <input
              type="checkbox"
              checked={datos.filtrable}
              disabled={!puedeSerFiltrable(datos.tipo)}
              onChange={(e) => onCambiar({ ...datos, filtrable: e.target.checked })}
              className="size-4 accent-[var(--color-primary)]"
            />
            Filtrable
          </label>
        </>
      )}

      <div className="flex items-center gap-2 pb-0.5">
        <button
          type="submit"
          disabled={guardando}
          className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold text-foreground"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

/**
 * Configurar → campos de un módulo.
 * Editar = renombrar (y cambiar tipo/filtrable en los personalizados).
 * Quitar = ocultar el campo de sistema opcional, o eliminar el personalizado.
 */
export function ConfigCampos({
  modulo,
  negocio,
  onVolver,
  onSesionVencida,
}: {
  modulo: Modulo;
  negocio: NegocioGuardado;
  onVolver: () => void;
  onSesionVencida: () => void;
}) {
  const [campos, setCampos] = useState<CampoConfig[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [creando, setCreando] = useState(false);
  const [nuevo, setNuevo] = useState<DatosCampo>(datosVacios);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [edicion, setEdicion] = useState<DatosCampo>(datosVacios);
  const [guardando, setGuardando] = useState(false);
  const [ocupadoId, setOcupadoId] = useState<number | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<number | null>(null);

  // Solo los módulos personalizados aceptan campos nuevos.
  const aceptaNuevos = modulo.predefinido === null;

  const manejarError = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && e.status === 401) onSesionVencida();
      else setError(mensajeDeError(e));
    },
    [onSesionVencida],
  );

  const cargar = useCallback(async () => {
    try {
      setCampos(await listarCamposConfig(modulo.id));
    } catch (e) {
      manejarError(e);
    }
  }, [modulo.id, manejarError]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const guardarNuevo = async () => {
    if (guardando) return;
    if (!nuevo.nombre.trim()) {
      setError("Escribe el nombre del campo.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await crearCampo(modulo.id, nuevo);
      setNuevo(datosVacios);
      setCreando(false);
      await cargar();
    } catch (e) {
      manejarError(e);
    } finally {
      setGuardando(false);
    }
  };

  const guardarEdicion = async (campo: CampoConfig) => {
    if (guardando) return;
    if (!edicion.nombre.trim()) {
      setError("Escribe el nombre del campo.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      await editarCampo(campo.id, edicion);
      setEditandoId(null);
      await cargar();
    } catch (e) {
      manejarError(e);
    } finally {
      setGuardando(false);
    }
  };

  const accion = async (campo: CampoConfig, hacer: () => Promise<void>) => {
    if (ocupadoId !== null) return;
    setOcupadoId(campo.id);
    setError(null);
    try {
      await hacer();
      setConfirmandoId(null);
      await cargar();
    } catch (e) {
      manejarError(e);
    } finally {
      setOcupadoId(null);
    }
  };

  const empezarEdicion = (c: CampoConfig) => {
    setCreando(false);
    setConfirmandoId(null);
    setError(null);
    setEdicion({ nombre: c.nombre, tipo: c.tipo, filtrable: c.filtrable });
    setEditandoId(c.id);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <button
        type="button"
        onClick={onVolver}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a módulos
      </button>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <span
            className="grid size-14 shrink-0 place-items-center rounded-2xl shadow-sm"
            style={{
              backgroundColor: negocio.colorSecundario,
              color: textoSobre(negocio.colorSecundario),
            }}
          >
            <IconoModulo modulo={modulo} className="size-7" />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-bold tracking-tight text-foreground">
              Campos de {modulo.nombre}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {aceptaNuevos
                ? "Define qué datos guarda cada registro."
                : "Campos del sistema: puedes renombrarlos y ocultar los opcionales."}
            </p>
          </div>
        </div>
        {aceptaNuevos && !creando && (
          <button
            type="button"
            onClick={() => {
              setCreando(true);
              setEditandoId(null);
              setError(null);
            }}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            style={{
              backgroundColor: negocio.colorSecundario,
              color: textoSobre(negocio.colorSecundario),
            }}
          >
            <Plus className="size-4" />
            Nuevo campo
          </button>
        )}
      </div>

      {error && (
        <div className="mt-6">
          <AlertaError mensaje={error} onCerrar={() => setError(null)} />
        </div>
      )}

      {creando && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <FormularioCampo
            datos={nuevo}
            soloNombre={false}
            guardando={guardando}
            onCambiar={setNuevo}
            onGuardar={() => void guardarNuevo()}
            onCancelar={() => {
              setCreando(false);
              setNuevo(datosVacios);
              setError(null);
            }}
          />
        </div>
      )}

      <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {campos === null && !error && (
          <div className="space-y-3 p-4" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-muted/70" />
            ))}
          </div>
        )}

        {campos !== null && campos.length === 0 && (
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            Este módulo todavía no tiene campos. Crea el primero con “Nuevo campo”.
          </p>
        )}

        <ul>
          {campos?.map((c) => {
            const deSistema = esDeSistema(c);
            const ocupado = ocupadoId === c.id;

            if (editandoId === c.id) {
              return (
                <li
                  key={c.id}
                  className="border-b border-border/70 bg-muted/30 px-4 py-4 last:border-0"
                >
                  <FormularioCampo
                    datos={edicion}
                    soloNombre={deSistema}
                    guardando={guardando}
                    onCambiar={setEdicion}
                    onGuardar={() => void guardarEdicion(c)}
                    onCancelar={() => {
                      setEditandoId(null);
                      setError(null);
                    }}
                  />
                </li>
              );
            }

            return (
              <li
                key={c.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 border-b border-border/70 px-4 py-3 last:border-0",
                  !c.visible && "bg-muted/40",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground",
                    !c.visible && "opacity-50",
                  )}
                >
                  <IconoTipo tipo={c.tipo} className="size-5" />
                </span>

                <div className={cn("min-w-0 flex-1", !c.visible && "opacity-60")}>
                  <p className="truncate font-semibold text-foreground">{c.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {etiquetaTipo(c.tipo)} · {deSistema ? "Sistema" : "Personalizado"}
                    {c.filtrable && " · Filtrable"}
                    {!c.visible && " · Oculto"}
                  </p>
                </div>

                {confirmandoId === c.id ? (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-foreground">¿Eliminar {c.nombre}?</span>
                    <button
                      type="button"
                      disabled={ocupado}
                      onClick={() => void accion(c, () => eliminarCampo(c.id))}
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
                      titulo={`Editar ${c.nombre}`}
                      disabled={ocupado}
                      onClick={() => empezarEdicion(c)}
                    >
                      <Pencil className="size-4" />
                    </BotonIcono>

                    {deSistema ? (
                      <BotonIcono
                        titulo={
                          !c.ocultable
                            ? "Campo obligatorio: no se puede quitar"
                            : c.visible
                              ? "Quitar del módulo (ocultar)"
                              : "Mostrar campo"
                        }
                        disabled={!c.ocultable || ocupado}
                        onClick={() =>
                          void accion(c, () => cambiarVisibilidadCampo(c.id, !c.visible))
                        }
                      >
                        {c.visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </BotonIcono>
                    ) : (
                      <BotonIcono
                        titulo="Quitar campo (eliminar)"
                        peligro
                        disabled={ocupado}
                        onClick={() => {
                          setEditandoId(null);
                          setConfirmandoId(c.id);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </BotonIcono>
                    )}
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
