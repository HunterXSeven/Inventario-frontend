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
    "GET /modulos/9/campos": campos["9"],
    "GET /productos?pagina=0&tamano=20": pagina([producto]),
    "GET /productos?pagina=0&tamano=100": pagina([producto]),
    "GET /ventas?pagina=0&tamano=20": pagina([]),
    "GET /movimientos?pagina=0&tamano=20": pagina([]),
    "GET /modulos/9/registros?pagina=0&tamano=20": pagina([]),
    "POST /productos": { idproducto: 2 },
    "POST /ventas": { idventa: 1, total: 20 },
    "POST /movimientos": null,
    "POST /modulos/9/registros": { idregistro: 1 },
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const ruta = url.replace("http://localhost:9090", "");
      if (init.method === "POST") {
        posts.push({ ruta, cuerpo: JSON.parse(String(init.body)) });
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
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Stock insuficiente");
  });

  it("Personal no tiene fila de agregar (se registra en la fase de permisos)", async () => {
    simular();
    abrir("/panel");
    await screen.findByText("Cemento");
    fireEvent.click(screen.getByRole("button", { name: /Personal/ }));
    await waitFor(() => expect(screen.queryByText("Cemento")).not.toBeInTheDocument());
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
});
