import { api, ApiError } from "@/lib/api";

/**
 * Datos del gestor de inventario: menú de módulos, campos y listados.
 *
 * Los cuatro módulos predefinidos (productos, personal, ventas, movimientos)
 * viven en tablas propias; los módulos personalizados guardan sus valores en
 * Registros.datos con la forma {"idCampo": valor}. Aquí todos se convierten en
 * la misma estructura de tabla (columnas + filas) para dibujarlos igual.
 */

export const TAMANO_PAGINA = 20;

export type TipoCampo = "texto" | "numero" | "decimal" | "fecha" | "imagen";
export type Predefinido = "productos" | "personal" | "ventas" | "movimientos";

export interface Modulo {
  id: number;
  nombre: string;
  predefinido: Predefinido | null;
  ocultable: boolean;
  visible: boolean;
}

export interface Campo {
  id: number;
  nombre: string;
  tipo: TipoCampo;
  /** Columna física en módulos predefinidos; null en campos personalizados. */
  columna: string | null;
  orden: number;
  /** Se puede usar para filtrar los registros de un módulo personalizado. */
  filtrable: boolean;
}

/** Cómo se dibuja una celda. */
export type TipoColumna =
  "texto" | "numero" | "dinero" | "fecha" | "fechahora" | "imagen" | "movimiento";

export interface ColumnaTabla {
  clave: string;
  titulo: string;
  tipo: TipoColumna;
}

export interface FilaTabla {
  id: string;
  celdas: Record<string, unknown>;
  /** Producto con stock en el mínimo o por debajo. */
  alerta?: boolean;
}

export interface TablaDatos {
  columnas: ColumnaTabla[];
  filas: FilaTabla[];
  pagina: number;
  paginas: number;
  total: number;
}

/* ------------------------------------------------------------
   Formas de las respuestas del backend (ver Dtos.java)
   ------------------------------------------------------------ */

interface ModuloApi {
  idmodulo: number;
  nombremodulo: string;
  predefinido: Predefinido | null;
  ocultable: boolean;
  visible: boolean;
}

interface CampoApi {
  idcampo: number;
  nombrecampo: string;
  tipocampo: TipoCampo;
  columna: string | null;
  orden: number | null;
  filtrable?: boolean;
}

interface PaginaApi<T> {
  contenido: T[];
  pagina: number;
  tamano: number;
  total: number;
  paginas: number;
}

interface ProductoApi {
  idproducto: number;
  stock: number | null;
  stockminimo: number | null;
  [campo: string]: unknown;
}

interface PersonalApi {
  idpersonal: number;
  [campo: string]: unknown;
}

interface VentaApi {
  idventa: number;
  personal: string | null;
  cliente: string | null;
  total: number;
  fecha: string;
  hora: string;
}

interface MovimientoApi {
  idmovimiento: number;
  producto: string | null;
  personal: string | null;
  tipo: string;
  cantidad: number;
  fecha: string;
  hora: string;
  motivo: string;
}

interface RegistroApi {
  idregistro: number;
  datos: Record<string, unknown>;
}

/* ------------------------------------------------------------
   Módulos y campos
   ------------------------------------------------------------ */

/** Menú del gestor: los módulos visibles que esta cuenta puede ver. */
export async function listarModulos(): Promise<Modulo[]> {
  const lista = await api<ModuloApi[]>("/modulos");
  return lista.map((m) => ({
    id: m.idmodulo,
    nombre: m.nombremodulo,
    predefinido: m.predefinido,
    ocultable: m.ocultable,
    visible: m.visible,
  }));
}

/** Campos visibles de un módulo, en el orden configurado. */
export async function listarCampos(idmodulo: number): Promise<Campo[]> {
  const lista = await api<CampoApi[]>(`/modulos/${idmodulo}/campos`);
  return lista
    .map((c) => ({
      id: c.idcampo,
      nombre: c.nombrecampo,
      tipo: c.tipocampo,
      columna: c.columna,
      orden: c.orden ?? 0,
      filtrable: c.filtrable === true,
    }))
    .sort((a, b) => a.orden - b.orden || a.id - b.id);
}

/* ------------------------------------------------------------
   Columnas
   ------------------------------------------------------------ */

const tipoColumnaDe: Record<TipoCampo, TipoColumna> = {
  texto: "texto",
  numero: "numero",
  decimal: "dinero",
  fecha: "fecha",
  imagen: "imagen",
};

/**
 * En los predefinidos `columna` es el nombre físico (nombreProducto, stockMinimo…)
 * y el JSON del backend usa ese mismo nombre en minúsculas.
 */
const claveDeColumna = (columna: string) => columna.toLowerCase();

