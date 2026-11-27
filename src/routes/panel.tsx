import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowLeftRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Layers,
  LogOut,
  Menu,
  Package,
  Settings,
  ShoppingCart,
  Users,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { cerrarSesion, puedeCrearEn, useSesion } from "@/lib/auth";
import type { NegocioGuardado, Usuario } from "@/lib/auth";
import { ApiError } from "@/lib/api";
import { textoSobre } from "@/lib/colores";
import { ConfigCampos } from "@/components/gestor/ConfigCampos";
import { ConfigModulos } from "@/components/gestor/ConfigModulos";
import { AgregarRegistro } from "@/components/gestor/AgregarRegistro";
import { IconoModulo } from "@/components/gestor/comunes";
import {
  cargarTabla,
  formatearCelda,
  listarCampos,
  listarModulos,
  mensajeDeError,
} from "@/lib/gestor";
import { admiteAgregar } from "@/lib/registros";
import type { Campo, ColumnaTabla, FilaTabla, Modulo, TablaDatos } from "@/lib/gestor";

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [{ title: "CuadraStock — Mi sistema" }],
  }),
  component: Panel,
});

/* ============================================================
   Presentación de cada módulo
   ============================================================ */

function descripcionDe(modulo: Modulo): string {
  switch (modulo.predefinido) {
    case "productos":
      return "Catálogo de productos con su precio y stock disponible.";
    case "ventas":
      return "Registro de cada venta realizada en el negocio.";
    case "movimientos":
      return "Historial de entradas, salidas y ajustes de stock.";
    case "personal":
      return "Empleados que tienen acceso a este sistema.";
    default:
      return "Registros de este módulo.";
  }
}

/* ============================================================
   Tabla
   ============================================================ */

const esNumerica = (c: ColumnaTabla) => c.tipo === "numero" || c.tipo === "dinero";

function EtiquetaMovimiento({ tipo }: { tipo: string }) {
  const estilo =
    tipo === "Entrada"
      ? "bg-success/10 text-success"
      : tipo === "Salida"
        ? "bg-destructive/10 text-destructive"
        : "bg-primary/10 text-primary";
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", estilo)}>
      {tipo}
    </span>
  );
}

function Celda({ columna, fila }: { columna: ColumnaTabla; fila: FilaTabla }) {
  const valor = fila.celdas[columna.clave];

  if (columna.tipo === "imagen") {
    return typeof valor === "string" && valor ? (
      <img src={valor} alt="" className="size-9 rounded-md border border-border object-cover" />
    ) : (
      <span className="text-muted-foreground">—</span>
    );
  }

  if (columna.tipo === "movimiento") {
    return typeof valor === "string" ? <EtiquetaMovimiento tipo={valor} /> : <>—</>;
  }

  const texto = formatearCelda(columna.tipo, valor);
  // Un producto con el stock en el mínimo (o por debajo) se marca en rojo.
  if (columna.clave === "stock" && fila.alerta) {
    return (
      <span className="font-semibold text-destructive" title="Stock bajo">
        {texto}
      </span>
    );
  }
  return <>{texto}</>;
}

