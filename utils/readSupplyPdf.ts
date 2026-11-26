import { parsePdfNotaCompleta } from './pdfNoteParser';

/** A failed document must never become a fixed purchase note. */
export async function readSupplyPdf(file: File | Blob) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const parsed = await Promise.race([
      parsePdfNotaCompleta(file),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(() => reject(new Error('La lectura del PDF agotó el tiempo disponible. Intenta de nuevo o usa captura manual.')), 4500);
      }),
    ]);
    if (!parsed.items?.length) throw new Error('No se encontraron productos legibles en el PDF. Revisa el archivo o usa captura manual.');
    return parsed;
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
}
