import pako from 'pako';
import type { ItemNotaPdf } from '@/types';

export interface ParsedPdfNota {
  folio: string;
  fecha: string;
  fechaOrden?: string;
  cliente?: string;
  creadoPor?: string;
  totalRegistrosEsperados?: number;
  items: ItemNotaPdf[];
  advertencias: string[];
}

/**
 * Decodifica una cadena PDF, ya sea literal (...), hexadecimal <...> o normal.
 * Soporta caracteres en español (ñ, acentos) codificados en WinAnsi / Latin1.
 */
export function decodePdfString(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();

  // 1. Cadena Hexadecimal: <5069F16120...>
  if (trimmed.startsWith('<') && trimmed.endsWith('>')) {
    const hex = trimmed.slice(1, -1).replace(/\s+/g, '');
    const bytes: number[] = [];
    for (let i = 0; i < hex.length; i += 2) {
      bytes.push(parseInt(hex.substr(i, 2), 16) || 0);
    }
    try {
      // Intentar primero con Latin1 / Windows-1252 (estándar para WinAnsiEncoding en PDF donde 0xF1 = 'ñ')
      return new TextDecoder('latin1').decode(new Uint8Array(bytes));
    } catch {
      return String.fromCharCode(...bytes);
    }
  }

  // 2. Cadena Literal: (Texto con escapes \( \))
  if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
    const inner = trimmed.slice(1, -1);
    return inner
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\')
      .replace(/\\r/g, '\r')
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\b/g, '\b')
      .replace(/\\f/g, '\f');
  }

  return trimmed;
}

/**
 * Descomprime los streams /FlateDecode de un archivo PDF usando pako o DecompressionStream.
 */
export async function decompressPdfStreams(arrayBuffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(arrayBuffer);
  let binaryStr = '';
  for (let i = 0; i < bytes.length; i++) {
    binaryStr += String.fromCharCode(bytes[i]);
  }

  let allText = '';
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(binaryStr)) !== null) {
    const rawBytes = Uint8Array.from(match[1], (c) => c.charCodeAt(0));

    let streamDecompressed = false;

    // 1. Descompresión primaria con pako (Síncrona, robusta y universal)
    try {
      const inflated = pako.inflate(rawBytes);
      const text = new TextDecoder('utf-8').decode(inflated);
      allText += text + '\n';
      streamDecompressed = true;
    } catch {
      // pako falló o stream es raw deflate sin cabecera zlib
    }

    if (!streamDecompressed) {
      try {
        const rawInflated = pako.inflateRaw(rawBytes);
        const text = new TextDecoder('utf-8').decode(rawInflated);
        allText += text + '\n';
        streamDecompressed = true;
      } catch {
        // No es raw deflate
      }
    }

    // 2. Descompresión secundaria con DecompressionStream (Web API nativa si existe)
    if (!streamDecompressed && typeof DecompressionStream !== 'undefined') {
      try {
        const ds = new DecompressionStream('deflate');
        const writer = ds.writable.getWriter();
        await writer.write(rawBytes);
        await writer.close();
        const reader = ds.readable.getReader();
        const chunks: Uint8Array[] = [];
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) chunks.push(value);
        }
        const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
        const combined = new Uint8Array(totalLen);
        let offset = 0;
        for (const c of chunks) {
          combined.set(c, offset);
          offset += c.length;
        }
        allText += new TextDecoder('utf-8').decode(combined) + '\n';
        streamDecompressed = true;
      } catch {
        // Stream no comprimido o error
      }
    }

    // 3. Si no estaba comprimido o falló el inflate, inspeccionar texto crudo
    if (!streamDecompressed) {
      try {
        const rawText = new TextDecoder('utf-8', { fatal: false }).decode(rawBytes);
        if (rawText.includes('BT') && rawText.includes('ET')) {
          allText += rawText + '\n';
        }
      } catch {
        // Ignorar binarios no de texto (fuentes, imágenes)
      }
    }
  }

  return allText;
}

/**
 * Extrae todos los tokens de texto de operadores Tj y TJ dentro de streams PDF.
 */
