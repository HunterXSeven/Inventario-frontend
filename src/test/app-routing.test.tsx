import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";
import { validarPasoIdentidad } from "@/routes/registro";
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
  logoUrl: "",
  colorPrimario: "#2563eb",
  colorSecundario: "#16a34a",
};

describe("Validación del registro de negocio", () => {
  it("exige el nombre del negocio", () => {
    const errores = validarPasoIdentidad({ ...datosValidos, nombre: "   " });
    expect(errores).toHaveProperty("nombre");
    expect(validarPasoIdentidad(datosValidos)).not.toHaveProperty("nombre");
  });

  it("limita el nombre a 255 caracteres (largo de la columna del backend)", () => {
    expect(validarPasoIdentidad({ ...datosValidos, nombre: "a".repeat(256) })).toHaveProperty("nombre");
  });

  it("el logo es opcional pero, si se escribe, debe ser un enlace http(s)", () => {
    expect(validarPasoIdentidad({ ...datosValidos, logoUrl: "logo.png" })).toHaveProperty("logoUrl");
    expect(validarPasoIdentidad({ ...datosValidos, logoUrl: "https://sitio.com/logo.png" })).not.toHaveProperty("logoUrl");
    expect(validarPasoIdentidad(datosValidos)).not.toHaveProperty("logoUrl");
  });

  it("el logo no puede superar los 255 caracteres", () => {
    const largo = `https://sitio.com/${"a".repeat(250)}.png`;
    expect(validarPasoIdentidad({ ...datosValidos, logoUrl: largo })).toHaveProperty("logoUrl");
  });

  it("datos completos y válidos no producen errores", () => {
    expect(Object.keys(validarPasoIdentidad(datosValidos))).toHaveLength(0);
  });
});
