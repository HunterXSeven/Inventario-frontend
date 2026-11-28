import { useEffect, useState } from "react";
import { api, ApiError, borrarToken, guardarToken, leerToken } from "@/lib/api";

/**
 * Sesión real contra el backend Spring Boot (JWT).
 *
 * El backend no guarda el nombre de la persona (solo correo y contraseña),
 * así que el nombre se recuerda en este navegador solo para el saludo.
 * La sesión se reconstruye con GET /auth/yo y, si el token ya está ligado a
 * un sistema, con GET /sistemas/actual.
 *
 * `negocio` es el sistema con el que se está trabajando. Un dueño que acaba de
 * iniciar sesión todavía no eligió uno (negocio = null) y pasa por /sistemas.
 */

export interface NegocioGuardado {
  id: number;
  nombre: string;
  logoUrl: string | null;
  colorPrimario: string;
  colorSecundario: string;
}

/** Lo que una cuenta de personal puede hacer en un módulo. */
export interface Permiso {
  idmodulo: number;
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
}

export interface Usuario {
  nombre: string;
  correo: string;
  tipo: "DUENO" | "PERSONAL";
  negocio: NegocioGuardado | null;
  /** Solo para PERSONAL: el dueño puede hacer todo. */
  permisos: Permiso[];
}

/** El dueño siempre puede; el personal, solo si su permiso del módulo lo marca. */
export function puedeEn(
  usuario: Usuario,
  idmodulo: number,
  accion: "crear" | "editar" | "eliminar",
): boolean {
  if (usuario.tipo === "DUENO") return true;
  return usuario.permisos.some((p) => p.idmodulo === idmodulo && p[accion]);
}

export const puedeCrearEn = (usuario: Usuario, idmodulo: number): boolean =>
  puedeEn(usuario, idmodulo, "crear");

export type ResultadoAcceso =
  { ok: true; usuario: Usuario } | { ok: false; campo: "correo" | "general"; error: string };

export type ResultadoNegocio =
  { ok: true; negocio: NegocioGuardado } | { ok: false; error: string };

/* ------------------------------------------------------------
   Formas de las respuestas del backend (ver Dtos.java)
   ------------------------------------------------------------ */

interface SistemaApi {
  idsistema: number;
  nombrenegocio: string;
  colorprincipal: string;
  colorsecundario: string;
  logourl: string | null;
}

interface TokenApi {
  token: string;
  tipo: "DUENO" | "PERSONAL";
  sistema: SistemaApi | null;
}

interface YoApi {
  correo: string;
  tipo: "DUENO" | "PERSONAL";
  idsistema: number | null;
  permisos?: PermisoApi[] | null;
}

interface PermisoApi {
  idmodulo: number;
  puedever: boolean;
  puedecrear: boolean;
  puedeeditar: boolean;
  puedeeliminar: boolean;
}

const aNegocio = (s: SistemaApi): NegocioGuardado => ({
  id: s.idsistema,
  nombre: s.nombrenegocio,
  logoUrl: s.logourl,
  colorPrimario: s.colorprincipal,
  colorSecundario: s.colorsecundario,
});

/* ------------------------------------------------------------
   Nombre de la persona (solo en este navegador)
   ------------------------------------------------------------ */

const claveNombre = (correo: string) => `cuadrastock:nombre:${correo}`;

function leerNombre(correo: string): string {
  try {
    const guardado = window.localStorage.getItem(claveNombre(correo));
    if (guardado) return guardado;
  } catch {
    /* sin acceso al almacenamiento */
  }
  return correo.split("@")[0] || correo;
}

function guardarNombre(correo: string, nombre: string): void {
  try {
    window.localStorage.setItem(claveNombre(correo), nombre);
  } catch {
    /* es solo para el saludo: si no se puede guardar, no pasa nada */
  }
}

/* ------------------------------------------------------------
   Errores
   ------------------------------------------------------------ */

function mensajeDe(e: unknown): string {
  return e instanceof ApiError ? e.message : "Ocurrió un error inesperado. Inténtalo de nuevo.";
}

