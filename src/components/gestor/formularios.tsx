import { useState } from "react";
import type { ReactNode } from "react";
import { AlertaError, claseInput } from "@/components/gestor/comunes";
import { mensajeDeError } from "@/lib/gestor";
import type { Campo } from "@/lib/gestor";
import { ACCIONES } from "@/lib/personal";
import type { Accion, FilaPermiso } from "@/lib/personal";
import type { Valores, Validacion } from "@/lib/registros";

/** Piezas compartidas por los formularios de alta y de edición. */

export function Etiqueta({
  texto,
  obligatorio,
  children,
}: {
  texto: string;
  obligatorio?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-foreground">
        {texto}
        {obligatorio && <span className="text-destructive"> *</span>}
      </span>
      {children}
    </label>
  );
}

/* ------------------------------------------------------------
   Piezas comunes de los formularios
   ------------------------------------------------------------ */

export interface PropsForm {
  onListo: () => void;
  onCancelar: () => void;
  /** Devuelve true si el error era de sesión vencida (ya se maneja fuera). */
  onSesionVencida: (e: unknown) => boolean;
}

/** Estado y envío compartidos: valida, muestra errores y evita el doble clic. */
export function useEnvio({ onListo, onSesionVencida }: PropsForm) {
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (validacion: Validacion, accion: () => Promise<void>) => {
    if (enviando) return;
    if (!validacion.ok) {
      setError(validacion.error);
      return;
    }
    setError(null);
    setEnviando(true);
    try {
      await accion();
      onListo();
    } catch (e) {
      setEnviando(false);
      if (!onSesionVencida(e)) setError(mensajeDeError(e));
    }
  };

  return { error, enviando, enviar };
}

export function Botones({ enviando, onCancelar }: { enviando: boolean; onCancelar: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 pt-2">
      <button
        type="submit"
        disabled={enviando}
        className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {enviando ? "Guardando…" : "Guardar"}
      </button>
      <button
        type="button"
        onClick={onCancelar}
        disabled={enviando}
        className="rounded-full border border-border bg-card px-6 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 disabled:opacity-60"
      >
        Cancelar
      </button>
    </div>
  );
}

export function CampoEntrada({
  campo,
  valor,
  onCambio,
  nombreClave,
  bloqueado = false,
}: {
  campo: Campo;
  valor: string;
  onCambio: (v: string) => void;
  nombreClave: string;
  bloqueado?: boolean;
}) {
  const tipo =
    campo.tipo === "fecha"
      ? "date"
      : campo.tipo === "numero" || campo.tipo === "decimal" || campo.columna === "precio"
        ? "number"
        : campo.tipo === "imagen"
          ? "url"
          : "text";
  const paso =
    campo.tipo === "decimal" || campo.columna === "precio"
      ? "0.01"
      : tipo === "number"
        ? "1"
        : undefined;
  return (
    <Etiqueta texto={campo.nombre} obligatorio={campo.columna === "nombreProducto"}>
      <input
        name={nombreClave}
        type={tipo}
        step={paso}
        min={tipo === "number" && campo.columna !== null ? 0 : undefined}
        inputMode={tipo === "number" ? "decimal" : undefined}
        placeholder={campo.tipo === "imagen" ? "https://…" : undefined}
        value={valor}
        disabled={bloqueado}
        onChange={(e) => onCambio(e.target.value)}
        className={claseInput}
      />
    </Etiqueta>
  );
}

export function RejillaCampos({
  campos,
  valores,
  clave,
  onCambio,
  bloqueado,
}: {
  campos: Campo[];
  valores: Valores;
  clave: (c: Campo) => string;
  onCambio: (clave: string, valor: string) => void;
  /** Campos que se muestran pero no se pueden cambiar (por ejemplo, el stock al editar). */
  bloqueado?: (c: Campo) => boolean;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {campos.map((c) => (
        <CampoEntrada
          key={c.id}
          campo={c}
          nombreClave={clave(c)}
          valor={valores[clave(c)] ?? ""}
          onCambio={(v) => onCambio(clave(c), v)}
          bloqueado={bloqueado?.(c) ?? false}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------
   Matriz de permisos (alta y edición de empleados)
   ------------------------------------------------------------ */

const ETIQUETA_ACCION: Record<Accion, string> = {
  ver: "Ver",
  crear: "Registrar",
  editar: "Editar",
  eliminar: "Eliminar",
};

export function TablaPermisos({
  filas,
  onCambio,
}: {
  filas: FilaPermiso[];
  onCambio: (idmodulo: number, accion: Accion, valor: boolean) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-foreground">Permisos por módulo</legend>
      <p className="mt-1 text-xs text-muted-foreground">
        Marca qué puede hacer en cada módulo. Para registrar, editar o eliminar también debe poder
        verlo.
      </p>
      {filas.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No hay módulos visibles para asignar.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wider text-muted-foreground">
                <th scope="col" className="px-4 py-2.5 font-semibold">
                  Módulo
                </th>
                {ACCIONES.map((a) => (
                  <th key={a} scope="col" className="px-3 py-2.5 text-center font-semibold">
                    {ETIQUETA_ACCION[a]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.idmodulo} className="border-b border-border last:border-0">
                  <th scope="row" className="px-4 py-2.5 text-left font-medium text-foreground">
                    {f.nombre}
                  </th>
                  {ACCIONES.map((a) => (
                    <td key={a} className="px-3 py-2.5 text-center">
                      <input
                        type="checkbox"
                        aria-label={`${ETIQUETA_ACCION[a]} en ${f.nombre}`}
                        checked={f[a]}
                        onChange={(e) => onCambio(f.idmodulo, a, e.target.checked)}
                        className="size-4 accent-primary"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </fieldset>
  );
}
