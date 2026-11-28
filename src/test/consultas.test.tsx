import { fireEvent, screen, waitFor, within } from "@testing-library/react";
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
  { idmodulo: 9, nombremodulo: "Proveedores", predefinido: null, ocultable: false, visible: true },
];

const campo = (
  idcampo: number,
  nombrecampo: string,
  tipocampo: string,
  columna: string | null,
  extra: Record<string, unknown> = {},
) => ({
  idcampo,
  nombrecampo,
  tipocampo,
  columna,
  ocultable: false,
  visible: true,
  filtrable: false,
  orden: idcampo,
  ...extra,
});

const camposProductos = [
  campo(1, "Nombre", "texto", "nombreProducto"),
  campo(2, "Precio", "decimal", "precio"),
  campo(3, "Stock", "numero", "stock"),
];
const camposProveedores = [
  campo(40, "Empresa", "texto", null, { filtrable: true }),
  campo(41, "Visitas", "numero", null, { filtrable: true }),
  campo(42, "Notas", "texto", null, { visible: false }),
];

const pagina = (contenido: unknown[]) => ({
  contenido,
  pagina: 0,
  tamano: 20,
  total: contenido.length,
  paginas: 1,
});

const cemento = { idproducto: 1, nombreproducto: "Cemento", precio: 10, stock: 2, stockminimo: 5 };

/** Backend simulado: anota cada petición y responde por ruta exacta. */
function simular(extra: Record<string, unknown> = {}) {
  const llamadas: { clave: string; cuerpo: unknown }[] = [];
  const respuestas: Record<string, unknown> = {
    "GET /auth/yo": { correo: "m@correo.com", tipo: "DUENO", idsistema: 7, permisos: [] },
    "GET /sistemas/actual": sistema,
    "GET /sistemas": [sistema],
    "GET /modulos": modulos,
    "GET /modulos/configuracion": modulos,
    "GET /modulos/1/campos": camposProductos,
    "GET /modulos/1/campos/configuracion": camposProductos,
    "GET /modulos/2/campos": [],
    "GET /modulos/3/campos": [],
    "GET /modulos/9/campos": camposProveedores.filter((c) => c.visible),
    "GET /productos?pagina=0&tamano=20": pagina([
      cemento,
      { ...cemento, idproducto: 2, nombreproducto: "Pintura", stock: 30 },
    ]),
    "GET /productos/stockbajo": [cemento],
    "GET /ventas?pagina=0&tamano=20": pagina([
      {
        idventa: 12,
        personal: null,
        cliente: "Ana",
        total: 20,
        fecha: "2026-11-27",
        hora: "10:30:00",
      },
    ]),
    "GET /ventas?pagina=0&tamano=20&desde=2026-11-01&hasta=2026-11-30": pagina([]),
    "GET /ventas/12": {
      idventa: 12,
      personal: null,
      cliente: "Ana",
      total: 20,
      fecha: "2026-11-27",
      hora: "10:30:00",
      detalles: [
        {
          iddetalle: 1,
          idproducto: 1,
          producto: "Cemento",
          cantidad: 2,
          preciounitario: 10,
          subtotal: 20,
        },
      ],
    },
    "GET /movimientos/producto/1?pagina=0&tamano=20": pagina([
      {
        idmovimiento: 5,
        personal: null,
        tipo: "Entrada",
        cantidad: 7,
        fecha: "2026-11-20",
        hora: "09:00:00",
        motivo: "Compra",
      },
    ]),
    "GET /modulos/9/registros?pagina=0&tamano=20": pagina([
      { idregistro: 3, datos: { "40": "Aceros SAC", "41": 2 } },
    ]),
    "GET /modulos/9/registros/filtro/texto?idcampo=40&pagina=0&tamano=20&valor=Aceros%20SAC":
      pagina([]),
    "GET /modulos/9/registros/filtro/numerico?idcampo=41&pagina=0&tamano=20&min=3&max=99999999999999":
      pagina([]),
    "PUT /sistemas/7": null,
    "DELETE /sistemas/7": null,
    "PUT /modulos/9": null,
    "PUT /modulos/1/campos/orden": null,
    ...extra,
  };
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const clave = `${init.method} ${url.replace("http://localhost:9090", "")}`;
      llamadas.push({ clave, cuerpo: init.body ? JSON.parse(String(init.body)) : null });
      if (!(clave in respuestas))
        return new Response(JSON.stringify({ mensaje: `Sin simular: ${clave}` }), { status: 404 });
      const r = respuestas[clave];
      return new Response(r === null ? null : JSON.stringify(r), { status: 200 });
    }),
  );
  return llamadas;
}

