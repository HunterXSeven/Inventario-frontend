import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { Plus, Trash2 } from "lucide-react";
import { AlertaError, claseInput } from "@/components/gestor/comunes";
import {
  Botones,
  Etiqueta,
  RejillaCampos,
  TablaPermisos,
  useEnvio,
} from "@/components/gestor/formularios";
import type { PropsForm } from "@/components/gestor/formularios";
import { ApiError } from "@/lib/api";
import { mensajeDeError } from "@/lib/gestor";
import type { Campo, Modulo } from "@/lib/gestor";
import {
  TIPOS_MOVIMIENTO,
  aNumero,
  claveCampo,
  crearMovimiento,
  crearProducto,
  crearRegistro,
  crearVenta,
  listarProductosParaElegir,
  totalEstimado,
  validarMovimiento,
  validarProducto,
  validarRegistro,
  validarVenta,
} from "@/lib/registros";
import {
  cambiarPermiso,
  crearPersonal,
  filasIniciales,
  guardarPermisos,
  validarPersonal,
} from "@/lib/personal";
import type { Accion, FilaPermiso } from "@/lib/personal";
import type {
  LineaVenta,
  OpcionProducto,
  TipoMovimiento,
  Valores,
  Validacion,
} from "@/lib/registros";

const soles = (n: number) => `S/ ${n.toFixed(2)}`;

/* ------------------------------------------------------------
   Contenedor: la fila "Agregar registro" y el formulario que abre
   ------------------------------------------------------------ */

