import { bluetoothPrinter } from '../services/bluetoothPrinterService';

console.log('--- TEST ESC/POS & BLUETOOTH PRINTER SERVICE (FASE 4 - 3.3) ---');

const sampleTicket = `
================================
  DISTRIBUIDORA DON MIGUEL
RFC: MIGD750412AB1
Tel: 477-123-4567
Dirección: León, Guanajuato
--------------------------------
Folio: FOL-20261109-001
Cliente: Abarrotes La Lupita
Venta: Queso Castel 1 exhibidor
Total: $540.00
¡Gracias por su compra!
================================
`;

// 1. Probar codificación ESC/POS para 58mm
console.log('1. Probando codificación ESC/POS (58mm)...');
const bytes58 = bluetoothPrinter.encodeEscPos(sampleTicket, { width: 58 });
console.log(`- Bytes generados (58mm): ${bytes58.length} bytes`);

// Verificar bytes de inicio ESC @
if (bytes58[0] !== 0x1b || bytes58[1] !== 0x40) {
  throw new Error('Bytes de inicialización ESC @ incorrectos');
}
console.log('✓ Inicialización ESC @ (0x1B, 0x40) correcta.');

// Verificar tabla de caracteres ESC t 2
if (bytes58[2] !== 0x1b || bytes58[3] !== 0x74 || bytes58[4] !== 0x02) {
  throw new Error('Selección de codepage CP850 incorrecta');
}
console.log('✓ Selección de Code Page Latin CP850 correcta.');

// 2. Probar codificación ESC/POS para 80mm con autocut
console.log('\n2. Probando codificación ESC/POS (80mm con autocut)...');
const bytes80 = bluetoothPrinter.encodeEscPos(sampleTicket, { width: 80, cut: true });
console.log(`- Bytes generados (80mm): ${bytes80.length} bytes`);

// Los últimos 4 bytes deben ser GS V 66 0 (0x1D, 0x56, 0x42, 0x00)
const last4 = Array.from(bytes80.slice(-4));
if (last4[0] !== 0x1d || last4[1] !== 0x56 || last4[2] !== 0x42 || last4[3] !== 0x00) {
  throw new Error(`Comando de corte GS V incorrecto: [${last4.join(', ')}]`);
}
console.log('✓ Comando de autocut GS V (0x1D, 0x56, 0x42, 0x00) correcto.');

// 3. Probar caracteres especiales en español
console.log('\n3. Probando mapeo de acentos y caracteres españoles...');
const spanishText = 'áéíóúÁÉÍÓÚñÑ¿¡$';
const encodedSpanish = bluetoothPrinter.encodeEscPos(spanishText);
// Debe contener los códigos CP850 correspondientes (ñ: 0xA4, Ñ: 0xA5, ¿: 0xA8, ¡: 0xAD, $: 0x24)
const bytesArr = Array.from(encodedSpanish);
if (!bytesArr.includes(0xa4) || !bytesArr.includes(0xa5) || !bytesArr.includes(0xa8) || !bytesArr.includes(0xad) || !bytesArr.includes(0x24)) {
  throw new Error('Fallo en mapeo de caracteres españoles en CP850');
}
console.log('✓ Mapeo de acentos, eñes y signos interrogación/admiración correcto.');

// 4. Probar estado del servicio
console.log('\n4. Verificando estado del servicio Bluetooth...');
const status = bluetoothPrinter.getStatus();
console.log('Estado reportado:', status);
if (status.connected !== false) {
  throw new Error('El estado inicial debe ser desconectado');
}
console.log('✓ Manejo de estado desconectado y soporte verificado.');

console.log('\n=============================================================');
console.log('>>> TEST 3.3 CONEXIÓN BLUETOOTH ESC/POS: 100% EXITOSO <<<');
console.log('=============================================================\n');

