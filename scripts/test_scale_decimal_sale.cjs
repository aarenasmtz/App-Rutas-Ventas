const http = require('http');
const { spawn, execSync } = require('child_process');

console.log('Testing Scale Decimal Weighing (0.450 kg) against live backend & SQL Server...');

const PORT = 5235;
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
  for (let i = 0; i < 30; i++) {
    if (serverReady) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Server startup timeout');
}

function requestJson(method, path, body) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: PORT,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, raw: data });
          }
        });
      }
    );
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function run() {
  try {
    await waitForServer();
    console.log('Backend server running on port', PORT);

    // 1. Get initial products to find a product
    const prodsRes = await requestJson('GET', '/api/v1/productos');
    if (prodsRes.status !== 200 || !prodsRes.body?.length) {
      throw new Error('Could not fetch products');
    }
    const testProd = prodsRes.body[0];
    console.log('Using product:', testProd.nombre, 'Initial Stock:', testProd.existenciaPiezas);

    // 2. Register sale with fractional decimal weight: 0.450 kg
    const idempotencyKey = `QA-SCALE-${Date.now()}`;
    const unitPrice = 120.00;
    const quantity = 0.450;
    const subtotal = Math.round(quantity * unitPrice * 100) / 100; // 54.00

    const salePayload = {
      clienteId: 'c1',
      empleadoId: '1',
      total: subtotal,
      items: [
        {
          productoId: testProd.codigo || testProd.id,
          presentacionTipo: 'kg',
          cantidadPresentaciones: quantity,
          piezasTotalesCalculadas: quantity,
          factorConversion: 1,
          presentacionNombre: 'Kilogramo (Báscula)',
          precioUnitario: unitPrice,
          subtotal: subtotal,
        },
      ],
      pagos: [
        {
          metodo: 'Efectivo',
          monto: subtotal,
        },
      ],
    };

    console.log('Sending fractional sale payload (0.450 kg):', salePayload);
    const saleRes = await requestJson('POST', '/api/v1/ventas', salePayload);
    console.log('Sale Response Status:', saleRes.status);
    console.log('Sale Response Body:', saleRes.body);

    if (saleRes.status !== 200 && saleRes.status !== 201) {
      throw new Error(`Scale sale failed with status ${saleRes.status}`);
    }

    // 3. Verify that stock was discounted by exactly 0.450
    const prodsResAfter = await requestJson('GET', '/api/v1/productos');
    const prodAfter = prodsResAfter.body.find((p) => p.id === testProd.id || p.codigo === testProd.codigo);
    console.log('Stock after 0.450 sale:', prodAfter.existenciaPiezas);

    const diff = Math.round((testProd.existenciaPiezas - prodAfter.existenciaPiezas) * 1000) / 1000;
    console.log('Exact Stock Difference:', diff);
    if (diff !== 0.450) {
      throw new Error(`Expected stock difference of 0.450, got ${diff}`);
    }

    console.log('SCALE FRACTIONAL WEIGHING (0.450 KG) FULLY VERIFIED ON SQL SERVER!');
  } finally {
    killServer();
  }
}

run().catch((err) => {
  console.error('Test failed:', err);
  killServer();
  process.exit(1);
});