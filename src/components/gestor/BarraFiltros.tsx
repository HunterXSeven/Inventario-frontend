import { useState } from "react";
import type { ReactNode } from "react";
import type { FormEvent } from "react";
import { cn } from "@/lib/utils";
import { claseInput } from "@/components/gestor/comunes";
import { hayConsulta, sinConsulta } from "@/lib/gestor";
import type { Campo, Consulta, FiltroCampo, Modulo } from "@/lib/gestor";

/** Campos por los que se puede filtrar un módulo personalizado. */
export const camposFiltrables = (campos: Campo[]) =>
  campos.filter((c) => c.filtrable && c.tipo !== "imagen");

/** ¿Este módulo ofrece algún filtro? */
export function tieneFiltros(modulo: Modulo, campos: Campo[]): boolean {
  switch (modulo.predefinido) {
    case "ventas":
    case "movimientos":
    case "productos":
      return true;
    case "personal":
      return false;
    default:
      return camposFiltrables(campos).length > 0;
  }
}

const claseBoton =
  "rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/40";
const claseBotonPrimario =
  "rounded-full bg-sec px-4 py-2 text-sm font-semibold text-sec-fg shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md";

export function BarraFiltros({
  modulo,
  campos,
  consulta,
  onCambiar,
  accion,
}: {
  modulo: Modulo;
  campos: Campo[];
  consulta: Consulta;
  onCambiar: (c: Consulta) => void;
  /** Botón de la derecha (Agregar registro). */
  accion?: ReactNode;
}) {
  const derecha = accion ? <div className="ml-auto self-center">{accion}</div> : null;
  switch (modulo.predefinido) {
    case "productos":
      return (
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
          <button
            type="button"
            aria-pressed={!!consulta.stockBajo}
            onClick={() => onCambiar(consulta.stockBajo ? sinConsulta : { stockBajo: true })}
            className={cn(
              claseBoton,
              consulta.stockBajo && "border-destructive/50 bg-destructive/10 text-destructive",
            )}
          >
            Solo stock bajo
          </button>
          {consulta.stockBajo && (
            <span className="text-sm text-muted-foreground">
              Productos con el stock en el mínimo o por debajo.
            </span>
          )}
          {derecha}
        </div>
      );
    case "ventas":
    case "movimientos":
      return (
        <FiltroFechas modulo={modulo} consulta={consulta} onCambiar={onCambiar} derecha={derecha} />
      );
    case "personal":
      return null;
    default:
      return (
        <FiltroPorCampo
          campos={campos}
          consulta={consulta}
          onCambiar={onCambiar}
          derecha={derecha}
        />
      );
  }
}

/* ------------------------------------------------------------
   Ventas y movimientos: rango de fechas
   ------------------------------------------------------------ */

