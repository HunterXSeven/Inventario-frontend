import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { cerrarSesion } from "@/lib/auth";
import { abrir } from "@/test/ayudas";

interface ModuloFalso {
  idmodulo: number;
  nombremodulo: string;
  predefinido: string | null;
  ocultable: boolean;
  visible: boolean;
}

interface CampoFalso {
  idcampo: number;
  idmodulo: number;
  nombrecampo: string;
  tipocampo: string;
  columna: string | null;
  ocultable: boolean;
  visible: boolean;
  filtrable: boolean;
  orden: number;
}

const sistema = {
  idsistema: 7,
  nombrenegocio: "Bodega Doña María",
  colorprincipal: "#1e3a8a",
  colorsecundario: "#f59e0b",
  logourl: null,
};

/**
 * Backend simulado con estado: guarda módulos y campos en memoria y aplica las
 * mismas reglas que el real (solo se oculta lo ocultable, lo de sistema no se
 * elimina, solo los módulos personalizados aceptan campos nuevos).
 */
function simularBackend(opciones: { personalConEmpleados?: boolean } = {}) {
  const modulos: ModuloFalso[] = [
    {
      idmodulo: 1,
      nombremodulo: "Productos",
      predefinido: "productos",
      ocultable: false,
      visible: true,
    },
    {
      idmodulo: 2,
      nombremodulo: "Personal",
      predefinido: "personal",
      ocultable: true,
      visible: true,
    },
    { idmodulo: 3, nombremodulo: "Ventas", predefinido: "ventas", ocultable: false, visible: true },
    {
      idmodulo: 4,
      nombremodulo: "Movimientos",
      predefinido: "movimientos",
      ocultable: false,
      visible: true,
    },
  ];
  const campos: CampoFalso[] = [
    {
      idcampo: 1,
      idmodulo: 1,
      nombrecampo: "Nombre",
      tipocampo: "texto",
      columna: "nombreProducto",
      ocultable: false,
      visible: true,
      filtrable: false,
      orden: 1,
    },
    {
      idcampo: 2,
      idmodulo: 1,
      nombrecampo: "Lote",
      tipocampo: "texto",
      columna: "lote",
      ocultable: true,
      visible: true,
      filtrable: false,
      orden: 2,
    },
  ];
  const llamadas: Array<{ clave: string; cuerpo: unknown }> = [];
  let sigModulo = 5;
  let sigCampo = 10;

  const json = (estado: number, cuerpo?: unknown) =>
    new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), { status: estado });
  const regla = (mensaje: string) => json(400, { mensaje });

  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const ruta = url.replace("http://localhost:9090", "");
      const clave = `${init.method} ${ruta}`;
      const cuerpo = init.body ? JSON.parse(String(init.body)) : undefined;
      llamadas.push({ clave, cuerpo });

      let m: RegExpMatchArray | null;

      if (clave === "GET /auth/yo")
        return json(200, { correo: "maria@correo.com", tipo: "DUENO", idsistema: 7 });
      if (clave === "GET /sistemas/actual") return json(200, sistema);
      if (clave === "GET /modulos")
        return json(
          200,
          modulos.filter((x) => x.visible),
        );
      if (clave === "GET /modulos/configuracion") return json(200, modulos);
      if (ruta.startsWith("GET /productos") || clave.startsWith("GET /productos")) {
        return json(200, { contenido: [], pagina: 0, tamano: 20, total: 0, paginas: 1 });
      }
      if (clave.startsWith("GET /modulos/") && clave.includes("/registros")) {
        return json(200, { contenido: [], pagina: 0, tamano: 20, total: 0, paginas: 1 });
      }

      if (clave === "POST /modulos") {
        if (
          modulos.some((x) => x.nombremodulo.toLowerCase() === cuerpo.nombremodulo.toLowerCase())
        ) {
          return regla("Ya existe un módulo con ese nombre");
        }
        const nuevo = {
          idmodulo: sigModulo++,
          nombremodulo: cuerpo.nombremodulo,
          predefinido: null,
          ocultable: false,
          visible: true,
        };
        modulos.push(nuevo);
        return json(201, nuevo);
      }
      if ((m = clave.match(/^PUT \/modulos\/(\d+)\/visibilidad$/))) {
        const x = modulos.find((y) => y.idmodulo === Number(m![1]))!;
        if (!cuerpo.visible && !x.ocultable) return regla("Este módulo no se puede ocultar");
        if (!cuerpo.visible && x.predefinido === "personal" && opciones.personalConEmpleados) {
          return regla("Elimina primero a tu personal para poder ocultar este módulo");
        }
        x.visible = cuerpo.visible;
        return json(204);
      }
      if ((m = clave.match(/^DELETE \/modulos\/(\d+)$/))) {
        const i = modulos.findIndex((y) => y.idmodulo === Number(m![1]));
        if (modulos[i]!.predefinido)
          return regla(
            "Los módulos predefinidos no se eliminan; puedes ocultarlos si no los necesitas",
          );
        modulos.splice(i, 1);
        return json(204);
      }

      if ((m = clave.match(/^GET \/modulos\/(\d+)\/campos(\/configuracion)?$/))) {
        const lista = campos.filter((c) => c.idmodulo === Number(m![1]));
        return json(200, m[2] ? lista : lista.filter((c) => c.visible));
      }
      if ((m = clave.match(/^POST \/modulos\/(\d+)\/campos$/))) {
        const mod = modulos.find((y) => y.idmodulo === Number(m![1]))!;
        if (mod.predefinido) return regla("Solo se pueden agregar campos a módulos personalizados");
        const nuevo: CampoFalso = {
          idcampo: sigCampo++,
          idmodulo: mod.idmodulo,
          nombrecampo: cuerpo.nombrecampo,
          tipocampo: cuerpo.tipocampo,
          columna: null,
          ocultable: false,
          visible: true,
          filtrable: cuerpo.filtrable,
          orden: 1,
        };
        campos.push(nuevo);
        return json(201, nuevo);
      }
      if ((m = clave.match(/^PUT \/campos\/(\d+)$/))) {
        const c = campos.find((y) => y.idcampo === Number(m![1]))!;
        if (
          campos.some(
            (y) =>
              y.idmodulo === c.idmodulo &&
              y.idcampo !== c.idcampo &&
              y.nombrecampo.toLowerCase() === cuerpo.nombrecampo.toLowerCase(),
          )
        ) {
          return regla("Ya existe un campo con ese nombre en el módulo");
        }
        c.nombrecampo = cuerpo.nombrecampo;
        if (!c.columna) {
          c.tipocampo = cuerpo.tipocampo;
          c.filtrable = cuerpo.filtrable;
        }
        return json(204);
      }
      if ((m = clave.match(/^PUT \/campos\/(\d+)\/visibilidad$/))) {
        const c = campos.find((y) => y.idcampo === Number(m![1]))!;
        if (!cuerpo.visible && !c.ocultable) return regla("Este campo no se puede ocultar");
        c.visible = cuerpo.visible;
        return json(204);
      }
      if ((m = clave.match(/^DELETE \/campos\/(\d+)$/))) {
        const i = campos.findIndex((y) => y.idcampo === Number(m![1]));
        if (campos[i]!.columna)
          return regla(
            "Los campos de sistema no se eliminan; puedes ocultarlos si no los necesitas",
          );
        campos.splice(i, 1);
        return json(204);
      }

      return json(404, { mensaje: `Sin simular: ${clave}` });
    }),
  );
  return { llamadas, modulos, campos };
}