function TablaRegistros({ tabla }: { tabla: TablaDatos }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-max border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {tabla.columnas.map((c) => (
              <th
                key={c.clave}
                scope="col"
                className={cn(
                  "px-4 py-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                  esNumerica(c) ? "text-right" : "text-left",
                )}
              >
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tabla.filas.map((fila) => (
            <tr key={fila.id} className="border-b border-border/70 last:border-0 hover:bg-muted/30">
              {tabla.columnas.map((c) => (
                <td
                  key={c.clave}
                  className={cn(
                    "px-4 py-3 text-foreground",
                    esNumerica(c) ? "text-right tabular-nums" : "text-left",
                  )}
                >
                  <Celda columna={c} fila={fila} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EsqueletoTabla() {
  return (
    <div className="space-y-3 p-4" aria-busy="true">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="h-9 animate-pulse rounded-lg bg-muted/70" />
      ))}
    </div>
  );
}

/* ============================================================
   Vista de un módulo
   ============================================================ */

function VistaModulo({
  modulo,
  negocio,
  puedeAgregar,
  onSesionVencida,
}: {
  modulo: Modulo;
  negocio: NegocioGuardado;
  puedeAgregar: boolean;
  onSesionVencida: () => void;
}) {
  const [campos, setCampos] = useState<Campo[] | null>(null);
  const [tabla, setTabla] = useState<TablaDatos | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pagina, setPagina] = useState(0);
  const [intento, setIntento] = useState(0);
  // Sube al guardar un registro nuevo para volver a pedir la tabla.
  const [recarga, setRecarga] = useState(0);

  const manejarError = (e: unknown) => {
    if (e instanceof ApiError && e.status === 401) onSesionVencida();
    else setError(mensajeDeError(e));
  };

  // Primero los campos (definen las columnas) y, con ellos, la página de datos.
  useEffect(() => {
    let vigente = true;
    setError(null);
    setCampos(null);
    setTabla(null);
    listarCampos(modulo.id)
      .then((c) => vigente && setCampos(c))
      .catch((e: unknown) => vigente && manejarError(e));
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulo.id, intento]);

  useEffect(() => {
    if (!campos) return;
    let vigente = true;
    setError(null);
    cargarTabla(modulo, campos, pagina)
      .then((t) => vigente && setTabla(t))
      .catch((e: unknown) => vigente && manejarError(e));
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campos, pagina, modulo, recarga]);

  /** true si el error era de sesión vencida (ya se atendió). */
  const sesionVencida = (e: unknown) => {
    if (e instanceof ApiError && e.status === 401) {
      onSesionVencida();
      return true;
    }
    return false;
  };

  const alCrearRegistro = () => {
    setPagina(0);
    setRecarga((n) => n + 1);
  };

  const cambiarPagina = (nueva: number) => {
    setTabla(null);
    setPagina(nueva);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {negocio.nombre} <span className="mx-1">›</span>{" "}
        <span className="text-foreground">{modulo.nombre}</span>
      </p>

      <div className="mt-4 flex items-center gap-4">
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
            {modulo.nombre}
          </h1>
          <p className="mt-1 text-muted-foreground">{descripcionDe(modulo)}</p>
        </div>
      </div>

      <section className="mt-8 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {error && (
          <div
            role="alert"
            className="m-4 flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle className="size-4 shrink-0" />
            <span className="flex-1">{error}</span>
            <button
              type="button"
              onClick={() => {
                setPagina(0);
                setIntento((n) => n + 1);
              }}
              className="font-semibold underline underline-offset-2"
            >
              Reintentar
            </button>
          </div>
        )}

        {!error && tabla === null && <EsqueletoTabla />}

        {tabla !== null && tabla.filas.length === 0 && (
          <div className="px-6 py-14 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
              <Inbox className="size-6" />
            </span>
            <p className="mt-4 font-semibold text-foreground">Todavía no hay registros</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Cuando haya datos en {modulo.nombre}, aparecerán aquí.
            </p>
          </div>
        )}

        {tabla !== null && tabla.filas.length > 0 && (
          <>
            <TablaRegistros tabla={tabla} />
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              <span>
                {tabla.total} {tabla.total === 1 ? "registro" : "registros"}
              </span>
              {tabla.paginas > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cambiarPagina(pagina - 1)}
                    disabled={pagina === 0}
                    aria-label="Página anterior"
                    className="grid size-8 place-items-center rounded-lg border border-border bg-card text-foreground transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="size-4" />
                  </button>
                  <span>
                    Página {pagina + 1} de {tabla.paginas}
                  </span>
                  <button
                    type="button"
                    onClick={() => cambiarPagina(pagina + 1)}
                    disabled={pagina + 1 >= tabla.paginas}
                    aria-label="Página siguiente"
                    className="grid size-8 place-items-center rounded-lg border border-border bg-card text-foreground transition-colors hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {tabla !== null && campos !== null && puedeAgregar && admiteAgregar(modulo) && (
          <AgregarRegistro
            modulo={modulo}
            campos={campos}
            onCreado={alCrearRegistro}
            onSesionVencida={sesionVencida}
          />
        )}
      </section>
    </div>
  );
}

/* ============================================================
   Barra lateral
   ============================================================ */

function BarraLateral({
  usuario,
  negocio,
  modulos,
  seleccionado,
  onElegir,
  onConfigurar,
  configurando,
  onSalir,
}: {
  usuario: Usuario;
  negocio: NegocioGuardado;
  modulos: Modulo[] | null;
  seleccionado: number | null;
  onElegir: (id: number) => void;
  onConfigurar: () => void;
  /** true mientras se está en las pantallas de Configurar. */
  configurando: boolean;
  onSalir: () => void;
}) {
  const texto = textoSobre(negocio.colorPrimario);
  const textoActivo = textoSobre(negocio.colorSecundario);
  const esDueno = usuario.tipo === "DUENO";

  return (
    <div
      className="flex h-full flex-col"
      style={{ backgroundColor: negocio.colorPrimario, color: texto }}
    >
      <div className="px-5 pb-4 pt-5">
        <div className="flex items-center gap-3">
          {negocio.logoUrl ? (
            <img
              src={negocio.logoUrl}
              alt={`Logo de ${negocio.nombre}`}
              className="size-10 shrink-0 rounded-xl bg-white object-contain p-0.5"
            />
          ) : (
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/20">
              <Building2 className="size-5" />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-bold leading-tight">{negocio.nombre}</p>
            {esDueno ? (
              <Link
                to="/sistemas"
                className="text-xs underline-offset-2 opacity-80 hover:underline hover:opacity-100"
              >
                Cambiar de sistema
              </Link>
            ) : (
              <p className="text-xs opacity-80">Gestor de inventario</p>
            )}
          </div>
        </div>
      </div>

      <p className="px-5 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-widest opacity-70">
        Módulos{modulos ? ` · ${modulos.length}` : ""}
      </p>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Módulos">
        {modulos === null && (
          <div className="space-y-2 px-2" aria-busy="true">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded-lg bg-white/15" />
            ))}
          </div>
        )}
        {modulos?.map((m) => {
          const activo = !configurando && m.id === seleccionado;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onElegir(m.id)}
              aria-current={activo ? "page" : undefined}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
                activo ? "shadow-sm" : "opacity-85 hover:bg-white/10 hover:opacity-100",
              )}
              style={
                activo
                  ? { backgroundColor: negocio.colorSecundario, color: textoActivo }
                  : undefined
              }
            >
              <IconoModulo modulo={m} className="size-[18px] shrink-0" />
              <span className="truncate">{m.nombre}</span>
            </button>
          );
        })}
      </nav>

      <div className="space-y-1 border-t border-white/15 px-3 py-4">
        <p className="truncate px-3 pb-2 text-xs opacity-70">{usuario.correo}</p>
        {esDueno && (
          <button
            type="button"
            onClick={onConfigurar}
            aria-current={configurando ? "page" : undefined}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors",
              configurando ? "shadow-sm" : "opacity-85 hover:bg-white/10 hover:opacity-100",
            )}
            style={
              configurando
                ? { backgroundColor: negocio.colorSecundario, color: textoActivo }
                : undefined
            }
          >
            <Settings className="size-[18px] shrink-0" />
            Configurar
          </button>
        )}
        <button
          type="button"
          onClick={onSalir}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium opacity-85 transition-colors hover:bg-white/10 hover:opacity-100"
        >
          <LogOut className="size-[18px] shrink-0" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