function FiltroFechas({
  modulo,
  consulta,
  onCambiar,
  derecha,
}: {
  modulo: Modulo;
  consulta: Consulta;
  onCambiar: (c: Consulta) => void;
  derecha: ReactNode;
}) {
  const [desde, setDesde] = useState(consulta.desde ?? "");
  const [hasta, setHasta] = useState(consulta.hasta ?? "");
  const [error, setError] = useState<string | null>(null);

  const aplicar = (e: FormEvent) => {
    e.preventDefault();
    if (!desde && !hasta) {
      setError("Elige al menos una fecha.");
      return;
    }
    if (desde && hasta && desde > hasta) {
      setError("La fecha “Desde” no puede ser posterior a “Hasta”.");
      return;
    }
    setError(null);
    onCambiar({ ...(desde ? { desde } : {}), ...(hasta ? { hasta } : {}) });
  };

  const verHoy = () => {
    setDesde("");
    setHasta("");
    setError(null);
    onCambiar(sinConsulta);
  };

  return (
    <form
      onSubmit={aplicar}
      noValidate
      className="flex flex-wrap items-end gap-3 border-b border-border px-4 py-3"
    >
      <label className="text-sm">
        <span className="mb-1 block font-medium text-foreground">Desde</span>
        <input
          type="date"
          aria-label="Desde"
          value={desde}
          onChange={(e) => setDesde(e.target.value)}
          className={cn(claseInput, "w-auto")}
        />
      </label>
      <label className="text-sm">
        <span className="mb-1 block font-medium text-foreground">Hasta</span>
        <input
          type="date"
          aria-label="Hasta"
          value={hasta}
          onChange={(e) => setHasta(e.target.value)}
          className={cn(claseInput, "w-auto")}
        />
      </label>
      <button type="submit" className={claseBotonPrimario}>
        Filtrar
      </button>
      <button type="button" onClick={verHoy} className={claseBoton}>
        Hoy
      </button>
      {derecha}
      <p className="basis-full text-xs text-muted-foreground">
        {hayConsulta(consulta)
          ? "Mostrando el rango elegido."
          : `Mostrando solo ${modulo.predefinido === "ventas" ? "las ventas" : "los movimientos"} de hoy. Elige fechas para ver otros días.`}
      </p>
      {error && (
        <p role="alert" className="basis-full text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}

/* ------------------------------------------------------------
   Módulos personalizados: filtro por un campo "filtrable"
   ------------------------------------------------------------ */

function FiltroPorCampo({
  campos,
  consulta,
  onCambiar,
  derecha,
}: {
  campos: Campo[];
  consulta: Consulta;
  onCambiar: (c: Consulta) => void;
  derecha: ReactNode;
}) {
  const filtrables = camposFiltrables(campos);
  const actual = consulta.filtro ?? null;
  const [idcampo, setIdcampo] = useState<string>(
    String(actual?.idcampo ?? filtrables[0]?.id ?? ""),
  );
  const [valor, setValor] = useState(actual?.valor ?? "");
  const [desde, setDesde] = useState(actual?.desde ?? "");
  const [hasta, setHasta] = useState(actual?.hasta ?? "");
  const [error, setError] = useState<string | null>(null);

  const campo = filtrables.find((c) => String(c.id) === idcampo);
  if (!campo) return null;

  const esTexto = campo.tipo === "texto";
  const tipoEntrada = campo.tipo === "fecha" ? "date" : "number";

  const aplicar = (e: FormEvent) => {
    e.preventDefault();
    if (esTexto ? !valor.trim() : !desde && !hasta) {
      setError(esTexto ? "Escribe el texto a buscar." : "Completa al menos un límite del rango.");
      return;
    }
    if (
      !esTexto &&
      desde &&
      hasta &&
      (campo.tipo === "fecha" ? desde > hasta : Number(desde) > Number(hasta))
    ) {
      setError("El valor inicial no puede ser mayor que el final.");
      return;
    }
    setError(null);
    const filtro: FiltroCampo = { idcampo: campo.id, tipo: campo.tipo, valor, desde, hasta };
    onCambiar({ filtro });
  };

  const quitar = () => {
    setValor("");
    setDesde("");
    setHasta("");
    setError(null);
    onCambiar(sinConsulta);
  };

  return (
    <form
      onSubmit={aplicar}
      noValidate
      className="flex flex-wrap items-end gap-3 border-b border-border px-4 py-3"
    >
      <label className="text-sm">
        <span className="mb-1 block font-medium text-foreground">Filtrar por</span>
        <select
          aria-label="Filtrar por"
          value={idcampo}
          onChange={(e) => {
            setIdcampo(e.target.value);
            setValor("");
            setDesde("");
            setHasta("");
            setError(null);
          }}
          className={cn(claseInput, "w-auto")}
        >
          {filtrables.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.nombre}
            </option>
          ))}
        </select>
      </label>

      {esTexto ? (
        <label className="text-sm">
          <span className="mb-1 block font-medium text-foreground">Es igual a</span>
          <input
            type="text"
            aria-label="Es igual a"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className={cn(claseInput, "w-auto")}
          />
        </label>
      ) : (
        <>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-foreground">
              {campo.tipo === "fecha" ? "Desde" : "Mínimo"}
            </span>
            <input
              type={tipoEntrada}
              step={campo.tipo === "decimal" ? "0.01" : undefined}
              aria-label={campo.tipo === "fecha" ? "Desde" : "Mínimo"}
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className={cn(claseInput, "w-auto")}
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-foreground">
              {campo.tipo === "fecha" ? "Hasta" : "Máximo"}
            </span>
            <input
              type={tipoEntrada}
              step={campo.tipo === "decimal" ? "0.01" : undefined}
              aria-label={campo.tipo === "fecha" ? "Hasta" : "Máximo"}
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className={cn(claseInput, "w-auto")}
            />
          </label>
        </>
      )}

      <button type="submit" className={claseBotonPrimario}>
        Filtrar
      </button>
      {actual && (
        <button type="button" onClick={quitar} className={claseBoton}>
          Quitar filtro
        </button>
      )}
      {derecha}
      {error && (
        <p role="alert" className="basis-full text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
