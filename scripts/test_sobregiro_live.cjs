const http = require('http');
const { spawn, execSync } = require('child_process');

const PORT = 5236;
console.log('--- TEST INTEGRACIÓN VIVO: AUTORIZACIÓN REMOTA PUSH PARA SOBREGIRO (FASE 4) ---');

const serverProc = spawn('dotnet', ['run', '--no-launch-profile', '--urls', `http://127.0.0.1:${PORT}`, '--project', 'backend/RutaVentas.Api'], {
  stdio: ['ignore', 'pipe', 'pipe']
});

let serverReady = false;
serverProc.stdout.on('data', (d) => {
  const str = d.toString();
  if (str.includes('Now listening on:') || str.includes('Application started.')) {
    serverReady = true;
  }
});
serverProc.stderr.on('data', (d) => console.error(d.toString()));

function killServer() {
  try {
    if (serverProc.pid) {
      execSync(`taskkill /pid ${serverProc.pid} /f /t`, { stdio: 'ignore' });
    }
  } catch {}
}

async function waitForServer() {
  for (let i = 0; i < 40; i++) {
    if (serverReady) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Server startup timeout');
}

function requestJson(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const dataString = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(dataString ? { 'Content-Length': Buffer.byteLength(dataString) } : {}),
        },
      },
      (res) => {
        let resData = '';
        res.on('data', chunk => resData += chunk);
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(resData);
          } catch {
            json = resData;
          }
          resolve({ status: res.statusCode, data: json });
        });
      }
    );
    req.on('error', reject);
    if (dataString) req.write(dataString);
    req.end();
  });
}

