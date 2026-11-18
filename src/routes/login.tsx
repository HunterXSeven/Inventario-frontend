import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, Eye, EyeOff, PackageCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { destinoPara, iniciarSesion, registrarUsuario, useSesion } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "CuadraStock — Inicia sesión" },
      {
        name: "description",
        content:
          "Inicia sesión o crea tu cuenta en CuadraStock para registrar tu negocio y armar tu sistema de inventario.",
      },
    ],
  }),
  component: Login,
});

/* ============================================================
   Modelo y validaciones
   ============================================================ */

type Vista = "login" | "registro";
type Errores = Record<string, string>;

interface Campos {
  nombre: string;
  correo: string;
  contrasena: string;
  confirmar: string;
}

const camposVacios: Campos = { nombre: "", correo: "", contrasena: "", confirmar: "" };
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validarCorreo(correo: string): string | null {
  if (!correo.trim()) return "Escribe tu correo electrónico.";
  if (!REGEX_CORREO.test(correo.trim())) return "Escribe un correo válido, como nombre@correo.com.";
  return null;
}

export function validarInicioSesion(c: Campos): Errores {
  const errores: Errores = {};
  const errorCorreo = validarCorreo(c.correo);
  if (errorCorreo) errores.correo = errorCorreo;
  if (!c.contrasena) errores.contrasena = "Escribe tu contraseña.";
  return errores;
}

export function validarRegistroCuenta(c: Campos): Errores {
  const errores: Errores = {};
  if (!c.nombre.trim()) errores.nombre = "Escribe tu nombre completo.";
  const errorCorreo = validarCorreo(c.correo);
  if (errorCorreo) errores.correo = errorCorreo;
  if (c.contrasena.length < 8) errores.contrasena = "Usa al menos 8 caracteres.";
  if (!c.confirmar) errores.confirmar = "Repite tu contraseña.";
  else if (c.confirmar !== c.contrasena) errores.confirmar = "Las contraseñas no coinciden.";
  return errores;
}

/* ============================================================
   Piezas de interfaz
   ============================================================ */

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

function LogoMark() {
  return (
    <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
      <PackageCheck className="size-5" strokeWidth={2.2} />
    </span>
  );
}

const claseInput = (conError: boolean) =>
  cn(
    "w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground",
    conError
      ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20"
      : "border-input focus:border-primary/50 focus:ring-2 focus:ring-ring/30",
  );

function MensajeError({ id, mensaje }: { id: string; mensaje: string }) {
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1.5 text-sm text-destructive">
      <AlertCircle className="size-4 shrink-0" />
      {mensaje}
    </p>
  );
}

function Campo({
  id,
  etiqueta,
  error,
  children,
}: {
  id: string;
  etiqueta: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {etiqueta}
      </label>
      <div className="mt-2">{children}</div>
      {error && <MensajeError id={`${id}-error`} mensaje={error} />}
    </div>
  );
}

/* ============================================================
   Página
   ============================================================ */

