import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cargarTabla,
  formatearCelda,
  formatearFecha,
  listarCampos,
  listarModulos,
} from "@/lib/gestor";
import type { Campo, Modulo } from "@/lib/gestor";

function simularBackend(respuestas: unknown[]) {
  const rutas: string[] = [];
  const cola = [...respuestas];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) => {
      rutas.push(url.replace("http://localhost:9090", ""));
      return new Response(JSON.stringify(cola.shift() ?? null), { status: 200 });
    }),
  );
  return rutas;
}

const pagina = <T>(contenido: T[], extra = {}) => ({
  contenido,
  pagina: 0,
  tamano: 20,
  total: contenido.length,
  paginas: 1,
  ...extra,
});

const modulo = (predefinido: Modulo["predefinido"], id = 1): Modulo => ({
  id,
  nombre: predefinido ?? "Clientes",
  predefinido,
  ocultable: false,
  visible: true,
});

const campo = (
  id: number,
  nombre: string,
  tipo: Campo["tipo"],
  columna: string | null,
  orden = id,
): Campo => ({
  id,
  nombre,
  tipo,
  columna,
  orden,
  filtrable: false,
});

beforeEach(() => {
  window.localStorage.clear();
  vi.unstubAllGlobals();
});

describe("Menú y campos", () => {
  it("listarModulos traduce la respuesta del backend", async () => {
    simularBackend([
      [
        {
          idmodulo: 3,
          nombremodulo: "Ventas",
          predefinido: "ventas",
          ocultable: false,
          visible: true,
        },
      ],
    ]);
    expect(await listarModulos()).toEqual([
      { id: 3, nombre: "Ventas", predefinido: "ventas", ocultable: false, visible: true },
    ]);
  });

  it("listarCampos ordena por (orden, idcampo)", async () => {
    simularBackend([
      [
        { idcampo: 5, nombrecampo: "B", tipocampo: "texto", columna: null, orden: 2 },
        { idcampo: 9, nombrecampo: "A", tipocampo: "texto", columna: null, orden: 1 },
        { idcampo: 4, nombrecampo: "C", tipocampo: "texto", columna: null, orden: 2 },
      ],
    ]);
    expect((await listarCampos(1)).map((c) => c.nombre)).toEqual(["A", "C", "B"]);
  });
});

