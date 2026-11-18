import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ImagePlus,
  PackageCheck,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { guardarNegocio, useSesion } from "@/lib/auth";

export const Route = createFileRoute("/registro")({
  head: () => ({
    meta: [
      { title: "CuadraStock — Registra tu negocio" },
      {
        name: "description",
        content:
          "Registra tu negocio en 2 pasos y CuadraStock preparará tu sistema de inventario personalizado. Empieza gratis, sin saber programar.",
      },
      { property: "og:title", content: "CuadraStock — Registra tu negocio" },
      {
        property: "og:description",
        content:
          "Registra tu negocio en 2 pasos y empieza a controlar tu inventario. Gratis para empezar, sin tarjeta de crédito.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Registro,
});

/* ============================================================
   Modelo de datos del formulario
   ============================================================ */

interface LogoNegocio {
  nombreArchivo: string;
  dataUrl: string;
}

export interface DatosNegocio {
  // Paso 1: identidad del negocio
  nombre: string;
  logo: LogoNegocio | null;
  colorPrimario: string;
  colorSecundario: string;
  // Paso 2: datos del negocio
  rubro: string;
  ruc: string;
  direccion: string;
  distrito: string;
  telefono: string;
}

const RUBROS = [
  "Bodega",
  "Ferretería",
  "Botica",
  "Tienda de ropa",
  "Librería",
  "Otro",
];

const COLOR_PRIMARIO_PREDETERMINADO = "#2563eb";
const COLOR_SECUNDARIO_PREDETERMINADO = "#16a34a";

const PRESELECCIONES_PRIMARIO = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#ea580c",
  "#0d9488",
  "#475569",
];
const PRESELECCIONES_SECUNDARIO = [
  "#16a34a",
  "#0ea5e9",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#2563eb",
];

/**
 * Configuración de pasos del wizard.
 * Para agregar un paso nuevo (por ejemplo, "Configuración del inventario"),
 * añádelo a esta lista y crea su componente en `renderPaso`; la barra de
 * progreso y la navegación se ajustan solas.
 */
const pasosConfig = [
  {
    id: "identidad",
    titulo: "Identidad del negocio",
    descripcion: "Cuéntanos cómo se llama tu negocio y cómo se verá.",
  },
  {
    id: "datos",
    titulo: "Datos del negocio",
    descripcion: "Unos datos básicos para dejar todo listo.",
  },
] as const;

type Errores = Record<string, string>;

const datosIniciales: DatosNegocio = {
  nombre: "",
  logo: null,
  colorPrimario: COLOR_PRIMARIO_PREDETERMINADO,
  colorSecundario: COLOR_SECUNDARIO_PREDETERMINADO,
  rubro: "",
  ruc: "",
  direccion: "",
  distrito: "",
  telefono: "",
};

/** Elige texto claro u oscuro según el fondo, para que el botón siempre se lea. */
function textoSobre(hex: string): string {
  const limpio = hex.replace("#", "");
  const r = parseInt(limpio.slice(0, 2), 16) || 0;
  const g = parseInt(limpio.slice(2, 4), 16) || 0;
  const b = parseInt(limpio.slice(4, 6), 16) || 0;
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminancia > 0.65 ? "#1e293b" : "#ffffff";
}

/* ============================================================
   Validaciones (mensajes en español)
   ============================================================ */

export function validarPasoIdentidad(datos: DatosNegocio): Errores {
  const errores: Errores = {};
  if (!datos.nombre.trim()) {
    errores.nombre = "Ingresa el nombre de tu negocio.";
  }
  return errores;
}

export function validarPasoDatos(datos: DatosNegocio): Errores {
  const errores: Errores = {};
  if (!datos.rubro) {
    errores.rubro = "Selecciona el rubro de tu negocio.";
  }
  if (datos.ruc && !/^\d{11}$/.test(datos.ruc)) {
    errores.ruc = "El RUC debe tener 11 dígitos.";
  }
  if (!datos.direccion.trim()) {
    errores.direccion = "Ingresa la dirección de tu negocio.";
  }
  if (!datos.distrito.trim()) {
    errores.distrito = "Ingresa el distrito de tu negocio.";
  }
  if (!/^\d{9}$/.test(datos.telefono)) {
    errores.telefono = "Ingresa un teléfono de 9 dígitos (ej. 987654321).";
  }
  return errores;
}

function validarPaso(indice: number, datos: DatosNegocio): Errores {
  const paso = pasosConfig[indice];
  if (!paso) return {};
  switch (paso.id) {
    case "identidad":
      return validarPasoIdentidad(datos);
    case "datos":
      return validarPasoDatos(datos);
    default:
      return {};
  }
}

/* ============================================================
   Piezas reutilizables
   ============================================================ */

function LogoMark({ className }: { className?: string }) {
  return (
    <span
      className={`inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground ${className ?? ""}`}
    >
      <PackageCheck className="size-5" strokeWidth={2.2} />
    </span>
  );
}

function Etiqueta({
  htmlFor,
  children,
  opcional,
}: {
  htmlFor?: string;
  children: string;
  opcional?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
      {children}{" "}
      {opcional ? (
        <span className="font-normal text-muted-foreground">(opcional)</span>
      ) : (
        <span className="text-destructive">*</span>
      )}
    </label>
  );
}

function MensajeError({ mensaje }: { mensaje: string }) {
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-destructive">
      <AlertCircle className="size-4 shrink-0" />
      {mensaje}
    </p>
  );
}

const claseInput = (conError: boolean) =>
  cn(
    "w-full rounded-xl border bg-background px-4 py-3 text-sm text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground",
    conError
      ? "border-destructive focus:border-destructive focus:ring-2 focus:ring-destructive/20"
      : "border-input focus:border-primary/50 focus:ring-2 focus:ring-ring/30",
  );

function SelectorColor({
  etiqueta,
  valor,
  onChange,
  preselecciones,
}: {
  etiqueta: string;
  valor: string;
  onChange: (color: string) => void;
  preselecciones: string[];
}) {
  return (
    <div>
      <span className="text-sm font-medium text-foreground">{etiqueta}</span>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {preselecciones.map((color) => (
          <button
            key={color}
            type="button"
            aria-label={`Elegir color ${color}`}
            onClick={() => onChange(color)}
            className={cn(
              "size-8 rounded-full border-2 transition-transform hover:scale-110",
              valor.toLowerCase() === color.toLowerCase()
                ? "border-foreground ring-2 ring-ring/40"
                : "border-border",
            )}
            style={{ backgroundColor: color }}
          />
        ))}
        <label
          className="relative size-8 cursor-pointer rounded-full border-2 border-dashed border-border transition-transform hover:scale-110"
          title="Elegir color personalizado"
        >
          <span
            className="absolute inset-1 rounded-full border border-border/60"
            style={{ backgroundColor: valor }}
          />
          <input
            type="color"
            aria-label="Color personalizado"
            value={valor}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
          />
        </label>
      </div>
    </div>
  );
}

/* ============================================================
   Paso 1 — Identidad del negocio
   ============================================================ */

function PasoIdentidad({
  datos,
  errores,
  onCambiar,
  onCambiarLogo,
}: {
  datos: DatosNegocio;
  errores: Errores;
  onCambiar: <K extends keyof DatosNegocio>(campo: K, valor: DatosNegocio[K]) => void;
  onCambiarLogo: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Etiqueta htmlFor="nombre">Nombre del negocio</Etiqueta>
        <input
          id="nombre"
          type="text"
          placeholder="Ej. Bodega Doña María"
          value={datos.nombre}
          onChange={(e) => onCambiar("nombre", e.target.value)}
          className={cn("mt-2", claseInput(!!errores.nombre))}
        />
        {errores.nombre && <MensajeError mensaje={errores.nombre} />}
      </div>

      <div>
        <Etiqueta opcional>Logo del negocio</Etiqueta>
        {datos.logo ? (
          <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-background p-3">
            <img
              src={datos.logo.dataUrl}
              alt="Logo del negocio"
              className="size-14 rounded-lg border border-border object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {datos.logo.nombreArchivo}
              </p>
              <button
                type="button"
                onClick={() => onCambiar("logo", null)}
                className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-destructive hover:underline"
              >
                <Trash2 className="size-3.5" />
                Quitar logo
              </button>
            </div>
          </div>
        ) : (
          <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-background px-4 py-6 text-center transition-colors hover:border-primary/40 hover:bg-muted/50">
            <ImagePlus className="size-6 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              Subir logo (PNG o JPG, máx. 2 MB)
            </span>
            <span className="text-xs text-muted-foreground">
              Haz clic para elegir un archivo
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              onChange={onCambiarLogo}
            />
          </label>
        )}
        {errores.logo && <MensajeError mensaje={errores.logo} />}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <SelectorColor
          etiqueta="Color principal"
          valor={datos.colorPrimario}
          onChange={(color) => onCambiar("colorPrimario", color)}
          preselecciones={PRESELECCIONES_PRIMARIO}
        />
        <SelectorColor
          etiqueta="Color secundario"
          valor={datos.colorSecundario}
          onChange={(color) => onCambiar("colorSecundario", color)}
          preselecciones={PRESELECCIONES_SECUNDARIO}
        />
      </div>
    </div>
  );
}

/* ============================================================
   Paso 2 — Datos del negocio
   ============================================================ */

function PasoDatos({
  datos,
  errores,
  onCambiar,
  correo,
}: {
  correo: string;
  datos: DatosNegocio;
  errores: Errores;
  onCambiar: <K extends keyof DatosNegocio>(campo: K, valor: DatosNegocio[K]) => void;
}) {
  const soloDigitos = (valor: string) => valor.replace(/\D/g, "");

  return (
    <div className="space-y-6">
      <div>
        <Etiqueta htmlFor="rubro">Rubro</Etiqueta>
        <select
          id="rubro"
          value={datos.rubro}
          onChange={(e) => onCambiar("rubro", e.target.value)}
          className={cn("mt-2 appearance-none", claseInput(!!errores.rubro))}
        >
          <option value="">Selecciona el rubro…</option>
          {RUBROS.map((rubro) => (
            <option key={rubro} value={rubro}>
              {rubro}
            </option>
          ))}
        </select>
        {errores.rubro && <MensajeError mensaje={errores.rubro} />}
      </div>

      <div>
        <Etiqueta htmlFor="ruc" opcional>
          RUC
        </Etiqueta>
        <input
          id="ruc"
          type="text"
          inputMode="numeric"
          maxLength={11}
          placeholder="Ej. 20512345678"
          value={datos.ruc}
          onChange={(e) => onCambiar("ruc", soloDigitos(e.target.value).slice(0, 11))}
          className={cn("mt-2", claseInput(!!errores.ruc))}
        />
        {errores.ruc && <MensajeError mensaje={errores.ruc} />}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Etiqueta htmlFor="direccion">Dirección</Etiqueta>
          <input
            id="direccion"
            type="text"
            placeholder="Ej. Av. Los Álamos 245"
            value={datos.direccion}
            onChange={(e) => onCambiar("direccion", e.target.value)}
            className={cn("mt-2", claseInput(!!errores.direccion))}
          />
          {errores.direccion && <MensajeError mensaje={errores.direccion} />}
        </div>
        <div>
          <Etiqueta htmlFor="distrito">Distrito</Etiqueta>
          <input
            id="distrito"
            type="text"
            placeholder="Ej. San Juan de Lurigancho"
            value={datos.distrito}
            onChange={(e) => onCambiar("distrito", e.target.value)}
            className={cn("mt-2", claseInput(!!errores.distrito))}
          />
          {errores.distrito && <MensajeError mensaje={errores.distrito} />}
        </div>
      </div>

      <div>
        <Etiqueta htmlFor="telefono">Teléfono / WhatsApp</Etiqueta>
        <input
          id="telefono"
          type="tel"
          inputMode="numeric"
          maxLength={9}
          placeholder="Ej. 987654321"
          value={datos.telefono}
          onChange={(e) => onCambiar("telefono", soloDigitos(e.target.value).slice(0, 9))}
          className={cn("mt-2", claseInput(!!errores.telefono))}
        />
        {errores.telefono && <MensajeError mensaje={errores.telefono} />}
      </div>

      <div>
        <Etiqueta>Correo de contacto</Etiqueta>
        <input
          type="email"
          value={correo}
          readOnly
          aria-readonly="true"
          className="mt-2 w-full cursor-not-allowed rounded-xl border border-input bg-muted px-4 py-3 text-sm text-muted-foreground shadow-sm"
        />
        <p className="mt-1.5 text-xs text-muted-foreground">
          Este es el correo de tu cuenta y no se puede editar.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   Panel de vista previa en vivo
   ============================================================ */

function VistaPrevia({ datos }: { datos: DatosNegocio }) {
  const nombreMostrado = datos.nombre.trim() || "Tu negocio";
  const rubroMostrado = datos.rubro || "Bodega";

  return (
    <aside className="h-fit lg:sticky lg:top-24">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Vista previa en vivo
      </p>
      <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card shadow-lg shadow-primary/5">
        <div
          className="h-2.5"
          style={{
            background: `linear-gradient(90deg, ${datos.colorPrimario}, ${datos.colorSecundario})`,
          }}
        />
        <div className="p-5">
          <div className="flex items-center gap-3">
            {datos.logo ? (
              <img
                src={datos.logo.dataUrl}
                alt="Logo del negocio"
                className="size-12 shrink-0 rounded-xl border border-border object-cover"
              />
            ) : (
              <span
                className="grid size-12 shrink-0 place-items-center rounded-xl"
                style={{
                  backgroundColor: datos.colorPrimario,
                  color: textoSobre(datos.colorPrimario),
                }}
              >
                <Building2 className="size-6" />
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-foreground">
                {nombreMostrado}
              </p>
              <p className="text-xs text-muted-foreground">{rubroMostrado}</p>
            </div>
          </div>
          <button
            type="button"
            tabIndex={-1}
            className="mt-4 w-full rounded-xl py-2.5 text-sm font-semibold shadow-sm"
            style={{
              backgroundColor: datos.colorSecundario,
              color: textoSobre(datos.colorSecundario),
            }}
          >
            Ver inventario
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Así se verá la tarjeta de tu negocio dentro de CuadraStock.
          </p>
        </div>
      </div>
    </aside>
  );
}

/* ============================================================
   Pantalla de resumen
   ============================================================ */

function FilaResumen({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border/70 py-3 last:border-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
      <dt className="text-sm text-muted-foreground">{etiqueta}</dt>
      <dd className="text-sm font-medium text-foreground sm:text-right">{valor || "—"}</dd>
    </div>
  );
}

function PantallaResumen({
  datos,
  correo,
  onVolverAEditar,
  onConfirmar,
}: {
  datos: DatosNegocio;
  correo: string;
  onVolverAEditar: () => void;
  onConfirmar: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Revisa la información
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Antes de confirmar, verifica que todo esté correcto.
        </p>

        <div className="mt-6 flex items-center gap-4 rounded-xl border border-border bg-background p-4">
          {datos.logo ? (
            <img
              src={datos.logo.dataUrl}
              alt="Logo del negocio"
              className="size-14 shrink-0 rounded-xl border border-border object-cover"
            />
          ) : (
            <span
              className="grid size-14 shrink-0 place-items-center rounded-xl"
              style={{
                backgroundColor: datos.colorPrimario,
                color: textoSobre(datos.colorPrimario),
              }}
            >
              <Building2 className="size-7" />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold text-foreground">
              {datos.nombre.trim() || "Tu negocio"}
            </p>
            <p className="text-sm text-muted-foreground">{datos.rubro || "—"}</p>
          </div>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{
              backgroundColor: `${datos.colorSecundario}1a`,
              color: textoSobre(datos.colorSecundario) === "#ffffff" ? datos.colorSecundario : "#1e293b",
            }}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: datos.colorSecundario }}
            />
            Vista previa
          </span>
        </div>

        <dl className="mt-4">
          <FilaResumen etiqueta="Nombre del negocio" valor={datos.nombre.trim()} />
          <FilaResumen etiqueta="Rubro" valor={datos.rubro} />
          <FilaResumen etiqueta="RUC" valor={datos.ruc} />
          <FilaResumen
            etiqueta="Dirección"
            valor={[datos.direccion.trim(), datos.distrito.trim()].filter(Boolean).join(", ")}
          />
          <FilaResumen etiqueta="Teléfono / WhatsApp" valor={datos.telefono} />
          <FilaResumen etiqueta="Correo de contacto" valor={correo} />
        </dl>

        <div className="mt-4 flex items-center gap-3 rounded-xl bg-muted px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">Colores elegidos:</span>
          <span
            className="inline-flex items-center gap-1.5 text-xs text-foreground"
          >
            <span
              className="size-4 rounded-full border border-border"
              style={{ backgroundColor: datos.colorPrimario }}
            />
            Principal
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-foreground">
            <span
              className="size-4 rounded-full border border-border"
              style={{ backgroundColor: datos.colorSecundario }}
            />
            Secundario
          </span>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onVolverAEditar}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
          >
            <ArrowLeft className="size-4" />
            Volver a editar
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-success px-6 py-3 text-sm font-semibold text-success-foreground shadow-lg shadow-success/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-success/30"
          >
            Confirmar y registrar
            <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   Pantalla de éxito
   ============================================================ */

function PantallaExito({ datos }: { datos: DatosNegocio }) {
  return (
    <div className="mx-auto max-w-xl py-8 text-center sm:py-14">
      <div className="rounded-3xl border border-border bg-card px-6 py-12 shadow-xl shadow-success/10 sm:px-12">
        <span className="mx-auto inline-flex size-20 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <CheckCircle2 className="size-10" strokeWidth={2} />
        </span>
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          ¡Tu negocio fue registrado!
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-muted-foreground">
          Ya puedes empezar a controlar el inventario de{" "}
          <span className="font-semibold text-foreground">
            {datos.nombre.trim() || "tu negocio"}
          </span>
          .
        </p>
        <Link
          to="/panel"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-success px-8 py-4 text-base font-semibold text-success-foreground shadow-lg shadow-success/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-success/30"
        >
          Ir a mi panel
          <ArrowRight className="size-5" />
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">
          Pronto podrás configurar los productos de tu inventario.
        </p>
      </div>
    </div>
  );
}

/* ============================================================
   Página principal del wizard
   ============================================================ */

function Registro() {
  const [fase, setFase] = useState<"pasos" | "resumen" | "exito">("pasos");
  const [pasoActual, setPasoActual] = useState(0);
  const [datos, setDatos] = useState<DatosNegocio>(datosIniciales);
  const [errores, setErrores] = useState<Errores>({});

  const navigate = useNavigate();
  const { cargando, usuario } = useSesion();

  // Ruta protegida: sin sesión va a /login; si ya registró su negocio, va al panel.
  // Solo se evalúa al cargar la sesión, para no saltarse la pantalla de éxito.
  useEffect(() => {
    if (cargando) return;
    if (!usuario) navigate({ to: "/login", replace: true });
    else if (usuario.negocio) navigate({ to: "/panel", replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cargando]);
  const formularioRef = useRef<HTMLDivElement>(null);

  const totalPasos = pasosConfig.length;
  const porcentaje = Math.round(((pasoActual + 1) / totalPasos) * 100);
  const esUltimoPaso = pasoActual === totalPasos - 1;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pasoActual, fase]);

  const setDato = <K extends keyof DatosNegocio>(campo: K, valor: DatosNegocio[K]) => {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  };

  const onCambiarLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0];
    e.target.value = "";
    if (!archivo) return;

    const formatosAceptados = ["image/png", "image/jpeg"];
    if (!formatosAceptados.includes(archivo.type)) {
      setErrores((prev) => ({ ...prev, logo: "Solo se aceptan imágenes PNG o JPG." }));
      return;
    }
    if (archivo.size > 2 * 1024 * 1024) {
      setErrores((prev) => ({
        ...prev,
        logo: "La imagen supera el máximo de 2 MB. Elige una más liviana.",
      }));
      return;
    }

    const lector = new FileReader();
    lector.onload = () => {
      setErrores((prev) => {
        const resto = { ...prev };
        delete resto.logo;
        return resto;
      });
      setDato("logo", { nombreArchivo: archivo.name, dataUrl: String(lector.result) });
    };
    lector.readAsDataURL(archivo);
  };

  const avanzar = () => {
    const nuevosErrores = validarPaso(pasoActual, datos);
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      formularioRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setErrores({});
    if (esUltimoPaso) {
      setFase("resumen");
    } else {
      setPasoActual((prev) => Math.min(prev + 1, totalPasos - 1));
    }
  };

  const retroceder = () => {
    setErrores({});
    setPasoActual((prev) => Math.max(prev - 1, 0));
  };

  function renderPaso() {
    const paso = pasosConfig[pasoActual];
    if (!paso) return null;
    switch (paso.id) {
      case "identidad":
        return (
          <PasoIdentidad
            datos={datos}
            errores={errores}
            onCambiar={setDato}
            onCambiarLogo={onCambiarLogo}
          />
        );
      case "datos":
        return <PasoDatos
            datos={datos}
            errores={errores}
            onCambiar={setDato}
            correo={usuario?.correo ?? ""}
          />;
      default:
        return null;
    }
  }

  if (cargando || !usuario || usuario.negocio) {
    return <div className="min-h-screen bg-background" aria-busy="true" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/70 bg-background/85 backdrop-blur">
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

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        {fase === "pasos" && (
          <>
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Registra tu negocio
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                En 2 pasos dejamos lista la identidad de tu negocio para armar tu
                sistema de inventario.
              </p>
            </div>

            {/* Barra de progreso */}
            <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between text-sm font-medium text-foreground">
                <span>
                  Paso {pasoActual + 1} de {totalPasos}
                </span>
                <span className="text-muted-foreground">{porcentaje}% completado</span>
              </div>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${porcentaje}%` }}
                />
              </div>
              <ol className="mt-4 grid grid-cols-2 gap-2">
                {pasosConfig.map((paso, i) => {
                  const completado = i < pasoActual;
                  const activo = i === pasoActual;
                  return (
                    <li key={paso.id} className="flex items-center gap-2 text-sm">
                      <span
                        className={cn(
                          "grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors",
                          completado
                            ? "bg-success text-success-foreground"
                            : activo
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground",
                        )}
                      >
                        {completado ? <CheckCircle2 className="size-4" /> : i + 1}
                      </span>
                      <span
                        className={cn(
                          "truncate",
                          activo
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground",
                        )}
                      >
                        {paso.titulo}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>

            {/* Formulario + vista previa */}
            <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div
                ref={formularioRef}
                className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
              >
                <h2 className="text-xl font-semibold text-foreground">
                  {pasosConfig[pasoActual]?.titulo}
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {pasosConfig[pasoActual]?.descripcion}
                </p>
                <form
                  className="mt-6"
                  noValidate
                  onSubmit={(e) => {
                    e.preventDefault();
                    avanzar();
                  }}
                >
                  {renderPaso()}
                  <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
                    {pasoActual > 0 && (
                      <button
                        type="button"
                        onClick={retroceder}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground shadow-sm transition-all hover:border-primary/40 hover:shadow-md"
                      >
                        <ArrowLeft className="size-4" />
                        Anterior
                      </button>
                    )}
                    <button
                      type="submit"
                      className={cn(
                        "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition-all hover:-translate-y-0.5",
                        esUltimoPaso
                          ? "bg-success text-success-foreground shadow-success/25 hover:shadow-xl hover:shadow-success/30"
                          : "bg-primary text-primary-foreground shadow-primary/20 hover:shadow-xl hover:shadow-primary/25",
                      )}
                    >
                      {esUltimoPaso ? "Guardar negocio" : "Siguiente"}
                      <ArrowRight className="size-4" />
                    </button>
                  </div>
                </form>
              </div>

              <VistaPrevia datos={datos} />
            </div>
          </>
        )}

        {fase === "resumen" && (
          <PantallaResumen
            datos={datos}
            correo={usuario.correo}
            onVolverAEditar={() => {
              setFase("pasos");
              setPasoActual(totalPasos - 1);
            }}
            onConfirmar={() => {
              guardarNegocio({
                nombre: datos.nombre.trim(),
                logoDataUrl: datos.logo?.dataUrl ?? null,
                colorPrimario: datos.colorPrimario,
                colorSecundario: datos.colorSecundario,
                rubro: datos.rubro,
                ruc: datos.ruc.trim(),
                direccion: datos.direccion.trim(),
                distrito: datos.distrito.trim(),
                telefono: datos.telefono,
              });
              setFase("exito");
            }}
          />
        )}

        {fase === "exito" && <PantallaExito datos={datos} />}
      </main>
    </div>
  );
}