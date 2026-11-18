import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Building2, LogOut } from "lucide-react";
import { cerrarSesion, useSesion } from "@/lib/auth";

export const Route = createFileRoute("/panel")({
  head: () => ({
    meta: [{ title: "CuadraStock — Mi panel" }],
  }),
  component: Panel,
});

/** Devuelve un color de texto legible (oscuro o blanco) sobre el color de fondo dado. */
function textoSobre(hex: string): string {
  const limpio = hex.replace("#", "");
  const completo = limpio.length === 3 ? [...limpio].map((c) => c + c).join("") : limpio;
  const n = parseInt(completo, 16);
  if (Number.isNaN(n)) return "#ffffff";
  const luminosidad = (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return luminosidad > 0.6 ? "#0f172a" : "#ffffff";
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div>
      <dt className="text-sm text-muted-foreground">{etiqueta}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{valor || "—"}</dd>
    </div>
  );
}

function Panel() {
  const navigate = useNavigate();
  const { cargando, usuario } = useSesion();

  useEffect(() => {
    if (cargando) return;
    if (!usuario) navigate({ to: "/login", replace: true });
    else if (!usuario.negocio) navigate({ to: "/registro", replace: true });
  }, [cargando, usuario, navigate]);

  if (cargando || !usuario || !usuario.negocio) {
    return <div className="min-h-screen bg-background" aria-busy="true" />;
  }

  const negocio = usuario.negocio;
  const primerNombre = usuario.nombre.split(" ")[0] || usuario.nombre;
  const textoCabecera = textoSobre(negocio.colorPrimario);

  const salir = () => {
    cerrarSesion();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header
        className="border-b border-black/5"
        style={{ backgroundColor: negocio.colorPrimario, color: textoCabecera }}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {negocio.logoDataUrl ? (
              <img
                src={negocio.logoDataUrl}
                alt={`Logo de ${negocio.nombre}`}
                className="size-9 rounded-lg bg-white object-contain p-0.5"
              />
            ) : (
              <span className="grid size-9 place-items-center rounded-lg bg-white/20">
                <Building2 className="size-5" />
              </span>
            )}
            <span className="truncate text-lg font-bold tracking-tight">{negocio.nombre}</span>
          </div>
          <button
            type="button"
            onClick={salir}
            className="inline-flex items-center gap-2 rounded-full border border-current/40 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white/15"
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6 sm:py-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Hola, {primerNombre}</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Este es el panel de <span className="font-semibold text-foreground">{negocio.nombre}</span>.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-foreground">Datos del negocio</h2>
            <dl className="mt-5 grid gap-5 sm:grid-cols-2">
              <Dato etiqueta="Rubro" valor={negocio.rubro} />
              <Dato etiqueta="RUC" valor={negocio.ruc} />
              <Dato etiqueta="Dirección" valor={negocio.direccion} />
              <Dato etiqueta="Distrito" valor={negocio.distrito} />
              <Dato etiqueta="Teléfono / WhatsApp" valor={negocio.telefono} />
              <Dato etiqueta="Correo de contacto" valor={usuario.correo} />
            </dl>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <h2 className="text-xl font-semibold text-foreground">Tus colores</h2>
            <div className="mt-5 flex gap-3">
              {[
                { nombre: "Principal", color: negocio.colorPrimario },
                { nombre: "Secundario", color: negocio.colorSecundario },
              ].map(({ nombre, color }) => (
                <div key={nombre} className="flex-1">
                  <div
                    className="h-14 rounded-xl border border-black/10"
                    style={{ backgroundColor: color }}
                  />
                  <p className="mt-2 text-sm font-medium text-foreground">{nombre}</p>
                  <p className="text-xs uppercase text-muted-foreground">{color}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center">
          <h2 className="text-xl font-semibold text-foreground">
            Tu sistema de inventario está en camino
          </h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">
            Aquí aparecerán tus módulos, campos y registros apenas conectemos el servidor.
          </p>
        </section>
      </main>
    </div>
  );
}
