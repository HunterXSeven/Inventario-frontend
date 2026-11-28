/**
 * Alta de registros: convierte lo que se escribe en el formulario en lo que
 * espera cada endpoint del backend, y valida lo básico antes de enviarlo.
 *
 * - Productos:    POST /productos            (columnas físicas + stockinicial)
 * - Movimientos:  POST /movimientos          (producto, tipo, cantidad, motivo)
 * - Ventas:       POST /ventas               (cliente + items; el total lo calcula la BD)
 * - Personalizados: POST /modulos/{id}/registros  ({ datos: { "idCampo": valor } })
 */
import { api } from "@/lib/api";
import type { Campo } from "@/lib/gestor";
import { subirImagenProducto } from "@/lib/imagenes";

export type Valores = Record<string, string>;

export interface OpcionProducto {
  id: number;
  nombre: string;
  precio: number | null;
  stock: number | null;
}

export type TipoMovimiento = "Entrada" | "Salida" | "Ajuste";
export const TIPOS_MOVIMIENTO: TipoMovimiento[] = ["Entrada", "Salida", "Ajuste"];

export interface LineaVenta {
  idproducto: string;
  cantidad: string;
}

export type Validacion = { ok: true } | { ok: false; error: string };

/* ------------------------------------------------------------
   Conversión de valores
   ------------------------------------------------------------ */

const vacio = (v: string | undefined) => (v ?? "").trim() === "";

