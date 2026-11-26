import assert from 'assert';
import {
  getBusinessIdentity,
  saveBusinessIdentity,
  businessLines,
  saleReceipt,
  corteReceipt,
  cobranzaReceipt,
  reportReceipt,
  receiptHtml,
} from '../utils/receiptDocument';

console.log('Testing Business Identity & Thermal Receipts...');

// Test 1: Default Business Identity
const initial = getBusinessIdentity();
assert.strictEqual(typeof initial.nombre, 'string');
assert.ok(initial.nombre.length > 0);
console.log('Default Business Identity:', initial.nombre);

// Test 2: Business Lines
const lines = businessLines();
assert.ok(lines.length >= 2);
assert.strictEqual(lines[0], initial.nombre);

// Test 3: Corte Receipt with Fondo Inicial
const mockCorte = {
  fecha: '09/nov/2026 18:30',
  vendedorNombre: 'Juan Chofer',
  rutaNombre: 'Ruta 1 - León Centro',
  ventasTotales: 4500,
  efectivo: 3000,
  transferencias: 500,
  tarjetas: 0,
  credito: 1000,
  fondoInicial: 500,
  abonosCobranza: 800,
  gastos: 200,
  efectivoEsperado: 4100, // 500 + 3000 + 800 - 200
  efectivoContado: 4100,
  diferenciaCaja: 0,
  piezasVendidas: 85,
  inventarioActualPiezas: 120,
};

const corteModel = corteReceipt(mockCorte);
assert.strictEqual(corteModel.title, 'Arqueo y Corte de Caja');
assert.ok(corteModel.rows.some(r => r.label === '+ Fondo Inicial' && r.value === '$500.00'));
assert.ok(corteModel.rows.some(r => r.label === 'Efectivo Esperado' && r.value === '$4,100.00'));

// Test 4: Cobranza Receipt
const mockCobranza = {
  folio: 'REC-998877',
  fecha: '09/nov/2026 12:00',
  clienteNombre: 'Abarrotes Don Pepe',
  clientePropietario: 'José Ramírez',
  vendedorNombre: 'Juan Chofer',
  montoAbonado: 1200,
  metodoPago: 'Efectivo',
  saldoAnterior: 3500,
  nuevoSaldo: 2300,
};

const cobranzaModel = cobranzaReceipt(mockCobranza);
assert.strictEqual(cobranzaModel.title, 'Recibo de Cobranza');
assert.ok(cobranzaModel.rows.some(r => r.label === 'Monto Abonado' && r.value === '$1,200.00'));
assert.ok(cobranzaModel.rows.some(r => r.label === 'Nuevo Saldo' && r.value === '$2,300.00'));

// Test 5: Receipt HTML (Continuous thermal roll size without 297mm truncation)
const html58 = receiptHtml(corteModel, 58);
assert.ok(html58.includes('size: 58mm auto'));
assert.ok(html58.includes('receipt-paper-width'));
assert.ok(html58.includes('triggerPrint'));
assert.ok(!html58.includes('297mm')); // Must NOT hardcode A4 297mm

const html80 = receiptHtml(corteModel, 80);
assert.ok(html80.includes('size: 80mm auto'));
assert.ok(!html80.includes('297mm'));

console.log('ALL THERMAL RECEIPT & IDENTITY TESTS PASSED SUCCESSFULLY!');

