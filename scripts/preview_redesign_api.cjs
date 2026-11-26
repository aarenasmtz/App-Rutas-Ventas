// Explicit, disposable UI preview only. Never imported by the application.
// All writes are rejected: this server cannot register sales or stock movements.
const http = require('node:http');
const port = Number(process.env.PREVIEW_API_PORT || 8911);
const products = Array.from({ length: 16 }, (_, index) => ({
  id: `test_product_${index + 1}`, nombre: index === 0 ? 'Producto de prueba con nombre largo para comprobar el mosaico compacto' : `Producto de prueba ${String(index + 1).padStart(2, '0')}`,
  categoria: index < 8 ? 'Categoría A' : 'Categoría B', marca: 'Pruebas locales', unidad: index === 2 ? 'kg' : 'paquete',
  precioBase: index === 0 ? 8 : 10 + index, existenciaPiezas: 300, precioPorPeso: index === 2, activo: true,
  estadoConfiguracion: index === 15 ? 'Pendiente' : 'Completo', manejaMultiplesPresentaciones: index === 0,
  presentaciones: index === 0 ? [{ tipo: 'paquete', nombre: 'Paquete', piezasEquivalentes: 1, precio: 8 }, { tipo: 'exhibidor', nombre: 'Exhibidor', piezasEquivalentes: 10, precio: 80 }, { tipo: 'caja', nombre: 'Caja', piezasEquivalentes: 60, precio: 480 }] : index === 2 ? [] : [{ tipo: 'paquete', nombre: 'Paquete', piezasEquivalentes: 1, precio: 10 + index }],
}));
const clients = [{ id: 'test_client_a', nombre: 'Cliente de prueba A', propietario: 'Entorno aislado', direccion: 'Sin dirección real', telefono: '', ruta: 'Ruta de prueba', diasVisita: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'], saldo: 0, limiteCredito: 1000, activo: true, estadoVisita: 'Pendiente', preciosEspeciales: { 'test_product_1:paquete': 7 }, latitud: 21.12, longitud: -101.68 }, { id: 'test_client_b', nombre: 'Cliente de prueba B', propietario: 'Entorno aislado', direccion: 'Sin dirección real', telefono: '', ruta: 'Ruta de prueba', diasVisita: [], saldo: 120, limiteCredito: 1000, activo: true, estadoVisita: 'Pendiente', preciosEspeciales: { 'test_product_1:paquete': 6 } }];
const sales = [1, 2, 3].map((id) => ({ id, folio: `TEST-${id}`, cliente: clients[id % 2], usuario: { id: 1, nombre: 'Equipo de prueba' }, fechaHora: new Date(Date.now() - id * 3600000).toISOString(), total: id * 20, estado: 'Completada', pagos: [{ metodo: id === 2 ? 'Crédito' : 'Efectivo', monto: id * 20 }], detalles: [] }));
if (process.env.PREVIEW_INCIDENTS === '1') {
  products[2].existenciaPiezas = 12345.678;
  for (const [suffix, name] of [['c','Cuenta incompleta'],['d','Cuenta fallida']]) clients.push({...clients[0],id:'test_client_'+suffix,nombre:name});
}
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') { res.end(); return; }
  if (req.method !== 'GET') { res.statusCode = 405; res.end(JSON.stringify({ message: 'Vista local de pruebas: escrituras deshabilitadas' })); return; }
  const path = new URL(req.url, 'http://127.0.0.1').pathname;
  if (process.env.PREVIEW_INCIDENTS === '1' && /^\/qa\/(reporte-(58|80)|venta-larga-(58|80)|venta-imagen)\.html$/.test(path)) {
    res.setHeader('Content-Type','text/html;charset=utf-8');res.end(require('node:fs').readFileSync(require('node:path').join(__dirname,'../docs/evidencia-incidencias',path.split('/').pop())));return;
  }
  let data = [];
  if (path === '/api/health') data = { status: 'Preview aislado' };
  else if (path.endsWith('/productos')) data = process.env.PREVIEW_EMPTY === '1' ? [] : products;
  else if (path.endsWith('/clientes')) data = process.env.PREVIEW_EMPTY === '1' ? [] : clients;
  else if (path.endsWith('/cuenta')) {
    const id = path.split('/').slice(-2)[0];
    if (id === 'test_client_d') { res.statusCode=503;data={message:'Error controlado de consulta'}; }
    else if (id === 'test_client_c') data={clienteId:id,movimientos:[]};
    else data={clienteId:id,saldo:id==='test_client_a'?0:120,limiteCredito:1000,movimientos:id==='test_client_a'?[]:[{id:'credit-1',fecha:new Date().toISOString(),concepto:'Crédito de prueba',monto:170,tipo:'cargo'},{id:'abono-1',fecha:new Date().toISOString(),concepto:'Abono de prueba',monto:50,tipo:'abono'}]};
    setTimeout(()=>res.end(JSON.stringify(data)),600);return;
  }
  else if (path.includes('/clientes/')) data = clients.find(c => path.endsWith('/' + c.id)) || {};
  else if (path.endsWith('/ventas')) data = process.env.PREVIEW_EMPTY === '1' ? [] : sales;
  else if (path.endsWith('/categorias')) data = [{ id: 'a', nombre: 'Categoría A' }, { id: 'b', nombre: 'Categoría B' }];
  else if (path.endsWith('/dashboard/resumen')) data = { ventasHoy: 120, cobranzaHoy: 80, creditoColocadoHoy: 40, efectivoEnCaja: 80, totalPiezasVendidas: 0 };
  else if (path.endsWith('/cortes/diario')) data = [{ empleadoId: '1', nombre: 'Equipo de prueba', ruta: 'Ruta de prueba', ventasTotales: 120, efectivo: 80, transferencias: 0, tarjetas: 0, credito: 40, abonosCobranza: 0, gastos: 0, devoluciones: 0, efectivoEsperado: 80, diferenciaCaja: 0, inventarioInicialPiezas: 300, inventarioActualPiezas: 300, piezasVendidas: 0 }];
  else if (path.endsWith('/empleados')) data = [{ id: '1', nombre: 'Equipo de prueba', rol: 'Administrador', ruta: 'Ruta de prueba', estado: 'Activo', ventasHoy: 120, permisos: {} }];
  else if (path.endsWith('/rutas')) data = [{ id: 1, nombre: 'Ruta de prueba', activa: true, totalClientes: 2 }];
  else if (path.endsWith('/reportes/resumen')) data = { periodo: new URL(req.url, 'http://127.0.0.1').searchParams.get('periodo') || 'Día', fechaInicio:'2026-11-02T00:00:00', fechaFin:new Date().toISOString(), ventasTotales: 120, cobranzaTotal: 80, creditoColocado: 40, gastosTotal: 0, utilidadEstimada: 0, ticketPromedio: 40, pedidosTotal: 3, clientesVisitados: 2, clientesTotalRuta: 2, efectividadVisitas: 100, topProductos: process.env.PREVIEW_INCIDENTS==='1'?[{productoId:'test-1',nombre:'Queso "Especial"; edición\ncon acentos y nombre largo para comprobar el documento completo',presentacion:'Caja',cantidadPresentaciones:2,cantidadVendida:120,importeTotal:960}]:[], metodosPago: { efectivo: 80, transferencia: 0, tarjeta: 0, credito: 40 } };
  res.end(JSON.stringify(data));
});
server.listen(port, '127.0.0.1', () => console.log(`UI PREVIEW ONLY: http://127.0.0.1:${port}/api/v1; all writes disabled`));
