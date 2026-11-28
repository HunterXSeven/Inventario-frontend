import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { cerrarSesion } from "@/lib/auth";
import { abrir } from "@/test/ayudas";

const sistema = {
  idsistema: 7,
  nombrenegocio: "Bodega",
  colorprincipal: "#1e3a8a",
  colorsecundario: "#f59e0b",
  logourl: null,
};

const modulos = [
  {
    idmodulo: 1,
    nombremodulo: "Productos",
    predefinido: "productos",
    ocultable: false,
    visible: true,
  },
  { idmodulo: 2, nombremodulo: "Ventas", predefinido: "ventas", ocultable: false, visible: true },
  {
    idmodulo: 3,
    nombremodulo: "Movimientos",
    predefinido: "movimientos",
    ocultable: false,
    visible: true,
  },
  {
    idmodulo: 4,
    nombremodulo: "Personal",
    predefinido: "personal",
    ocultable: true,
    visible: true,
  },
  { idmodulo: 9, nombremodulo: "Proveedores", predefinido: null, ocultable: false, visible: true },
];

const campos: Record<string, unknown[]> = {
  "1": [
    { idcampo: 1, nombrecampo: "Nombre", tipocampo: "texto", columna: "nombreProducto", orden: 1 },
    { idcampo: 2, nombrecampo: "Precio", tipocampo: "decimal", columna: "precio", orden: 2 },
    { idcampo: 3, nombrecampo: "Stock", tipocampo: "numero", columna: "stock", orden: 3 },
    { idcampo: 5, nombrecampo: "Imagen", tipocampo: "imagen", columna: "imagenUrl", orden: 4 },
  ],
  "4": [
    { idcampo: 20, nombrecampo: "Nombre", tipocampo: "texto", columna: "nombre", orden: 1 },
    { idcampo: 21, nombrecampo: "DNI", tipocampo: "texto", columna: "dni", orden: 2 },
    { idcampo: 22, nombrecampo: "Correo", tipocampo: "texto", columna: "correo", orden: 3 },
  ],
  "9": [
    { idcampo: 40, nombrecampo: "Empresa", tipocampo: "texto", columna: null, orden: 1 },
    { idcampo: 41, nombrecampo: "Visitas", tipocampo: "numero", columna: null, orden: 2 },
  ],
};

const pagina = (contenido: unknown[]) => ({
  contenido,
  pagina: 0,
  tamano: 20,
  total: contenido.length,
  paginas: 1,
});

const producto = { idproducto: 1, nombreproducto: "Cemento", precio: 10, stock: 5, stockminimo: 1 };

/** Backend simulado que además anota los POST recibidos. */
function simular(opciones: { tipo?: "DUENO" | "PERSONAL"; permisos?: unknown[] } = {}) {
  const posts: { ruta: string; cuerpo: unknown }[] = [];
  const respuestas: Record<string, unknown> = {
    "GET /auth/yo": {
      correo: "m@correo.com",
      tipo: opciones.tipo ?? "DUENO",
      idsistema: 7,
      permisos: opciones.permisos ?? [],
    },
    "GET /sistemas/actual": sistema,
    "GET /modulos": modulos,
    "GET /modulos/1/campos": campos["1"],
    "GET /modulos/2/campos": [],
    "GET /modulos/3/campos": [],
    "GET /modulos/4/campos": campos["4"],
    "GET /personal": [{ idpersonal: 5, nombre: "Ana", dni: "12345678", correo: "ana@correo.com" }],
    "PUT /productos/1": null,
    "PUT /productos/1/imagen": { idproducto: 1 },
    "DELETE /productos/1/imagen": { idproducto: 1 },
    "PUT /productos/2/imagen": { idproducto: 2 },
    "DELETE /productos/1": null,
    "GET /modulos/9/registros?pagina=0&tamano=20": pagina([
      { idregistro: 3, datos: { "40": "Aceros SAC", "41": 2 } },
    ]),
    "PUT /modulos/9/registros/3": { idregistro: 3 },
    "DELETE /modulos/9/registros/3": null,
    "PUT /personal/5": null,
    "PUT /personal/5/contrasena": null,
    "DELETE /personal/5": null,
    "GET /personal/5/permisos": [
      {
        idmodulo: 2,
        nombremodulo: "Ventas",
        predefinido: "ventas",
        puedever: true,
        puedecrear: true,
        puedeeditar: false,
        puedeeliminar: false,
      },
      {
        idmodulo: 77,
        nombremodulo: "Oculto",
        predefinido: null,
        puedever: true,
        puedecrear: false,
        puedeeditar: false,
        puedeeliminar: false,
      },
    ],
    "POST /personal": { idpersonal: 5, nombre: "Luis", dni: null, correo: "luis@correo.com" },
    "PUT /personal/5/permisos": null,
    "GET /modulos/9/campos": campos["9"],
    "GET /productos?pagina=0&tamano=20": pagina([producto]),
    "GET /productos?pagina=0&tamano=100": pagina([producto]),
    "GET /ventas?pagina=0&tamano=20": pagina([]),
    "GET /movimientos?pagina=0&tamano=20": pagina([]),
    "POST /productos": { idproducto: 2 },
    "POST /ventas": { idventa: 1, total: 20 },
    "POST /movimientos": null,
    "POST /modulos/9/registros": { idregistro: 1 },
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const ruta = url.replace("http://localhost:9090", "");
      if (init.method === "POST" || init.method === "PUT" || init.method === "DELETE") {
        posts.push({
          ruta: init.method === "POST" ? ruta : `${init.method} ${ruta}`,
          cuerpo:
            init.body instanceof FormData
              ? { archivo: (init.body.get("imagen") as File).name }
              : init.body
                ? JSON.parse(String(init.body))
                : null,
        });
      }
      const clave = `${init.method} ${ruta}`;
      if (!(clave in respuestas))
        return new Response(JSON.stringify({ mensaje: `Sin simular: ${clave}` }), { status: 404 });
      const r = respuestas[clave];
      return new Response(r === null ? null : JSON.stringify(r), {
        status: init.method === "POST" ? 201 : 200,
      });
    }),
  );
  return posts;
}

