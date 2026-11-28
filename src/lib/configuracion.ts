import { api } from "@/lib/api";
import type { Modulo, Predefinido, TipoCampo } from "@/lib/gestor";

/**
 * Configuración del sistema (solo el dueño): módulos y campos.
 *
 * Reglas del backend que la pantalla respeta:
 *  - Solo se ocultan los módulos y campos marcados como `ocultable`.
 *  - Los módulos y campos predefinidos (de sistema) no se eliminan.
 *  - Solo los módulos personalizados aceptan campos nuevos.
 *  - Los campos de sistema solo se renombran; el tipo y "filtrable" no cambian.
 *  - Un campo de tipo imagen no puede ser filtrable.
 */

export interface CampoConfig {
  id: number;
  nombre: string;
  tipo: TipoCampo;
  /** Columna física: distingue un campo de sistema de uno personalizado (null). */
  columna: string | null;
  ocultable: boolean;
  visible: boolean;
  filtrable: boolean;
  orden: number;
}

export interface DatosCampo {
  nombre: string;
  tipo: TipoCampo;
  filtrable: boolean;
}

export const TIPOS_CAMPO: { valor: TipoCampo; etiqueta: string }[] = [
  { valor: "texto", etiqueta: "Texto" },
  { valor: "numero", etiqueta: "Número" },
  { valor: "decimal", etiqueta: "Decimal" },
  { valor: "fecha", etiqueta: "Fecha" },
  { valor: "imagen", etiqueta: "Imagen" },
];

export const puedeSerFiltrable = (tipo: TipoCampo) => tipo !== "imagen";

export const esDeSistema = (c: CampoConfig) => c.columna !== null;

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
  ocultable: boolean;
  visible: boolean;
  filtrable: boolean;
  orden: number | null;
}

const aModulo = (m: ModuloApi): Modulo => ({
  id: m.idmodulo,
  nombre: m.nombremodulo,
  predefinido: m.predefinido,
  ocultable: m.ocultable,
  visible: m.visible,
});

const aCampo = (c: CampoApi): CampoConfig => ({
  id: c.idcampo,
  nombre: c.nombrecampo,
  tipo: c.tipocampo,
  columna: c.columna,
  ocultable: c.ocultable,
  visible: c.visible,
  filtrable: c.filtrable,
  orden: c.orden ?? 0,
});

const cuerpoCampo = (d: DatosCampo) => ({
  nombrecampo: d.nombre.trim(),
  tipocampo: d.tipo,
  filtrable: puedeSerFiltrable(d.tipo) && d.filtrable,
});

/* ------------------------------------------------------------
   Módulos
   ------------------------------------------------------------ */

/** Todos los módulos, incluidos los ocultos. */
export async function listarModulosConfig(): Promise<Modulo[]> {
  return (await api<ModuloApi[]>("/modulos/configuracion")).map(aModulo);
}

export async function crearModulo(nombre: string): Promise<Modulo> {
  return aModulo(
    await api<ModuloApi>("/modulos", { metodo: "POST", cuerpo: { nombremodulo: nombre.trim() } }),
  );
}

export async function renombrarModulo(id: number, nombre: string): Promise<void> {
  await api(`/modulos/${id}`, { metodo: "PUT", cuerpo: { nombremodulo: nombre.trim() } });
}

export async function cambiarVisibilidadModulo(id: number, visible: boolean): Promise<void> {
  await api(`/modulos/${id}/visibilidad`, { metodo: "PUT", cuerpo: { visible } });
}

export async function eliminarModulo(id: number): Promise<void> {
  await api(`/modulos/${id}`, { metodo: "DELETE" });
}

/* ------------------------------------------------------------
   Campos
   ------------------------------------------------------------ */

/** Todos los campos del módulo, incluidos los ocultos, en el orden configurado. */
export async function listarCamposConfig(idmodulo: number): Promise<CampoConfig[]> {
  const lista = await api<CampoApi[]>(`/modulos/${idmodulo}/campos/configuracion`);
  return lista.map(aCampo).sort((a, b) => a.orden - b.orden || a.id - b.id);
}

export async function crearCampo(idmodulo: number, datos: DatosCampo): Promise<CampoConfig> {
  return aCampo(
    await api<CampoApi>(`/modulos/${idmodulo}/campos`, {
      metodo: "POST",
      cuerpo: cuerpoCampo(datos),
    }),
  );
}

export async function editarCampo(id: number, datos: DatosCampo): Promise<void> {
  await api(`/campos/${id}`, { metodo: "PUT", cuerpo: cuerpoCampo(datos) });
}

export async function cambiarVisibilidadCampo(id: number, visible: boolean): Promise<void> {
  await api(`/campos/${id}/visibilidad`, { metodo: "PUT", cuerpo: { visible } });
}

/** Guarda el nuevo orden: el backend exige la lista completa de campos del módulo (también los ocultos). */
export async function reordenarCampos(idmodulo: number, idcampos: number[]): Promise<void> {
  await api(`/modulos/${idmodulo}/campos/orden`, { metodo: "PUT", cuerpo: { idcampos } });
}

export async function eliminarCampo(id: number): Promise<void> {
  await api(`/campos/${id}`, { metodo: "DELETE" });
}
