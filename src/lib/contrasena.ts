/** Reglas de contraseña (las valida el frontend; el backend solo exige el largo). */
export interface ReglaContrasena {
  texto: string;
  cumple: boolean;
}

export function reglasContrasena(c: string): ReglaContrasena[] {
  return [
    { texto: "Al menos 8 caracteres", cumple: c.length >= 8 },
    { texto: "Una letra mayúscula", cumple: /\p{Lu}/u.test(c) },
    { texto: "Una letra minúscula", cumple: /\p{Ll}/u.test(c) },
    { texto: "Un número", cumple: /\d/.test(c) },
  ];
}

export type ResultadoContrasena = { ok: true } | { ok: false; error: string };

export function validarContrasena(c: string): ResultadoContrasena {
  if (!reglasContrasena(c).every((r) => r.cumple))
    return {
      ok: false,
      error:
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.",
    };
  if (new TextEncoder().encode(c).length > 72)
    return { ok: false, error: "La contraseña es demasiado larga." };
  return { ok: true };
}

/** Valida contraseña y su confirmación. */
export function validarConfirmacion(c: string, confirmar: string): ResultadoContrasena {
  const base = validarContrasena(c);
  if (!base.ok) return base;
  if (c !== confirmar) return { ok: false, error: "Las contraseñas no coinciden." };
  return { ok: true };
}