/* ============================================================
   Gestor
   ============================================================ */

type Vista = { tipo: "datos" } | { tipo: "modulos" } | { tipo: "campos"; modulo: Modulo };

function Gestor({ usuario, negocio }: { usuario: Usuario; negocio: NegocioGuardado }) {
  const navigate = useNavigate();
  const [modulos, setModulos] = useState<Modulo[] | null>(null);
  const [errorModulos, setErrorModulos] = useState<string | null>(null);
  const [seleccionado, setSeleccionado] = useState<number | null>(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [intento, setIntento] = useState(0);
  const [vista, setVista] = useState<Vista>({ tipo: "datos" });

  const salir = () => {
    cerrarSesion();
    navigate({ to: "/login" });
  };

  useEffect(() => {
    let vigente = true;
    setErrorModulos(null);
    listarModulos()
      .then((lista) => {
        if (!vigente) return;
        setModulos(lista);
        // Si el módulo elegido ya no está en el menú (se ocultó o eliminó), pasa al primero.
        setSeleccionado((actual) =>
          actual !== null && lista.some((m) => m.id === actual) ? actual : (lista[0]?.id ?? null),
        );
      })
      .catch((e: unknown) => {
        if (!vigente) return;
        if (e instanceof ApiError && e.status === 401) {
          cerrarSesion();
          navigate({ to: "/login", replace: true });
        } else {
          setErrorModulos(mensajeDeError(e));
        }
      });
    return () => {
      vigente = false;
    };
  }, [intento, navigate]);

  const modulo = modulos?.find((m) => m.id === seleccionado) ?? null;

  const elegir = (id: number) => {
    setSeleccionado(id);
    setVista({ tipo: "datos" });
    setMenuAbierto(false);
  };

  const configurar = () => {
    setVista({ tipo: "modulos" });
    setMenuAbierto(false);
  };

  const barra = (
    <BarraLateral
      usuario={usuario}
      negocio={negocio}
      modulos={modulos}
      seleccionado={seleccionado}
      onElegir={elegir}
      onConfigurar={configurar}
      configurando={vista.tipo !== "datos"}
      onSalir={salir}
    />
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Barra superior solo en pantallas chicas */}
      <header
        className="sticky top-0 z-30 flex h-14 items-center gap-3 px-4 lg:hidden"
        style={{
          backgroundColor: negocio.colorPrimario,
          color: textoSobre(negocio.colorPrimario),
        }}
      >
        <button
          type="button"
          onClick={() => setMenuAbierto(true)}
          aria-label="Abrir menú"
          className="grid size-9 place-items-center rounded-lg hover:bg-white/15"
        >
          <Menu className="size-5" />
        </button>
        <span className="truncate font-bold">{negocio.nombre}</span>
      </header>

      {/* Barra fija en pantallas grandes */}
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-64 lg:block">{barra}</aside>

      {/* Cajón en pantallas chicas */}
      {menuAbierto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuAbierto(false)}
            className="absolute inset-0 bg-black/50"
          />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85%] shadow-xl">
            {barra}
            <button
              type="button"
              onClick={() => setMenuAbierto(false)}
              aria-label="Cerrar menú"
              className="absolute right-3 top-3 grid size-8 place-items-center rounded-lg hover:bg-white/15"
              style={{ color: textoSobre(negocio.colorPrimario) }}
            >
              <X className="size-4" />
            </button>
          </aside>
        </div>
      )}

      <main className="lg:pl-64">
        {errorModulos && (
          <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
            <div
              role="alert"
              className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              <AlertCircle className="size-4 shrink-0" />
              <span className="flex-1">{errorModulos}</span>
              <button
                type="button"
                onClick={() => setIntento((n) => n + 1)}
                className="font-semibold underline underline-offset-2"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {vista.tipo === "datos" && !errorModulos && modulos !== null && modulos.length === 0 && (
          <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
            <p className="font-semibold text-foreground">No tienes módulos disponibles</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Pídele al dueño del negocio que te dé acceso a algún módulo.
            </p>
          </div>
        )}

        {vista.tipo === "modulos" && (
          <ConfigModulos
            negocio={negocio}
            onAbrirCampos={(m) => setVista({ tipo: "campos", modulo: m })}
            onCambio={() => setIntento((n) => n + 1)}
            onSesionVencida={salir}
          />
        )}

        {vista.tipo === "campos" && (
          <ConfigCampos
            key={vista.modulo.id}
            modulo={vista.modulo}
            negocio={negocio}
            onVolver={() => setVista({ tipo: "modulos" })}
            onSesionVencida={salir}
          />
        )}

        {vista.tipo === "datos" && modulo && (
          <VistaModulo
            key={modulo.id}
            modulo={modulo}
            negocio={negocio}
            puedeAgregar={puedeCrearEn(usuario, modulo.id)}
            onSesionVencida={salir}
          />
        )}
      </main>
    </div>
  );
}

/* ============================================================
   Ruta
   ============================================================ */

function Panel() {
  const navigate = useNavigate();
  const { cargando, usuario } = useSesion();

  useEffect(() => {
    if (cargando) return;
    if (!usuario) navigate({ to: "/login", replace: true });
    else if (!usuario.negocio) navigate({ to: "/sistemas", replace: true });
  }, [cargando, usuario, navigate]);

  if (cargando || !usuario || !usuario.negocio) {
    return <div className="min-h-screen bg-background" aria-busy="true" />;
  }

  return <Gestor usuario={usuario} negocio={usuario.negocio} />;
}