const menu = () => screen.getByRole("navigation", { name: "Módulos" });
const fila = (nombre: string) => screen.getByText(nombre, { selector: "p" }).closest("li")!;

async function irAConfigurar() {
  window.localStorage.setItem("cuadrastock:token", "T");
  abrir("/panel");
  await screen.findByRole("heading", { name: "Productos" });
  fireEvent.click(screen.getByRole("button", { name: /Configurar/ }));
  await screen.findByRole("heading", { name: "Módulos" });
}

beforeEach(() => {
  window.localStorage.clear();
  cerrarSesion();
  vi.unstubAllGlobals();
});

describe("Configurar · módulos", () => {
  it("lista todos los módulos, y desactiva lo que el backend no permite", async () => {
    simularBackend();
    await irAConfigurar();

    // Productos: predefinido y no ocultable → ni ojo ni tacho
    const productos = within(fila("Productos"));
    expect(productos.getByTitle("Este módulo no se puede ocultar")).toBeDisabled();
    expect(productos.getByTitle("Los módulos predefinidos no se eliminan")).toBeDisabled();
    // Personal: sí se puede ocultar
    expect(within(fila("Personal")).getByTitle("Ocultar módulo")).toBeEnabled();
  });

  it("ocultar un módulo lo saca del menú y se puede volver a mostrar", async () => {
    const { llamadas } = simularBackend();
    await irAConfigurar();
    expect(within(menu()).getByRole("button", { name: /Personal/ })).toBeInTheDocument();

    fireEvent.click(within(fila("Personal")).getByTitle("Ocultar módulo"));

    await waitFor(() =>
      expect(within(menu()).queryByRole("button", { name: /Personal/ })).not.toBeInTheDocument(),
    );
    expect(llamadas.find((l) => l.clave === "PUT /modulos/2/visibilidad")?.cuerpo).toEqual({
      visible: false,
    });
    // sigue en la lista de configuración, marcado como oculto
    expect(within(fila("Personal")).getByText(/Oculto/)).toBeInTheDocument();

    fireEvent.click(within(fila("Personal")).getByTitle("Mostrar módulo"));

    await waitFor(() =>
      expect(within(menu()).getByRole("button", { name: /Personal/ })).toBeInTheDocument(),
    );
  });

  it("muestra el mensaje del backend si no se puede ocultar (personal registrado)", async () => {
    simularBackend({ personalConEmpleados: true });
    await irAConfigurar();

    fireEvent.click(within(fila("Personal")).getByTitle("Ocultar módulo"));

    expect(await screen.findByRole("alert")).toHaveTextContent("Elimina primero a tu personal");
    expect(within(menu()).getByRole("button", { name: /Personal/ })).toBeInTheDocument();
  });

  it("+ Nuevo crea un módulo solo con el nombre y aparece en el menú", async () => {
    const { llamadas } = simularBackend();
    await irAConfigurar();

    fireEvent.click(screen.getByRole("button", { name: /Nuevo/ }));
    fireEvent.change(screen.getByLabelText("Nombre del módulo"), {
      target: { value: "  Clientes " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Clientes", { selector: "p" })).toBeInTheDocument();
    expect(llamadas.find((l) => l.clave === "POST /modulos")?.cuerpo).toEqual({
      nombremodulo: "Clientes",
    });
    expect(await within(menu()).findByRole("button", { name: /Clientes/ })).toBeInTheDocument();
    expect(screen.queryByLabelText("Nombre del módulo")).not.toBeInTheDocument();
  });

  it("no crea un módulo sin nombre, y muestra el error de nombre repetido", async () => {
    const { llamadas } = simularBackend();
    await irAConfigurar();
    fireEvent.click(screen.getByRole("button", { name: /Nuevo/ }));

    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Escribe el nombre del módulo");
    expect(llamadas.some((l) => l.clave === "POST /modulos")).toBe(false);

    fireEvent.change(screen.getByLabelText("Nombre del módulo"), { target: { value: "ventas" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Ya existe un módulo con ese nombre"),
    );
  });

  it("eliminar un módulo personalizado pide confirmación", async () => {
    const { llamadas } = simularBackend();
    await irAConfigurar();
    fireEvent.click(screen.getByRole("button", { name: /Nuevo/ }));
    fireEvent.change(screen.getByLabelText("Nombre del módulo"), { target: { value: "Clientes" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await screen.findByText("Clientes", { selector: "p" });

    fireEvent.click(within(fila("Clientes")).getByTitle("Eliminar módulo"));
    expect(llamadas.some((l) => l.clave.startsWith("DELETE"))).toBe(false); // aún no
    fireEvent.click(screen.getByRole("button", { name: "No" }));
    expect(llamadas.some((l) => l.clave.startsWith("DELETE"))).toBe(false);

    fireEvent.click(within(fila("Clientes")).getByTitle("Eliminar módulo"));
    fireEvent.click(screen.getByRole("button", { name: "Sí, eliminar" }));

    await waitFor(() =>
      expect(screen.queryByText("Clientes", { selector: "p" })).not.toBeInTheDocument(),
    );
    expect(llamadas.some((l) => l.clave === "DELETE /modulos/5")).toBe(true);
    await waitFor(() =>
      expect(within(menu()).queryByRole("button", { name: /Clientes/ })).not.toBeInTheDocument(),
    );
  });
});

describe("Configurar · campos", () => {
  it("módulo predefinido: sin 'Nuevo campo', ocultar el opcional y el obligatorio desactivado", async () => {
    const { llamadas } = simularBackend();
    await irAConfigurar();

    fireEvent.click(within(fila("Productos")).getByTitle("Campos de Productos"));

    await screen.findByRole("heading", { name: "Campos de Productos" });
    expect(screen.queryByRole("button", { name: /Nuevo campo/ })).not.toBeInTheDocument();
    expect(
      within(fila("Nombre")).getByTitle("Campo obligatorio: no se puede quitar"),
    ).toBeDisabled();

    fireEvent.click(within(fila("Lote")).getByTitle("Quitar del módulo (ocultar)"));

    await waitFor(() => expect(within(fila("Lote")).getByText(/Oculto/)).toBeInTheDocument());
    expect(llamadas.find((l) => l.clave === "PUT /campos/2/visibilidad")?.cuerpo).toEqual({
      visible: false,
    });
    expect(within(fila("Lote")).getByTitle("Mostrar campo")).toBeEnabled();
  });

  it("módulo personalizado: crea un campo con tipo y filtrable", async () => {
    const { llamadas } = simularBackend();
    await irAConfigurar();
    fireEvent.click(screen.getByRole("button", { name: /Nuevo/ }));
    fireEvent.change(screen.getByLabelText("Nombre del módulo"), { target: { value: "Clientes" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await screen.findByText("Clientes", { selector: "p" });
    fireEvent.click(within(fila("Clientes")).getByTitle("Campos de Clientes"));
    await screen.findByRole("heading", { name: "Campos de Clientes" });
    expect(screen.getByText(/todavía no tiene campos/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Nuevo campo/ }));
    fireEvent.change(screen.getByLabelText("Nombre del campo"), {
      target: { value: " Teléfono " },
    });
    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "numero" } });
    fireEvent.click(screen.getByLabelText("Filtrable"));
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Teléfono", { selector: "p" })).toBeInTheDocument();
    expect(llamadas.find((l) => l.clave === "POST /modulos/5/campos")?.cuerpo).toEqual({
      nombrecampo: "Teléfono",
      tipocampo: "numero",
      filtrable: true,
    });
    expect(
      within(fila("Teléfono")).getByText(/Número · Personalizado · Filtrable/),
    ).toBeInTheDocument();
  });

  it("un campo de imagen no puede ser filtrable", async () => {
    simularBackend();
    await irAConfigurar();
    fireEvent.click(screen.getByRole("button", { name: /Nuevo/ }));
    fireEvent.change(screen.getByLabelText("Nombre del módulo"), { target: { value: "Clientes" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await screen.findByText("Clientes", { selector: "p" });
    fireEvent.click(within(fila("Clientes")).getByTitle("Campos de Clientes"));
    fireEvent.click(await screen.findByRole("button", { name: /Nuevo campo/ }));

    fireEvent.click(screen.getByLabelText("Filtrable"));
    fireEvent.change(screen.getByLabelText("Tipo"), { target: { value: "imagen" } });

    expect(screen.getByLabelText("Filtrable")).toBeDisabled();
    expect(screen.getByLabelText("Filtrable")).not.toBeChecked();
  });

  it("editar un campo de sistema solo permite cambiar el nombre", async () => {
    const { llamadas } = simularBackend();
    await irAConfigurar();
    fireEvent.click(within(fila("Productos")).getByTitle("Campos de Productos"));
    await screen.findByRole("heading", { name: "Campos de Productos" });

    fireEvent.click(within(fila("Lote")).getByTitle("Editar Lote"));

    expect(screen.queryByLabelText("Tipo")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Nombre del campo"), {
      target: { value: "Lote de compra" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("Lote de compra", { selector: "p" })).toBeInTheDocument();
    expect(llamadas.find((l) => l.clave === "PUT /campos/2")?.cuerpo).toMatchObject({
      nombrecampo: "Lote de compra",
    });
  });

  it("renombrar a un nombre repetido muestra el error del backend y conserva la edición", async () => {
    simularBackend();
    await irAConfigurar();
    fireEvent.click(within(fila("Productos")).getByTitle("Campos de Productos"));
    await screen.findByRole("heading", { name: "Campos de Productos" });

    fireEvent.click(within(fila("Lote")).getByTitle("Editar Lote"));
    fireEvent.change(screen.getByLabelText("Nombre del campo"), { target: { value: "nombre" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Ya existe un campo con ese nombre");
    expect(screen.getByLabelText("Nombre del campo")).toHaveValue("nombre");
  });

  it("quitar un campo personalizado lo elimina tras confirmar; 'Volver' regresa a módulos", async () => {
    const { llamadas } = simularBackend();
    await irAConfigurar();
    fireEvent.click(screen.getByRole("button", { name: /Nuevo/ }));
    fireEvent.change(screen.getByLabelText("Nombre del módulo"), { target: { value: "Clientes" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await screen.findByText("Clientes", { selector: "p" });
    fireEvent.click(within(fila("Clientes")).getByTitle("Campos de Clientes"));
    fireEvent.click(await screen.findByRole("button", { name: /Nuevo campo/ }));
    fireEvent.change(screen.getByLabelText("Nombre del campo"), { target: { value: "Teléfono" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar" }));
    await screen.findByText("Teléfono", { selector: "p" });

    fireEvent.click(within(fila("Teléfono")).getByTitle("Quitar campo (eliminar)"));
    fireEvent.click(screen.getByRole("button", { name: "Sí, eliminar" }));

    await waitFor(() =>
      expect(screen.queryByText("Teléfono", { selector: "p" })).not.toBeInTheDocument(),
    );
    expect(llamadas.some((l) => l.clave.startsWith("DELETE /campos/"))).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /Volver a módulos/ }));
    expect(await screen.findByRole("heading", { name: "Módulos" })).toBeInTheDocument();
  });
});