describe("Tablas de módulos predefinidos", () => {
  it("productos: columnas desde los campos visibles y alerta de stock bajo", async () => {
    const rutas = simularBackend([
      pagina([
        {
          idproducto: 1,
          nombreproducto: "Cemento",
          precio: 25.5,
          stock: 3,
          stockminimo: 5,
          imagenurl: null,
        },
        {
          idproducto: 2,
          nombreproducto: "Pintura",
          precio: 40,
          stock: 20,
          stockminimo: 5,
          imagenurl: null,
        },
      ]),
    ]);
    const campos = [
      campo(1, "Nombre", "texto", "nombreProducto"),
      campo(2, "Precio", "decimal", "precio"),
      campo(3, "Stock", "numero", "stock"),
    ];

    const t = await cargarTabla(modulo("productos"), campos, 0);

    expect(rutas[0]).toBe("/productos?pagina=0&tamano=20");
    expect(t.columnas.map((c) => [c.clave, c.titulo, c.tipo])).toEqual([
      ["nombreproducto", "Nombre", "texto"],
      ["precio", "Precio", "dinero"],
      ["stock", "Stock", "numero"],
    ]);
    expect(t.filas.map((f) => f.alerta)).toEqual([true, false]);
    expect(t.filas[0]?.celdas["nombreproducto"]).toBe("Cemento");
  });

  it("un campo oculto no genera columna", async () => {
    simularBackend([
      pagina([
        {
          idproducto: 1,
          nombreproducto: "Cemento",
          precio: 1,
          stock: 1,
          stockminimo: 0,
          lote: "L1",
        },
      ]),
    ]);
    // El backend ya no devuelve el campo "Lote" porque está oculto: solo llegan Nombre y Precio.
    const campos = [
      campo(1, "Nombre", "texto", "nombreProducto"),
      campo(2, "Precio", "decimal", "precio"),
    ];

    const t = await cargarTabla(modulo("productos"), campos, 0);

    expect(t.columnas.map((c) => c.titulo)).toEqual(["Nombre", "Precio"]);
  });

  it("ventas: número, vendedor y cliente solo si el campo está visible", async () => {
    const venta = {
      idventa: 12,
      personal: null,
      cliente: "Ana",
      total: 1188,
      fecha: "2026-11-13",
      hora: "10:05:00",
    };
    simularBackend([pagina([venta]), pagina([venta])]);

    const con = await cargarTabla(modulo("ventas"), [campo(1, "Cliente", "texto", "cliente")], 0);
    const sin = await cargarTabla(modulo("ventas"), [], 0);

    expect(con.columnas.map((c) => c.titulo)).toEqual([
      "N° venta",
      "Fecha",
      "Cliente",
      "Vendedor",
      "Total",
    ]);
    expect(sin.columnas.map((c) => c.titulo)).toEqual(["N° venta", "Fecha", "Vendedor", "Total"]);
    expect(con.filas[0]?.celdas).toMatchObject({
      numero: "V-0012",
      vendedor: "Administrador",
      total: 1188,
    });
  });

  it("movimientos: responsable por defecto es el administrador", async () => {
    simularBackend([
      pagina([
        {
          idmovimiento: 1,
          producto: "Cemento",
          personal: null,
          tipo: "Entrada",
          cantidad: 10,
          fecha: "2026-11-13",
          hora: "10:05:00",
          motivo: "Stock inicial",
        },
      ]),
    ]);

    const t = await cargarTabla(modulo("movimientos"), [], 0);

    expect(t.columnas.map((c) => c.titulo)).toEqual([
      "Fecha",
      "Producto",
      "Tipo",
      "Cantidad",
      "Responsable",
      "Motivo",
    ]);
    expect(t.filas[0]?.celdas["responsable"]).toBe("Administrador");
  });

  it("personal: el backend no pagina, todo llega en una página", async () => {
    simularBackend([[{ idpersonal: 1, nombre: "Luis", dni: "12345678", correo: "luis@x.com" }]]);
    const campos = [campo(1, "Nombre", "texto", "nombre"), campo(2, "Correo", "texto", "correo")];

    const t = await cargarTabla(modulo("personal"), campos, 0);

    expect(t).toMatchObject({ pagina: 0, paginas: 1, total: 1 });
    expect(t.filas[0]?.celdas["correo"]).toBe("luis@x.com");
  });
});

describe("Módulos personalizados", () => {
  it("toma los valores de datos[idCampo] y respeta la página pedida", async () => {
    const rutas = simularBackend([
      pagina([{ idregistro: 7, datos: { "11": "Ferretería Los Andes", "12": 4 } }], {
        pagina: 1,
        total: 21,
        paginas: 2,
      }),
    ]);
    const campos = [campo(11, "Cliente", "texto", null), campo(12, "Visitas", "numero", null)];

    const t = await cargarTabla(modulo(null, 5), campos, 1);

    expect(rutas[0]).toBe("/modulos/5/registros?pagina=1&tamano=20");
    expect(t.columnas.map((c) => c.clave)).toEqual(["c11", "c12"]);
    expect(t.filas[0]?.celdas).toEqual({ c11: "Ferretería Los Andes", c12: 4 });
    expect(t).toMatchObject({ pagina: 1, paginas: 2, total: 21 });
  });

  it("un registro sin valor en un campo deja la celda vacía", async () => {
    simularBackend([pagina([{ idregistro: 1, datos: {} }])]);

    const t = await cargarTabla(modulo(null, 5), [campo(11, "Cliente", "texto", null)], 0);

    expect(formatearCelda("texto", t.filas[0]?.celdas["c11"])).toBe("—");
  });
});

describe("Formato", () => {
  it("la fecha no se corre de día por la zona horaria", () => {
    expect(formatearFecha("2026-11-13")).toBe("13/11/2026");
    expect(formatearFecha("2026-11-13T23:30:00")).toBe("13/11/2026");
  });

  it("dinero en soles con dos decimales y separador de miles", () => {
    expect(formatearCelda("dinero", 1188)).toBe("S/ 1,188.00");
    expect(formatearCelda("dinero", "25.5")).toBe("S/ 25.50");
  });

  it("fecha y hora juntas, sin segundos", () => {
    expect(formatearCelda("fechahora", { fecha: "2026-11-13", hora: "10:05:33" })).toBe(
      "13/11/2026 10:05",
    );
  });

  it("valores vacíos se muestran como guion", () => {
    expect(formatearCelda("texto", null)).toBe("—");
    expect(formatearCelda("numero", undefined)).toBe("—");
  });
});