/** Número escrito por la persona ("12,5" también vale). null si no es un número. */
export function aNumero(v: string | undefined): number | null {
  if (vacio(v)) return null;
  const n = Number((v as string).trim().replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const esEntero = (n: number) => Number.isInteger(n);

/* ------------------------------------------------------------
   Productos
   ------------------------------------------------------------ */

/** Nombre físico de la columna → clave del formulario (en minúsculas, como el JSON del backend). */
export const claveCampo = (c: Campo): string => (c.columna ?? `c${c.id}`).toLowerCase();

export function validarProducto(campos: Campo[], valores: Valores): Validacion {
  for (const c of campos) {
    const v = valores[claveCampo(c)];
    switch (c.columna) {
      case "nombreProducto":
        if (vacio(v)) return { ok: false, error: `${c.nombre} es obligatorio.` };
        break;
      case "precio": {
        if (vacio(v)) return { ok: false, error: `${c.nombre} es obligatorio.` };
        const n = aNumero(v);
        if (n === null || n < 0)
          return { ok: false, error: `${c.nombre} debe ser un número desde 0.` };
        break;
      }
      case "stock":
      case "stockMinimo": {
        if (vacio(v)) break;
        const n = aNumero(v);
        if (n === null || n < 0 || !esEntero(n))
          return { ok: false, error: `${c.nombre} debe ser un número entero desde 0.` };
        break;
      }
      default:
        break;
    }
  }
  return { ok: true };
}

/** Cuerpo de POST /productos. "Stock" del formulario se envía como stockinicial. */
export function cuerpoProducto(campos: Campo[], valores: Valores): Record<string, unknown> {
  const cuerpo: Record<string, unknown> = {};
  for (const c of campos) {
    const v = (valores[claveCampo(c)] ?? "").trim();
    switch (c.columna) {
      case "nombreProducto":
        cuerpo["nombreproducto"] = v;
        break;
      case "precio":
        if (v) cuerpo["precio"] = aNumero(v);
        break;
      case "stock":
        if (v) cuerpo["stockinicial"] = aNumero(v);
        break;
      case "stockMinimo":
        if (v) cuerpo["stockminimo"] = aNumero(v);
        break;
      case "fechaVencimiento":
        if (v) cuerpo["fechavencimiento"] = v;
        break;
      case "lote":
        if (v) cuerpo["lote"] = v;
        break;
      case "codigoQR":
        if (v) cuerpo["codigoqr"] = v;
        break;
      // La imagen no va en el JSON: se sube aparte (PUT /productos/{id}/imagen).
      default:
        break;
    }
  }
  return cuerpo;
}

/** Crea el producto y, si se eligió una imagen, la sube en un segundo paso con su id. */
export async function crearProducto(
  campos: Campo[],
  valores: Valores,
  imagen?: File | null,
): Promise<void> {
  const creado = await api<{ idproducto: number }>("/productos", {
    metodo: "POST",
    cuerpo: cuerpoProducto(campos, valores),
  });
  if (imagen) {
    try {
      await subirImagenProducto(creado.idproducto, imagen);
    } catch (e) {
      const motivo = e instanceof Error ? e.message : "";
      throw new Error(
        `El producto se creó, pero la imagen no se pudo subir. ${motivo} Edítalo para subirla de nuevo.`.trim(),
      );
    }
  }
}

/* ------------------------------------------------------------
   Productos para elegir (movimientos y ventas)
   ------------------------------------------------------------ */

interface ProductoApi {
  idproducto: number;
  nombreproducto: string;
  precio: number | null;
  stock: number | null;
}

interface PaginaApi<T> {
  contenido: T[];
  paginas: number;
}

/** Todos los productos del sistema (el backend limita a 100 por página). */
export async function listarProductosParaElegir(): Promise<OpcionProducto[]> {
  const opciones: OpcionProducto[] = [];
  let pagina = 0;
  let paginas = 1;
  while (pagina < paginas && pagina < 50) {
    const r = await api<PaginaApi<ProductoApi>>(`/productos?pagina=${pagina}&tamano=100`);
    for (const p of r.contenido) {
      opciones.push({
        id: p.idproducto,
        nombre: p.nombreproducto,
        precio: p.precio,
        stock: p.stock,
      });
    }
    paginas = r.paginas;
    pagina += 1;
  }
  return opciones.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

/* ------------------------------------------------------------
   Movimientos
   ------------------------------------------------------------ */

export interface DatosMovimiento {
  idproducto: string;
  tipo: TipoMovimiento;
  cantidad: string;
  motivo: string;
}

export function validarMovimiento(d: DatosMovimiento): Validacion {
  if (vacio(d.idproducto)) return { ok: false, error: "Elige un producto." };
  const n = aNumero(d.cantidad);
  if (n === null || !esEntero(n))
    return { ok: false, error: "La cantidad debe ser un número entero." };
  if (d.tipo === "Ajuste") {
    if (n < 0) return { ok: false, error: "El stock resultante no puede ser negativo." };
  } else if (n <= 0) {
    return { ok: false, error: "La cantidad debe ser mayor que cero." };
  }
  if (d.motivo.trim().length > 100)
    return { ok: false, error: "El motivo no puede superar los 100 caracteres." };
  return { ok: true };
}

export async function crearMovimiento(d: DatosMovimiento): Promise<void> {
  const motivo = d.motivo.trim();
  await api("/movimientos", {
    metodo: "POST",
    cuerpo: {
      idproducto: Number(d.idproducto),
      tipo: d.tipo,
      cantidad: aNumero(d.cantidad),
      ...(motivo ? { motivo } : {}),
    },
  });
}

/* ------------------------------------------------------------
   Ventas
   ------------------------------------------------------------ */

export function validarVenta(cliente: string, lineas: LineaVenta[]): Validacion {
  if (cliente.trim().length > 100)
    return { ok: false, error: "El cliente no puede superar los 100 caracteres." };
  const usadas = lineas.filter((l) => !(vacio(l.idproducto) && vacio(l.cantidad)));
  if (usadas.length === 0) return { ok: false, error: "Agrega al menos un producto." };
  const vistos = new Set<string>();
  for (const l of usadas) {
    if (vacio(l.idproducto)) return { ok: false, error: "Elige el producto de cada línea." };
    const n = aNumero(l.cantidad);
    if (n === null || !esEntero(n) || n <= 0)
      return { ok: false, error: "Cada cantidad debe ser un número entero mayor que cero." };
    if (vistos.has(l.idproducto))
      return {
        ok: false,
        error: "Un producto aparece dos veces: junta sus cantidades en una línea.",
      };
    vistos.add(l.idproducto);
  }
  return { ok: true };
}

/** Total aproximado con los precios actuales (el definitivo lo calcula la base de datos). */
export function totalEstimado(lineas: LineaVenta[], productos: OpcionProducto[]): number {
  let total = 0;
  for (const l of lineas) {
    const p = productos.find((x) => String(x.id) === l.idproducto);
    const n = aNumero(l.cantidad);
    if (p && p.precio !== null && n !== null && n > 0) total += p.precio * n;
  }
  return total;
}

export async function crearVenta(cliente: string, lineas: LineaVenta[]): Promise<void> {
  const c = cliente.trim();
  const items = lineas
    .filter((l) => !vacio(l.idproducto))
    .map((l) => ({ idproducto: Number(l.idproducto), cantidad: aNumero(l.cantidad) }));
  await api("/ventas", { metodo: "POST", cuerpo: { ...(c ? { cliente: c } : {}), items } });
}

/* ------------------------------------------------------------
   Módulos personalizados
   ------------------------------------------------------------ */

export function validarRegistro(campos: Campo[], valores: Valores): Validacion {
  let alguno = false;
  for (const c of campos) {
    const v = valores[`c${c.id}`];
    if (vacio(v)) continue;
    alguno = true;
    if (c.tipo === "numero") {
      const n = aNumero(v);
      if (n === null || !esEntero(n))
        return { ok: false, error: `${c.nombre} debe ser un número entero.` };
    } else if (c.tipo === "decimal") {
      if (aNumero(v) === null) return { ok: false, error: `${c.nombre} debe ser un número.` };
    } else if ((v ?? "").trim().length > 2000) {
      return { ok: false, error: `${c.nombre} no puede superar 2000 caracteres.` };
    }
  }
  if (!alguno) return { ok: false, error: "Completa al menos un campo." };
  return { ok: true };
}

/** { "idCampo": valor } con cada valor en el tipo que pide el backend. Los vacíos se omiten. */
export function datosDeRegistro(
  campos: Campo[],
  valores: Valores,
): Record<string, string | number> {
  const datos: Record<string, string | number> = {};
  for (const c of campos) {
    const v = (valores[`c${c.id}`] ?? "").trim();
    if (!v) continue;
    datos[String(c.id)] = c.tipo === "numero" || c.tipo === "decimal" ? (aNumero(v) as number) : v;
  }
  return datos;
}

export async function crearRegistro(
  idmodulo: number,
  campos: Campo[],
  valores: Valores,
): Promise<void> {
  await api(`/modulos/${idmodulo}/registros`, {
    metodo: "POST",
    cuerpo: { datos: datosDeRegistro(campos, valores) },
  });
}