function columnasDeCampos(campos: Campo[], usarColumna: boolean): ColumnaTabla[] {
  return campos.map((c) => ({
    clave: usarColumna && c.columna ? claveDeColumna(c.columna) : `c${c.id}`,
    titulo: c.nombre,
    tipo: tipoColumnaDe[c.tipo] ?? "texto",
  }));
}

/* ------------------------------------------------------------
   Listados
   ------------------------------------------------------------ */

const consulta = (pagina: number) => `?pagina=${pagina}&tamano=${TAMANO_PAGINA}`;

/** Filtro por un campo de un módulo personalizado (solo campos marcados como filtrables). */
export interface FiltroCampo {
  idcampo: number;
  tipo: TipoCampo;
  /** Texto exacto (campos de texto). */
  valor: string;
  /** Rango: mínimo/máximo (números) o desde/hasta (fechas yyyy-MM-dd). */
  desde: string;
  hasta: string;
}

/** Lo que se pide además de la página: rango de fechas, stock bajo o filtro de campo. */
export interface Consulta {
  /** Ventas y movimientos (yyyy-MM-dd). Sin fechas, el backend devuelve solo las de hoy. */
  desde?: string;
  hasta?: string;
  /** Productos con stock en el mínimo o por debajo. */
  stockBajo?: boolean;
  filtro?: FiltroCampo | null;
}

export const sinConsulta: Consulta = {};

export const hayConsulta = (c: Consulta): boolean =>
  !!c.desde || !!c.hasta || !!c.stockBajo || !!c.filtro;

function conFechas(base: string, c: Consulta): string {
  const extra = [c.desde ? `desde=${c.desde}` : "", c.hasta ? `hasta=${c.hasta}` : ""]
    .filter(Boolean)
    .join("&");
  return extra ? `${base}&${extra}` : base;
}

const MINIMO = "-99999999999999";
const MAXIMO = "99999999999999";

/** Ruta del listado de un módulo personalizado, con o sin filtro por campo. */
export function rutaRegistros(idmodulo: number, numeroPagina: number, f?: FiltroCampo | null) {
  const base = `/modulos/${idmodulo}/registros`;
  if (!f) return `${base}${consulta(numeroPagina)}`;
  const comun = `idcampo=${f.idcampo}&pagina=${numeroPagina}&tamano=${TAMANO_PAGINA}`;
  switch (f.tipo) {
    case "numero":
    case "decimal":
      return `${base}/filtro/numerico?${comun}&min=${f.desde.trim() || MINIMO}&max=${f.hasta.trim() || MAXIMO}`;
    case "fecha":
      return `${base}/filtro/fecha?${comun}&desde=${f.desde || "1900-01-01"}T00:00:00&hasta=${f.hasta || "2999-12-31"}T23:59:59`;
    default:
      return `${base}/filtro/texto?${comun}&valor=${encodeURIComponent(f.valor.trim())}`;
  }
}

function pagina<T>(
  p: PaginaApi<T>,
  columnas: ColumnaTabla[],
  aFila: (x: T) => FilaTabla,
): TablaDatos {
  return {
    columnas,
    filas: p.contenido.map(aFila),
    pagina: p.pagina,
    paginas: Math.max(1, p.paginas),
    total: p.total,
  };
}

