import { EntradaContrasena, ReglasContrasena } from "@/components/gestor/EntradaContrasena";
import { validarConfirmacion } from "@/lib/contrasena";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FormEvent } from "react";
import { AlertaError, EtiquetaMovimiento, claseInput } from "@/components/gestor/comunes";
import {
  Botones,
  Etiqueta,
  RejillaCampos,
  TablaPermisos,
  useEnvio,
} from "@/components/gestor/formularios";
import type { PropsForm } from "@/components/gestor/formularios";
import {
  cambiarContrasena,
  cargarPermisos,
  editarPersonal,
  editarProducto,
  editarRegistro,
  eliminarPersonal,
  eliminarProducto,
  eliminarRegistro,
  reemplazarPermisos,
  valoresDeFila,
  valoresDeRegistro,
} from "@/lib/edicion";
import type { PermisosCargados } from "@/lib/edicion";
import { cargarHistorial, cargarVenta } from "@/lib/consultas";
import type { DetalleDeVenta, HistorialDeProducto } from "@/lib/consultas";
import { formatearCelda, mensajeDeError } from "@/lib/gestor";
import type { Campo, FilaTabla, Modulo } from "@/lib/gestor";
import { cambiarPermiso, validarDatosPersonal } from "@/lib/personal";
import type { Accion } from "@/lib/personal";
import { claveCampo, datosDeRegistro, validarProducto, validarRegistro } from "@/lib/registros";
import type { Valores } from "@/lib/registros";

/** Lo que se puede hacer con una fila ya creada. */
export type TipoAccion = "editar" | "eliminar" | "clave" | "permisos" | "detalle" | "historial";

export interface AccionEnFila {
  tipo: TipoAccion;
  fila: FilaTabla;
}

/** Nombre con el que se identifica la fila en los mensajes ("¿Eliminar Cemento?"). */
export function nombreDeFila(modulo: Modulo, campos: Campo[], fila: FilaTabla): string {
  const celdas = fila.celdas;
  if (modulo.predefinido === "productos")
    return String(celdas["nombreproducto"] ?? "este producto");
  if (modulo.predefinido === "personal") return String(celdas["nombre"] ?? "este empleado");
  if (modulo.predefinido === "ventas") return String(celdas["numero"] ?? "esta venta");
  const primero = campos
    .map((c) => celdas[`c${c.id}`])
    .find((v) => v !== null && v !== undefined && String(v).trim() !== "");
  return primero === undefined ? "este registro" : String(primero);
}

const TITULOS: Record<TipoAccion, string> = {
  editar: "Editar",
  eliminar: "Eliminar",
  clave: "Cambiar contraseña de",
  permisos: "Permisos de",
  detalle: "Detalle de la venta",
  historial: "Historial de",
};

export function PanelAccion({
  accion,
  modulo,
  modulos,
  campos,
  onListo,
  onCancelar,
  onSesionVencida,
}: {
  accion: AccionEnFila;
  modulo: Modulo;
  modulos: Modulo[];
  campos: Campo[];
  /** Mensaje de éxito; la tabla se recarga. */
  onListo: (mensaje: string) => void;
  onCancelar: () => void;
  onSesionVencida: (e: unknown) => boolean;
}) {
  const nombre = nombreDeFila(modulo, campos, accion.fila);
  const comunes = {
    onCancelar,
    onSesionVencida,
  };

  let contenido;
  switch (accion.tipo) {
    case "eliminar":
      contenido = (
        <ConfirmarEliminar
          modulo={modulo}
          fila={accion.fila}
          nombre={nombre}
          onListo={() => onListo(`${nombre} se eliminó.`)}
          {...comunes}
        />
      );
      break;
    case "detalle":
      contenido = <DetalleVenta fila={accion.fila} {...comunes} />;
      break;
    case "historial":
      contenido = <Historial fila={accion.fila} {...comunes} />;
      break;
    case "clave":
      contenido = (
        <FormClave
          fila={accion.fila}
          onListo={() => onListo(`Contraseña de ${nombre} actualizada.`)}
          {...comunes}
        />
      );
      break;
    case "permisos":
      contenido = (
        <FormPermisos
          fila={accion.fila}
          modulos={modulos}
          onListo={() => onListo(`Permisos de ${nombre} guardados.`)}
          {...comunes}
        />
      );
      break;
    default:
      contenido =
        modulo.predefinido === "productos" ? (
          <FormEditarProducto
            campos={campos}
            fila={accion.fila}
            onListo={() => onListo("Producto actualizado.")}
            {...comunes}
          />
        ) : modulo.predefinido === "personal" ? (
          <FormEditarPersonal
            campos={campos}
            fila={accion.fila}
            onListo={() => onListo("Empleado actualizado.")}
            {...comunes}
          />
        ) : (
          <FormEditarRegistro
            modulo={modulo}
            campos={campos}
            fila={accion.fila}
            onListo={() => onListo("Registro actualizado.")}
            {...comunes}
          />
        );
  }

  return (
    <div className="border-t border-border bg-muted/20 px-4 py-5 sm:px-6">
      <h2 className="text-base font-semibold text-foreground">
        {TITULOS[accion.tipo]} {nombre}
      </h2>
      <div className="mt-4">{contenido}</div>
    </div>
  );
}

