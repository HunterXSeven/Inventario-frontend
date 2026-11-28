import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  cerrarSesion,
  destinoPara,
  guardarNegocio,
  iniciarSesion,
  iniciarSesionConGoogle,
  listarSistemas,
  obtenerSesion,
  registrarUsuario,
  seleccionarSistema,
} from "@/lib/auth";
import { leerToken } from "@/lib/api";

/** Simula el backend: cada respuesta se consume en orden y se registran las peticiones. */
function simularBackend(respuestas: Array<{ estado?: number; cuerpo?: unknown }>) {
  const llamadas: Array<{ ruta: string; metodo: string; cuerpo: unknown; auth: string | null }> =
    [];
  const cola = [...respuestas];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const headers = (init.headers ?? {}) as Record<string, string>;
      llamadas.push({
        ruta: url.replace("http://localhost:9090", ""),
        metodo: String(init.method),
        cuerpo: init.body ? JSON.parse(String(init.body)) : null,
        auth: headers["Authorization"] ?? null,
      });
      const r = cola.shift() ?? { estado: 500 };
      const estado = r.estado ?? 200;
      return new Response(r.cuerpo === undefined ? null : JSON.stringify(r.cuerpo), {
        status: estado,
      });
    }),
  );
  return llamadas;
}

const sistema = {
  idsistema: 7,
  nombrenegocio: "Bodega Doña María",
  colorprincipal: "#2563eb",
  colorsecundario: "#16a34a",
  logourl: null,
};

beforeEach(() => {
  window.localStorage.clear();
  cerrarSesion();
  vi.unstubAllGlobals();
});

