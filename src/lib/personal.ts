/**
 * Alta de personal con sus permisos.
 *
 * - POST /personal                      → crea al empleado (solo el dueño) y devuelve su id
 * - PUT  /personal/{id}/permisos        → reemplaza la matriz completa de permisos
 *
 * Regla del backend: para crear, editar o eliminar en un módulo también hay que poder verlo.
 */
import { api } from "@/lib/api";
import type { Modulo } from "@/lib/gestor";
import type { Validacion } from "@/lib/registros";
import { validarConfirmacion, validarContrasena } from "@/lib/contrasena";

export type Accion = "ver" | "crear" | "editar" | "eliminar";
export const ACCIONES: Accion[] = ["ver", "crear", "editar", "eliminar"];

export interface FilaPermiso {
  idmodulo: number;
  nombre: string;
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
}

export interface DatosPersonal {
  nombre: string;
  dni: string;
  correo: string;
  contrasena: string;
}

const REGEX_CORREO = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Módulos sobre los que se puede dar permisos: todos menos Personal (solo el dueño lo gestiona). */
export function filasIniciales(modulos: Modulo[]): FilaPermiso[] {
  return modulos
    .filter((m) => m.predefinido !== "personal")
    .map((m) => ({
      idmodulo: m.id,
      nombre: m.nombre,
      ver: false,
      crear: false,
      editar: false,
      eliminar: false,
    }));
}

/**
 * Marca o desmarca una acción respetando la regla "sin ver no hay nada":
 * activar crear/editar/eliminar activa también ver, y quitar ver quita todo.
 */
export function cambiarPermiso(fila: FilaPermiso, accion: Accion, valor: boolean): FilaPermiso {
  if (accion === "ver") {
    return valor
      ? { ...fila, ver: true }
      : { ...fila, ver: false, crear: false, editar: false, eliminar: false };
  }
  return { ...fila, [accion]: valor, ver: valor ? true : fila.ver };
}

export function validarDatosPersonal(d: Omit<DatosPersonal, "contrasena">): Validacion {
  if (!d.nombre.trim()) return { ok: false, error: "El nombre es obligatorio." };
  if (d.nombre.trim().length > 200)
    return { ok: false, error: "El nombre no puede superar los 200 caracteres." };
  if (d.dni.trim().length > 20)
    return { ok: false, error: "El DNI no puede superar los 20 caracteres." };
  if (!d.correo.trim()) return { ok: false, error: "El correo es obligatorio." };
  if (!REGEX_CORREO.test(d.correo.trim()))
    return { ok: false, error: "Escribe un correo válido, como nombre@correo.com." };
  return { ok: true };
}

export { validarContrasena } from "@/lib/contrasena";

export function validarPersonal(d: DatosPersonal, confirmar?: string): Validacion {
  const datos = validarDatosPersonal(d);
  if (!datos.ok) return datos;
  return confirmar === undefined
    ? validarContrasena(d.contrasena)
    : validarConfirmacion(d.contrasena, confirmar);
}

interface PersonalCreadoApi {
  idpersonal: number;
}

/** Crea al empleado y devuelve su id. */
export async function crearPersonal(d: DatosPersonal): Promise<number> {
  const dni = d.dni.trim();
  const r = await api<PersonalCreadoApi>("/personal", {
    metodo: "POST",
    cuerpo: {
      nombre: d.nombre.trim(),
      ...(dni ? { dni } : {}),
      correo: d.correo.trim(),
      contrasena: d.contrasena,
    },
  });
  return r.idpersonal;
}

/** Cuerpo de PUT /personal/{id}/permisos: solo los módulos con algún permiso. */
export function cuerpoPermisos(filas: FilaPermiso[]) {
  return filas
    .filter((f) => f.ver || f.crear || f.editar || f.eliminar)
    .map((f) => ({
      idmodulo: f.idmodulo,
      puedever: f.ver,
      puedecrear: f.crear,
      puedeeditar: f.editar,
      puedeeliminar: f.eliminar,
    }));
}

export async function guardarPermisos(idpersonal: number, filas: FilaPermiso[]): Promise<void> {
  const cuerpo = cuerpoPermisos(filas);
  if (cuerpo.length === 0) return; // un empleado nuevo ya empieza sin permisos
  await api(`/personal/${idpersonal}/permisos`, { metodo: "PUT", cuerpo });
}
