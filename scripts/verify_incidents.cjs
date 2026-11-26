// Isolated regression checks: no HTTP calls or business writes.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'..');
function load(file,imports={},extra={}){const module={exports:{}};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{module,exports:module.exports,console,...extra,require:name=>{if(name in imports)return imports[name];throw Error(name);}});return module.exports;}
const location=load('utils/location.ts'),money=load('utils/helpers.ts'),account=load('utils/customerAccount.ts'),csv=load('utils/reportExport.ts');
assert.equal(money.formatCurrency(0),'$0');for(const v of [null,undefined,'12',NaN,Infinity])assert.equal(money.formatCurrency(v),'—');
assert.equal(location.buildMapsUrl({latitud:0,longitud:0}),'https://www.google.com/maps/dir/?api=1&destination=0%2C0&travelmode=driving');
assert.equal(location.validCoordinates(91,0),false);assert.equal(location.validCoordinates(0,-181),false);
assert.equal(location.mapsDestination({direccion:' Calle Ñ 2 ',colonia:undefined,ciudad:'León'}),'Calle Ñ 2, León');
assert.equal(location.buildMapsUrl({direccion:'undefined',colonia:null,ciudad:'León'}),null);
assert.equal(location.mapsDestination({latitud:100,longitud:20,direccion:'Calle A'}),'Calle A');
assert.equal(location.normalizeNominatim({road:'Calle A',house_number:'10',quarter:'Barrio',suburb:'Sector',city:'León'}).colonia,'Barrio');
assert.equal(location.normalizeNominatim({residential:'Residencial A'}).colonia,'Residencial A');
assert.equal(location.normalizeNominatim({city:'León',municipality:'León'}).colonia,'');
const zero={clienteId:'a',saldo:0,limiteCredito:0,movimientos:[]};assert.equal(account.validateAccount(zero,'a'),zero);
for(const data of [{clienteId:'a',movimientos:[]},{...zero,clienteId:'b'},{...zero,movimientos:[{id:'1',monto:undefined}]}])assert.throws(()=>account.validateAccount(data,'a'));
const now=new Date(2026,10,8,14);assert.equal(csv.periodRange('Semana',now).start.getDate(),2);assert.equal(csv.periodRange('Mes',now).start.getDate(),1);
const productName='Queso "Especial"; edición\ncon acentos y nombre completo';
const report={periodo:'Semana',fechaInicio:'2026-11-02T00:00:00',fechaFin:'2026-11-08T14:00:00',ventasTotales:960,cobranzaTotal:50,creditoColocado:100,gastosTotal:20,utilidadEstimada:300,ticketPromedio:480,pedidosTotal:2,clientesVisitados:1,metodosPago:{efectivo:860,credito:100},topProductos:[{nombre:productName,presentacion:'Caja',cantidadPresentaciones:2,cantidadVendida:120,importeTotal:960}]};
// Independent CSV reader checks the resulting file, including embedded newlines.
function parseCsv(text){let rows=[],row=[],cell='',quoted=false;for(let i=1;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===';'&&!quoted){row.push(cell);cell='';}else if(c==='\n'&&!quoted){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}else cell+=c;}return rows;}
const result=csv.reportCsv(report),rows=parseCsv(result);assert.equal(result.charCodeAt(0),0xfeff);assert(rows.some(row=>row[0]===productName&&row[1]==='Caja'&&row[2]==='2'&&row[3]==='960'));assert.equal(csv.csvCell('=1+1'),'"\'=1+1"');assert.throws(()=>csv.reportCsv({}));
const doc=load('utils/receiptDocument.ts',{'expo-constants':{default:{expoConfig:{extra:{businessIdentity:{nombre:'DISTRIBUIDORA DON MIGUEL',rfc:'MIGD750412AB1',telefono:'477-123-4567',direccion:'León, Guanajuato'}}}}},'./helpers':money});

// Check Business Identity
assert.equal(doc.getBusinessIdentity().nombre,'DISTRIBUIDORA DON MIGUEL');
assert(doc.businessLines().includes('DISTRIBUIDORA DON MIGUEL'));

// Check Corte Receipt with Fondo Inicial
const corteData = {
  fecha: '09/nov/2026 18:30',
  vendedorNombre: 'Juan Chofer',
  rutaNombre: 'Ruta 1',
  ventasTotales: 4500,
  efectivo: 3000,
  transferencias: 500,
  tarjetas: 0,
  credito: 1000,
  fondoInicial: 500,
  abonosCobranza: 800,
  gastos: 200,
  efectivoEsperado: 4100,
  efectivoContado: 4100,
  diferenciaCaja: 0,
  piezasVendidas: 85,
  inventarioActualPiezas: 120,
};
const corteModel = doc.corteReceipt(corteData);
assert.equal(corteModel.title, 'Arqueo y Corte de Caja');
assert(corteModel.rows.some(r => r.label === '+ Fondo Inicial' && r.value === '$500'));
assert(corteModel.rows.some(r => r.label === 'Efectivo Esperado' && r.value === '$4,100'));

