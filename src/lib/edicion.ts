/**
 * Editar y eliminar filas ya creadas.
 *
 * - Productos:      PUT/DELETE /productos/{id}                (el stock no se toca: solo cambia con movimientos)
 * - Personalizados: PUT/DELETE /modulos/{id}/registros/{id}   (el PUT reemplaza todos los valores)
 * - Personal:       PUT/DELETE /personal/{id}, PUT /personal/{id}/contrasena,
 *                   GET/PUT /personal/{id}/permisos           (el PUT reemplaza la matriz completa)
 *
 * Ventas y movimientos son historial: el backend no los edita ni los elimina.
 */
import { api } from "@/lib/api";
import type { Campo, Modulo } from "@/lib/gestor";
import { claveCampo } from "@/lib/registros";
import type { Valores } from "@/lib/registros";
import { filasIniciales } from "@/lib/personal";
import type { FilaPermiso } from "@/lib/personal";

/** ¿Las filas de este módulo se pueden editar y eliminar? */
export function admiteEdicion(modulo: Modulo): boolean {
  return modulo.predefinido !== "ventas" && modulo.predefinido !== "movimientos";
}

/* ------------------------------------------------------------
   Valores iniciales del formulario a partir de la fila
   ------------------------------------------------------------ */

const comoTexto = (v: unknown): string => (v === null || v === undefined ? "" : String(v));

/** Para fechas el campo <input type="date"> solo entiende yyyy-MM-dd. */
const comoFecha = (v: unknown): string => comoTexto(v).slice(0, 10);

/** Productos y personal: la fila trae el DTO del backend (claves en minúsculas). */
export function valoresDeFila(campos: Campo[], celdas: Record<string, unknown>): Valores {
  const valores: Valores = {};
  for (const c of campos) {
    const clave = claveCampo(c);
    valores[clave] = c.tipo === "fecha" ? comoFecha(celdas[clave]) : comoTexto(celdas[clave]);
  }
  return valores;
}

/* ------------------------------------------------------------
   Productos
   ------------------------------------------------------------ */

const num = (v: string): number | null => {
  const n = Number(v.trim().replace(",", "."));
  return v.trim() !== "" && Number.isFinite(n) ? n : null;
};

/**
 * Cuerpo de PUT /productos/{id}. El backend reemplaza todos los datos, así que se parte
 * de la fila original (para no borrar lo que está oculto) y se pisa con lo editado.
 */
export function cuerpoEdicionProducto(
  campos: Campo[],
  valores: Valores,
  original: Record<string, unknown>,
): Record<string, unknown> {
  const cuerpo: Record<string, unknown> = {
    nombreproducto: original["nombreproducto"] ?? null,
    precio: original["precio"] ?? null,
    stockminimo: original["stockminimo"] ?? null,
    fechavencimiento: original["fechavencimiento"] ?? null,
    lote: original["lote"] ?? null,
    codigoqr: original["codigoqr"] ?? null,
    imagenurl: original["imagenurl"] ?? null,
  };
  for (const c of campos) {
    const v = (valores[claveCampo(c)] ?? "").trim();
    switch (c.columna) {
      case "nombreProducto":
        cuerpo["nombreproducto"] = v;
        break;
      case "precio":
        cuerpo["precio"] = num(v);
        break;
      case "stockMinimo":
        cuerpo["stockminimo"] = num(v);
        break;
      case "fechaVencimiento":
        cuerpo["fechavencimiento"] = v || null;
        break;
      case "lote":
        cuerpo["lote"] = v || null;
        break;
      case "codigoQR":
        cuerpo["codigoqr"] = v || null;
        break;
      case "imagenUrl":
        cuerpo["imagenurl"] = v || null;
        break;
      default:
        break; // "stock" no se edita
    }
  }
  return cuerpo;
}

export async function editarProducto(
  id: string,
  campos: Campo[],
  valores: Valores,
  original: Record<string, unknown>,
): Promise<void> {
  await api(`/productos/${id}`, {
    metodo: "PUT",
    cuerpo: cuerpoEdicionProducto(campos, valores, original),
  });
}

