import { createFileRoute } from "@tanstack/react-router";
import {
  BellRing,
  CheckCircle2,
  ClipboardX,
  FileSpreadsheet,
  LogIn,
  PackageCheck,
  PackageX,
  PartyPopper,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  Store,
  ArrowRight,
} from "lucide-react";
import heroDashboard from "@/assets/hero-dashboard.png";
import { Reveal } from "@/components/landing/reveal";

export const Route = createFileRoute("/variante-b")({
  head: () => ({
    meta: [
      {
        title: "CuadraStock Color — Inventario fácil para tu negocio",
      },
      {
        name: "description",
        content:
          "Arma tu sistema de inventario en minutos sin saber programar. Pensado para bodegas, ferreterías, boticas y tiendas de ropa del Perú.",
      },
      { property: "og:title", content: "CuadraStock — ¡Chau a las planillas enredadas!" },
      {
        property: "og:description",
        content:
          "Tu inventario ordenado desde el celular o la PC. Empieza gratis y en 5 minutos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VarianteB,
});

function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex size-9 rotate-3 items-center justify-center rounded-2xl rounded-br-md bg-primary text-primary-foreground shadow-md ${className ?? ""}`}
    >
      <Store className="size-5" strokeWidth={2.2} />
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

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-lg font-extrabold tracking-tight text-foreground">
            Cuadra<span className="text-primary">Stock</span>
          </span>
        </a>

        <nav className="hidden items-center gap-7 text-sm font-bold text-muted-foreground md:flex">
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
          className="inline-flex items-center gap-2 rounded-full border-2 border-border bg-card px-4 py-2 text-sm font-bold text-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
        >
          <GoogleIcon className="size-4" />
          <span className="hidden sm:inline">Iniciar sesión con Google</span>
          <span className="sm:hidden">Iniciar sesión</span>
        </button>
      </div>
    </header>
  );
}

const pegatinas = [
  { texto: "¡Stock listo!", clases: "-left-4 top-8 bg-secondary text-secondary-foreground", lento: true, rot: "-6deg" },
  { texto: "Vendiste 12 hoy", clases: "-right-5 top-24 bg-accent text-accent-foreground", lento: false, rot: "5deg" },
  { texto: "Arroz PayPal: quedan 4", clases: "-left-6 bottom-16 bg-primary text-primary-foreground", lento: false, rot: "4deg" },
];

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px] bg-gradient-to-b from-secondary via-accent/60 to-background"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 right-[-120px] -z-10 size-72 rounded-full bg-secondary blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[-140px] top-64 -z-10 size-80 rounded-full bg-accent/70 blur-3xl"
      />

      <div className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-24">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border-2 border-primary/25 bg-card px-4 py-1.5 text-xs font-bold text-primary shadow-sm">
            <Sparkles className="size-4" />
            Hecho para bodegas, ferreterías, boticas y tiendas de ropa
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            ¡Chau a las planillas! Tu inventario,{" "}
            <span className="relative inline-block text-primary">
              ordenadito
              <svg
                aria-hidden="true"
                viewBox="0 0 220 14"
                className="absolute -bottom-2 left-0 w-full text-success"
                preserveAspectRatio="none"
              >
                <path d="M4 10 Q 55 2 110 8 T 216 6" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              </svg>
            </span>{" "}
            y sin enredos.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg font-medium text-muted-foreground">
            CuadraStock arma tu sistema de inventario en minutos, sin tecnicismos:
            como tu libreta de apuntes, pero en el celular y sin hojas perdidas.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#contacto"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-success px-8 py-4 text-base font-extrabold text-success-foreground shadow-lg shadow-success/30 transition-transform hover:-translate-y-1 hover:scale-[1.02] sm:w-auto"
            >
              Crear mi sistema de inventario
              <ArrowRight className="size-5" />
            </a>
            <a
              href="#como-funciona"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-card px-8 py-4 text-base font-bold text-foreground transition-all hover:-translate-y-1 hover:border-primary hover:shadow-md sm:w-auto"
            >
              Ver cómo funciona
            </a>
          </div>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-semibold text-muted-foreground">
            {["Sin instalar nada", "Empieza gratis", "Listo en 5 minutos"].map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-success" />
                {item}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={150} className="relative mt-14 sm:mt-16">
          <ul aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
            {pegatinas.map((s) => (
              <li
                key={s.texto}
                className={`absolute ${s.clases} ${s.lento ? "flotar-lento" : "flotar"} rounded-2xl rounded-tr-md px-3.5 py-2 text-xs font-extrabold shadow-lg`}
                style={{ ["--rot" as string]: s.rot, rotate: s.rot }}
              >
                {s.texto}
              </li>
            ))}
          </ul>
          <div className="relative mx-auto max-w-5xl rotate-1 rounded-3xl border-4 border-primary/15 bg-card p-2 shadow-2xl shadow-primary/20 sm:p-3">
            <div className="flex items-center gap-1.5 px-3 py-2">
              <span className="size-3 rounded-full bg-destructive/70" />
              <span className="size-3 rounded-full bg-success/70" />
              <span className="size-3 rounded-full bg-secondary-foreground/40" />
              <span className="ml-3 hidden rounded-lg bg-secondary px-3 py-1 text-xs font-bold text-secondary-foreground sm:block">
                app.cuadrastock.pe/panel
              </span>
            </div>
            <img
              src={heroDashboard}
              alt="Panel de inventario de CuadraStock con productos, stock y alertas"
              width={1408}
              height={1008}
              className="w-full rounded-2xl border-2 border-border/60"
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
    color: "bg-destructive/10 text-destructive",
    titulo: "Stock desordenado",
    texto:
      "Nunca sabes con certeza cuánto producto tienes ni qué se está acabando en el estante.",
  },
  {
    icon: ClipboardX,
    color: "bg-secondary text-secondary-foreground",
    titulo: "Pérdidas por falta de control",
    texto:
      "Compras de más lo que no se mueve y te quedas sin lo que sí se vende. Plata que se va por la borda.",
  },
  {
    icon: PackageCheck,
    color: "bg-accent text-accent-foreground",
    titulo: "Ventas sin registro",
    texto:
      "Las ventas salen por el mostrador y no quedan anotadas en ningún lado: imposible saber cuánto vendiste.",
  },
];

function Problema() {
  return (
    <section id="problema" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-destructive/10 px-4 py-1.5 text-xs font-extrabold text-destructive">
            El desorden no da tregua
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            ¿Te suena esta película?
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Llevar el inventario "de cabeza" le cuesta caro a los negocios como el
            tuyo, todos los días.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {problemas.map((p, i) => (
            <Reveal key={p.titulo} delay={i * 100}>
              <article className="h-full rounded-3xl border-2 border-dashed border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-lg hover:shadow-primary/10">
                <span className={`sacudir-hover inline-flex size-12 items-center justify-center rounded-2xl rounded-tr-md ${p.color}`}>
                  <p.icon className="size-6" strokeWidth={2.2} />
                </span>
                <h3 className="mt-5 text-lg font-extrabold text-foreground">{p.titulo}</h3>
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
    color: "bg-primary text-primary-foreground",
    titulo: "Inicia sesión con Google",
    texto:
      "Sin registros largos ni contraseñas que olvidar. Con tu cuenta de Google ya puedes empezar.",
  },
  {
    icon: SlidersHorizontal,
    color: "bg-success text-success-foreground",
    titulo: "Personaliza tu inventario",
    texto:
      "Elige cómo registrar tus productos: categorías, precios, unidades y lo que tu negocio necesita.",
  },
  {
    icon: PackageCheck,
    color: "bg-secondary text-secondary-foreground",
    titulo: "Empieza a controlar tu stock",
    texto:
      "Registra entradas y salidas, y recibe alertas cuando un producto esté por acabarse.",
  },
];

function ComoFunciona() {
  return (
    <section id="como-funciona" className="relative bg-secondary/60 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-1.5 text-xs font-extrabold text-primary-foreground">
            Facilito, facilito
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Cómo funciona
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Tres pasos y ya está. No necesitas saber nada de tecnología.
          </p>
        </Reveal>
        <ol className="mt-12 grid gap-6 sm:grid-cols-3">
          {pasos.map((paso, i) => (
            <Reveal key={paso.titulo} delay={i * 100}>
              <li className="relative flex h-full list-none flex-col items-center rounded-3xl border-2 border-border bg-card p-7 text-center shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-lg hover:shadow-primary/10">
                <span
                  className={`sacudir-hover absolute -top-4 left-1/2 -translate-x-1/2 rounded-full ${paso.color} px-4 py-1.5 text-xs font-extrabold shadow-md`}
                >
                  Paso {i + 1}
                </span>
                <span className={`inline-flex size-14 items-center justify-center rounded-2xl rounded-bl-md ${paso.color} opacity-90`}>
                  <paso.icon className="size-7" strokeWidth={2.2} />
                </span>
                <h3 className="mt-5 text-lg font-extrabold text-foreground">
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
    color: "bg-primary/10 text-primary",
    titulo: "Alertas de stock bajo",
    texto:
      "CuadraStock te avisa cuando un producto está por acabarse, antes de que un cliente se vaya con las manos vacías.",
  },
  {
    icon: FileSpreadsheet,
    color: "bg-success/10 text-success",
    titulo: "Importa desde Excel",
    texto:
      "¿Tus productos en una planilla? Súbela y CuadraStock arma tu catálogo automáticamente.",
  },
  {
    icon: SlidersHorizontal,
    color: "bg-secondary text-secondary-foreground",
    titulo: "Atributos personalizados",
    texto:
      "Cada producto con los datos que tú decides: lote, talla, color, proveedor, fecha de vencimiento y más.",
  },
  {
    icon: Smartphone,
    color: "bg-accent text-accent-foreground",
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
          <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-xs font-extrabold text-accent-foreground">
            <PartyPopper className="size-4" />
            Lo mejor para tu negocio
          </span>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Lo que CuadraStock hace por ti
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Un sistema sencillo, pensado para negocios reales del Perú.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {beneficios.map((b, i) => (
            <Reveal key={b.titulo} delay={i * 80}>
              <article className="flex h-full gap-5 rounded-3xl border-2 border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1.5 hover:shadow-lg hover:shadow-primary/10 sm:p-7">
                <span className={`sacudir-hover inline-flex size-12 shrink-0 items-center justify-center rounded-2xl rounded-tr-md ${b.color}`}>
                  <b.icon className="size-6" strokeWidth={2.2} />
                </span>
                <div>
                  <h3 className="text-lg font-extrabold text-foreground">{b.titulo}</h3>
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
          <div className="relative overflow-hidden rounded-4xl bg-primary px-6 py-14 text-center shadow-2xl shadow-primary/30 sm:px-12 sm:py-16">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -left-16 -top-16 size-56 rounded-full bg-secondary/30 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-20 -right-10 size-64 rounded-full bg-success/25 blur-2xl"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute right-16 top-8 size-10 rotate-12 rounded-2xl rounded-tr-md bg-secondary/50"
            />
            <h2 className="relative mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-primary-foreground sm:text-4xl">
              Empieza hoy mismo a controlar tu inventario
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-lg text-primary-foreground/85">
              En pocos minutos tendrás tu sistema de inventario funcionando. Gratis
              para empezar, sin tarjeta de crédito.
            </p>
            <a
              href="#"
              className="relative mt-8 inline-flex items-center justify-center gap-2 rounded-2xl bg-success px-9 py-4 text-base font-extrabold text-success-foreground shadow-lg shadow-black/15 transition-transform hover:-translate-y-1 hover:scale-[1.03]"
            >
              Crear mi sistema de inventario
              <ArrowRight className="size-5" />
            </a>
            <p className="relative mt-4 text-sm font-semibold text-primary-foreground/75">
              Solo necesitas tu cuenta de Google.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t-2 border-dashed border-border bg-secondary/40 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
        <a href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-base font-extrabold tracking-tight text-foreground">
            Cuadra<span className="text-primary">Stock</span>
          </span>
        </a>
        <div className="text-center text-sm text-muted-foreground sm:text-left">
          <p>
            Escríbenos:{" "}
            <a
              href="mailto:hola@cuadrastock.pe"
              className="font-bold text-primary hover:underline"
            >
              hola@cuadrastock.pe
            </a>
          </p>
          <p className="mt-1">Lima, Perú · Atención de lunes a sábado</p>
        </div>
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} CuadraStock. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

function VarianteB() {
  return (
    <div className="variante-b min-h-screen bg-background">
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
