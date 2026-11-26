const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require('typescript');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function load(relative, imports = {}, extra = {}) {
  const module = { exports: {} };
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root, relative), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, {
    exports: module.exports, module, console, ...extra,
    require: name => { if (name in imports) return imports[name]; throw new Error(`Unexpected dependency ${name}`); },
  });
  return module.exports;
}
const { resumenCantidades } = load('utils/ventaResumen.ts');
const { getPrecioPresentacion, calcularUnidadesBase, desglosarInventario } = load('utils/multipresentacion.ts');
const product = { id: 'test', nombre: 'Producto aislado', unidad: 'paquete', precioBase: 8, manejaMultiplesPresentaciones: true };
const presentations = [{ tipo: 'paquete', nombre: 'Paquete', piezasEquivalentes: 1, precio: 8 }, { tipo: 'exhibidor', nombre: 'Exhibidor', piezasEquivalentes: 10, precio: 80 }, { tipo: 'caja', nombre: 'Caja', piezasEquivalentes: 60, precio: 480 }];
const items = [1, 2, 3].map((quantity, index) => ({ producto: product, cantidad: quantity, presentacion: presentations[2 - index] }));
assert.equal(resumenCantidades(items), '1 caja · 2 exhibidores · 3 paquetes');
assert.equal(items.reduce((sum, i) => sum + calcularUnidadesBase(i.cantidad, i.presentacion), 0), 83);
assert.equal(items.reduce((sum, i) => sum + i.cantidad * getPrecioPresentacion(product, i.presentacion), 0), 664);
assert.equal(desglosarInventario(217, presentations, 'paquete'), '3 cajas + 3 exhibidores + 7 paquetes');
assert.equal(resumenCantidades([...items, { producto: { id: 'weight', unidad: 'kg' }, cantidad: 0.45 }]), '1 caja · 2 exhibidores · 3 paquetes · 0.450 kg');
assert.equal(resumenCantidades([]), 'Sin productos');
assert.equal(getPrecioPresentacion(product, presentations[2], { precioEspecial: { 'test:caja': 460, test: 7 } }), 460);
assert.equal(getPrecioPresentacion(product, presentations[2], { precioEspecial: { test: 7 } }), 480);

// Preferences operate on an isolated in-memory device; no real browser storage.
const values = new Map();
let calls = 0;
const { DataService } = load('services/mockDataService.ts', {
  '@/utils/reportExport': load('utils/reportExport.ts'),
  '@/constants/mockData': { empleados: [], bitacora: [], initialProductos: [], initialClientes: [] },
  './httpApiService': { apiService: new Proxy({}, { get: () => () => { calls++; throw new Error('Network not allowed'); } }) },
  './offlineSyncQueueService': { offlineSyncQueue: {} },
}, { window: { localStorage: { getItem: k => values.get(k) || null, setItem: (k, v) => values.set(k, v) } } });
assert.equal(DataService.getVistaCatalogo('a'), 'mosaicos');
DataService.saveVistaCatalogo('lista', 'a');
assert.equal(DataService.getVistaCatalogo('a'), 'lista');
assert.equal(DataService.getVistaCatalogo('b'), 'mosaicos');
DataService.toggleFavorito('test', 'a');
DataService.saveOrdenPersonalizado(['test', 'weight'], 'a');
DataService.saveVistaCatalogo('mosaicos', 'a');
assert.equal(JSON.stringify(DataService.getFavoritos('a')), '["test"]');
assert.equal(JSON.stringify(DataService.getOrdenPersonalizado('a')), '["test","weight"]');
values.set('miguel_vista_a', 'invalid');
assert.equal(DataService.getVistaCatalogo('a'), 'mosaicos');
assert.equal(calls, 0);
console.log('PASS: base units, independent prices, special prices, mixed quantity labels, device/user view preference, favorites and manual order; no network or real data writes.');

async function verifyPdfReading() {
  const parsed = { folio: 'SinFolio', fecha: '', items: [{ productoAlmacen: 'Dato del archivo', cantidadNota: 0.45, um: 'KG' }], advertencias: [] };
  let answer = parsed;
  let cleared = 0;
  const { readSupplyPdf } = load('utils/readSupplyPdf.ts', {
    './pdfNoteParser': { parsePdfNotaCompleta: async () => { if (answer instanceof Error) throw answer; return answer; } },
  }, { setTimeout: () => 1, clearTimeout: () => { cleared++; } });
  const file = { name: 'viernes-prueba.pdf' };
  assert.equal(await readSupplyPdf(file), parsed);
  answer = { ...parsed, items: [] };
  await assert.rejects(() => readSupplyPdf(file), /No se encontraron productos/);
  answer = new Error('Documento ilegible');
  await assert.rejects(() => readSupplyPdf(file), /Documento ilegible/);
  assert.equal(cleared, 3);
  const timed = load('utils/readSupplyPdf.ts', {
    './pdfNoteParser': { parsePdfNotaCompleta: () => new Promise(() => {}) },
  }, { setTimeout: callback => { Promise.resolve().then(callback); return 1; }, clearTimeout: () => {} });
  await assert.rejects(() => timed.readSupplyPdf(file), /agotó el tiempo/);
  console.log('PASS: PDF data preserved; empty, unreadable and timed out documents rejected even with a former demo filename.');
}
verifyPdfReading().catch(error => { console.error(error); process.exitCode = 1; });