async function main() {
  console.log('Esperando inicio del backend .NET 9...');
  await waitForServer();
  console.log(`✓ Backend conectado y respondiendo en http://127.0.0.1:${PORT}`);

  try {
    // 1. Obtener clientes y productos
    const clientesRes = await requestJson('GET', '/api/v1/clientes');
    const productosRes = await requestJson('GET', '/api/v1/productos');

    if (!Array.isArray(clientesRes.data) || clientesRes.data.length === 0) {
      throw new Error('No se encontraron clientes.');
    }
    if (!Array.isArray(productosRes.data) || productosRes.data.length === 0) {
      throw new Error('No se encontraron productos.');
    }

    // 1. Crear un cliente de prueba con límite bajo ($100) para prueba controlada
    const nuevoClienteReq = {
      nombre: 'Abarrotes Sobregiro Test',
      propietario: 'Roberto Sobregiro',
      direccion: 'Av Siempre Viva 742',
      limiteCredito: 100,
      saldo: 0
    };
    const crearClienteRes = await requestJson('POST', '/api/v1/clientes', nuevoClienteReq);
    const cliente = crearClienteRes.data;

    const producto = productosRes.data[0];

    const clienteNombre = cliente.nombre || 'Abarrotes Sobregiro Test';
    const saldoActual = cliente.saldo ?? 0;
    const limiteCredito = cliente.limiteCredito || 100;
    const precioBase = producto.precioBase || 8;

    console.log(`Cliente creado para test: ${clienteNombre} (ID: ${cliente.id})`);
    console.log(`- Saldo actual: $${saldoActual}, Límite de crédito: $${limiteCredito}`);

    // Queremos vender 20 piezas a $8 = $160 (Excede límite de $100 por $60)
    // Existencia actual es ~48 piezas, por lo que 20 piezas es perfectamente surtible
    const piezasNecesarias = 20;
    const subtotalCalculado = piezasNecesarias * precioBase;

    console.log(`Existencia disponible: ${producto.existencia}`);
    console.log(`Venta a intentar: ${piezasNecesarias} piezas x $${precioBase} = $${subtotalCalculado}`);

    console.log(`\n1. Intentando venta a crédito por $${subtotalCalculado} (Excede límite de $${limiteCredito})...`);

    const ventaExcedida = {
      clienteId: cliente.id.toString(),
      empleadoId: '1',
      total: subtotalCalculado,
      items: [
        {
          productoId: producto.id.toString(),
          presentacionTipo: 'Unidad',
          presentacionNombre: 'Pieza',
          factorConversion: 1,
          cantidadPresentaciones: piezasNecesarias,
          piezasTotalesCalculadas: piezasNecesarias,
          precioUnitario: precioBase,
          subtotal: subtotalCalculado,
        }
      ],
      pagos: [
        {
          metodo: 'Crédito',
          monto: subtotalCalculado,
        }
      ]
    };

    const intentoVentaRes = await requestJson('POST', '/api/v1/ventas', ventaExcedida);
    console.log(`Respuesta intento venta: HTTP ${intentoVentaRes.status}`);
    console.log(`Cuerpo:`, intentoVentaRes.data);

    if (intentoVentaRes.status !== 422 || !intentoVentaRes.data.requiereAutorizacion) {
      throw new Error(`Se esperaba HTTP 422 con requiereAutorizacion=true, pero se obtuvo: ${intentoVentaRes.status}`);
    }
    console.log('✓ La venta fue bloqueada correctamente por exceso de crédito (HTTP 422).');

    // 2. Chofer solicita autorización remota de sobregiro
    console.log('\n2. Chofer envía solicitud de sobregiro...');
    const solicitudReq = {
      clienteId: cliente.id.toString(),
      empleadoId: '1',
      montoSolicitado: subtotalCalculado,
      motivo: 'Cliente solicita surtido grande para evento de fin de semana'
    };

    const solicitudRes = await requestJson('POST', '/api/v1/ventas/solicitar-sobregiro', solicitudReq);
    console.log(`Respuesta solicitud: HTTP ${solicitudRes.status}`);
    console.log(`Token Solicitud generado:`, solicitudRes.data.tokenSolicitud);

    if ((solicitudRes.status !== 200 && solicitudRes.status !== 201) || !solicitudRes.data.tokenSolicitud) {
      throw new Error('Fallo al generar solicitud de sobregiro.');
    }
    const tokenSolicitud = solicitudRes.data.tokenSolicitud;
    console.log('✓ Solicitud de sobregiro registrada como Pendiente.');

    // 3. Don Miguel consulta solicitudes pendientes
    console.log('\n3. Don Miguel consulta solicitudes de sobregiro pendientes...');
    const listadoPendientes = await requestJson('GET', '/api/v1/ventas/solicitudes-sobregiro?estado=Pendiente');
    console.log(`Solicitudes pendientes encontradas: ${listadoPendientes.data.length}`);
    const solicitudEncontrada = listadoPendientes.data.find(s => s.tokenSolicitud === tokenSolicitud);
    if (!solicitudEncontrada) {
      throw new Error('La solicitud recién creada no aparece en la bandeja de Don Miguel.');
    }
    console.log(`✓ Don Miguel ve la solicitud de $${solicitudEncontrada.montoSolicitado} para ${solicitudEncontrada.clienteNombre}`);

    // 4. Don Miguel autoriza la solicitud
    console.log('\n4. Don Miguel autoriza el sobregiro...');
    const resolverReq = {
      tokenSolicitud: tokenSolicitud,
      autorizado: true,
      adminId: '1',
      motivoResolucion: 'Autorizado vía App por Don Miguel'
    };
    const resolverRes = await requestJson('POST', '/api/v1/ventas/resolver-sobregiro', resolverReq);
    console.log(`Respuesta resolver: HTTP ${resolverRes.status}`);
    console.log(`Token Autorización otorgado:`, resolverRes.data.tokenAutorizacion);
    if (resolverRes.status !== 200 || !resolverRes.data.tokenAutorizacion) {
      throw new Error('Fallo al autorizar sobregiro.');
    }
    const tokenAutorizacion = resolverRes.data.tokenAutorizacion;
    console.log('✓ Solicitud autorizada con éxito.');

    // 5. Chofer consulta estado de su solicitud
    console.log('\n5. Chofer consulta estatus de la solicitud...');
    const consultaRes = await requestJson('GET', `/api/v1/ventas/consultar-sobregiro/${tokenSolicitud}`);
    console.log(`Estatus consultado: ${consultaRes.data.estado}`);
    if (consultaRes.data.estado !== 'Autorizada' || consultaRes.data.tokenAutorizacion !== tokenAutorizacion) {
      throw new Error('El estatus consultado no coincide con la autorización.');
    }
    console.log('✓ Chofer recibe confirmación y token de autorización remota.');

    // 6. Chofer reintenta la venta con el Token de Autorización
    console.log('\n6. Chofer procesa la venta adjuntando el Token de Autorización...');
    const ventaConToken = {
      ...ventaExcedida,
      tokenAutorizacionSobregiro: tokenAutorizacion
    };

    const ventaFinalRes = await requestJson('POST', '/api/v1/ventas', ventaConToken);
    console.log(`Respuesta venta autorizada: HTTP ${ventaFinalRes.status}`);
    console.log(`Datos venta creada:`, ventaFinalRes.data);

    if (ventaFinalRes.status !== 201) {
      throw new Error(`Se esperaba HTTP 201 Created al enviar token de autorización, pero se obtuvo: ${ventaFinalRes.status}`);
    }
    console.log(`✓ Venta completada exitosamente! Folio: ${ventaFinalRes.data.folio}, Nuevo Saldo: $${ventaFinalRes.data.nuevoSaldoCliente}`);

    console.log('\n======================================================');
    console.log('>>> TEST 3.2 AUTORIZACIÓN REMOTA PUSH: 100% EXITOSO <<<');
    console.log('======================================================\n');
  } finally {
    killServer();
  }
}

main().catch(err => {
  killServer();
  console.error('FATAL ERROR EN TEST:', err);
  process.exit(1);
});