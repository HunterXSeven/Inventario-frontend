import { useEffect, useState } from "react";

/**
 * Sesión SIMULADA para la demostración: usuarios, sesión y negocio se guardan
 * en el navegador (localStorage). Las contraseñas se guardan sin cifrar, por
 * eso esto NO sirve para producción.
 *
 * Al conectar Spring Boot, reemplaza las funciones de este archivo
 * (registrarUsuario, iniciarSesion, obtenerSesion, guardarNegocio,
 * cerrarSesion) por llamadas a tu API; el resto de la app no cambia.
 */

export interface NegocioGuardado {
  nombre: string;
  logoDataUrl: string | null;
  colorPrimario: string;
  colorSecundario: string;
  rubro: string;
  ruc: string;
  direccion: string;
  distrito: string;
  telefono: string;
}

export interface Usuario {
  nombre: string;
  correo: string;
  negocio: NegocioGuardado | null;
}

interface UsuarioRegistrado extends Usuario {
  contrasena: string;
}

export type ResultadoAcceso =
  | { ok: true; usuario: Usuario }
  | { ok: false; campo: "correo" | "general"; error: string };

const CLAVE_USUARIOS = "cuadrastock:usuarios";
const CLAVE_SESION = "cuadrastock:sesion";

const normalizar = (correo: string) => correo.trim().toLowerCase();

function leer<T>(clave: string, porDefecto: T): T {
  try {
    const valor = window.localStorage.getItem(clave);
    return valor ? (JSON.parse(valor) as T) : porDefecto;
  } catch {
    return porDefecto;
  }
}

function escribir(clave: string, valor: unknown): boolean {
  try {
    window.localStorage.setItem(clave, JSON.stringify(valor));
    return true;
  } catch {
    return false;
  }
}

function sinContrasena({ contrasena: _contrasena, ...usuario }: UsuarioRegistrado): Usuario {
  return usuario;
}

export function registrarUsuario(datos: {
  nombre: string;
  correo: string;
  contrasena: string;
}): ResultadoAcceso {
  const usuarios = leer<UsuarioRegistrado[]>(CLAVE_USUARIOS, []);
  const correo = normalizar(datos.correo);

  if (usuarios.some((u) => u.correo === correo)) {
    return { ok: false, campo: "correo", error: "Este correo ya está registrado." };
  }

  const nuevo: UsuarioRegistrado = {
    nombre: datos.nombre.trim(),
    correo,
    contrasena: datos.contrasena,
    negocio: null,
  };

  if (!escribir(CLAVE_USUARIOS, [...usuarios, nuevo]) || !escribir(CLAVE_SESION, correo)) {
    return {
      ok: false,
      campo: "general",
      error: "No pudimos guardar tu cuenta en este navegador. Revisa que no esté en modo privado.",
    };
  }
  return { ok: true, usuario: sinContrasena(nuevo) };
}

export function iniciarSesion(correo: string, contrasena: string): ResultadoAcceso {
  const usuarios = leer<UsuarioRegistrado[]>(CLAVE_USUARIOS, []);
  const encontrado = usuarios.find(
    (u) => u.correo === normalizar(correo) && u.contrasena === contrasena,
  );

  if (!encontrado) {
    return { ok: false, campo: "general", error: "Correo o contraseña incorrectos." };
  }
  escribir(CLAVE_SESION, encontrado.correo);
  return { ok: true, usuario: sinContrasena(encontrado) };
}

export function obtenerSesion(): Usuario | null {
  const correo = leer<string | null>(CLAVE_SESION, null);
  if (!correo) return null;
  const usuario = leer<UsuarioRegistrado[]>(CLAVE_USUARIOS, []).find((u) => u.correo === correo);
  return usuario ? sinContrasena(usuario) : null;
}

export function cerrarSesion(): void {
  try {
    window.localStorage.removeItem(CLAVE_SESION);
  } catch {
    /* sin acceso al almacenamiento: no hay sesión que cerrar */
  }
}

/** Guarda el negocio del usuario con sesión iniciada. */
export function guardarNegocio(negocio: NegocioGuardado): boolean {
  const correo = leer<string | null>(CLAVE_SESION, null);
  if (!correo) return false;

  const usuarios = leer<UsuarioRegistrado[]>(CLAVE_USUARIOS, []);
  const conNegocio = (n: NegocioGuardado) =>
    usuarios.map((u) => (u.correo === correo ? { ...u, negocio: n } : u));

  if (escribir(CLAVE_USUARIOS, conNegocio(negocio))) return true;
  // Un logo grande puede superar el límite del navegador: reintenta sin logo.
  return escribir(CLAVE_USUARIOS, conNegocio({ ...negocio, logoDataUrl: null }));
}

/* ------------------------------------------------------------
   Hooks y ayudas de navegación
   ------------------------------------------------------------ */

export type DestinoAcceso = "/login" | "/registro" | "/panel";

/** Pantalla que corresponde según el estado del usuario. */
export function destinoPara(usuario: Usuario | null): DestinoAcceso {
  if (!usuario) return "/login";
  return usuario.negocio ? "/panel" : "/registro";
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
    setEstado({ cargando: false, usuario: obtenerSesion() });
  }, []);

  return estado;
}

export function useDestinoAcceso(): DestinoAcceso {
  const { usuario } = useSesion();
  return destinoPara(usuario);
}