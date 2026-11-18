import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { validarPasoDatos, validarPasoIdentidad } from "@/routes/registro";
import type { DatosNegocio } from "@/routes/registro";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });

  it("matches the registro wizard at /registro", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/registro");

    expect(matches.at(-1)?.routeId).toBe("/registro");
  });
});

const datosValidos: DatosNegocio = {
  nombre: "Bodega Doña María",
  logo: null,
  colorPrimario: "#2563eb",
  colorSecundario: "#16a34a",
  rubro: "Bodega",
  ruc: "",
  direccion: "Av. Los Álamos 245",
  distrito: "San Juan de Lurigancho",
  telefono: "987654321",
};

describe("Validación del registro de negocio", () => {
  it("exige el nombre del negocio", () => {
    const errores = validarPasoIdentidad({ ...datosValidos, nombre: "   " });
    expect(errores).toHaveProperty("nombre");
    expect(validarPasoIdentidad(datosValidos)).not.toHaveProperty("nombre");
  });

  it("valida el RUC opcional con 11 dígitos", () => {
    expect(validarPasoDatos({ ...datosValidos, ruc: "12345" })).toHaveProperty("ruc");
    expect(validarPasoDatos({ ...datosValidos, ruc: "20512345678" })).not.toHaveProperty("ruc");
  });

  it("exige un teléfono de 9 dígitos", () => {
    expect(validarPasoDatos({ ...datosValidos, telefono: "98765432" })).toHaveProperty("telefono");
    expect(validarPasoDatos({ ...datosValidos, telefono: "987654321" })).not.toHaveProperty("telefono");
  });

  it("los datos del paso 2 completos no producen errores", () => {
    expect(Object.keys(validarPasoDatos(datosValidos))).toHaveLength(0);
  });
});
