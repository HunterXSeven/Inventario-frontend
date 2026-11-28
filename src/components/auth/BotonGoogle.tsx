import { useEffect, useRef, useState } from "react";
import { cargarGoogle, googleConfigurado, ID_CLIENTE_GOOGLE } from "@/lib/google";

/**
 * Botón oficial "Continuar con Google". Google dibuja el botón y, al elegir la cuenta,
 * entrega una credencial que se pasa a `onCredencial`.
 */
export function BotonGoogle({
  onCredencial,
  deshabilitado = false,
}: {
  onCredencial: (credencial: string) => void;
  deshabilitado?: boolean;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  // El callback de Google se registra una vez: siempre llama a la versión más reciente.
  const alCredencial = useRef(onCredencial);
  alCredencial.current = onCredencial;

  useEffect(() => {
    if (!googleConfigurado()) return;
    let vigente = true;
    cargarGoogle()
      .then((id) => {
        if (!vigente || !contenedor.current) return;
        id.initialize({
          client_id: ID_CLIENTE_GOOGLE,
          callback: (r) => {
            if (r.credential) alCredencial.current(r.credential);
          },
        });
        id.renderButton(contenedor.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          shape: "rectangular",
          locale: "es",
          width: Math.min(400, contenedor.current.clientWidth || 320),
        });
      })
      .catch((e: unknown) => {
        if (vigente) setError(e instanceof Error ? e.message : "No pudimos cargar Google.");
      });
    return () => {
      vigente = false;
    };
  }, []);

  if (!googleConfigurado()) {
    return (
      <p role="status" className="mt-6 text-xs text-muted-foreground">
        El acceso con Google aún no está configurado. Usa tu correo y contraseña.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <div
        ref={contenedor}
        aria-label="Continuar con Google"
        className={`flex justify-center ${deshabilitado ? "pointer-events-none opacity-60" : ""}`}
      />
      {error && (
        <p role="alert" className="mt-2 text-center text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
