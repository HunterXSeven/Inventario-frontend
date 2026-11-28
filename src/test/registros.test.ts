import { describe, expect, it } from "vitest";

import type { Campo, Modulo } from "@/lib/gestor";
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
  filtrable: false,
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

import { cambiarPermiso, cuerpoPermisos, filasIniciales, validarPersonal } from "@/lib/personal";

describe("personal y permisos", () => {
  const modulos: Modulo[] = [
    { id: 1, nombre: "Productos", predefinido: "productos", ocultable: false, visible: true },
    { id: 4, nombre: "Personal", predefinido: "personal", ocultable: true, visible: true },
  ];

  it("la matriz excluye Personal y empieza sin permisos", () => {
    const filas = filasIniciales(modulos);
    expect(filas).toHaveLength(1);
    expect(cuerpoPermisos(filas)).toEqual([]);
  });

  it("crear/editar/eliminar activan ver y quitar ver lo apaga todo", () => {
    const f = filasIniciales(modulos)[0]!;
    const conCrear = cambiarPermiso(f, "crear", true);
    expect(conCrear).toMatchObject({ ver: true, crear: true });
    expect(cambiarPermiso(conCrear, "ver", false)).toMatchObject({ ver: false, crear: false });
    expect(cambiarPermiso(conCrear, "crear", false)).toMatchObject({ ver: true, crear: false });
  });

  it("valida nombre, correo y contraseña", () => {
    const ok = { nombre: "Luis", dni: "", correo: "luis@correo.com", contrasena: "clave1234" };
    expect(validarPersonal(ok)).toEqual({ ok: true });
    expect(validarPersonal({ ...ok, nombre: " " })).toMatchObject({ ok: false });
    expect(validarPersonal({ ...ok, correo: "luis" })).toMatchObject({ ok: false });
    expect(validarPersonal({ ...ok, contrasena: "1234567" })).toMatchObject({ ok: false });
  });
});
