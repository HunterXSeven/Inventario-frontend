import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AlertaError, claseInput } from "@/components/gestor/comunes";
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
import { mensajeDeError } from "@/lib/gestor";
import type { Campo, FilaTabla, Modulo } from "@/lib/gestor";
import { cambiarPermiso, validarContrasena, validarDatosPersonal } from "@/lib/personal";
import type { Accion } from "@/lib/personal";
import { claveCampo, datosDeRegistro, validarProducto, validarRegistro } from "@/lib/registros";
import type { Valores } from "@/lib/registros";

/** Lo que se puede hacer con una fila ya creada. */
export type TipoAccion = "editar" | "eliminar" | "clave" | "permisos";

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
  const { error, enviando, enviar } = useEnvio(props);

  const alEnviar = (e: FormEvent) => {
    e.preventDefault();
    void enviar(validarProducto(campos, valores), () =>
      editarProducto(fila.id, campos, valores, fila.celdas),
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
  const { error, enviando, enviar } = useEnvio(props);

  const alEnviar = (e: FormEvent) => {
    e.preventDefault();
    void enviar(validarContrasena(contrasena), () => cambiarContrasena(fila.id, contrasena));
  };

  return (
    <form onSubmit={alEnviar} noValidate className="space-y-4">
      <div className="max-w-sm">
        <Etiqueta texto="Nueva contraseña" obligatorio>
          <input
            type="password"
            aria-label="Nueva contraseña"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
            className={claseInput}
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