beforeEach(() => {
  window.localStorage.clear();
  cerrarSesion(); // limpia la sesión en caché (y borra el token)
  window.localStorage.setItem("cuadrastock:token", "T");
  vi.unstubAllGlobals();
});

describe("Agregar registros", () => {
  it("agrega un producto con Stock como stock inicial y recarga la tabla", async () => {
    const posts = simular();
    abrir("/panel");
    await screen.findByText("Cemento");

    fireEvent.click(screen.getByRole("button", { name: /Agregar registro/ }));
    fireEvent.change(screen.getByLabelText(/^Nombre/), { target: { value: "Pintura" } });
    fireEvent.change(screen.getByLabelText(/^Precio/), { target: { value: "40" } });
    fireEvent.change(screen.getByLabelText(/^Stock/), { target: { value: "8" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Producto agregado.")).toBeInTheDocument();
    expect(posts).toEqual([
      { ruta: "/productos", cuerpo: { nombreproducto: "Pintura", precio: 40, stockinicial: 8 } },
    ]);
  });

  it("agrega un producto y sube su imagen con el id recién creado", async () => {
    const posts = simular();
    abrir("/panel");
    await screen.findByText("Cemento");

    fireEvent.click(screen.getByRole("button", { name: /Agregar registro/ }));
    fireEvent.change(screen.getByLabelText(/^Nombre/), { target: { value: "Pintura" } });
    fireEvent.change(screen.getByLabelText(/^Precio/), { target: { value: "40" } });
    const foto = new File(["x"], "pintura.png", { type: "image/png" });
    fireEvent.change(screen.getByLabelText("Imagen"), { target: { files: [foto] } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Producto agregado.")).toBeInTheDocument();
    expect(posts).toEqual([
      { ruta: "/productos", cuerpo: { nombreproducto: "Pintura", precio: 40 } },
      { ruta: "PUT /productos/2/imagen", cuerpo: { archivo: "pintura.png" } },
    ]);
  });

  it("rechaza una imagen que no es JPG, PNG o WebP", async () => {
    simular();
    abrir("/panel");
    await screen.findByText("Cemento");

    fireEvent.click(screen.getByRole("button", { name: /Agregar registro/ }));
    const pdf = new File(["x"], "ficha.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByLabelText("Imagen"), { target: { files: [pdf] } });

    expect(await screen.findByText(/Solo se aceptan imágenes JPG, PNG o WebP/)).toBeInTheDocument();
  });

  it("no envía nada si falta el nombre y avisa", async () => {
    const posts = simular();
    abrir("/panel");
    await screen.findByText("Cemento");

    fireEvent.click(screen.getByRole("button", { name: /Agregar registro/ }));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Nombre es obligatorio");
    expect(posts).toHaveLength(0);
  });

  it("registra una venta con sus líneas", async () => {
    const posts = simular();
    abrir("/panel");
    await screen.findByText("Cemento");
    fireEvent.click(screen.getByRole("button", { name: /Ventas/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Agregar registro/ }));

    const selector = await screen.findByLabelText("Producto 1");
    fireEvent.change(selector, { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Cantidad 1"), { target: { value: "2" } });
    expect(screen.getByText("S/ 20.00", { selector: "span" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Venta registrada.")).toBeInTheDocument();
    expect(posts).toEqual([
      { ruta: "/ventas", cuerpo: { items: [{ idproducto: 1, cantidad: 2 }] } },
    ]);
  });

  it("registra un movimiento", async () => {
    const posts = simular();
    abrir("/panel");
    await screen.findByText("Cemento");
    fireEvent.click(screen.getByRole("button", { name: /Movimientos/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Agregar registro/ }));

    fireEvent.change(await screen.findByLabelText("Producto"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "Salida" } });
    fireEvent.change(screen.getByLabelText("Cantidad"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Motivo"), { target: { value: "Merma" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Movimiento registrado.")).toBeInTheDocument();
    expect(posts).toEqual([
      {
        ruta: "/movimientos",
        cuerpo: { idproducto: 1, tipo: "Salida", cantidad: 2, motivo: "Merma" },
      },
    ]);
  });

  it("en un módulo personalizado envía los valores por id de campo", async () => {
    const posts = simular();
    abrir("/panel");
    await screen.findByText("Cemento");
    fireEvent.click(screen.getByRole("button", { name: /Proveedores/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Agregar registro/ }));

    fireEvent.change(screen.getByLabelText("Empresa"), { target: { value: "Aceros SAC" } });
    fireEvent.change(screen.getByLabelText("Visitas"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Registro agregado.")).toBeInTheDocument();
    expect(posts).toEqual([
      { ruta: "/modulos/9/registros", cuerpo: { datos: { "40": "Aceros SAC", "41": 3 } } },
    ]);
  });

  it("muestra el mensaje del backend si rechaza el registro", async () => {
    simular();
    const original = globalThis.fetch;
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) =>
      init.method === "POST"
        ? new Response(JSON.stringify({ mensaje: "Stock insuficiente" }), { status: 400 })
        : original(url, init),
    );
    abrir("/panel");
    await screen.findByText("Cemento");
    fireEvent.click(screen.getByRole("button", { name: /Agregar registro/ }));
    fireEvent.change(screen.getByLabelText(/^Nombre/), { target: { value: "X" } });
    fireEvent.change(screen.getByLabelText(/^Precio/), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Stock insuficiente");
  });

  it("registra un empleado y guarda sus permisos respetando 'ver'", async () => {
    const posts = simular();
    abrir("/panel");
    await screen.findByText("Cemento");
    fireEvent.click(screen.getByRole("button", { name: /Personal/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Agregar registro/ }));

    fireEvent.change(await screen.findByLabelText("Nombre"), { target: { value: "Luis" } });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "luis@correo.com" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "Clave1234" } });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "Clave1234" },
    });
    // Registrar en Ventas activa también Ver; Eliminar en Productos activa Ver.
    fireEvent.click(screen.getByLabelText("Registrar en Ventas"));
    fireEvent.click(screen.getByLabelText("Eliminar en Productos"));
    expect(screen.getByLabelText("Ver en Ventas")).toBeChecked();
    expect(screen.getByLabelText("Ver en Productos")).toBeChecked();
    // Personal no aparece como módulo con permisos.
    expect(screen.queryByLabelText("Ver en Personal")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Empleado registrado.")).toBeInTheDocument();
    expect(posts).toEqual([
      {
        ruta: "/personal",
        cuerpo: { nombre: "Luis", correo: "luis@correo.com", contrasena: "Clave1234" },
      },
      {
        ruta: "PUT /personal/5/permisos",
        cuerpo: [
          {
            idmodulo: 1,
            puedever: true,
            puedecrear: false,
            puedeeditar: false,
            puedeeliminar: true,
          },
          {
            idmodulo: 2,
            puedever: true,
            puedecrear: true,
            puedeeditar: false,
            puedeeliminar: false,
          },
        ],
      },
    ]);
  });

  it("quitar 'Ver' desmarca el resto de permisos del módulo", async () => {
    simular();
    abrir("/panel");
    await screen.findByText("Cemento");
    fireEvent.click(screen.getByRole("button", { name: /Personal/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Agregar registro/ }));

    fireEvent.click(await screen.findByLabelText("Editar en Productos"));
    fireEvent.click(screen.getByLabelText("Ver en Productos"));

    expect(screen.getByLabelText("Editar en Productos")).not.toBeChecked();
  });

  it("valida correo y contraseña antes de enviar", async () => {
    const posts = simular();
    abrir("/panel");
    await screen.findByText("Cemento");
    fireEvent.click(screen.getByRole("button", { name: /Personal/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Agregar registro/ }));

    fireEvent.change(await screen.findByLabelText("Nombre"), { target: { value: "Luis" } });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "luis" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("correo válido");

    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "luis@correo.com" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "corta" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("al menos 8");
    expect(posts).toHaveLength(0);
  });

  it("al crear personal exige mayúscula, minúscula y número, y que la confirmación coincida", async () => {
    const posts = simular();
    abrir("/panel");
    await screen.findByText("Cemento");
    fireEvent.click(screen.getByRole("button", { name: "Personal" }));
    fireEvent.click(await screen.findByRole("button", { name: /Agregar registro/ }));
    fireEvent.change(await screen.findByLabelText("Nombre"), { target: { value: "Luis" } });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "luis@correo.com" } });

    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "clave1234" } });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "clave1234" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("una mayúscula");

    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "Clave1234" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("no coinciden");
    expect(posts).toHaveLength(0);
  });

  it("el ojo muestra y oculta lo que se escribe en la contraseña", async () => {
    simular();
    abrir("/panel");
    await screen.findByText("Cemento");
    fireEvent.click(screen.getByRole("button", { name: "Personal" }));
    fireEvent.click(await screen.findByRole("button", { name: /Agregar registro/ }));

    const campo = await screen.findByLabelText("Contraseña");
    expect(campo).toHaveAttribute("type", "password");
    fireEvent.click(screen.getByRole("button", { name: "Mostrar contraseña" }));
    expect(campo).toHaveAttribute("type", "text");
    fireEvent.click(screen.getByRole("button", { name: "Ocultar contraseña" }));
    expect(campo).toHaveAttribute("type", "password");
  });

  it("si fallan los permisos, el reintento no vuelve a crear al empleado", async () => {
    const posts = simular();
    const original = globalThis.fetch;
    let fallos = 1;
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
      if (init.method === "PUT" && fallos-- > 0)
        return new Response(JSON.stringify({ mensaje: "Módulo inexistente." }), { status: 400 });
      return original(url, init);
    });
    abrir("/panel");
    await screen.findByText("Cemento");
    fireEvent.click(screen.getByRole("button", { name: /Personal/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Agregar registro/ }));

    fireEvent.change(await screen.findByLabelText("Nombre"), { target: { value: "Luis" } });
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "luis@correo.com" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "Clave1234" } });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "Clave1234" },
    });
    fireEvent.click(screen.getByLabelText("Ver en Productos"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("ya se registró");

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Empleado registrado.")).toBeInTheDocument();
    expect(posts.filter((p) => p.ruta === "/personal")).toHaveLength(1);
  });

  it("el personal nunca ve 'Agregar registro' en el módulo Personal", async () => {
    simular({ tipo: "PERSONAL", permisos: [] });
    abrir("/panel");
    await screen.findByText("Cemento");
    expect(screen.queryByRole("button", { name: /Agregar registro/ })).not.toBeInTheDocument();
  });

  it("el personal solo ve 'Agregar registro' donde tiene permiso de crear", async () => {
    simular({
      tipo: "PERSONAL",
      permisos: [
        {
          idmodulo: 1,
          nombremodulo: "Productos",
          predefinido: "productos",
          puedever: true,
          puedecrear: false,
          puedeeditar: false,
          puedeeliminar: false,
        },
        {
          idmodulo: 2,
          nombremodulo: "Ventas",
          predefinido: "ventas",
          puedever: true,
          puedecrear: true,
          puedeeditar: false,
          puedeeliminar: false,
        },
      ],
    });
    abrir("/panel");
    await screen.findByText("Cemento");
    expect(screen.queryByRole("button", { name: /Agregar registro/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Ventas/ }));
    expect(await screen.findByRole("button", { name: /Agregar registro/ })).toBeInTheDocument();
  });

  it("un 401 por falta de permiso no cierra la sesión si el token sigue vigente", async () => {
    simular({
      tipo: "PERSONAL",
      permisos: [
        {
          idmodulo: 2,
          nombremodulo: "Ventas",
          predefinido: "ventas",
          puedever: true,
          puedecrear: true,
          puedeeditar: false,
          puedeeliminar: false,
        },
      ],
    });
    const original = globalThis.fetch;
    // El backend responde 401 (sin permiso de ver Productos) pero /auth/yo sigue funcionando.
    vi.stubGlobal("fetch", async (url: string, init: RequestInit) =>
      url.includes("tamano=100") ? new Response(null, { status: 401 }) : original(url, init),
    );
    const router = abrir("/panel");
    await screen.findByText("Cemento");
    fireEvent.click(screen.getByRole("button", { name: /Ventas/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Agregar registro/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "permiso de ver el módulo Productos",
    );
    expect(router.state.location.pathname).toBe("/panel");
    expect(window.localStorage.getItem("cuadrastock:token")).toBe("T");
  });
});

