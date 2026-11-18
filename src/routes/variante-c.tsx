import { createFileRoute } from "@tanstack/react-router";
import {
  BellRing,
  CheckCircle2,
  ClipboardX,
  Cpu,
  FileSpreadsheet,
  LogIn,
  PackageCheck,
  PackageX,
  SlidersHorizontal,
  Smartphone,
  Terminal,
  ArrowRight,
} from "lucide-react";
import heroDashboard from "@/assets/hero-dashboard.png";
import { Reveal } from "@/components/landing/reveal";

export const Route = createFileRoute("/variante-c")({
  head: () => ({
    meta: [
      {
        title: "CuadraStock — Tu inventario en tiempo real, sin programar",
      },
      {
        name: "description",
        content:
          "Un motor de inventario personalizado para bodegas, ferreterías, boticas y tiendas de ropa del Perú. Datos en vivo, alertas automáticas y cero planillas.",
      },
      {
        property: "og:title",
        content: "CuadraStock — Inventario en tiempo real, sin escribir código",
      },
      {
        property: "og:description",
        content:
          "Sistema de inventario a la medida de tu negocio en minutos. Sincronización en vivo, alertas de stock bajo y reportes listos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VarianteC,
});

function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex size-8 items-center justify-center rounded-lg border border-primary/40 bg-primary/10 text-primary shadow-[0_0_18px_-4px] shadow-primary/50 ${className ?? ""}`}
    >
      <Cpu className="size-4.5" strokeWidth={2.2} />
    </span>
  );
}

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

function EtiquetaViva({ texto }: { texto: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-primary">
      <span className="pulso size-1.5 rounded-full bg-primary" />
      {texto}
    </span>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Cuadra<span className="text-primary">Stock</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 font-mono text-xs uppercase tracking-widest text-muted-foreground md:flex">
          <a href="#como-funciona" className="transition-colors hover:text-primary">
            Cómo funciona
          </a>
          <a href="#beneficios" className="transition-colors hover:text-primary">
            Beneficios
          </a>
          <a href="#contacto" className="transition-colors hover:text-primary">
            Contacto
          </a>
        </nav>

        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-all hover:border-primary/50 hover:shadow-[0_0_20px_-6px] hover:shadow-primary/50"
        >
          <GoogleIcon className="size-4" />
          <span className="hidden sm:inline">Iniciar sesión con Google</span>
          <span className="sm:hidden">Iniciar sesión</span>
        </button>
      </div>
    </header>
  );
}

const datosEnVivo = [
  { texto: "sync: en vivo", clases: "-left-5 top-10 text-success" },
  { texto: "stock_bajo: 2 alertas", clases: "-right-6 top-32 text-destructive" },
  { texto: "ventas_hoy: S/ 1,240", clases: "-left-8 bottom-20 text-primary" },
];

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="fondo-malla pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] opacity-40" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-gradient-to-b from-transparent via-background/40 to-background"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 -z-10 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-24">
        <Reveal className="mx-auto max-w-3xl text-center">
          <EtiquetaViva texto="motor de inventario v2.0" />
          <h1 className="mt-5 font-mono text-3xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl [&_strong]:font-mono [&_strong]:text-primary">
            Tu inventario, <strong className="font-bold">en tiempo real</strong>.
            Sin escribir una línea de código.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            CuadraStock genera un sistema de inventario a la medida de tu negocio en
            minutos: datos claros, alertas automáticas y cero planillas.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#contacto"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-success px-8 py-4 text-base font-semibold text-success-foreground shadow-lg shadow-success/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-success/40 sm:w-auto"
            >
              Crear mi sistema de inventario
              <ArrowRight className="size-5" />
            </a>
            <a
              href="#como-funciona"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/5 px-8 py-4 text-base font-semibold text-primary transition-all hover:-translate-y-0.5 hover:bg-primary/10 sm:w-auto"
            >
              Ver cómo funciona
            </a>
          </div>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
            {["Sin instalar nada", "Empieza gratis", "Listo en 5 minutos"].map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-success" />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={150} className="relative mt-14 sm:mt-16">
          <ul aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 hidden font-mono text-xs lg:block">
            {datosEnVivo.map((d) => (
              <li key={d.texto} className={`absolute ${d.clases} rounded-md border border-border bg-card/90 px-3 py-1.5 shadow-lg backdrop-blur`}>
                {d.texto}
              </li>
            ))}
          </ul>
          <div className="relative mx-auto max-w-5xl rounded-2xl border border-primary/25 bg-card p-2 shadow-2xl shadow-primary/20 sm:p-3">
            <div className="flex items-center gap-1.5 px-3 py-2">
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="ml-3 inline-flex items-center gap-2 hidden rounded-md bg-muted px-3 py-1 font-mono text-xs text-muted-foreground sm:inline-flex">
                <Terminal className="size-3.5" />
                app.cuadrastock.pe/panel
              </span>
              <span className="ml-auto hidden sm:block">
                <EtiquetaViva texto="en vivo" />
              </span>
            </div>
            <img
              src={heroDashboard}
              alt="Panel de inventario de CuadraStock con productos, stock y alertas"
              width={1408}
              height={1008}
              className="w-full rounded-xl border border-border/60"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const problemas = [
  {
    icon: PackageX,
    titulo: "Stock desordenado",
    texto:
      "Nunca sabes con certeza cuánto producto tienes ni qué se está acabando en el estante.",
  },
  {
    icon: ClipboardX,
    titulo: "Pérdidas por falta de control",
    texto:
      "Compras de más lo que no se mueve y te quedas sin lo que sí se vende. Dinero que se va por la borda.",
  },
  {
    icon: PackageCheck,
    titulo: "Ventas sin registro",
    texto:
      "Las ventas salen por el mostrador y nunca quedan anotadas en ningún lado: imposible saber cuánto vendiste.",
  },
];

function Problema() {
  return (
    <section id="problema" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <EtiquetaViva texto="diagnóstico" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            ¿Te suena familiar?
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Llevar el inventario "de cabeza" le cuesta caro a los negocios como el
            tuyo, todos los días.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {problemas.map((p, i) => (
            <Reveal key={p.titulo} delay={i * 100}>
              <article className="group h-full rounded-2xl border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
                <span className="inline-flex size-12 items-center justify-center rounded-lg border border-destructive/30 bg-destructive/10 text-destructive transition-all group-hover:shadow-[0_0_20px_-6px] group-hover:shadow-destructive/60">
                  <p.icon className="size-6" strokeWidth={2} />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{p.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {p.texto}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const pasos = [
  {
    icon: LogIn,
    titulo: "Inicia sesión con Google",
    texto:
      "Sin registros largos ni contraseñas que olvidar. Con tu cuenta de Google ya puedes empezar.",
  },
  {
    icon: SlidersHorizontal,
    titulo: "Personaliza tu inventario",
    texto:
      "Elige cómo registrar tus productos: categorías, precios, unidades y los atributos que tu negocio necesita.",
  },
  {
    icon: PackageCheck,
    titulo: "Empieza a controlar tu stock",
    texto:
      "Registra entradas y salidas, y recibe alertas cuando un producto esté por acabarse.",
  },
];

function ComoFunciona() {
  return (
    <section id="como-funciona" className="border-y border-border/60 bg-secondary/40 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <EtiquetaViva texto="secuencia de arranque" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Cómo funciona
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Tres pasos y estás listo. No necesitas saber nada de tecnología.
          </p>
        </Reveal>
        <ol className="mt-12 grid gap-6 sm:grid-cols-3">
          {pasos.map((paso, i) => (
            <Reveal key={paso.titulo} delay={i * 100}>
              <li className="relative flex h-full list-none flex-col rounded-2xl border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-4xl font-bold text-primary/25">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="inline-flex size-12 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                    <paso.icon className="size-6" strokeWidth={2} />
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {paso.titulo}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {paso.texto}
                </p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

const beneficios = [
  {
    icon: BellRing,
    titulo: "Alertas de stock bajo",
    texto:
      "CuadraStock te avisa cuando un producto está por acabarse, antes de que un cliente se vaya con las manos vacías.",
  },
  {
    icon: FileSpreadsheet,
    titulo: "Importa desde Excel",
    texto:
      "¿Tus productos en una planilla? Súbela y CuadraStock arma tu catálogo automáticamente.",
  },
  {
    icon: SlidersHorizontal,
    titulo: "Atributos personalizados",
    texto:
      "Cada producto con los datos que tú decides: lote, talla, color, proveedor, fecha de vencimiento y más.",
  },
  {
    icon: Smartphone,
    titulo: "Desde el celular y la PC",
    texto:
      "Revisa y actualiza tu inventario desde el mostrador, la bodega o donde estés.",
  },
];

function Beneficios() {
  return (
    <section id="beneficios" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <EtiquetaViva texto="módulos activos" />
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Lo que CuadraStock hace por ti
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Un sistema sencillo, pensado para negocios reales del Perú.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {beneficios.map((b, i) => (
            <Reveal key={b.titulo} delay={i * 80}>
              <article className="group flex h-full gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 sm:p-7">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-lg border border-accent/30 bg-accent/10 text-accent transition-all group-hover:shadow-[0_0_20px_-6px] group-hover:shadow-accent/60">
                  <b.icon className="size-6" strokeWidth={2} />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{b.titulo}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {b.texto}
                  </p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaFinal() {
  return (
    <section id="contacto" className="pb-16 sm:pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-card px-6 py-14 text-center shadow-2xl shadow-primary/20 sm:px-12 sm:py-16">
            <div aria-hidden="true" className="fondo-malla pointer-events-none absolute inset-0 opacity-30" />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-1/2 top-0 size-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl"
            />
            <div className="relative">
              <EtiquetaViva texto="listo para desplegar" />
              <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Empieza hoy mismo a controlar tu inventario
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
                En pocos minutos tendrás tu sistema de inventario funcionando. Gratis
                para empezar, sin tarjeta de crédito.
              </p>
              <a
                href="#"
                className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-success px-9 py-4 text-base font-semibold text-success-foreground shadow-lg shadow-success/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-success/40"
              >
                Crear mi sistema de inventario
                <ArrowRight className="size-5" />
              </a>
              <p className="mt-4 text-sm text-muted-foreground">
                Solo necesitas tu cuenta de Google.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/70 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
        <a href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-base font-semibold tracking-tight text-foreground">
            Cuadra<span className="text-primary">Stock</span>
          </span>
        </a>
        <div className="text-center text-sm text-muted-foreground sm:text-left">
          <p>
            Escríbenos:{" "}
            <a
              href="mailto:hola@cuadrastock.pe"
              className="font-medium text-primary hover:underline"
            >
              hola@cuadrastock.pe
            </a>
          </p>
          <p className="mt-1">Lima, Perú · Atención de lunes a sábado</p>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          © {new Date().getFullYear()} CuadraStock. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

function VarianteC() {
  return (
    <div className="variante-c min-h-screen bg-background">
      <Navbar />
      <main>
        <Hero />
        <Problema />
        <ComoFunciona />
        <Beneficios />
        <CtaFinal />
      </main>
      <Footer />
    </div>
  );
}