describe("Sesión contra el backend", () => {
  it("registra una cuenta, guarda el token y no manda el nombre al backend", async () => {
    const llamadas = simularBackend([
      { estado: 201, cuerpo: { token: "T1", tipo: "DUENO", sistema: null } },
    ]);

    const r = await registrarUsuario({
      nombre: "María Quispe",
      correo: " maria@correo.com ",
      contrasena: "clave1234",
    });

    expect(r.ok).toBe(true);
    expect(llamadas[0]).toMatchObject({
      ruta: "/auth/registro",
      metodo: "POST",
      cuerpo: { correo: "maria@correo.com", contrasena: "clave1234" },
      auth: null,
    });
    expect(leerToken()).toBe("T1");
    if (r.ok) expect(r.usuario).toMatchObject({ nombre: "María Quispe", negocio: null });
  });

  it("muestra el mensaje del backend y marca el campo correo si ya está registrado", async () => {
    simularBackend([{ estado: 400, cuerpo: { mensaje: "El correo ya está registrado" } }]);

    const r = await registrarUsuario({ nombre: "A", correo: "a@a.com", contrasena: "clave1234" });

    expect(r).toEqual({ ok: false, campo: "correo", error: "El correo ya está registrado" });
    expect(leerToken()).toBeNull();
  });

  it("el dueño siempre pasa por la lista de sistemas, aunque tenga uno solo", async () => {
    const llamadas = simularBackend([{ cuerpo: { token: "T2", tipo: "DUENO", sistema } }]);

    const r = await iniciarSesion("maria@correo.com", "clave1234");

    expect(llamadas).toHaveLength(1);
    expect(r.ok && r.usuario.negocio).toBeNull();
    expect(r.ok && destinoPara(r.usuario)).toBe("/sistemas");
  });

  it("con Google envía la credencial a /auth/google y abre la sesión del dueño", async () => {
    const llamadas = simularBackend([
      { cuerpo: { token: "TG", tipo: "DUENO", sistema: null } },
      { cuerpo: { correo: "maria@gmail.com", tipo: "DUENO", idsistema: null, permisos: [] } },
    ]);

    const r = await iniciarSesionConGoogle("ID-TOKEN-DE-GOOGLE");

    expect(llamadas[0]).toMatchObject({
      ruta: "/auth/google",
      metodo: "POST",
      cuerpo: { credencial: "ID-TOKEN-DE-GOOGLE" },
      auth: null,
    });
    expect(llamadas[1]).toMatchObject({ ruta: "/auth/yo", auth: "Bearer TG" });
    expect(leerToken()).toBe("TG");
    expect(r.ok && r.usuario).toMatchObject({ correo: "maria@gmail.com", tipo: "DUENO" });
    expect(r.ok && destinoPara(r.usuario)).toBe("/sistemas");
  });

  it("con Google muestra el mensaje del backend y no deja token si la credencial es inválida", async () => {
    simularBackend([
      { estado: 401, cuerpo: { mensaje: "No pudimos validar tu cuenta de Google." } },
    ]);

    const r = await iniciarSesionConGoogle("falsa");

    expect(r).toEqual({
      ok: false,
      campo: "general",
      error: "No pudimos validar tu cuenta de Google.",
    });
    expect(leerToken()).toBeNull();
  });

  it("el personal entra directo a su sistema", async () => {
    simularBackend([{ cuerpo: { token: "TP", tipo: "PERSONAL", sistema } }]);

    const r = await iniciarSesion("vendedor@correo.com", "clave1234");

    expect(r.ok && r.usuario.negocio).toMatchObject({ id: 7, nombre: "Bodega Doña María" });
    expect(r.ok && destinoPara(r.usuario)).toBe("/panel");
  });

  it("una cuenta recién creada va a la lista de sistemas", async () => {
    simularBackend([{ estado: 201, cuerpo: { token: "T1", tipo: "DUENO", sistema: null } }]);

    const r = await registrarUsuario({ nombre: "A", correo: "a@a.com", contrasena: "clave1234" });

    expect(r.ok && destinoPara(r.usuario)).toBe("/sistemas");
  });

  it("listarSistemas devuelve los negocios del dueño", async () => {
    window.localStorage.setItem("cuadrastock:token", "T1");
    const llamadas = simularBackend([
      { cuerpo: [sistema, { ...sistema, idsistema: 8, nombrenegocio: "Otra tienda" }] },
    ]);

    const r = await listarSistemas();

    expect(llamadas[0]).toMatchObject({ ruta: "/sistemas", metodo: "GET", auth: "Bearer T1" });
    expect(r.ok && r.sistemas.map((x) => x.nombre)).toEqual(["Bodega Doña María", "Otra tienda"]);
  });

  it("seleccionarSistema cambia al token ligado al sistema elegido", async () => {
    window.localStorage.setItem("cuadrastock:token", "T1");
    const llamadas = simularBackend([{ cuerpo: { token: "T9", tipo: "DUENO", sistema } }]);

    const r = await seleccionarSistema(7);

    expect(llamadas[0]).toMatchObject({
      ruta: "/auth/sistema/7",
      metodo: "POST",
      auth: "Bearer T1",
    });
    expect(leerToken()).toBe("T9");
    expect(r.ok && r.negocio.id).toBe(7);
  });

  it("seleccionarSistema muestra el error si el sistema no es del dueño", async () => {
    window.localStorage.setItem("cuadrastock:token", "T1");
    simularBackend([{ estado: 404, cuerpo: { mensaje: "El sistema no existe" } }]);

    expect(await seleccionarSistema(99)).toEqual({ ok: false, error: "El sistema no existe" });
    expect(leerToken()).toBe("T1");
  });

  it("login con contraseña incorrecta devuelve el error general", async () => {
    simularBackend([{ estado: 401, cuerpo: { mensaje: "Correo o contraseña incorrectos" } }]);

    const r = await iniciarSesion("maria@correo.com", "mala");

    expect(r).toEqual({ ok: false, campo: "general", error: "Correo o contraseña incorrectos" });
  });

  it("guardarNegocio crea el sistema y cambia al token ligado a él", async () => {
    window.localStorage.setItem("cuadrastock:token", "T1");
    const llamadas = simularBackend([
      { estado: 201, cuerpo: sistema },
      { cuerpo: { token: "T5", tipo: "DUENO", sistema } },
    ]);

    const r = await guardarNegocio({
      nombre: "  Bodega Doña María ",
      colorPrimario: "#2563eb",
      colorSecundario: "#16a34a",
    });

    expect(llamadas[0]).toMatchObject({
      ruta: "/sistemas",
      metodo: "POST",
      auth: "Bearer T1",
      cuerpo: {
        nombrenegocio: "Bodega Doña María",
        colorprincipal: "#2563eb",
        colorsecundario: "#16a34a",
      },
    });
    expect(llamadas[1]).toMatchObject({
      ruta: "/auth/sistema/7",
      metodo: "POST",
      auth: "Bearer T1",
    });
    expect(leerToken()).toBe("T5");
    expect(r.ok).toBe(true);
  });

  it("un token vencido (401) se descarta y la sesión queda en null", async () => {
    window.localStorage.setItem("cuadrastock:token", "VIEJO");
    simularBackend([{ estado: 401 }]);

    expect(await obtenerSesion()).toBeNull();
    expect(leerToken()).toBeNull();
  });

  it("sin conexión con el backend explica qué pasó", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const r = await iniciarSesion("maria@correo.com", "clave1234");

    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/conectar con el servidor/);
  });
});