function Login() {
  const navigate = useNavigate();
  const { cargando, usuario } = useSesion();

  const [vista, setVista] = useState<Vista>("login");
  const [campos, setCampos] = useState<Campos>(camposVacios);
  const [errores, setErrores] = useState<Errores>({});
  const [verContrasena, setVerContrasena] = useState(false);
  const [avisoGoogle, setAvisoGoogle] = useState(false);

  const esLogin = vista === "login";

  // Si ya hay una sesión iniciada, lleva al usuario a donde corresponde.
  useEffect(() => {
    if (!cargando && usuario) navigate({ to: destinoPara(usuario), replace: true });
  }, [cargando, usuario, navigate]);

  const setCampo = (campo: keyof Campos, valor: string) => {
    setCampos((prev) => ({ ...prev, [campo]: valor }));
    if (errores[campo] || errores.general) {
      setErrores((prev) => {
        const { [campo]: _quitado, general: _general, ...resto } = prev;
        return resto;
      });
    }
  };

  const cambiarVista = (nueva: Vista) => {
    setVista(nueva);
    setErrores({});
    setVerContrasena(false);
    setCampos((prev) => ({ ...camposVacios, correo: prev.correo }));
  };

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevosErrores = esLogin ? validarInicioSesion(campos) : validarRegistroCuenta(campos);
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    if (esLogin) {
      const resultado = iniciarSesion(campos.correo, campos.contrasena);
      if (!resultado.ok) {
        setErrores({ [resultado.campo]: resultado.error });
        return;
      }
      navigate({ to: destinoPara(resultado.usuario) });
    } else {
      const resultado = registrarUsuario({
        nombre: campos.nombre,
        correo: campos.correo,
        contrasena: campos.contrasena,
      });
      if (!resultado.ok) {
        setErrores({ [resultado.campo]: resultado.error });
        return;
      }
      navigate({ to: "/registro" });
    }
  };

  const botonContrasena = (
    <button
      type="button"
      onClick={() => setVerContrasena((v) => !v)}
      aria-label={verContrasena ? "Ocultar contraseña" : "Mostrar contraseña"}
      className="absolute inset-y-0 right-0 grid w-12 place-items-center text-muted-foreground transition-colors hover:text-foreground"
    >
      {verContrasena ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );

  const tipoContrasena = verContrasena ? "text" : "password";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-background/85">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-lg font-bold tracking-tight text-foreground">
              Cuadra<span className="text-primary">Stock</span>
            </span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            Volver al inicio
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <div className="grid overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-primary/10 md:grid-cols-[minmax(0,1fr)_minmax(0,0.8fr)]">
          {/* Formulario */}
          <section className="p-6 sm:p-10">
            <div
              key={vista}
              className="animate-in fade-in slide-in-from-left-4 duration-300 motion-reduce:animate-none"
            >
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                {esLogin ? "Inicia sesión" : "Crea tu cuenta"}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {esLogin
                  ? "Entra para seguir con tu sistema de inventario."
                  : "Después de crear tu cuenta, registrarás tu negocio en 2 pasos."}
              </p>

              <button
                type="button"
                onClick={() => setAvisoGoogle(true)}
                className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
              >
                <GoogleIcon className="size-4" />
                Continuar con Google
              </button>
              {avisoGoogle && (
                <p role="status" className="mt-2 text-xs text-muted-foreground">
                  El acceso con Google se activará cuando conectemos el servidor. Por ahora usa tu
                  correo.
                </p>
              )}

              <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                o usa tu correo
                <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={enviar} noValidate className="space-y-5">
                {errores.general && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    {errores.general}
                  </div>
                )}

                {!esLogin && (
                  <Campo id="nombre" etiqueta="Nombre completo" error={errores.nombre}>
                    <input
                      id="nombre"
                      type="text"
                      autoComplete="name"
                      placeholder="Ej. María Quispe"
                      value={campos.nombre}
                      onChange={(e) => setCampo("nombre", e.target.value)}
                      aria-invalid={!!errores.nombre}
                      aria-describedby={errores.nombre ? "nombre-error" : undefined}
                      className={claseInput(!!errores.nombre)}
                    />
                  </Campo>
                )}

                <Campo id="correo" etiqueta="Correo electrónico" error={errores.correo}>
                  <input
                    id="correo"
                    type="email"
                    autoComplete="email"
                    placeholder="nombre@correo.com"
                    value={campos.correo}
                    onChange={(e) => setCampo("correo", e.target.value)}
                    aria-invalid={!!errores.correo}
                    aria-describedby={errores.correo ? "correo-error" : undefined}
                    className={claseInput(!!errores.correo)}
                  />
                </Campo>

                <Campo id="contrasena" etiqueta="Contraseña" error={errores.contrasena}>
                  <div className="relative">
                    <input
                      id="contrasena"
                      type={tipoContrasena}
                      autoComplete={esLogin ? "current-password" : "new-password"}
                      placeholder={esLogin ? "Tu contraseña" : "Mínimo 8 caracteres"}
                      value={campos.contrasena}
                      onChange={(e) => setCampo("contrasena", e.target.value)}
                      aria-invalid={!!errores.contrasena}
                      aria-describedby={errores.contrasena ? "contrasena-error" : undefined}
                      className={cn(claseInput(!!errores.contrasena), "pr-12")}
                    />
                    {botonContrasena}
                  </div>
                </Campo>

                {!esLogin && (
                  <Campo id="confirmar" etiqueta="Confirmar contraseña" error={errores.confirmar}>
                    <input
                      id="confirmar"
                      type={tipoContrasena}
                      autoComplete="new-password"
                      placeholder="Repite tu contraseña"
                      value={campos.confirmar}
                      onChange={(e) => setCampo("confirmar", e.target.value)}
                      aria-invalid={!!errores.confirmar}
                      aria-describedby={errores.confirmar ? "confirmar-error" : undefined}
                      className={claseInput(!!errores.confirmar)}
                    />
                  </Campo>
                )}

                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-primary/25"
                >
                  {esLogin ? "Iniciar sesión" : "Crear cuenta"}
                </button>
              </form>

              {/* En pantallas pequeñas el panel azul se oculta: el cambio va aquí. */}
              <p className="mt-6 text-center text-sm text-muted-foreground md:hidden">
                {esLogin ? "¿Aún no tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
                <button
                  type="button"
                  onClick={() => cambiarVista(esLogin ? "registro" : "login")}
                  className="font-semibold text-primary hover:underline"
                >
                  {esLogin ? "Regístrate" : "Inicia sesión"}
                </button>
              </p>
            </div>
          </section>

          {/* Panel azul */}
          <aside className="hidden flex-col items-center justify-center gap-4 bg-gradient-to-br from-primary to-[oklch(0.38_0.12_262)] p-10 text-center text-primary-foreground md:flex">
            <h2 className="text-3xl font-bold tracking-tight">
              {esLogin ? "¡Hola de nuevo!" : "¡Bienvenido a CuadraStock!"}
            </h2>
            <p className="max-w-xs text-primary-foreground/85">
              {esLogin
                ? "¿Aún no tienes cuenta? Créala y registra tu negocio en 2 pasos."
                : "¿Ya tienes cuenta? Inicia sesión y sigue donde lo dejaste."}
            </p>
            <button
              type="button"
              onClick={() => cambiarVista(esLogin ? "registro" : "login")}
              className="mt-2 rounded-full border-2 border-primary-foreground/70 px-8 py-3 text-sm font-semibold transition-colors hover:bg-primary-foreground/10"
            >
              {esLogin ? "Crear cuenta" : "Iniciar sesión"}
            </button>
          </aside>
        </div>
      </main>
    </div>
  );
}