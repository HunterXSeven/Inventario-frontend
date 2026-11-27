import { AlertCircle, ArrowLeftRight, Layers, Package, ShoppingCart, Users } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Modulo } from "@/lib/gestor";

/** Piezas compartidas por las pantallas del gestor. */

export function IconoModulo({ modulo, className }: { modulo: Modulo; className?: string }) {
  switch (modulo.predefinido) {
    case "productos":
      return <Package className={className} />;
    case "ventas":
      return <ShoppingCart className={className} />;
    case "movimientos":
      return <ArrowLeftRight className={className} />;
    case "personal":
      return <Users className={className} />;
    default:
      return <Layers className={className} />;
  }
}

export function AlertaError({ mensaje, onCerrar }: { mensaje: string; onCerrar?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
    >
      <AlertCircle className="size-4 shrink-0" />
      <span className="flex-1">{mensaje}</span>
      {onCerrar && (
        <button
          type="button"
          onClick={onCerrar}
          className="font-semibold underline underline-offset-2"
        >
          Cerrar
        </button>
      )}
    </div>
  );
}

/** Botón cuadrado con un ícono; `titulo` es el texto de ayuda y el nombre accesible. */
export function BotonIcono({
  titulo,
  onClick,
  disabled = false,
  peligro = false,
  children,
}: {
  titulo: string;
  onClick?: () => void;
  disabled?: boolean;
  peligro?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid size-9 place-items-center rounded-lg border border-border bg-card text-muted-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        peligro
          ? "enabled:hover:border-destructive/40 enabled:hover:bg-destructive/5 enabled:hover:text-destructive"
          : "enabled:hover:border-primary/40 enabled:hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export const claseInput =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60";
