import { describe, expect, it } from "vitest";

import type { Campo } from "@/lib/gestor";
import {
  aNumero,
  cuerpoProducto,
  datosDeRegistro,
  totalEstimado,
  validarMovimiento,
  validarProducto,
  validarRegistro,
  validarVenta,
} from "@/lib/registros";

const campo = (id: number, nombre: string, tipo: Campo["tipo"], columna: string | null): Campo => ({
  id,
  nombre,
  tipo,
  columna,
  orden: id,
});

const productos = [
  campo(1, "Nombre", "texto", "nombreProducto"),
  campo(2, "Precio", "decimal", "precio"),
  campo(3, "Stock", "numero", "stock"),
  campo(4, "Stock mínimo", "numero", "stockMinimo"),
  campo(5, "Vence", "fecha", "fechaVencimiento"),
];

describe("registros: productos", () => {
  it("arma el cuerpo con los nombres del backend y Stock como stockinicial", () => {
    const cuerpo = cuerpoProducto(productos, {
      nombreproducto: " Cemento ",
      precio: "25,5",
      stock: "10",
      stockminimo: "",
      fechavencimiento: "2027-01-31",
    });
    expect(cuerpo).toEqual({
      nombreproducto: "Cemento",
      precio: 25.5,
      stockinicial: 10,
      fechavencimiento: "2027-01-31",
    });
  });

  it("exige el nombre y números válidos", () => {
    expect(validarProducto(productos, {})).toMatchObject({ ok: false });
    expect(validarProducto(productos, { nombreproducto: "A", precio: "-1" })).toMatchObject({
      ok: false,
    });
    expect(validarProducto(productos, { nombreproducto: "A", stock: "1.5" })).toMatchObject({
      ok: false,
    });
    expect(validarProducto(productos, { nombreproducto: "A", precio: "3", stock: "2" })).toEqual({
      ok: true,
    });
  });

  it("aNumero acepta coma decimal y rechaza texto", () => {
    expect(aNumero("2,5")).toBe(2.5);
    expect(aNumero("abc")).toBeNull();
    expect(aNumero("  ")).toBeNull();
  });
});

describe("registros: movimientos y ventas", () => {
  it("valida cantidades según el tipo", () => {
    const base = { idproducto: "1", tipo: "Entrada" as const, cantidad: "0", motivo: "" };
    expect(validarMovimiento(base)).toMatchObject({ ok: false });
    expect(validarMovimiento({ ...base, tipo: "Ajuste" })).toEqual({ ok: true });
    expect(validarMovimiento({ ...base, idproducto: "" })).toMatchObject({ ok: false });
    expect(validarMovimiento({ ...base, cantidad: "4" })).toEqual({ ok: true });
  });

  it("la venta necesita productos, cantidades enteras y sin repetir", () => {
    expect(validarVenta("", [{ idproducto: "", cantidad: "" }])).toMatchObject({ ok: false });
    expect(validarVenta("", [{ idproducto: "1", cantidad: "0" }])).toMatchObject({ ok: false });
    expect(
      validarVenta("", [
        { idproducto: "1", cantidad: "1" },
        { idproducto: "1", cantidad: "2" },
      ]),
    ).toMatchObject({ ok: false });
    expect(validarVenta("Ana", [{ idproducto: "1", cantidad: "2" }])).toEqual({ ok: true });
  });

  it("estima el total con los precios actuales", () => {
    const lista = [{ id: 1, nombre: "A", precio: 2.5, stock: 9 }];
    expect(totalEstimado([{ idproducto: "1", cantidad: "4" }], lista)).toBe(10);
    expect(totalEstimado([{ idproducto: "", cantidad: "4" }], lista)).toBe(0);
  });
});

describe("registros: módulos personalizados", () => {
  const campos = [
    campo(10, "Detalle", "texto", null),
    campo(11, "Cantidad", "numero", null),
    campo(12, "Monto", "decimal", null),
  ];

  it("envía { idCampo: valor } con números como número y omite vacíos", () => {
    expect(datosDeRegistro(campos, { c10: " hola ", c11: "3", c12: "" })).toEqual({
      "10": "hola",
      "11": 3,
    });
  });

  it("pide al menos un campo y respeta los tipos", () => {
    expect(validarRegistro(campos, {})).toMatchObject({ ok: false });
    expect(validarRegistro(campos, { c11: "2.5" })).toMatchObject({ ok: false });
    expect(validarRegistro(campos, { c12: "x" })).toMatchObject({ ok: false });
    expect(validarRegistro(campos, { c10: "ok" })).toEqual({ ok: true });
  });
});