/** Carga una página de datos del módulo, ya lista para dibujar como tabla. */
export async function cargarTabla(
  modulo: Modulo,
  campos: Campo[],
  numeroPagina: number,
  extra: Consulta = sinConsulta,
): Promise<TablaDatos> {
  switch (modulo.predefinido) {
    case "productos": {
      const aFila = (x: ProductoApi): FilaTabla => ({
        id: String(x.idproducto),
        celdas: x,
        alerta: x.stock !== null && x.stockminimo !== null && x.stock <= x.stockminimo,
      });
      if (extra.stockBajo) {
        // El backend devuelve esta lista completa, sin paginar.
        const lista = await api<ProductoApi[]>("/productos/stockbajo");
        return {
          columnas: columnasDeCampos(campos, true),
          filas: lista.map(aFila),
          pagina: 0,
          paginas: 1,
          total: lista.length,
        };
      }
      const p = await api<PaginaApi<ProductoApi>>(`/productos${consulta(numeroPagina)}`);
      return pagina(p, columnasDeCampos(campos, true), aFila);
    }

    case "personal": {
      // El backend devuelve todo el personal de una vez, sin paginar.
      const lista = await api<PersonalApi[]>("/personal");
      const columnas = columnasDeCampos(campos, true);
      return {
        columnas,
        filas: lista.map((x) => ({ id: String(x.idpersonal), celdas: x })),
        pagina: 0,
        paginas: 1,
        total: lista.length,
      };
    }

    case "ventas": {
      const p = await api<PaginaApi<VentaApi>>(
        conFechas(`/ventas${consulta(numeroPagina)}`, extra),
      );
      const columnas: ColumnaTabla[] = [
        { clave: "numero", titulo: "N° venta", tipo: "texto" },
        { clave: "fecha", titulo: "Fecha", tipo: "fechahora" },
      ];
      // "Cliente" es un campo que el dueño puede ocultar.
      if (campos.some((c) => c.columna === "cliente")) {
        columnas.push({
          clave: "cliente",
          titulo: nombreDe(campos, "cliente", "Cliente"),
          tipo: "texto",
        });
      }
      columnas.push(
        { clave: "vendedor", titulo: "Vendedor", tipo: "texto" },
        { clave: "total", titulo: "Total", tipo: "dinero" },
      );
      return pagina(p, columnas, (v) => ({
        id: String(v.idventa),
        celdas: {
          numero: `V-${String(v.idventa).padStart(4, "0")}`,
          fecha: { fecha: v.fecha, hora: v.hora },
          cliente: v.cliente,
          vendedor: v.personal ?? "Administrador",
          total: v.total,
        },
      }));
    }

    case "movimientos": {
      const p = await api<PaginaApi<MovimientoApi>>(
        conFechas(`/movimientos${consulta(numeroPagina)}`, extra),
      );
      const columnas: ColumnaTabla[] = [
        { clave: "fecha", titulo: "Fecha", tipo: "fechahora" },
        { clave: "producto", titulo: "Producto", tipo: "texto" },
        { clave: "tipo", titulo: "Tipo", tipo: "movimiento" },
        { clave: "cantidad", titulo: "Cantidad", tipo: "numero" },
        { clave: "responsable", titulo: "Responsable", tipo: "texto" },
        { clave: "motivo", titulo: "Motivo", tipo: "texto" },
      ];
      return pagina(p, columnas, (m) => ({
        id: String(m.idmovimiento),
        celdas: {
          fecha: { fecha: m.fecha, hora: m.hora },
          producto: m.producto,
          tipo: m.tipo,
          cantidad: m.cantidad,
          responsable: m.personal ?? "Administrador",
          motivo: m.motivo,
        },
      }));
    }

    default: {
      // Módulo personalizado: los valores viven en datos["idCampo"].
      const p = await api<PaginaApi<RegistroApi>>(
        rutaRegistros(modulo.id, numeroPagina, extra.filtro),
      );
      return pagina(p, columnasDeCampos(campos, false), (r) => ({
        id: String(r.idregistro),
        celdas: Object.fromEntries(campos.map((c) => [`c${c.id}`, r.datos[String(c.id)]])),
      }));
    }
  }
}

function nombreDe(campos: Campo[], columna: string, respaldo: string): string {
  return campos.find((c) => c.columna === columna)?.nombre ?? respaldo;
}

/* ------------------------------------------------------------
   Formato de celdas
   ------------------------------------------------------------ */

const dinero = new Intl.NumberFormat("es-PE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** "2026-11-27" (o "2026-11-27T10:00:00") → "27/11/2026", sin pasar por Date para no mover el día por zona horaria. */
export function formatearFecha(valor: unknown): string {
  if (typeof valor !== "string") return "—";
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(valor);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : valor;
}

/** "13:45:09" → "13:45". */
export function formatearHora(valor: unknown): string {
  if (typeof valor !== "string") return "";
  const m = /^(\d{2}):(\d{2})/.exec(valor);
  return m ? `${m[1]}:${m[2]}` : valor;
}

/** Texto plano de una celda (las imágenes y etiquetas se dibujan aparte). */
export function formatearCelda(tipo: TipoColumna, valor: unknown): string {
  if (valor === null || valor === undefined || valor === "") return "—";
  switch (tipo) {
    case "dinero": {
      const n = Number(valor);
      return Number.isNaN(n) ? String(valor) : `S/ ${dinero.format(n)}`;
    }
    case "numero": {
      const n = Number(valor);
      return Number.isNaN(n) ? String(valor) : String(n);
    }
    case "fecha":
      return formatearFecha(valor);
    case "fechahora": {
      if (typeof valor === "object" && valor !== null && "fecha" in valor) {
        const { fecha, hora } = valor as { fecha: unknown; hora: unknown };
        return `${formatearFecha(fecha)} ${formatearHora(hora)}`.trim();
      }
      return formatearFecha(valor);
    }
    default:
      return String(valor);
  }
}

export function mensajeDeError(e: unknown): string {
  return e instanceof ApiError ? e.message : "Ocurrió un error inesperado. Inténtalo de nuevo.";
}