export async function eliminarProducto(id: string): Promise<void> {
  await api(`/productos/${id}`, { metodo: "DELETE" });
}

/* ------------------------------------------------------------
   Módulos personalizados
   ------------------------------------------------------------ */

/** Los valores iniciales de un registro personalizado salen de las celdas `c{idCampo}`. */
export function valoresDeRegistro(campos: Campo[], celdas: Record<string, unknown>): Valores {
  const valores: Valores = {};
  for (const c of campos) {
    const v = celdas[`c${c.id}`];
    valores[`c${c.id}`] = c.tipo === "fecha" ? comoFecha(v) : comoTexto(v);
  }
  return valores;
}

export async function editarRegistro(
  idmodulo: number,
  idregistro: string,
  datos: Record<string, string | number>,
): Promise<void> {
  await api(`/modulos/${idmodulo}/registros/${idregistro}`, {
    metodo: "PUT",
    cuerpo: { datos },
  });
}

export async function eliminarRegistro(idmodulo: number, idregistro: string): Promise<void> {
  await api(`/modulos/${idmodulo}/registros/${idregistro}`, { metodo: "DELETE" });
}

/* ------------------------------------------------------------
   Personal
   ------------------------------------------------------------ */

export async function editarPersonal(
  id: string,
  datos: { nombre: string; dni: string; correo: string },
): Promise<void> {
  const dni = datos.dni.trim();
  await api(`/personal/${id}`, {
    metodo: "PUT",
    cuerpo: {
      nombre: datos.nombre.trim(),
      correo: datos.correo.trim(),
      ...(dni ? { dni } : {}),
    },
  });
}

export async function eliminarPersonal(id: string): Promise<void> {
  await api(`/personal/${id}`, { metodo: "DELETE" });
}

export async function cambiarContrasena(id: string, contrasena: string): Promise<void> {
  await api(`/personal/${id}/contrasena`, { metodo: "PUT", cuerpo: { contrasena } });
}

interface PermisoApi {
  idmodulo: number;
  puedever: boolean;
  puedecrear: boolean;
  puedeeditar: boolean;
  puedeeliminar: boolean;
}

export interface PermisosCargados {
  filas: FilaPermiso[];
  /** Permisos sobre módulos que no están en la matriz (por ejemplo, ocultos): se conservan. */
  conservados: PermisoApi[];
}

/** Matriz del empleado: una fila por módulo, con lo que ya tiene marcado. */
export async function cargarPermisos(
  idpersonal: string,
  modulos: Modulo[],
): Promise<PermisosCargados> {
  const guardados = await api<PermisoApi[]>(`/personal/${idpersonal}/permisos`);
  const filas = filasIniciales(modulos).map((f) => {
    const g = guardados.find((p) => p.idmodulo === f.idmodulo);
    return g
      ? {
          ...f,
          ver: g.puedever,
          crear: g.puedecrear,
          editar: g.puedeeditar,
          eliminar: g.puedeeliminar,
        }
      : f;
  });
  const conservados = guardados.filter((g) => !filas.some((f) => f.idmodulo === g.idmodulo));
  return { filas, conservados };
}

/** PUT de la matriz completa (aunque quede vacía: así se le quitan todos los permisos). */
export async function reemplazarPermisos(
  idpersonal: string,
  filas: FilaPermiso[],
  conservados: PermisoApi[],
): Promise<void> {
  const cuerpo = [
    ...filas
      .filter((f) => f.ver || f.crear || f.editar || f.eliminar)
      .map((f) => ({
        idmodulo: f.idmodulo,
        puedever: f.ver,
        puedecrear: f.crear,
        puedeeditar: f.editar,
        puedeeliminar: f.eliminar,
      })),
    ...conservados.map((c) => ({
      idmodulo: c.idmodulo,
      puedever: c.puedever,
      puedecrear: c.puedecrear,
      puedeeditar: c.puedeeditar,
      puedeeliminar: c.puedeeliminar,
    })),
  ];
  await api(`/personal/${idpersonal}/permisos`, { metodo: "PUT", cuerpo });
}