function errorDeAcceso(e: unknown): ResultadoAcceso {
  const error = mensajeDe(e);
  const esDeCorreo =
    e instanceof ApiError && [400, 409].includes(e.status) && /correo/i.test(error);
  return { ok: false, campo: esDeCorreo ? "correo" : "general", error };
}

const ERROR_ALMACENAMIENTO =
  "No pudimos guardar tu sesión en este navegador. Revisa que no esté en modo privado.";

/* ------------------------------------------------------------
   Sesión (con caché en memoria para no repetir peticiones)
   ------------------------------------------------------------ */

let sesionEnCache: Promise<Usuario | null> | null = null;

async function cargarSesion(): Promise<Usuario> {
  const yo = await api<YoApi>("/auth/yo");
  let negocio: NegocioGuardado | null = null;

  if (yo.idsistema !== null) {
    try {
      negocio = aNegocio(await api<SistemaApi>("/sistemas/actual"));
    } catch (e) {
      // El sistema del token ya no existe: se trata como "sin negocio".
      if (!(e instanceof ApiError && e.status === 404)) throw e;
    }
  }

  const permisos = (yo.permisos ?? []).map((p) => ({
    idmodulo: p.idmodulo,
    ver: p.puedever,
    crear: p.puedecrear,
    editar: p.puedeeditar,
    eliminar: p.puedeeliminar,
  }));
  return { nombre: leerNombre(yo.correo), correo: yo.correo, tipo: yo.tipo, negocio, permisos };
}

/** Usuario con sesión iniciada, o null si no hay sesión (o ya venció). */
export function obtenerSesion(): Promise<Usuario | null> {
  if (typeof window === "undefined" || !leerToken()) {
    sesionEnCache = null;
    return Promise.resolve(null);
  }
  if (!sesionEnCache) {
    sesionEnCache = cargarSesion().catch((e: unknown) => {
      sesionEnCache = null;
      if (e instanceof ApiError && e.status === 401) return null;
      throw e;
    });
  }
  return sesionEnCache;
}

export async function registrarUsuario(datos: {
  nombre: string;
  correo: string;
  contrasena: string;
}): Promise<ResultadoAcceso> {
  const correo = datos.correo.trim();
  try {
    const r = await api<TokenApi>("/auth/registro", {
      metodo: "POST",
      cuerpo: { correo, contrasena: datos.contrasena },
      conToken: false,
    });
    if (!guardarToken(r.token)) return { ok: false, campo: "general", error: ERROR_ALMACENAMIENTO };

    const nombre = datos.nombre.trim();
    guardarNombre(correo, nombre);
    // Una cuenta recién creada todavía no tiene negocio.
    const usuario: Usuario = { nombre, correo, tipo: r.tipo, negocio: null, permisos: [] };
    sesionEnCache = Promise.resolve(usuario);
    return { ok: true, usuario };
  } catch (e) {
    return errorDeAcceso(e);
  }
}

export async function iniciarSesion(correo: string, contrasena: string): Promise<ResultadoAcceso> {
  const correoLimpio = correo.trim();
  try {
    const r = await api<TokenApi>("/auth/login", {
      metodo: "POST",
      cuerpo: { correo: correoLimpio, contrasena },
      conToken: false,
    });
    if (!guardarToken(r.token)) return { ok: false, campo: "general", error: ERROR_ALMACENAMIENTO };

    // El dueño siempre pasa por la lista de sistemas (aunque tenga uno solo);
    // el personal entra directo al sistema donde trabaja.
    const negocio = r.tipo === "PERSONAL" && r.sistema ? aNegocio(r.sistema) : null;

    const usuario: Usuario = {
      nombre: leerNombre(correoLimpio),
      correo: correoLimpio,
      tipo: r.tipo,
      negocio,
      // El login no trae permisos: se cargan con /auth/yo al volver a abrir la sesión.
      permisos: [],
    };
    // El personal necesita sus permisos: se vuelven a pedir a /auth/yo en vez de usar este usuario.
    sesionEnCache = r.tipo === "PERSONAL" ? null : Promise.resolve(usuario);
    return { ok: true, usuario };
  } catch (e) {
    borrarToken();
    sesionEnCache = null;
    return errorDeAcceso(e);
  }
}

