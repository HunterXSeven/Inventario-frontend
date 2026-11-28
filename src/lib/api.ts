/**
 * Cliente HTTP del backend Spring Boot (Sys-inventarios).
 *
 * - URL base: variable VITE_API_URL (por defecto http://localhost:9090).
 * - El token JWT se guarda en localStorage y se envía como "Authorization: Bearer".
 * - Los errores del backend llegan como {"mensaje": "..."}; aquí se convierten
 *   en un ApiError con ese mensaje, listo para mostrarlo en pantalla.
 */

const URL_BASE =
  (import.meta.env["VITE_API_URL"] as string | undefined)?.replace(/\/+$/, "") ||
  "http://localhost:9090";

const CLAVE_TOKEN = "cuadrastock:token";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.name = "ApiError";
    this.status = status;
  }
}

/* ------------------------------------------------------------
   Token
   ------------------------------------------------------------ */

export function leerToken(): string | null {
  try {
    return window.localStorage.getItem(CLAVE_TOKEN);
  } catch {
    return null;
  }
}

export function guardarToken(token: string): boolean {
  try {
    window.localStorage.setItem(CLAVE_TOKEN, token);
    return true;
  } catch {
    return false;
  }
}

export function borrarToken(): void {
  try {
    window.localStorage.removeItem(CLAVE_TOKEN);
  } catch {
    /* sin acceso al almacenamiento: no hay token que borrar */
  }
}

/* ------------------------------------------------------------
   Peticiones
   ------------------------------------------------------------ */

interface Opciones {
  metodo?: "GET" | "POST" | "PUT" | "DELETE";
  cuerpo?: unknown;
  /** false en las rutas públicas (login y registro). */
  conToken?: boolean;
}

function mensajePorEstado(estado: number): string {
  switch (estado) {
    case 401:
      return "Tu sesión venció. Inicia sesión de nuevo.";
    case 403:
      return "No tienes permiso para hacer esto.";
    case 404:
      return "No encontramos lo que buscabas.";
    default:
      return estado >= 500
        ? "El servidor tuvo un problema. Inténtalo de nuevo en un momento."
        : "No pudimos completar la operación.";
  }
}

function mensajeDelCuerpo(datos: unknown): string | null {
  if (typeof datos === "object" && datos !== null && "mensaje" in datos) {
    const { mensaje } = datos as { mensaje: unknown };
    if (typeof mensaje === "string" && mensaje.trim()) return mensaje;
  }
  return null;
}

async function tokenSigueVigente(token: string): Promise<boolean> {
  try {
    const r = await fetch(`${URL_BASE}/auth/yo`, {
      method: "GET",
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function api<T = void>(
  ruta: string,
  { metodo = "GET", cuerpo, conToken = true }: Opciones = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = conToken ? leerToken() : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const esArchivo = typeof FormData !== "undefined" && cuerpo instanceof FormData;
  // Con FormData el navegador pone solo el Content-Type (multipart + boundary).
  if (cuerpo !== undefined && !esArchivo) headers["Content-Type"] = "application/json";

  let respuesta: Response;
  try {
    respuesta = await fetch(`${URL_BASE}${ruta}`, {
      method: metodo,
      headers,
      body: cuerpo === undefined ? null : esArchivo ? (cuerpo as FormData) : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ApiError(
      0,
      "No pudimos conectar con el servidor. Revisa que el backend esté en marcha.",
    );
  }

  // Algunas respuestas (204) vienen sin cuerpo.
  const texto = await respuesta.text();
  let datos: unknown = null;
  if (texto) {
    try {
      datos = JSON.parse(texto);
    } catch {
      datos = null;
    }
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401 && token) {
      // Un 401 puede ser un token vencido... o, en este backend, una acción sin permiso
      // (Spring lo responde como 401 al reenviar el error). Se comprueba con /auth/yo.
      if (ruta !== "/auth/yo" && (await tokenSigueVigente(token))) {
        throw new ApiError(403, mensajePorEstado(403));
      }
      // Token vencido o inválido: no sirve de nada, se descarta.
      borrarToken();
    }
    throw new ApiError(
      respuesta.status,
      mensajeDelCuerpo(datos) ?? mensajePorEstado(respuesta.status),
    );
  }
  return datos as T;
}