export function extractTextTokensFromPdfStream(streamText: string): string[] {
  // Regex compatible con cadenas literales (...) y hexadecimales <...> para Tj y TJ
  const opRegex = /(?:\[((?:[^[\]]|\\[[\]])*)\]\s*TJ|(\((?:\\.|[^()])*\)|<[0-9a-fA-F\s]+>)\s*Tj)/g;
  const tokens: string[] = [];
  let m: RegExpExecArray | null;

  while ((m = opRegex.exec(streamText)) !== null) {
    if (m[1]) {
      // TJ array: unir componentes de texto
      const subRegex = /(\((?:\\.|[^()])*\)|<[0-9a-fA-F\s]+>)/g;
      let sm: RegExpExecArray | null;
      let combined = '';
      while ((sm = subRegex.exec(m[1])) !== null) {
        combined += decodePdfString(sm[1]);
      }
      tokens.push(combined);
    } else if (m[2]) {
      tokens.push(decodePdfString(m[2]));
    }
  }

  return tokens;
}

/**
 * Palabras clave de encabezados o pies de página a ignorar durante la extracción tabular.
 */
const PALABRAS_NO_ITEM = new Set([
  'folio',
  'fecha',
  'fecha de orden',
  'producto',
  'um',
  'cantidad',
  'equivalencias',
  'surtido',
  'total',
  'orden de venta',
  'orden de compra',
  'nota de venta',
  'nota de compra',
  'comentarios',
  'observaciones',
  'firma',
  'pagina',
  'página',
  'creado por',
  'cliente',
  'numero de registros',
  'número de registros',
]);

function isNoiseToken(t: string): boolean {
  if (!t) return true;
  const tLow = t.trim().toLowerCase();
  if (tLow.startsWith('___')) return true;
  if (tLow.startsWith('total ') || tLow === 'total') return true;
  if (PALABRAS_NO_ITEM.has(tLow)) return true;
  if (
    tLow.includes('orden de venta') ||
    tLow.includes('orden de compra') ||
    tLow.includes('nota de venta') ||
    tLow.includes('nota de compra') ||
    tLow.includes('comentarios') ||
    tLow.includes('observaciones') ||
    tLow.includes('firma') ||
    tLow.includes('página') ||
    tLow.includes('pagina') ||
    tLow.includes('creado por') ||
    tLow.includes('numero de registros') ||
    tLow.includes('número de registros')
  ) {
    return true;
  }
  return false;
}

/**
 * Parsea un archivo PDF de nota de compra o surtido, devolviendo los datos estructurados.
 */
