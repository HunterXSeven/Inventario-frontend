import { fireEvent, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { cerrarSesion } from "@/lib/auth";
import { abrir } from "@/test/ayudas";

const sistema = {
  idsistema: 7,
  nombrenegocio: "Bodega Doña María",
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
];

const camposProductos = [
  { idcampo: 1, nombrecampo: "Nombre", tipocampo: "texto", columna: "nombreProducto", orden: 1 },
  { idcampo: 2, nombrecampo: "Precio", tipocampo: "decimal", columna: "precio", orden: 2 },
  { idcampo: 3, nombrecampo: "Stock", tipocampo: "numero", columna: "stock", orden: 3 },
];

/** Backend simulado: responde según la ruta. */
function simularBackend(tipo: "DUENO" | "PERSONAL", idsistema: number | null) {
  const respuestas: Record<string, unknown> = {
    "GET /auth/yo": { correo: "maria@correo.com", tipo, idsistema },
    "GET /sistemas/actual": sistema,
    "GET /sistemas": [sistema],
    "GET /modulos": modulos,
    "GET /modulos/1/campos": camposProductos,
    "GET /modulos/2/campos": [],
    "GET /productos?pagina=0&tamano=20": {
      contenido: [
        { idproducto: 1, nombreproducto: "Cemento Sol", precio: 25.5, stock: 3, stockminimo: 5 },
        { idproducto: 2, nombreproducto: "Pintura látex", precio: 40, stock: 20, stockminimo: 5 },
      ],
      pagina: 0,
      tamano: 20,
      total: 2,
      paginas: 1,
    },
    "GET /ventas?pagina=0&tamano=20": {
      contenido: [],
      pagina: 0,
      tamano: 20,
      total: 0,
      paginas: 1,
    },
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const clave = `${init.method} ${url.replace("http://localhost:9090", "")}`;
      if (!(clave in respuestas))
        return new Response(JSON.stringify({ mensaje: `Sin simular: ${clave}` }), { status: 404 });
      return new Response(JSON.stringify(respuestas[clave]), { status: 200 });
    }),
  );
}

beforeEach(() => {
  window.localStorage.clear();
  cerrarSesion(); // limpia la sesión en caché de la prueba anterior
  vi.unstubAllGlobals();
});

describe("Gestor de inventario", () => {
  it("muestra los módulos en la barra y la tabla de productos con stock bajo marcado", async () => {
    window.localStorage.setItem("cuadrastock:token", "T");
    simularBackend("DUENO", 7);

    abrir("/panel");

    expect(await screen.findByText("Cemento Sol")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ventas/ })).toBeInTheDocument();
    expect(screen.getByText("S/ 25.50")).toBeInTheDocument();
    expect(screen.getByTitle("Stock bajo")).toHaveTextContent("3");
    expect(screen.getByRole("button", { name: /Cerrar sesión/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Configurar/ })).toBeEnabled();
  });

  it("al cambiar de módulo carga sus datos (vacío en ventas)", async () => {
    window.localStorage.setItem("cuadrastock:token", "T");
    simularBackend("DUENO", 7);
    abrir("/panel");
    await screen.findByText("Cemento Sol");

    fireEvent.click(screen.getByRole("button", { name: /Ventas/ }));

    expect(await screen.findByText("Todavía no hay registros")).toBeInTheDocument();
  });

  it("el personal no ve Configurar ni 'Cambiar de sistema'", async () => {
    window.localStorage.setItem("cuadrastock:token", "T");
    simularBackend("PERSONAL", 7);

    abrir("/panel");

    await screen.findByText("Cemento Sol");
    expect(screen.queryByRole("button", { name: /Configurar/ })).not.toBeInTheDocument();
    expect(screen.queryByText("Cambiar de sistema")).not.toBeInTheDocument();
  });

  it("un dueño sin sistema elegido es enviado a la lista de sistemas", async () => {
    window.localStorage.setItem("cuadrastock:token", "T");
    simularBackend("DUENO", null);

    const router = abrir("/panel");

    await waitFor(() => expect(router.state.location.pathname).toBe("/sistemas"));
    expect(await screen.findByText("Bodega Doña María")).toBeInTheDocument();
    expect(screen.getByText("Abrir sistema")).toBeInTheDocument();
  });

  it("sin sesión, /panel lleva al login", async () => {
    simularBackend("DUENO", null);

    const router = abrir("/panel");

    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
  });
});