export function AgregarRegistro({
  modulo,
  modulos,
  campos,
  onCreado,
  onSesionVencida,
}: {
  modulo: Modulo;
  /** Módulos del menú: Personal los usa para elegir los permisos. */
  modulos: Modulo[];
  campos: Campo[];
  /** Se llama tras guardar, para recargar la tabla. */
  onCreado: () => void;
  onSesionVencida: (e: unknown) => boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  if (!abierto) {
    return (
      <div className="border-t border-border">
        {aviso && (
          <p role="status" className="px-4 pt-3 text-sm font-medium text-primary">
            {aviso}
          </p>
        )}
        <button
          type="button"
          onClick={() => {
            setAviso(null);
            setAbierto(true);
          }}
          className="flex w-full items-center gap-2 px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
        >
          <Plus className="size-4" />
          Agregar registro
        </button>
      </div>
    );
  }

  const terminar = (mensaje: string | null) => {
    setAbierto(false);
    setAviso(mensaje);
    if (mensaje) onCreado();
  };

  return (
    <div className="border-t border-border bg-muted/20 px-4 py-5 sm:px-6">
      <h2 className="text-base font-semibold text-foreground">Nuevo registro en {modulo.nombre}</h2>
      <div className="mt-4">
        {modulo.predefinido === "productos" ? (
          <FormProducto
            campos={campos}
            onListo={() => terminar("Producto agregado.")}
            onCancelar={() => terminar(null)}
            onSesionVencida={onSesionVencida}
          />
        ) : modulo.predefinido === "movimientos" ? (
          <FormMovimiento
            onListo={() => terminar("Movimiento registrado.")}
            onCancelar={() => terminar(null)}
            onSesionVencida={onSesionVencida}
          />
        ) : modulo.predefinido === "ventas" ? (
          <FormVenta
            clienteVisible={campos.some((c) => c.columna === "cliente")}
            onListo={() => terminar("Venta registrada.")}
            onCancelar={() => terminar(null)}
            onSesionVencida={onSesionVencida}
          />
        ) : modulo.predefinido === "personal" ? (
          <FormPersonal
            campos={campos}
            modulos={modulos}
            onListo={() => terminar("Empleado registrado.")}
            onCancelar={() => terminar(null)}
            onSesionVencida={onSesionVencida}
          />
        ) : (
          <FormPersonalizado
            modulo={modulo}
            campos={campos}
            onListo={() => terminar("Registro agregado.")}
            onCancelar={() => terminar(null)}
            onSesionVencida={onSesionVencida}
          />
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------
   Productos
   ------------------------------------------------------------ */

function FormProducto({ campos, ...props }: PropsForm & { campos: Campo[] }) {
  const [valores, setValores] = useState<Valores>({});
  const { error, enviando, enviar } = useEnvio(props);

  const alEnviar = (e: FormEvent) => {
    e.preventDefault();
    void enviar(validarProducto(campos, valores), () => crearProducto(campos, valores));
  };

  return (
    <form onSubmit={alEnviar} noValidate className="space-y-4">
      <RejillaCampos
        campos={campos}
        valores={valores}
        clave={claveCampo}
        onCambio={(k, v) => setValores((a) => ({ ...a, [k]: v }))}
      />
      {error && <AlertaError mensaje={error} />}
      <Botones enviando={enviando} onCancelar={props.onCancelar} />
    </form>
  );
}

/* ------------------------------------------------------------
   Productos para elegir (compartido por movimientos y ventas)
   ------------------------------------------------------------ */

type Productos =
  | { estado: "cargando" }
  | { estado: "error"; mensaje: string }
  | { estado: "listo"; lista: OpcionProducto[] };

function useProductos(onSesionVencida: (e: unknown) => boolean): Productos {
  const [productos, setProductos] = useState<Productos>({ estado: "cargando" });
  useEffect(() => {
    let vigente = true;
    listarProductosParaElegir()
      .then((lista) => vigente && setProductos({ estado: "listo", lista }))
      .catch((e: unknown) => {
        if (!vigente || onSesionVencida(e)) return;
        setProductos({
          estado: "error",
          mensaje:
            e instanceof ApiError && e.status === 403
              ? "Para elegir productos necesitas también permiso de ver el módulo Productos. Pídeselo al dueño."
              : mensajeDeError(e),
        });
      });
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return productos;
}

function SinProductos({ productos }: { productos: Productos }) {
  if (productos.estado === "cargando")
    return <p className="text-sm text-muted-foreground">Cargando productos…</p>;
  if (productos.estado === "error") return <AlertaError mensaje={productos.mensaje} />;
  if (productos.lista.length === 0)
    return (
      <p className="text-sm text-muted-foreground">
        Primero agrega al menos un producto en el módulo Productos.
      </p>
    );
  return null;
}

function SelectorProducto({
  valor,
  lista,
  onCambio,
  etiqueta,
}: {
  valor: string;
  lista: OpcionProducto[];
  onCambio: (v: string) => void;
  etiqueta: string;
}) {
  return (
    <select
      aria-label={etiqueta}
      value={valor}
      onChange={(e) => onCambio(e.target.value)}
      className={claseInput}
    >
      <option value="">Elige un producto…</option>
      {lista.map((p) => (
        <option key={p.id} value={String(p.id)}>
          {p.nombre}
          {p.stock !== null ? ` (stock ${p.stock})` : ""}
        </option>
      ))}
    </select>
  );
}

/* ------------------------------------------------------------
   Movimientos
   ------------------------------------------------------------ */

function FormMovimiento(props: PropsForm) {
  const productos = useProductos(props.onSesionVencida);
  const [idproducto, setIdproducto] = useState("");
  const [tipo, setTipo] = useState<TipoMovimiento>("Entrada");
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");
  const { error, enviando, enviar } = useEnvio(props);

  const datos = { idproducto, tipo, cantidad, motivo };
  const alEnviar = (e: FormEvent) => {
    e.preventDefault();
    void enviar(validarMovimiento(datos), () => crearMovimiento(datos));
  };

  const hayProductos = productos.estado === "listo" && productos.lista.length > 0;

  return (
    <form onSubmit={alEnviar} noValidate className="space-y-4">
      <SinProductos productos={productos} />
      {hayProductos && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Etiqueta texto="Producto" obligatorio>
            <SelectorProducto
              etiqueta="Producto"
              valor={idproducto}
              lista={productos.lista}
              onCambio={setIdproducto}
            />
          </Etiqueta>
          <Etiqueta texto="Tipo" obligatorio>
            <select
              aria-label="Tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoMovimiento)}
              className={claseInput}
            >
              {TIPOS_MOVIMIENTO.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Etiqueta>
          <Etiqueta texto={tipo === "Ajuste" ? "Stock resultante" : "Cantidad"} obligatorio>
            <input
              type="number"
              min={0}
              step={1}
              aria-label={tipo === "Ajuste" ? "Stock resultante" : "Cantidad"}
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className={claseInput}
            />
          </Etiqueta>
          <Etiqueta texto="Motivo">
            <input
              type="text"
              aria-label="Motivo"
              maxLength={100}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className={claseInput}
            />
          </Etiqueta>
        </div>
      )}
      {hayProductos && tipo === "Ajuste" && (
        <p className="text-xs text-muted-foreground">
          En un ajuste indicas cuántas unidades quedan en total, no cuántas suman o restan.
        </p>
      )}
      {error && <AlertaError mensaje={error} />}
      <Botones enviando={enviando} onCancelar={props.onCancelar} />
    </form>
  );
}

/* ------------------------------------------------------------
   Ventas
   ------------------------------------------------------------ */

function FormVenta({ clienteVisible, ...props }: PropsForm & { clienteVisible: boolean }) {
  const productos = useProductos(props.onSesionVencida);
  const [cliente, setCliente] = useState("");
  const [lineas, setLineas] = useState<LineaVenta[]>([{ idproducto: "", cantidad: "1" }]);
  const { error, enviando, enviar } = useEnvio(props);

  const cambiarLinea = (i: number, cambio: Partial<LineaVenta>) =>
    setLineas((ls) => ls.map((l, j) => (j === i ? { ...l, ...cambio } : l)));

  const alEnviar = (e: FormEvent) => {
    e.preventDefault();
    void enviar(validarVenta(cliente, lineas), () => crearVenta(cliente, lineas));
  };

  const hayProductos = productos.estado === "listo" && productos.lista.length > 0;
  const total = hayProductos ? totalEstimado(lineas, productos.lista) : 0;

  return (
    <form onSubmit={alEnviar} noValidate className="space-y-4">
      <SinProductos productos={productos} />
      {hayProductos && (
        <>
          {clienteVisible && (
            <div className="max-w-sm">
              <Etiqueta texto="Cliente">
                <input
                  type="text"
                  aria-label="Cliente"
                  maxLength={100}
                  value={cliente}
                  onChange={(e) => setCliente(e.target.value)}
                  className={claseInput}
                />
              </Etiqueta>
            </div>
          )}

          <div className="space-y-3">
            {lineas.map((l, i) => {
              const p = productos.lista.find((x) => String(x.id) === l.idproducto);
              const n = aNumero(l.cantidad);
              return (
                <div key={i} className="flex flex-wrap items-end gap-3">
                  <div className="min-w-[14rem] flex-1">
                    <Etiqueta texto={i === 0 ? "Producto" : ""}>
                      <SelectorProducto
                        etiqueta={`Producto ${i + 1}`}
                        valor={l.idproducto}
                        lista={productos.lista}
                        onCambio={(v) => cambiarLinea(i, { idproducto: v })}
                      />
                    </Etiqueta>
                  </div>
                  <div className="w-28">
                    <Etiqueta texto={i === 0 ? "Cantidad" : ""}>
                      <input
                        type="number"
                        min={1}
                        step={1}
                        aria-label={`Cantidad ${i + 1}`}
                        value={l.cantidad}
                        onChange={(e) => cambiarLinea(i, { cantidad: e.target.value })}
                        className={claseInput}
                      />
                    </Etiqueta>
                  </div>
                  <p className="w-24 pb-2 text-right text-sm text-muted-foreground">
                    {p && p.precio !== null && n !== null && n > 0 ? soles(p.precio * n) : "—"}
                  </p>
                  <button
                    type="button"
                    title="Quitar línea"
                    aria-label={`Quitar línea ${i + 1}`}
                    disabled={lineas.length === 1}
                    onClick={() => setLineas((ls) => ls.filter((_, j) => j !== i))}
                    className="mb-0.5 grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors enabled:hover:border-destructive/40 enabled:hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setLineas((ls) => [...ls, { idproducto: "", cantidad: "1" }])}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
            >
              <Plus className="size-4" />
              Agregar otro producto
            </button>
            <p className="text-sm text-muted-foreground">
              Total estimado: <span className="font-semibold text-foreground">{soles(total)}</span>
              <span className="ml-1 text-xs">(el total final lo calcula el sistema)</span>
            </p>
          </div>
        </>
      )}
      {error && <AlertaError mensaje={error} />}
      <Botones enviando={enviando} onCancelar={props.onCancelar} />
    </form>
  );
}

/* ------------------------------------------------------------
   Módulos personalizados
   ------------------------------------------------------------ */

function FormPersonalizado({
  modulo,
  campos,
  ...props
}: PropsForm & { modulo: Modulo; campos: Campo[] }) {
  const [valores, setValores] = useState<Valores>({});
  const { error, enviando, enviar } = useEnvio(props);

  const alEnviar = (e: FormEvent) => {
    e.preventDefault();
    void enviar(validarRegistro(campos, valores), () => crearRegistro(modulo.id, campos, valores));
  };

  if (campos.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Este módulo todavía no tiene campos. Agrégalos desde Configurar.
        </p>
        <button
          type="button"
          onClick={props.onCancelar}
          className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40"
        >
          Cerrar
        </button>
      </div>
    );
  }

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

/* ------------------------------------------------------------
   Personal: datos de la cuenta + permisos por módulo
   ------------------------------------------------------------ */

function FormPersonal({
  campos,
  modulos,
  ...props
}: PropsForm & { campos: Campo[]; modulos: Modulo[] }) {
  const [datos, setDatos] = useState({ nombre: "", dni: "", correo: "", contrasena: "" });
  const [filas, setFilas] = useState<FilaPermiso[]>(() => filasIniciales(modulos));
  // Si el empleado se creó pero fallaron los permisos, un reintento no lo crea otra vez.
  const [creadoId, setCreadoId] = useState<number | null>(null);
  const { error, enviando, enviar } = useEnvio(props);

  const etiquetaDe = (columna: string, respaldo: string) =>
    campos.find((c) => c.columna === columna)?.nombre ?? respaldo;
  const dniVisible = campos.some((c) => c.columna === "dni");

  const cambiar = (idmodulo: number, accion: Accion, valor: boolean) =>
    setFilas((fs) =>
      fs.map((f) => (f.idmodulo === idmodulo ? cambiarPermiso(f, accion, valor) : f)),
    );

  const alEnviar = (e: FormEvent) => {
    e.preventDefault();
    void enviar(creadoId === null ? validarPersonal(datos) : { ok: true }, async () => {
      let id = creadoId;
      if (id === null) {
        id = await crearPersonal(datos);
        setCreadoId(id);
      }
      try {
        await guardarPermisos(id, filas);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) throw err;
        throw new ApiError(
          0,
          `El empleado ya se registró, pero no pudimos guardar sus permisos: ${mensajeDeError(err)} Pulsa Guardar para reintentar.`,
        );
      }
    });
  };

  const bloqueado = creadoId !== null;

  return (
    <form onSubmit={alEnviar} noValidate className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Etiqueta texto={etiquetaDe("nombre", "Nombre")} obligatorio>
          <input
            type="text"
            aria-label={etiquetaDe("nombre", "Nombre")}
            value={datos.nombre}
            disabled={bloqueado}
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
              disabled={bloqueado}
              onChange={(e) => setDatos((d) => ({ ...d, dni: e.target.value }))}
              className={claseInput}
            />
          </Etiqueta>
        )}
        <Etiqueta texto={etiquetaDe("correo", "Correo")} obligatorio>
          <input
            type="email"
            aria-label={etiquetaDe("correo", "Correo")}
            autoComplete="off"
            value={datos.correo}
            disabled={bloqueado}
            onChange={(e) => setDatos((d) => ({ ...d, correo: e.target.value }))}
            className={claseInput}
          />
        </Etiqueta>
        <Etiqueta texto="Contraseña" obligatorio>
          <input
            type="password"
            aria-label="Contraseña"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            value={datos.contrasena}
            disabled={bloqueado}
            onChange={(e) => setDatos((d) => ({ ...d, contrasena: e.target.value }))}
            className={claseInput}
          />
        </Etiqueta>
      </div>

      <TablaPermisos filas={filas} onCambio={cambiar} />

      {error && <AlertaError mensaje={error} />}
      <Botones enviando={enviando} onCancelar={props.onCancelar} />
    </form>
  );
}