export async function parsePdfNotaCompleta(fileOrBuffer: File | Blob | ArrayBuffer): Promise<ParsedPdfNota> {
  const advertencias: string[] = [];

  let arrayBuffer: ArrayBuffer;
  if (fileOrBuffer instanceof ArrayBuffer) {
    arrayBuffer = fileOrBuffer;
  } else {
    arrayBuffer = await fileOrBuffer.arrayBuffer();
  }

  const allText = await decompressPdfStreams(arrayBuffer);
  const tokens = extractTextTokensFromPdfStream(allText);

  let folio = '';
  let fecha = '';
  let fechaOrden = '';
  let cliente = '';
  let creadoPor = '';
  let totalRegistrosEsperados: number | undefined = undefined;

  // 1. Extraer Folio
  const folioIdx = tokens.findIndex((t) => t.trim().toLowerCase() === 'folio');
  if (folioIdx !== -1 && tokens[folioIdx + 1]) {
    folio = tokens[folioIdx + 1].trim();
  } else {
    // Buscar patrón de 6 dígitos tipo 295584 o 'Orden de Venta (295584)'
    for (const tok of tokens) {
      const match = tok.match(/(?:Orden de Venta\s*\(?|#\s*)(\d{5,7})\)?/i);
      if (match) {
        folio = match[1];
        break;
      }
    }
  }

  // 2. Extraer Fecha
  const fechaIdx = tokens.findIndex((t) => t.trim().toLowerCase() === 'fecha');
  if (fechaIdx !== -1 && tokens[fechaIdx + 1]) {
    fecha = tokens[fechaIdx + 1].trim();
  }

  // 3. Extraer Fecha de Orden
  const fechaOrdIdx = tokens.findIndex((t) => t.trim().toLowerCase() === 'fecha de orden');
  if (fechaOrdIdx !== -1 && tokens[fechaOrdIdx + 1]) {
    fechaOrden = tokens[fechaOrdIdx + 1].trim();
  }

  // 4. Extraer Creado Por
  const creadorIdx = tokens.findIndex((t) => t.trim().toLowerCase() === 'creado por');
  if (creadorIdx !== -1 && tokens[creadorIdx + 1]) {
    creadoPor = tokens[creadorIdx + 1].trim();
  }

  // 5. Extraer Cliente
  const clienteIdx = tokens.findIndex((t) => t.trim().toLowerCase() === 'cliente');
  if (clienteIdx !== -1 && tokens[clienteIdx + 1]) {
    cliente = tokens[clienteIdx + 1].trim();
  }

  // 6. Extraer Número de registros
  const numRegIdx = tokens.findIndex(
    (t) =>
      t.trim().toLowerCase() === 'numero de registros' ||
      t.trim().toLowerCase() === 'número de registros'
  );
  if (numRegIdx !== -1 && tokens[numRegIdx + 1]) {
    const parsedReg = parseInt(tokens[numRegIdx + 1].trim(), 10);
    if (!isNaN(parsedReg)) {
      totalRegistrosEsperados = parsedReg;
    }
  }

  // 7. Extraer Items de la tabla
  const parsedItems: ItemNotaPdf[] = [];
  const headerIdx = tokens.findIndex((t) => t.trim().toLowerCase() === 'surtido');

  if (headerIdx !== -1) {
    const tableTokens = tokens.slice(headerIdx + 1);
    let i = 0;

    while (i < tableTokens.length) {
      const tok = (tableTokens[i] || '').trim();

      if (isNoiseToken(tok)) {
        i++;
        continue;
      }

      const prodName = tok;
      i++;

      // Saltar celdas vacías previas a la UM
      while (i < tableTokens.length && !tableTokens[i].trim()) i++;

      const um = (tableTokens[i] || 'PZA').trim();
      i++;

      // Saltar celdas vacías previas a la Cantidad
      while (i < tableTokens.length && !tableTokens[i].trim()) i++;

      const cantStr = (tableTokens[i] || '1').trim();
      const cant = parseFloat(cantStr) || 1;
      i++;

      // Equivalencias (opcional, entre paréntesis ej. "( Caja: 36.00 )")
      let equiv = '';
      while (i < tableTokens.length && !tableTokens[i].trim()) i++;

      if (
        i < tableTokens.length &&
        (tableTokens[i].trim().startsWith('(') || tableTokens[i].trim().includes(':'))
      ) {
        equiv = tableTokens[i].trim();
        i++;
      }

      // Saltar celda de surtido/checkbox
      while (i < tableTokens.length && tableTokens[i].trim() === '') i++;

      // Validar que la fila extraída sea válida
      const umLower = um.toLowerCase();
      if (
        umLower.includes('comentario') ||
        umLower.includes('orden') ||
        umLower.includes('nota') ||
        umLower === 'fecha' ||
        umLower === 'folio'
      ) {
        continue;
      }

      parsedItems.push({
        productoAlmacen: prodName,
        um: um,
        cantidadNota: cant,
        equivalencias: equiv,
        piezasCalculadas: cant,
        recordarVinculacion: true,
      });
    }
  }

  if (totalRegistrosEsperados !== undefined && parsedItems.length !== totalRegistrosEsperados) {
    advertencias.push(
      `El PDF indica ${totalRegistrosEsperados} registros pero se extrajeron ${parsedItems.length}.`
    );
  }

  return {
    folio: folio || 'SinFolio',
    fecha: fecha || new Date().toLocaleString('es-MX'),
    fechaOrden,
    cliente,
    creadoPor,
    totalRegistrosEsperados,
    items: parsedItems,
    advertencias,
  };
}