describe("Editar y eliminar", () => {
  const permisosDe = (
    idmodulo: number,
    nombre: string,
    predefinido: string | null,
    p: Partial<Record<"c" | "e" | "d", boolean>>,
  ) => ({
    idmodulo,
    nombremodulo: nombre,
    predefinido,
    puedever: true,
    puedecrear: !!p.c,
    puedeeditar: !!p.e,
    puedeeliminar: !!p.d,
  });

  it("edita un producto sin tocar el stock y conserva los datos ocultos", async () => {
    const posts = simular();
    abrir("/panel");
    await screen.findByText("Cemento");

    fireEvent.click(screen.getByRole("button", { name: "Editar Cemento" }));
    expect(await screen.findByLabelText(/^Stock/)).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/^Precio/), { target: { value: "12.5" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Producto actualizado.")).toBeInTheDocument();
    expect(posts).toEqual([
      {
        ruta: "PUT /productos/1",
        cuerpo: {
          nombreproducto: "Cemento",
          precio: 12.5,
          stockminimo: 1,
          fechavencimiento: null,
          lote: null,
          codigoqr: null,
        },
      },
    ]);
  });

  it("cambia la imagen de un producto al editarlo", async () => {
    const posts = simular();
    abrir("/panel");
    await screen.findByText("Cemento");

    fireEvent.click(screen.getByRole("button", { name: "Editar Cemento" }));
    const foto = new File(["x"], "cemento.webp", { type: "image/webp" });
    fireEvent.change(await screen.findByLabelText("Imagen"), { target: { files: [foto] } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Producto actualizado.")).toBeInTheDocument();
    expect(posts.map((p) => p.ruta)).toEqual(["PUT /productos/1", "PUT /productos/1/imagen"]);
    expect(posts[1]?.cuerpo).toEqual({ archivo: "cemento.webp" });
  });

  it("elimina un producto solo tras confirmar", async () => {
    const posts = simular();
    abrir("/panel");
    await screen.findByText("Cemento");

    fireEvent.click(screen.getByRole("button", { name: "Eliminar Cemento" }));
    expect(await screen.findByText(/Esta acción no se puede deshacer/)).toBeInTheDocument();
    expect(posts).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    expect(posts).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Eliminar Cemento" }));
    fireEvent.click(await screen.findByRole("button", { name: "Sí, eliminar" }));

    expect(await screen.findByText("Cemento se eliminó.")).toBeInTheDocument();
    expect(posts).toEqual([{ ruta: "DELETE /productos/1", cuerpo: null }]);
  });

  it("edita y elimina un registro de un módulo personalizado", async () => {
    const posts = simular();
    abrir("/panel");
    await screen.findByText("Cemento");
    fireEvent.click(screen.getByRole("button", { name: /Proveedores/ }));

    fireEvent.click(await screen.findByRole("button", { name: "Editar Aceros SAC" }));
    expect(await screen.findByLabelText("Visitas")).toHaveValue(2);
    fireEvent.change(screen.getByLabelText("Visitas"), { target: { value: "9" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Registro actualizado.")).toBeInTheDocument();

    fireEvent.click(await screen.findByRole("button", { name: "Eliminar Aceros SAC" }));
    fireEvent.click(await screen.findByRole("button", { name: "Sí, eliminar" }));
    expect(await screen.findByText("Aceros SAC se eliminó.")).toBeInTheDocument();

    expect(posts).toEqual([
      {
        ruta: "PUT /modulos/9/registros/3",
        cuerpo: { datos: { "40": "Aceros SAC", "41": 9 } },
      },
      { ruta: "DELETE /modulos/9/registros/3", cuerpo: null },
    ]);
  });

  it("ventas y movimientos no ofrecen editar ni eliminar", async () => {
    simular();
    abrir("/panel");
    await screen.findByText("Cemento");
    fireEvent.click(screen.getByRole("button", { name: /Ventas/ }));
    await screen.findByText("Todavía no hay registros");
    expect(screen.queryByRole("button", { name: /Editar|Eliminar/ })).not.toBeInTheDocument();
  });

  it("edita los datos de un empleado, cambia su contraseña y lo elimina", async () => {
    const posts = simular();
    abrir("/panel");
    await screen.findByText("Cemento");
    fireEvent.click(screen.getByRole("button", { name: /Personal/ }));

    fireEvent.click(await screen.findByRole("button", { name: "Editar Ana" }));
    expect(await screen.findByLabelText("Correo")).toHaveValue("ana@correo.com");
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "ana@nuevo.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Empleado actualizado.")).toBeInTheDocument();

    fireEvent.click(await screen.findByRole("button", { name: "Cambiar contraseña de Ana" }));
    fireEvent.change(await screen.findByLabelText("Nueva contraseña"), {
      target: { value: "corta" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("al menos 8");
    fireEvent.change(screen.getByLabelText("Nueva contraseña"), { target: { value: "Nueva1234" } });
    fireEvent.change(screen.getByLabelText("Confirmar contraseña"), {
      target: { value: "Nueva1234" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByText("Contraseña de Ana actualizada.")).toBeInTheDocument();

    fireEvent.click(await screen.findByRole("button", { name: "Eliminar Ana" }));
    fireEvent.click(await screen.findByRole("button", { name: "Sí, eliminar" }));
    expect(await screen.findByText("Ana se eliminó.")).toBeInTheDocument();

    expect(posts).toEqual([
      {
        ruta: "PUT /personal/5",
        cuerpo: { nombre: "Ana", correo: "ana@nuevo.com", dni: "12345678" },
      },
      { ruta: "PUT /personal/5/contrasena", cuerpo: { contrasena: "Nueva1234" } },
      { ruta: "DELETE /personal/5", cuerpo: null },
    ]);
  });

  it("edita los permisos de un empleado y conserva los de módulos que no se muestran", async () => {
    const posts = simular();
    abrir("/panel");
    await screen.findByText("Cemento");
    fireEvent.click(screen.getByRole("button", { name: /Personal/ }));

    fireEvent.click(await screen.findByRole("button", { name: "Permisos de Ana" }));
    expect(await screen.findByLabelText("Registrar en Ventas")).toBeChecked();
    expect(screen.getByLabelText("Ver en Productos")).not.toBeChecked();
    fireEvent.click(screen.getByLabelText("Editar en Productos"));
    fireEvent.click(screen.getByLabelText("Registrar en Ventas"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Permisos de Ana guardados.")).toBeInTheDocument();
    expect(posts).toEqual([
      {
        ruta: "PUT /personal/5/permisos",
        cuerpo: [
          {
            idmodulo: 1,
            puedever: true,
            puedecrear: false,
            puedeeditar: true,
            puedeeliminar: false,
          },
          {
            idmodulo: 2,
            puedever: true,
            puedecrear: false,
            puedeeditar: false,
            puedeeliminar: false,
          },
          {
            idmodulo: 77,
            puedever: true,
            puedecrear: false,
            puedeeditar: false,
            puedeeliminar: false,
          },
        ],
      },
    ]);
  });

  it("el personal solo ve los botones de las acciones que tiene permitidas", async () => {
    simular({
      tipo: "PERSONAL",
      permisos: [permisosDe(1, "Productos", "productos", { e: true })],
    });
    abrir("/panel");
    await screen.findByText("Cemento");

    expect(screen.getByRole("button", { name: "Editar Cemento" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Eliminar Cemento" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Cambiar contraseña/ })).not.toBeInTheDocument();
  });
});
