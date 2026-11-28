/**
 * Acceso con Google (Google Identity Services).
 *
 * El navegador obtiene de Google una "credencial" (un ID token firmado) y el
 * frontend la envía al backend en POST /auth/google; el backend la valida y
 * responde igual que /auth/login.
 *
 * Requiere VITE_GOOGLE_CLIENT_ID (el Client ID de tipo "Aplicación web" creado en
 * Google Cloud Console, con http://localhost:8080 como origen autorizado).
 */

export const ID_CLIENTE_GOOGLE =
  (import.meta.env["VITE_GOOGLE_CLIENT_ID"] as string | undefined)?.trim() || "";

export const googleConfigurado = (): boolean => ID_CLIENTE_GOOGLE !== "";

interface RespuestaCredencial {
  credential?: string;
}

interface OpcionesBoton {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill";
  width?: number;
  locale?: string;
}

export interface GoogleId {
  initialize: (config: {
    client_id: string;
    callback: (r: RespuestaCredencial) => void;
    ux_mode?: "popup" | "redirect";
  }) => void;
  renderButton: (contenedor: HTMLElement, opciones: OpcionesBoton) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const URL_SCRIPT = "https://accounts.google.com/gsi/client";
let promesaScript: Promise<GoogleId> | null = null;

/** Descarga el script de Google una sola vez y devuelve su API. */
export function cargarGoogle(): Promise<GoogleId> {
  if (window.google?.accounts?.id) return Promise.resolve(window.google.accounts.id);
  if (promesaScript) return promesaScript;

  promesaScript = new Promise<GoogleId>((resolve, reject) => {
    const falla = () => {
      promesaScript = null; // permite reintentar
      reject(new Error("No pudimos cargar el acceso con Google. Revisa tu conexión."));
    };
    const script = document.createElement("script");
    script.src = URL_SCRIPT;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const id = window.google?.accounts?.id;
      if (id) resolve(id);
      else falla();
    };
    script.onerror = falla;
    document.head.appendChild(script);
  });
  return promesaScript;
}
