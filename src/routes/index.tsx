import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BellRing,
  CheckCircle2,
  ClipboardX,
  FileSpreadsheet,
  LogIn,
  PackageCheck,
  PackageX,
  SlidersHorizontal,
  Smartphone,
  ArrowRight,
} from "lucide-react";
import heroDashboard from "@/assets/hero-dashboard.png";
import { Reveal } from "@/components/landing/reveal";
import { useDestinoAcceso } from "@/lib/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title: "CuadraStock — Sistema de inventario para tu negocio",
      },
      {
        name: "description",
        content:
          "Crea en minutos un sistema de inventario a la medida de tu bodega, ferretería, botica o tienda de ropa. Sin saber programar.",
      },
      { property: "og:title", content: "CuadraStock — Tu inventario bajo control" },
      {
        property: "og:description",
        content:
          "Sistema de inventario personalizado para minoristas del Perú. Sin planillas enredadas, sin saber programar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground ${className ?? ""}`}
    >
      <PackageCheck className="size-5" strokeWidth={2.2} />
    </span>
  );
}

function Navbar() {
  const destino = useDestinoAcceso();

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-lg font-bold tracking-tight text-foreground">
            Cuadra<span className="text-primary">Stock</span>
          </span>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
          <a href="#como-funciona" className="transition-colors hover:text-foreground">
            Cómo funciona
          </a>
          <a href="#beneficios" className="transition-colors hover:text-foreground">
            Beneficios
          </a>
          <a href="#contacto" className="transition-colors hover:text-foreground">
            Contacto
          </a>
        </nav>

        <Link
          to={destino}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
        >
          {destino === "/login" ? "Iniciar sesión" : "Ir a mi cuenta"}
        </Link>
      </div>
    </header>
  );
}

function Hero() {
  const destino = useDestinoAcceso();

  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-gradient-to-b from-secondary to-background"
      />
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:px-6 sm:pt-24 sm:pb-28">
        <Reveal className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card px-4 py-1.5 text-xs font-semibold text-primary shadow-sm">
            Hecho para bodegas, ferreterías, boticas y tiendas de ropa
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Tu inventario, bajo control.{" "}
            <span className="text-primary">Sin saber programar.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            CuadraStock crea un sistema de inventario a la medida de tu negocio en
            minutos: adiós a las planillas enredadas y a las pérdidas.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to={destino}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-success px-8 py-4 text-base font-semibold text-success-foreground shadow-lg shadow-success/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-success/30 sm:w-auto"
            >
              Crear mi sistema de inventario
              <ArrowRight className="size-5" />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex w-full items-center justify-center rounded-full border border-border bg-card px-8 py-4 text-base font-semibold text-foreground shadow-sm transition-all hover:border-primary/40 hover:shadow-md sm:w-auto"
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

        <Reveal delay={150} className="mt-14 sm:mt-16">
          <div className="relative mx-auto max-w-5xl rounded-2xl border border-border bg-card p-2 shadow-2xl shadow-primary/10 sm:p-3">
            <div className="flex items-center gap-1.5 px-3 py-2">
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="ml-3 hidden rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground sm:block">
                app.cuadrastock.pe/panel
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
      "Las ventas salen por el mostrador y nunca quedan anotadas en ningún lado, imposible saber cuánto vendiste.",
  },
];

function Problema() {
  return (
    <section id="problema" className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
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
              <article className="h-full rounded-2xl border border-border bg-card p-7 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5">
                <span className="inline-flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
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
    titulo: "Crea tu cuenta",
    texto:
      "Regístrate con tu correo en un minuto, sin trámites largos. Luego registras tu negocio.",
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
    <section id="como-funciona" className="bg-secondary/50 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Cómo funciona
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Tres pasos y estás listo. No necesitas saber nada de tecnología.
          </p>
        </Reveal>
        <ol className="mt-12 grid gap-6 sm:grid-cols-3">
          {pasos.map((paso, i) => (
            <Reveal key={paso.titulo} delay={i * 100}>
              <li className="relative flex h-full list-none flex-col items-center rounded-2xl border border-border bg-card p-7 text-center shadow-sm">
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  Paso {i + 1}
                </span>
                <span className="inline-flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <paso.icon className="size-7" strokeWidth={2} />
                </span>
                <h3 className="mt-5 text-lg font-semibold text-foreground">
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
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Lo que CuadraStock hace por ti
          </h2>
          <p className="mt-3 text-lg text-muted-foreground">
            Un sistema sencillo, pensado para negocios reales del Perú.
          </p>
        </Reveal>
        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {beneficios.map((b, i) => (
            <Reveal key={b.titulo} delay={i * 80}>
              <article className="flex h-full gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/5 sm:p-7">
                <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
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
  const destino = useDestinoAcceso();

  return (
    <section id="contacto" className="pb-16 sm:pb-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <div className="overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center shadow-xl shadow-primary/20 sm:px-12 sm:py-16">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Empieza hoy mismo a controlar tu inventario
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-primary-foreground/80">
              En pocos minutos tendrás tu sistema de inventario funcionando. Gratis
              para empezar, sin tarjeta de crédito.
            </p>
            <Link
              to={destino}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-success px-9 py-4 text-base font-semibold text-success-foreground shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              Crear mi sistema de inventario
              <ArrowRight className="size-5" />
            </Link>
            <p className="mt-4 text-sm text-primary-foreground/70">
              Solo necesitas tu correo para empezar.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
        <a href="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-base font-bold tracking-tight text-foreground">
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
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} CuadraStock. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}

function Index() {
  return (
    <div className="min-h-screen bg-background">
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