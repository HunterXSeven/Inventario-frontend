/**
 * Consultas de detalle:
 * - GET /ventas/{id}                 → la venta con sus líneas
 * - GET /movimientos/producto/{id}   → historial (kardex) de un producto, paginado
 */
import { api } from "@/lib/api";
import { TAMANO_PAGINA } from "@/lib/gestor";

export interface LineaDeVenta {
  producto: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface DetalleDeVenta {
  numero: string;
  fecha: string;
  hora: string;
  cliente: string | null;
  vendedor: string;
  total: number;
  lineas: LineaDeVenta[];
}

interface VentaApi {
  idventa: number;
  personal: string | null;
  cliente: string | null;
  total: number;
  fecha: string;
  hora: string;
  detalles: {
    producto: string;
    cantidad: number;
    preciounitario: number;
    subtotal: number;
  }[];
}

export async function cargarVenta(id: string): Promise<DetalleDeVenta> {
  const v = await api<VentaApi>(`/ventas/${id}`);
  return {
    numero: `V-${String(v.idventa).padStart(4, "0")}`,
    fecha: v.fecha,
    hora: v.hora,
    cliente: v.cliente,
    vendedor: v.personal ?? "Administrador",
    total: v.total,
    lineas: (v.detalles ?? []).map((d) => ({
      producto: d.producto,
      cantidad: d.cantidad,
      precio: d.preciounitario,
      subtotal: d.subtotal,
    })),
  };
}

export interface MovimientoDeProducto {
  id: number;
  fecha: string;
  hora: string;
  tipo: string;
  cantidad: number;
  responsable: string;
  motivo: string;
}

export interface HistorialDeProducto {
  movimientos: MovimientoDeProducto[];
  pagina: number;
  paginas: number;
  total: number;
}

interface PaginaMovimientosApi {
  contenido: {
    idmovimiento: number;
    personal: string | null;
    tipo: string;
    cantidad: number;
    fecha: string;
    hora: string;
    motivo: string;
  }[];
  pagina: number;
  paginas: number;
  total: number;
}

export async function cargarHistorial(
  idproducto: string,
  pagina: number,
): Promise<HistorialDeProducto> {
  const p = await api<PaginaMovimientosApi>(
    `/movimientos/producto/${idproducto}?pagina=${pagina}&tamano=${TAMANO_PAGINA}`,
  );
  return {
    movimientos: p.contenido.map((m) => ({
      id: m.idmovimiento,
      fecha: m.fecha,
      hora: m.hora,
      tipo: m.tipo,
      cantidad: m.cantidad,
      responsable: m.personal ?? "Administrador",
      motivo: m.motivo,
    })),
    pagina: p.pagina,
    paginas: Math.max(1, p.paginas),
    total: p.total,
  };
}
