import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ArrowRight, Building2, LogOut, PackageCheck, Plus } from "lucide-react";
import { cerrarSesion, listarSistemas, seleccionarSistema, useSesion } from "@/lib/auth";
import type { NegocioGuardado } from "@/lib/auth";
import { textoSobre } from "@/lib/colores";

export const Route = createFileRoute("/sistemas")({
  head: () => ({
    meta: [{ title: "CuadraStock — Mis sistemas" }],
  }),
  component: Sistemas,
});

function LogoMark() {
  return (
    <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <PackageCheck className="size-5" strokeWidth={2.2} />
    </span>
  );
}

function TarjetaSistema({
  negocio,
  abriendo,
  bloqueada,
  onAbrir,
}: {
  negocio: NegocioGuardado;
  abriendo: boolean;
  bloqueada: boolean;
  onAbrir: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onAbrir}
      disabled={bloqueada}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
    >
      <div className="flex items-center gap-3">
        {negocio.logoUrl ? (
          <img
            src={negocio.logoUrl}
            alt={`Logo de ${negocio.nombre}`}
            className="size-12 shrink-0 rounded-xl border border-border bg-white object-contain p-0.5"
          />
        ) : (
          <span
            className="grid size-12 shrink-0 place-items-center rounded-xl"
            style={{
              backgroundColor: negocio.colorPrimario,
              color: textoSobre(negocio.colorPrimario),
            }}
          >
            <Building2 className="size-6" />
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-foreground">{negocio.nombre}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span
              className="size-3.5 rounded-full border border-black/10"
              style={{ backgroundColor: negocio.colorPrimario }}
            />
            <span
              className="size-3.5 rounded-full border border-black/10"
              style={{ backgroundColor: negocio.colorSecundario }}
            />
          </div>
        </div>
      </div>
      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
        {abriendo ? "Abriendo…" : "Abrir sistema"}
        {!abriendo && (
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        )}
      </span>
    </button>
  );
}

function Sistemas() {
  const navigate = useNavigate();
  const { cargando, usuario } = useSesion();

  const [sistemas, setSistemas] = useState<NegocioGuardado[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [abriendoId, setAbriendoId] = useState<number | null>(null);

  // Ruta protegida: sin sesión va a /login; el personal trabaja directo en su sistema.
  useEffect(() => {
    if (cargando) return;
    if (!usuario) navigate({ to: "/login", replace: true });
    else if (usuario.tipo === "PERSONAL") navigate({ to: "/panel", replace: true });
  }, [cargando, usuario, navigate]);

  const esDueno = !cargando && usuario?.tipo === "DUENO";

  const cargar = useCallback(async () => {
    setError(null);
    setSistemas(null);
    const r = await listarSistemas();
    if (r.ok) setSistemas(r.sistemas);
    else setError(r.error);
  }, []);

  useEffect(() => {
    if (esDueno) void cargar();
  }, [esDueno, cargar]);

  const abrir = async (negocio: NegocioGuardado) => {
    if (abriendoId !== null) return;
    setAbriendoId(negocio.id);
    setError(null);
    const r = await seleccionarSistema(negocio.id);
    if (!r.ok) {
      setAbriendoId(null);
      setError(r.error);
      return;
    }
    navigate({ to: "/panel" });
  };

  const salir = () => {
    cerrarSesion();
    navigate({ to: "/login" });
  };

  if (!esDueno) return <div className="min-h-screen bg-background" aria-busy="true" />;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-lg font-bold tracking-tight text-foreground">
              Cuadra<span className="text-primary">Stock</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-[16rem] truncate text-sm text-muted-foreground sm:inline">
              {usuario?.correo}
            </span>
            <button
              type="button"
              onClick={salir}
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
            >
              <LogOut className="size-4" />
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Mis sistemas</h1>
            <p className="mt-2 text-muted-foreground">
              Elige el negocio que quieres administrar o crea uno nuevo.
            </p>
          </div>
          {sistemas !== null && sistemas.length > 0 && (
            <button
              type="button"
              onClick={() => navigate({ to: "/registro" })}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25"
            >
              <Plus className="size-4" />
              Crear
            </button>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            <AlertCircle className="size-4 shrink-0" />
            <span className="flex-1">{error}</span>
            {sistemas === null && (
              <button
                type="button"
                onClick={() => void cargar()}
                className="font-semibold underline underline-offset-2"
              >
                Reintentar
              </button>
            )}
          </div>
        )}

        {sistemas === null && !error && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-2xl border border-border bg-muted/60"
              />
            ))}
          </div>
        )}

        {sistemas !== null && sistemas.length === 0 && (
          <section className="mt-8 rounded-2xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
            <span className="mx-auto grid size-14 place-items-center rounded-full bg-accent text-accent-foreground">
              <Building2 className="size-7" />
            </span>
            <h2 className="mt-5 text-xl font-semibold text-foreground">Aún no tienes sistemas</h2>
            <p className="mx-auto mt-2 max-w-sm text-muted-foreground">
              Crea el primero con los datos de tu negocio y te armamos el inventario.
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: "/registro" })}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25"
            >
              <Plus className="size-5" />
              Crear
            </button>
          </section>
        )}

        {sistemas !== null && sistemas.length > 0 && (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sistemas.map((s) => (
              <TarjetaSistema
                key={s.id}
                negocio={s}
                abriendo={abriendoId === s.id}
                bloqueada={abriendoId !== null}
                onAbrir={() => void abrir(s)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