beforeEach(() => {
  window.localStorage.clear();
  cerrarSesion();
  window.localStorage.setItem("cuadrastock:token", "T");
  vi.unstubAllGlobals();
});

describe("Mis sistemas: editar y eliminar", () => {
  it("edita el nombre y los colores de un sistema", async () => {
    const llamadas = simular({
      "GET /auth/yo": { correo: "m@correo.com", tipo: "DUENO", idsistema: null },
    });
    abrir("/sistemas");

    fireEvent.click(await screen.findByRole("button", { name: "Editar Bodega" }));
    fireEvent.change(await screen.findByLabelText("Nombre del negocio"), {
      target: { value: "Bodega Central" },
    });
    fireEvent.change(screen.getByLabelText("Color principal"), { target: { value: "#ff0000" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(llamadas.find((l) => l.clave === "PUT /sistemas/7")?.cuerpo).toEqual({
        nombrenegocio: "Bodega Central",
        colorprincipal: "#ff0000",
        colorsecundario: "#f59e0b",
      }),
    );
  });

  it("no guarda un nombre vacío", async () => {
    const llamadas = simular({
      "GET /auth/yo": { correo: "m@correo.com", tipo: "DUENO", idsistema: null },
    });
    abrir("/sistemas");

    fireEvent.click(await screen.findByRole("button", { name: "Editar Bodega" }));
    fireEvent.change(await screen.findByLabelText("Nombre del negocio"), {
      target: { value: " " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Ingresa el nombre");
    expect(llamadas.some((l) => l.clave.startsWith("PUT"))).toBe(false);
  });

  it("elimina un sistema solo tras confirmar", async () => {
    const llamadas = simular({
      "GET /auth/yo": { correo: "m@correo.com", tipo: "DUENO", idsistema: null },
    });
    abrir("/sistemas");

    fireEvent.click(await screen.findByRole("button", { name: "Eliminar Bodega" }));
    expect(llamadas.some((l) => l.clave === "DELETE /sistemas/7")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    fireEvent.click(screen.getByRole("button", { name: "Eliminar Bodega" }));
    fireEvent.click(screen.getByRole("button", { name: "Sí, eliminar" }));

    await waitFor(() => expect(llamadas.some((l) => l.clave === "DELETE /sistemas/7")).toBe(true));
  });
});

describe("Configurar: renombrar módulos y ordenar campos", () => {
  it("renombra un módulo", async () => {
    const llamadas = simular();
    abrir("/panel");
    fireEvent.click(await screen.findByRole("button", { name: /Configurar/ }));

    fireEvent.click(await screen.findByRole("button", { name: "Renombrar Proveedores" }));
    fireEvent.change(screen.getByLabelText("Nuevo nombre de Proveedores"), {
      target: { value: "Distribuidores" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(llamadas.find((l) => l.clave === "PUT /modulos/9")?.cuerpo).toEqual({
        nombremodulo: "Distribuidores",
      }),
    );
  });

  it("sube un campo y envía la lista completa en el nuevo orden", async () => {
    const llamadas = simular();
    abrir("/panel");
    fireEvent.click(await screen.findByRole("button", { name: /Configurar/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Campos de Productos" }));

    expect(await screen.findByRole("button", { name: "Subir Nombre" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Bajar Stock" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Subir Precio" }));

    await waitFor(() =>
      expect(llamadas.find((l) => l.clave === "PUT /modulos/1/campos/orden")?.cuerpo).toEqual({
        idcampos: [2, 1, 3],
      }),
    );
  });
});

describe("Consultas del gestor", () => {
  it("ventas y movimientos muestran hoy por defecto y se filtran por fechas", async () => {
    const llamadas = simular();
    abrir("/panel");
    await screen.findByText("Cemento");
    fireEvent.click(screen.getByRole("button", { name: /Ventas/ }));

    expect(await screen.findByText("V-0012")).toBeInTheDocument();
    expect(screen.getByText(/Mostrando solo las ventas de hoy/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2026-11-01" } });
    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "2026-11-30" } });
    fireEvent.click(screen.getByRole("button", { name: "Filtrar" }));

    expect(await screen.findByText("No hay registros que coincidan")).toBeInTheDocument();
    expect(
      llamadas.some(
        (l) => l.clave === "GET /ventas?pagina=0&tamano=20&desde=2026-11-01&hasta=2026-11-30",
      ),
    ).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Hoy" }));
    expect(await screen.findByText("V-0012")).toBeInTheDocument();
  });

  it("rechaza un rango con Desde posterior a Hasta", async () => {
    const llamadas = simular();
    abrir("/panel");
    await screen.findByText("Cemento");
    fireEvent.click(screen.getByRole("button", { name: /Ventas/ }));
    await screen.findByText("V-0012");

    fireEvent.change(screen.getByLabelText("Desde"), { target: { value: "2026-12-01" } });
    fireEvent.change(screen.getByLabelText("Hasta"), { target: { value: "2026-11-01" } });
    fireEvent.click(screen.getByRole("button", { name: "Filtrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("no puede ser posterior");
    expect(llamadas.filter((l) => l.clave.includes("desde=")).length).toBe(0);
  });

  it("muestra el detalle de una venta", async () => {
    simular();
    abrir("/panel");
    await screen.findByText("Cemento");
    fireEvent.click(screen.getByRole("button", { name: /Ventas/ }));
    fireEvent.click(await screen.findByRole("button", { name: "Ver detalle de V-0012" }));

    const detalle = (await screen.findByText("Detalle de la venta V-0012"))
      .parentElement as HTMLElement;
    expect(await within(detalle).findByText("Cemento")).toBeInTheDocument();
    expect(within(detalle).getByText("Total")).toBeInTheDocument();
    expect(within(detalle).getAllByText("S/ 20.00").length).toBeGreaterThan(0);
  });

  it("filtra productos con stock bajo", async () => {
    const llamadas = simular();
    abrir("/panel");
    await screen.findByText("Pintura");

    fireEvent.click(screen.getByRole("button", { name: "Solo stock bajo" }));

    await waitFor(() => expect(screen.queryByText("Pintura")).not.toBeInTheDocument());
    expect(screen.getByText("Cemento")).toBeInTheDocument();
    expect(llamadas.some((l) => l.clave === "GET /productos/stockbajo")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Solo stock bajo" }));
    expect(await screen.findByText("Pintura")).toBeInTheDocument();
  });

  it("muestra el historial de movimientos de un producto", async () => {
    simular();
    abrir("/panel");
    fireEvent.click(await screen.findByRole("button", { name: "Historial de Cemento" }));

    expect(await screen.findByText("Compra")).toBeInTheDocument();
    expect(screen.getByText("Entrada")).toBeInTheDocument();
    expect(screen.getByText("Historial de Cemento", { selector: "h2" })).toBeInTheDocument();
  });

  it("filtra un módulo personalizado por un campo filtrable", async () => {
    const llamadas = simular();
    abrir("/panel");
    await screen.findByText("Cemento");
    fireEvent.click(screen.getByRole("button", { name: /Proveedores/ }));
    await screen.findByText("Aceros SAC");

    // Solo ofrece los campos filtrables y visibles.
    const selector = screen.getByLabelText("Filtrar por");
    expect(
      within(selector)
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual(["Empresa", "Visitas"]);

    fireEvent.change(screen.getByLabelText("Es igual a"), { target: { value: "Aceros SAC" } });
    fireEvent.click(screen.getByRole("button", { name: "Filtrar" }));
    expect(await screen.findByText("No hay registros que coincidan")).toBeInTheDocument();
    expect(
      llamadas.some(
        (l) =>
          l.clave ===
          "GET /modulos/9/registros/filtro/texto?idcampo=40&pagina=0&tamano=20&valor=Aceros%20SAC",
      ),
    ).toBe(true);

    // Campo numérico: rango con un solo límite; el otro se completa solo.
    fireEvent.change(screen.getByLabelText("Filtrar por"), { target: { value: "41" } });
    fireEvent.change(screen.getByLabelText("Mínimo"), { target: { value: "3" } });
    fireEvent.click(screen.getByRole("button", { name: "Filtrar" }));
    await waitFor(() =>
      expect(
        llamadas.some(
          (l) =>
            l.clave ===
            "GET /modulos/9/registros/filtro/numerico?idcampo=41&pagina=0&tamano=20&min=3&max=99999999999999",
        ),
      ).toBe(true),
    );

    fireEvent.click(screen.getByRole("button", { name: "Quitar filtro" }));
    expect(await screen.findByText("Aceros SAC")).toBeInTheDocument();
  });
});
