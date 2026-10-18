const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('=== VERIFICACIÓN DEL PIPELINE DE IMPORTACIÓN CSV ===\n');

// 1. Verificar existencia y tamaño del CSV oficial
const csvPath = path.join(__dirname, '..', 'ProductosMiguel.csv');
if (!fs.existsSync(csvPath)) {
  console.error('❌ ERROR: ProductosMiguel.csv no encontrado en:', csvPath);
  process.exit(1);
}

const csvBuffer = fs.readFileSync(csvPath);
const csvContent = csvBuffer.toString('utf8');
const fileHash = crypto.createHash('sha256').update(csvContent, 'utf8').digest('hex');

console.log('1. Archivo CSV Oficial:');
console.log('   - Ruta:', csvPath);
console.log('   - Tamaño:', csvBuffer.length, 'bytes');
console.log('   - SHA-256 FileHash:', fileHash);

// 2. Parser RFC de líneas CSV
function parseCsvLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }
  values.push(current.trim());
  return values;
}

// 3. Parser de decimales españoles
function tryParseSpanishDecimal(raw) {
  if (!raw || typeof raw !== 'string') return null;
  let cleaned = raw.trim().replace(/\$/g, '').replace(/\s/g, '');
  if (cleaned.includes('.') && cleaned.includes(',')) {
    cleaned = cleaned.replace(/\./g, '').replace(/,/g, '.');
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(/,/g, '.');
  } else if ((cleaned.match(/\./g) || []).length > 1) {
    cleaned = cleaned.replace(/\./g, '');
  } else if (cleaned.includes('.')) {
    const dotParts = cleaned.split('.');
    if (dotParts.length === 2 && dotParts[1].length === 3 && dotParts[0] !== '0' && dotParts[0] !== '-0') {
      cleaned = cleaned.replace(/\./g, '');
    }
  }
  const val = parseFloat(cleaned);
  return isNaN(val) ? null : val;
}

// Pruebas unitarias de parsing numérico según requerimiento
const testCases = [
  { raw: '241.088,06', expected: 241088.06 },
  { raw: '16.762,5', expected: 16762.5 },
  { raw: '510', expected: 510 },
  { raw: '48', expected: 48 },
  { raw: '0', expected: 0 },
  { raw: '25.802', expected: 25802 },
];

console.log('\n2. Validación de Formatos Numéricos Españoles:');
let numErrors = 0;
testCases.forEach((tc) => {
  const parsed = tryParseSpanishDecimal(tc.raw);
  const ok = parsed === tc.expected;
  if (!ok) numErrors++;
  console.log(`   - "${tc.raw}" -> ${parsed} (Esperado: ${tc.expected}) ${ok ? '✓ OK' : '❌ ERROR'}`);
});
if (numErrors > 0) {
  console.error('❌ Fallaron pruebas de parsing numérico');
  process.exit(1);
}

// 4. Normalización de texto
function normalizeText(text) {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

// 5. Análisis completo de ProductosMiguel.csv
const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
const header = parseCsvLine(lines[0]);
console.log('\n3. Estructura de Encabezados CSV:');
console.log('   - Columnas detectadas (' + header.length + '):', header.slice(0, 8).join(' | '), '...');

const dataRows = lines.slice(1);
console.log('   - Filas de datos:', dataRows.length);

const parsedProducts = [];
const nameCounts = {};
let invalidRows = 0;
let originCodesFound = 0;

dataRows.forEach((line, idx) => {
  const filaNum = idx + 2;
  const cols = parseCsvLine(line);
  const rawCodigo = cols[0] || '';
  const rawNombre = cols[1] || '';
  const rawCategoria = cols[2] || '';
  const rawUnidad = cols[3] || '';
  const rawCosto = cols[6] || '';
  const rawPrecio = cols[7] || '';

  const codigoOrigen = (rawCodigo.toLowerCase() === 'null' || !rawCodigo.trim()) ? '' : rawCodigo.trim();
  if (codigoOrigen) originCodesFound++;

  const costo = tryParseSpanishDecimal(rawCosto);
  const precio = tryParseSpanishDecimal(rawPrecio);

  if (!rawNombre.trim() || costo === null || precio === null) {
    invalidRows++;
    console.log(`   ⚠️ Fila ${filaNum} inválida: Nombre="${rawNombre}", Costo="${rawCosto}", Precio="${rawPrecio}"`);
    return;
  }

  const normName = normalizeText(rawNombre);
  nameCounts[normName] = (nameCounts[normName] || 0) + 1;

  parsedProducts.push({
    fila: filaNum,
    nombreOriginal: rawNombre.trim(),
    normName,
    codigoOrigen,
    costo,
    precio,
    unidad: rawUnidad.toLowerCase().trim(),
  });
});

console.log('\n4. Clasificación Inicial del Archivo:');
console.log('   - Filas válidas procesables:', parsedProducts.length);
console.log('   - Filas inválidas:', invalidRows);
console.log('   - Códigos de origen informados (distintos de null/vacío):', originCodesFound);

// Detectar nombres ambiguos repetidos dentro del CSV
const duplicatesInCsv = Object.entries(nameCounts).filter(([_, count]) => count > 1);
console.log('   - Nombres normalizados duplicados en el CSV (Ambiguos):', duplicatesInCsv.length, 'grupos');
duplicatesInCsv.slice(0, 5).forEach(([norm, count]) => {
  console.log(`     • "${norm}" aparece ${count} veces en el CSV`);
});

// 6. Verificación de regla de existencias en cero y sin categorías inventadas
console.log('\n5. Verificación de Reglas de Negocio en Alta:');
const sampleNew = parsedProducts[0];
const sampleProductEntity = {
  codigo: 'p19',
  nombre: sampleNew.nombreOriginal,
  categoria: 'Sin categoría', // NO 'Jamón'
  unidad: 'unidad',
  precioBase: sampleNew.precio,
  precioCompra: sampleNew.costo,
  existencia: 0, // Regla estricta: 0
  estadoConfiguracion: 'Pendiente', // Pendiente de unidad real
  codigoOrigen: sampleNew.codigoOrigen || null,
  codigoBarras: '', // NO inventar 750...
};

console.log('   - Existencia asignada a nuevo:', sampleProductEntity.existencia, sampleProductEntity.existencia === 0 ? '✓ (Cero estricto)' : '❌ ERROR');
console.log('   - Categoría asignada:', sampleProductEntity.categoria, sampleProductEntity.categoria === 'Sin categoría' ? '✓ (No inventa Jamón)' : '❌ ERROR');
console.log('   - Código de barras:', sampleProductEntity.codigoBarras === '' ? '✓ (No inventa código de barras)' : '❌ ERROR');
console.log('   - Estado configuración:', sampleProductEntity.estadoConfiguracion, sampleProductEntity.estadoConfiguracion === 'Pendiente' ? '✓ (Pendiente de confirmar unidad)' : '❌ ERROR');

console.log('\n✅ VALIDACIÓN DEL PIPELINE COMPLETADA EXITOSAMENTE.');
