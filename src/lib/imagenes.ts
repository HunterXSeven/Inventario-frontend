/**
 * Imágenes (Cloudinary, vía el backend).
 *
 * - Producto: PUT/DELETE /productos/{id}/imagen   (multipart, campo "imagen")
 * - Logo:     PUT/DELETE /sistemas/{id}/logo      (multipart, campo "logo"; solo el dueño)
 *
 * El backend acepta JPG, PNG y WebP de hasta 5 MB y guarda la URL; el campo imagenurl / logourl
 * de los JSON ya no cambia nada. Para un producto nuevo: primero se crea y luego se sube.
 */
import { api } from "@/lib/api";

export const MAX_BYTES_IMAGEN = 5 * 1024 * 1024;
export const TIPOS_IMAGEN = ["image/jpeg", "image/png", "image/webp"];

/** Qué hacer con la imagen al guardar un formulario. */
export interface CambioImagen {
  archivo?: File | null;
  quitar?: boolean;
}

/** Mensaje de error si el archivo no sirve; null si está bien. */
export function validarImagen(archivo: File): string | null {
  if (!TIPOS_IMAGEN.includes(archivo.type)) return "Solo se aceptan imágenes JPG, PNG o WebP.";
  if (archivo.size > MAX_BYTES_IMAGEN) return "La imagen supera el tamaño máximo de 5 MB.";
  return null;
}

function formulario(campo: string, archivo: File): FormData {
  const f = new FormData();
  f.append(campo, archivo);
  return f;
}

export async function subirImagenProducto(idproducto: number, archivo: File): Promise<void> {
  await api(`/productos/${idproducto}/imagen`, {
    metodo: "PUT",
    cuerpo: formulario("imagen", archivo),
  });
}

export async function quitarImagenProducto(idproducto: number): Promise<void> {
  await api(`/productos/${idproducto}/imagen`, { metodo: "DELETE" });
}

export async function subirLogo(idsistema: number, archivo: File): Promise<void> {
  await api(`/sistemas/${idsistema}/logo`, { metodo: "PUT", cuerpo: formulario("logo", archivo) });
}

export async function quitarLogo(idsistema: number): Promise<void> {
  await api(`/sistemas/${idsistema}/logo`, { metodo: "DELETE" });
}
