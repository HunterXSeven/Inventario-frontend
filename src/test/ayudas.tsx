import {
  Outlet,
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { render } from "@testing-library/react";

import { Route as RutaPanel } from "@/routes/panel";
import { Route as RutaSistemas } from "@/routes/sistemas";

/**
 * Raíz mínima con los mismos componentes reales de /panel y /sistemas.
 * La raíz de la app dibuja un <html> completo y espera las hojas de estilo,
 * algo que jsdom no hace.
 */
export function abrir(ruta: string) {
  const raiz = createRootRoute({ component: Outlet });
  const pagina = (path: string, component: () => React.ReactNode) =>
    createRoute({ getParentRoute: () => raiz, path, component });
  const router = createRouter({
    routeTree: raiz.addChildren([
      pagina("/panel", RutaPanel.options.component as () => React.ReactNode),
      pagina("/sistemas", RutaSistemas.options.component as () => React.ReactNode),
      pagina("/login", () => <p>pantalla de login</p>),
      pagina("/registro", () => <p>pantalla de registro</p>),
    ]),
    history: createMemoryHistory({ initialEntries: [ruta] }),
  });
  render(<RouterProvider router={router as never} />);
  return router;
}
