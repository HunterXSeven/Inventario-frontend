/** Devuelve un color de texto legible (oscuro o blanco) sobre el color de fondo dado. */
export function textoSobre(hex: string): string {
  const limpio = hex.replace("#", "");
  const completo = limpio.length === 3 ? [...limpio].map((c) => c + c).join("") : limpio;
  const n = parseInt(completo, 16);
  if (Number.isNaN(n)) return "#ffffff";
  const luminosidad =
    (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return luminosidad > 0.6 ? "#0f172a" : "#ffffff";
}