// Check Cobranza Receipt
const cobranzaData = {
  folio: 'REC-123456',
  fecha: '09/nov/2026 12:00',
  clienteNombre: 'Abarrotes La Lupita',
  clientePropietario: 'Guadalupe Santos',
  vendedorNombre: 'Juan Chofer',
  montoAbonado: 600,
  metodoPago: 'Efectivo',
  saldoAnterior: 1800,
  nuevoSaldo: 1200,
};
const cobranzaModel = doc.cobranzaReceipt(cobranzaData);
assert.equal(cobranzaModel.title, 'Recibo de Cobranza');
assert(cobranzaModel.rows.some(r => r.label === 'Monto Abonado' && r.value === '$600'));
assert(cobranzaModel.rows.some(r => r.label === 'Nuevo Saldo' && r.value === '$1,200'));

const sale={folio:'QA-LOCAL',fecha:'08/11/2026',clienteNombre:'Cliente de prueba',vendedorNombre:'Usuario de prueba',items:Array.from({length:70},(_,i)=>({nombre:`${i+1}. ${productName} para comprobar todas las líneas de la descripción`,presentacion:i%2?'Caja':'paquete',cantidad:1,precioUnitario:8,subtotal:8})),subtotal:560,total:560,pagos:[{metodo:'Efectivo',monto:560}]};
const dir=path.join(root,'docs/evidencia-incidencias');fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(path.join(dir,'reporte-regresion.csv'),result);
for(const width of [58,80]){
  const html=doc.receiptHtml(doc.reportReceipt({...report,topProductos:report.topProductos.map(p=>({nombre:p.nombre,presentacion:p.presentacion,cantidad:2,total:p.importeTotal}))}),width);
  assert(html.includes('Queso &quot;Especial&quot;; edición'));
  assert(!html.includes('VEM-'));
  assert(html.includes(`size: ${width}mm auto`));
  assert(!html.includes('297mm'));
  fs.writeFileSync(path.join(dir,`reporte-${width}.html`),html);
  const saleHtml=doc.receiptHtml(doc.saleReceipt(sale),width);
  assert(!saleHtml.includes('...'));
  for(const item of sale.items) assert(saleHtml.includes(doc.escapeReceipt(item.nombre)));
  fs.writeFileSync(path.join(dir,`venta-larga-${width}.html`),saleHtml);
  const corteHtml=doc.receiptHtml(corteModel,width);
  assert(corteHtml.includes('Arqueo y Corte de Caja'));
  assert(corteHtml.includes('+ Fondo Inicial'));
  fs.writeFileSync(path.join(dir,`corte-${width}.html`),corteHtml);
}
// Browser fixture exercises the actual canvas renderer; not imported by the app.
fs.writeFileSync(path.join(dir,'venta-imagen.html'),`<!doctype html><meta charset="utf-8"><title>QA imagen comprobante</title><style>body{margin:0;background:white}img{width:100%;max-width:460px}</style><body><script>const canvas=(${doc.receiptCanvas.toString()})(${JSON.stringify(doc.saleReceipt({...sale,items:sale.items.slice(0,4),subtotal:32,total:32,pagos:[{metodo:'Efectivo',monto:32}]})).replace(/</g,'\\u003c')});const image=new Image();image.alt='Comprobante de prueba con nombres completos';image.src=canvas.toDataURL();document.body.appendChild(image);</script>`);
console.log('PASS: money, GPS zero/ranges/partial address, colonia priorities, incomplete/zero account, Monday period, CSV round-trip, receipt full names/58/80 mm, Fondo Inicial corte and Don Miguel business identity.');
async function verifyLocalReport() {
  const now = new Date(), old = new Date(now); old.setMonth(old.getMonth()-2);
  const detail={productoId:'qa-product',presentacionNombre:'Caja',cantidadPresentaciones:2,piezasTotales:120,subtotal:960};
  const storage={miguel_mock_productos:JSON.stringify([{id:'qa-product',nombre:productName}]),miguel_mock_ventas:JSON.stringify([{clienteId:'qa-client',fechaHora:now.toISOString(),total:960,pagos:[{metodo:'Efectivo',monto:960}],detalles:[detail]},{clienteId:'old',fechaHora:old.toISOString(),total:5000,pagos:[],detalles:[detail]}])};
  let writes=0;
  const {DataService}=load('services/mockDataService.ts',{
    '@/utils/reportExport':csv,'@/constants/mockData':{empleados:[],bitacora:[],initialProductos:[],initialClientes:[]},
    './httpApiService':{apiService:{getReporteResumen:async()=>{throw Error('Offline test');}}},'./offlineSyncQueueService':{offlineSyncQueue:{getQueue:()=>[]}}
  },{window:{localStorage:{getItem:key=>storage[key]||null,setItem:(key,value)=>{writes++;storage[key]=value;}}}});
  const startupWrites=writes;
  const localReport=await DataService.getReporteResumen('Semana');
  assert.equal(writes,startupWrites);
  assert.equal(localReport.pedidosTotal,1);
  assert.equal(localReport.ventasTotales,960);
  assert.equal(localReport.utilidadEstimada,336);
  assert.equal(localReport.topProductos[0].nombre,productName);
  assert.equal(localReport.topProductos[0].presentacion,'Caja');
  assert.equal(localReport.topProductos[0].cantidadVendida,2);
  console.log('PASS: offline report excludes old sales, preserves real product name, presentation and quantity without extra storage writes.');
}
verifyLocalReport().catch(err=>{console.error(err);process.exit(1);});
