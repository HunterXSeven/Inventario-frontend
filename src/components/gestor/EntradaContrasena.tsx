import { useState } from "react";
import { Check, Eye, EyeOff, Circle } from "lucide-react";
import { claseInput } from "@/components/gestor/comunes";
import { reglasContrasena } from "@/lib/contrasena";

/** Campo de contraseña con un botón para ver lo que se escribe. */
export function EntradaContrasena({
  etiqueta,
  valor,
  onCambio,
  placeholder,
  bloqueado = false,
}: {
  etiqueta: string;
  valor: string;
  onCambio: (v: string) => void;
  placeholder?: string;
  bloqueado?: boolean;
}) {
  const [ver, setVer] = useState(false);
  return (
    <div className="relative">
      <input
        type={ver ? "text" : "password"}
        aria-label={etiqueta}
        autoComplete="new-password"
        placeholder={placeholder}
        value={valor}
        disabled={bloqueado}
        onChange={(e) => onCambio(e.target.value)}
        className={`${claseInput} pr-11`}
      />
      <button
        type="button"
        onClick={() => setVer((v) => !v)}
        aria-label={ver ? `Ocultar ${etiqueta.toLowerCase()}` : `Mostrar ${etiqueta.toLowerCase()}`}
        className="absolute inset-y-0 right-0 grid w-10 place-items-center text-muted-foreground hover:text-foreground"
      >
        {ver ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

/** Lista que se va marcando mientras se escribe la contraseña. */
export function ReglasContrasena({ contrasena }: { contrasena: string }) {
  return (
    <ul className="mt-2 grid gap-1 text-xs sm:grid-cols-2" aria-label="Requisitos de la contraseña">
      {reglasContrasena(contrasena).map((r) => (
        <li
          key={r.texto}
          className={
            r.cumple
              ? "flex items-center gap-1.5 text-success"
              : "flex items-center gap-1.5 text-muted-foreground"
          }
        >
          {r.cumple ? <Check className="size-3.5" /> : <Circle className="size-3" />}
          {r.texto}
        </li>
      ))}
    </ul>
  );
}