/* ------------------------------------------------------------
   Eliminar
   ------------------------------------------------------------ */

function ConfirmarEliminar({
  modulo,
  fila,
  nombre,
  onListo,
  onCancelar,
  onSesionVencida,
}: PropsForm & { modulo: Modulo; fila: FilaTabla; nombre: string }) {
  const [error, setError] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);

  const eliminar = async () => {
    if (eliminando) return;
    setEliminando(true);
    setError(null);
    try {
      if (modulo.predefinido === "productos") await eliminarProducto(fila.id);
      else if (modulo.predefinido === "personal") await eliminarPersonal(fila.id);
      else await eliminarRegistro(modulo.id, fila.id);
      onListo();
    } catch (e) {
      setEliminando(false);
      if (!onSesionVencida(e)) setError(mensajeDeError(e));
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground">
        ¿Eliminar <span className="font-semibold">{nombre}</span>? Esta acción no se puede deshacer.
        {modulo.predefinido === "productos" &&
          " Las ventas y movimientos anteriores conservan su historial."}
        {modulo.predefinido === "personal" && " Ya no podrá iniciar sesión."}
      </p>
      {error && <AlertaError mensaje={error} />}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void eliminar()}
          disabled={eliminando}
          className="rounded-full bg-destructive px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {eliminando ? "Eliminando…" : "Sí, eliminar"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          disabled={eliminando}
          className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 disabled:opacity-60"
        >
          No
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Editar
   ------------------------------------------------------------ */

function FormEditarProducto({
  campos,
  fila,
  ...props
}: PropsForm & { campos: Campo[]; fila: FilaTabla }) {
  const [valores, setValores] = useState<Valores>(() => valoresDeFila(campos, fila.celdas));
  const [archivo, setArchivo] = useState<File | null>(null);
  const [quitar, setQuitar] = useState(false);
  const { error, enviando, enviar } = useEnvio(props);
  const urlActual = typeof fila.celdas["imagenurl"] === "string" ? fila.celdas["imagenurl"] : null;

  const alEnviar = (e: FormEvent) => {
    e.preventDefault();
    void enviar(validarProducto(campos, valores), () =>
      editarProducto(fila.id, campos, valores, fila.celdas, { archivo, quitar }),
    );
  };

  return (
    <form onSubmit={alEnviar} noValidate className="space-y-4">
      <RejillaCampos
        campos={campos}
        valores={valores}
        clave={claveCampo}
        onCambio={(k, v) => setValores((a) => ({ ...a, [k]: v }))}
        bloqueado={(c) => c.columna === "stock"}
        imagen={{
          actual: urlActual,
          archivo,
          quitar,
          onArchivo: setArchivo,
          onQuitar: setQuitar,
        }}
      />
      {campos.some((c) => c.columna === "stock") && (
        <p className="text-xs text-muted-foreground">
          El stock no se edita aquí: cambia con los movimientos (entradas, salidas y ajustes).
        </p>
      )}
      {error && <AlertaError mensaje={error} />}
      <Botones enviando={enviando} onCancelar={props.onCancelar} />
    </form>
  );
}

function FormEditarRegistro({
  modulo,
  campos,
  fila,
  ...props
}: PropsForm & { modulo: Modulo; campos: Campo[]; fila: FilaTabla }) {
  const [valores, setValores] = useState<Valores>(() => valoresDeRegistro(campos, fila.celdas));
  const { error, enviando, enviar } = useEnvio(props);

  const alEnviar = (e: FormEvent) => {
    e.preventDefault();
    void enviar(validarRegistro(campos, valores), () =>
      editarRegistro(modulo.id, fila.id, datosDeRegistro(campos, valores)),
    );
  };

  return (
    <form onSubmit={alEnviar} noValidate className="space-y-4">
      <RejillaCampos
        campos={campos}
        valores={valores}
        clave={(c) => `c${c.id}`}
        onCambio={(k, v) => setValores((a) => ({ ...a, [k]: v }))}
      />
      {error && <AlertaError mensaje={error} />}
      <Botones enviando={enviando} onCancelar={props.onCancelar} />
    </form>
  );
}

function FormEditarPersonal({
  campos,
  fila,
  ...props
}: PropsForm & { campos: Campo[]; fila: FilaTabla }) {
  const texto = (k: string) => (fila.celdas[k] === null ? "" : String(fila.celdas[k] ?? ""));
  const [datos, setDatos] = useState({
    nombre: texto("nombre"),
    dni: texto("dni"),
    correo: texto("correo"),
  });
  const { error, enviando, enviar } = useEnvio(props);

  const etiquetaDe = (columna: string, respaldo: string) =>
    campos.find((c) => c.columna === columna)?.nombre ?? respaldo;
  const dniVisible = campos.some((c) => c.columna === "dni");

  const alEnviar = (e: FormEvent) => {
    e.preventDefault();
    void enviar(validarDatosPersonal(datos), () => editarPersonal(fila.id, datos));
  };

  return (
    <form onSubmit={alEnviar} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Etiqueta texto={etiquetaDe("nombre", "Nombre")} obligatorio>
          <input
            type="text"
            aria-label={etiquetaDe("nombre", "Nombre")}
            value={datos.nombre}
            onChange={(e) => setDatos((d) => ({ ...d, nombre: e.target.value }))}
            className={claseInput}
          />
        </Etiqueta>
        {dniVisible && (
          <Etiqueta texto={etiquetaDe("dni", "DNI")}>
            <input
              type="text"
              aria-label={etiquetaDe("dni", "DNI")}
              inputMode="numeric"
              value={datos.dni}
              onChange={(e) => setDatos((d) => ({ ...d, dni: e.target.value }))}
              className={claseInput}
            />
          </Etiqueta>
        )}
        <Etiqueta texto={etiquetaDe("correo", "Correo")} obligatorio>
          <input
            type="email"
            aria-label={etiquetaDe("correo", "Correo")}
            value={datos.correo}
            onChange={(e) => setDatos((d) => ({ ...d, correo: e.target.value }))}
            className={claseInput}
          />
        </Etiqueta>
      </div>
      {error && <AlertaError mensaje={error} />}
      <Botones enviando={enviando} onCancelar={props.onCancelar} />
    </form>
  );
}

/* ------------------------------------------------------------
   Contraseña y permisos de un empleado
   ------------------------------------------------------------ */

function FormClave({ fila, ...props }: PropsForm & { fila: FilaTabla }) {
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const { error, enviando, enviar } = useEnvio(props);

  const alEnviar = (e: FormEvent) => {
    e.preventDefault();
    void enviar(validarConfirmacion(contrasena, confirmar), () =>
      cambiarContrasena(fila.id, contrasena),
    );
  };

  return (
    <form onSubmit={alEnviar} noValidate className="space-y-4">
      <div className="grid max-w-2xl gap-4 sm:grid-cols-2">
        <div>
          <Etiqueta texto="Nueva contraseña" obligatorio>
            <EntradaContrasena
              etiqueta="Nueva contraseña"
              valor={contrasena}
              onCambio={setContrasena}
            />
          </Etiqueta>
          <ReglasContrasena contrasena={contrasena} />
        </div>
        <Etiqueta texto="Confirmar contraseña" obligatorio>
          <EntradaContrasena
            etiqueta="Confirmar contraseña"
            valor={confirmar}
            placeholder="Repite la contraseña"
            onCambio={setConfirmar}
          />
        </Etiqueta>
      </div>
      {error && <AlertaError mensaje={error} />}
      <Botones enviando={enviando} onCancelar={props.onCancelar} />
    </form>
  );
}

function FormPermisos({
  fila,
  modulos,
  ...props
}: PropsForm & { fila: FilaTabla; modulos: Modulo[] }) {
  const [cargados, setCargados] = useState<PermisosCargados | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const { error, enviando, enviar } = useEnvio(props);
  const { onSesionVencida } = props;

  useEffect(() => {
    let vigente = true;
    cargarPermisos(fila.id, modulos)
      .then((c) => vigente && setCargados(c))
      .catch((e: unknown) => {
        if (!vigente || onSesionVencida(e)) return;
        setErrorCarga(mensajeDeError(e));
      });
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fila.id]);

  if (errorCarga) return <AlertaError mensaje={errorCarga} />;
  if (!cargados) return <p className="text-sm text-muted-foreground">Cargando permisos…</p>;

  const cambiar = (idmodulo: number, accion: Accion, valor: boolean) =>
    setCargados((c) =>
      c
        ? {
            ...c,
            filas: c.filas.map((f) =>
              f.idmodulo === idmodulo ? cambiarPermiso(f, accion, valor) : f,
            ),
          }
        : c,
    );

  const alEnviar = (e: FormEvent) => {
    e.preventDefault();
    void enviar({ ok: true }, () =>
      reemplazarPermisos(fila.id, cargados.filas, cargados.conservados),
    );
  };

  return (
    <form onSubmit={alEnviar} noValidate className="space-y-4">
      <TablaPermisos filas={cargados.filas} onCambio={cambiar} />
      {error && <AlertaError mensaje={error} />}
      <Botones enviando={enviando} onCancelar={props.onCancelar} />
    </form>
  );
}

/* ------------------------------------------------------------
   Consultas: detalle de una venta e historial de un producto
   ------------------------------------------------------------ */

function BotonCerrar({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40"
    >
      Cerrar
    </button>
  );
}

function DetalleVenta({
  fila,
  onCancelar,
  onSesionVencida,
}: {
  fila: FilaTabla;
  onCancelar: () => void;
  onSesionVencida: (e: unknown) => boolean;
}) {
  const [venta, setVenta] = useState<DetalleDeVenta | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    cargarVenta(fila.id)
      .then((v) => vigente && setVenta(v))
      .catch((e: unknown) => {
        if (!vigente || onSesionVencida(e)) return;
        setError(mensajeDeError(e));
      });
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fila.id]);

  return (
    <div className="space-y-4">
      {error && <AlertaError mensaje={error} />}
      {!venta && !error && <p className="text-sm text-muted-foreground">Cargando venta…</p>}
      {venta && (
        <>
          <p className="text-sm text-muted-foreground">
            {formatearCelda("fechahora", { fecha: venta.fecha, hora: venta.hora })} · Vendedor:{" "}
            {venta.vendedor}
            {venta.cliente ? ` · Cliente: ${venta.cliente}` : ""}
          </p>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  <th scope="col" className="px-4 py-2.5 text-left font-semibold">
                    Producto
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                    Cantidad
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                    Precio
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right font-semibold">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {venta.lineas.map((l, i) => (
                  <tr key={i} className="border-b border-border/70 last:border-0">
                    <td className="px-4 py-2.5">{l.producto}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{l.cantidad}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatearCelda("dinero", l.precio)}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">
                      {formatearCelda("dinero", l.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-border bg-muted/30 font-semibold">
                  <td colSpan={3} className="px-4 py-2.5 text-right">
                    Total
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {formatearCelda("dinero", venta.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
      <BotonCerrar onClick={onCancelar} />
    </div>
  );
}

function Historial({
  fila,
  onCancelar,
  onSesionVencida,
}: {
  fila: FilaTabla;
  onCancelar: () => void;
  onSesionVencida: (e: unknown) => boolean;
}) {
  const [pagina, setPagina] = useState(0);
  const [datos, setDatos] = useState<HistorialDeProducto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    setDatos(null);
    cargarHistorial(fila.id, pagina)
      .then((h) => vigente && setDatos(h))
      .catch((e: unknown) => {
        if (!vigente || onSesionVencida(e)) return;
        setError(mensajeDeError(e));
      });
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fila.id, pagina]);

  return (
    <div className="space-y-4">
      {error && <AlertaError mensaje={error} />}
      {!datos && !error && <p className="text-sm text-muted-foreground">Cargando historial…</p>}
      {datos && datos.movimientos.length === 0 && (
        <p className="text-sm text-muted-foreground">Este producto todavía no tiene movimientos.</p>
      )}
      {datos && datos.movimientos.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                  {["Fecha", "Tipo", "Cantidad", "Responsable", "Motivo"].map((t, i) => (
                    <th
                      key={t}
                      scope="col"
                      className={`px-4 py-2.5 font-semibold ${i === 2 ? "text-right" : "text-left"}`}
                    >
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {datos.movimientos.map((m) => (
                  <tr key={m.id} className="border-b border-border/70 last:border-0">
                    <td className="px-4 py-2.5">
                      {formatearCelda("fechahora", { fecha: m.fecha, hora: m.hora })}
                    </td>
                    <td className="px-4 py-2.5">
                      <EtiquetaMovimiento tipo={m.tipo} />
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{m.cantidad}</td>
                    <td className="px-4 py-2.5">{m.responsable}</td>
                    <td className="px-4 py-2.5">{formatearCelda("texto", m.motivo)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {datos.paginas > 1 && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <button
                type="button"
                aria-label="Página anterior del historial"
                disabled={pagina === 0}
                onClick={() => setPagina(pagina - 1)}
                className="grid size-8 place-items-center rounded-lg border border-border bg-card text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span>
                Página {pagina + 1} de {datos.paginas}
              </span>
              <button
                type="button"
                aria-label="Página siguiente del historial"
                disabled={pagina + 1 >= datos.paginas}
                onClick={() => setPagina(pagina + 1)}
                className="grid size-8 place-items-center rounded-lg border border-border bg-card text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </>
      )}
      <BotonCerrar onClick={onCancelar} />
    </div>
  );
}