export function cerrarSesion(): void {
  borrarToken();
  sesionEnCache = null;
}

/** Sistemas (negocios) del dueño. Solo lo puede pedir una cuenta de dueño. */
export async function listarSistemas(): Promise<
  { ok: true; sistemas: NegocioGuardado[] } | { ok: false; error: string }
> {
  try {
    const lista = await api<SistemaApi[]>("/sistemas");
    return { ok: true, sistemas: lista.map(aNegocio) };
  } catch (e) {
    return { ok: false, error: mensajeDe(e) };
  }
}

/** Entra a un sistema: el backend devuelve un token nuevo ligado a él (POST /auth/sistema/{id}). */
export async function seleccionarSistema(idsistema: number): Promise<ResultadoNegocio> {
  try {
    const t = await api<TokenApi>(`/auth/sistema/${idsistema}`, { metodo: "POST" });
    if (!guardarToken(t.token)) return { ok: false, error: ERROR_ALMACENAMIENTO };
    sesionEnCache = null; // la próxima lectura reconstruye la sesión con el sistema elegido
    if (!t.sistema)
      return { ok: false, error: "No pudimos abrir ese negocio. Inténtalo de nuevo." };
    return { ok: true, negocio: aNegocio(t.sistema) };
  } catch (e) {
    return { ok: false, error: mensajeDe(e) };
  }
}

/**
 * Crea el negocio del dueño (POST /sistemas) y entra a él
 * (POST /auth/sistema/{id}, que devuelve un token ligado a ese sistema).
 */
export async function guardarNegocio(datos: {
  nombre: string;
  logoUrl: string;
  colorPrimario: string;
  colorSecundario: string;
}): Promise<ResultadoNegocio> {
  let creado: SistemaApi;
  try {
    creado = await api<SistemaApi>("/sistemas", {
      metodo: "POST",
      cuerpo: {
        nombrenegocio: datos.nombre.trim(),
        colorprincipal: datos.colorPrimario,
        colorsecundario: datos.colorSecundario,
        logourl: datos.logoUrl.trim() || null,
      },
    });
  } catch (e) {
    return { ok: false, error: mensajeDe(e) };
  }

  sesionEnCache = null;
  try {
    const t = await api<TokenApi>(`/auth/sistema/${creado.idsistema}`, { metodo: "POST" });
    guardarToken(t.token);
  } catch {
    // El negocio ya existe: al recargar, la sesión lo encuentra sola.
    return {
      ok: false,
      error:
        "Tu negocio se creó, pero no pudimos abrirlo. Búscalo en tu lista de sistemas para entrar.",
    };
  }
  return { ok: true, negocio: aNegocio(creado) };
}

/* ------------------------------------------------------------
   Hooks y ayudas de navegación
   ------------------------------------------------------------ */

export type DestinoAcceso = "/login" | "/sistemas" | "/panel";

/** Pantalla que corresponde según el estado del usuario. */
export function destinoPara(usuario: Usuario | null): DestinoAcceso {
  if (!usuario) return "/login";
  // El personal siempre trabaja dentro de su sistema; el dueño elige primero cuál abrir.
  return usuario.negocio || usuario.tipo === "PERSONAL" ? "/panel" : "/sistemas";
}

/**
 * Lee la sesión en el navegador. Empieza con `cargando: true` para que el
 * servidor y el cliente pinten lo mismo en la primera renderización.
 */
export function useSesion() {
  const [estado, setEstado] = useState<{ cargando: boolean; usuario: Usuario | null }>({
    cargando: true,
    usuario: null,
  });

  useEffect(() => {
    let vigente = true;
    obtenerSesion()
      .then((usuario) => vigente && setEstado({ cargando: false, usuario }))
      // Sin conexión con el servidor: se muestra como sin sesión; el login explica el error.
      .catch(() => vigente && setEstado({ cargando: false, usuario: null }));
    return () => {
      vigente = false;
    };
  }, []);

  return estado;
}

export function useDestinoAcceso(): DestinoAcceso {
  const { usuario } = useSesion();
  return destinoPara(usuario);
}
