const http = require('http');
const { spawn } = require('child_process');

console.log('Testing Inventario segmentation API against live backend...');

const PORT = 5210;
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

async function waitForServer() {
  for (let i = 0; i < 30; i++) {
    if (serverReady) return true;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('Server startup timeout');
}

function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  try {
    await waitForServer();
    console.log('Backend server running on port', PORT);

    // Test 1: Get Inventario Bodega
    const resBodega = await getJson(`http://127.0.0.1:${PORT}/api/v1/inventario?ubicacion=Bodega`);
    console.log('Status Bodega:', resBodega.status);
    console.log('UbicacionNombre:', resBodega.body?.ubicacionNombre);
    console.log('Total Piezas Bodega:', resBodega.body?.totalPiezas);
    if (resBodega.status !== 200 || !resBodega.body?.items) {
      throw new Error('Bodega inventory failed');
    }

    // Test 2: Get Inventario Camioneta 1
    const resCamioneta1 = await getJson(`http://127.0.0.1:${PORT}/api/v1/inventario?ubicacion=Camioneta%201`);
    console.log('Status Camioneta 1:', resCamioneta1.status);
    console.log('UbicacionNombre:', resCamioneta1.body?.ubicacionNombre);
    console.log('Total Piezas Camioneta 1:', resCamioneta1.body?.totalPiezas);
    if (resCamioneta1.status !== 200 || !resCamioneta1.body?.items) {
      throw new Error('Camioneta 1 inventory failed');
    }

    // Test 3: Get Inventario with usuarioId
    const resUser = await getJson(`http://127.0.0.1:${PORT}/api/v1/inventario?usuarioId=1`);
    console.log('Status UsuarioId 1:', resUser.status);
    console.log('UbicacionNombre UsuarioId 1:', resUser.body?.ubicacionNombre);
    if (resUser.status !== 200) {
      throw new Error('UsuarioId inventory failed');
    }

    console.log('ALL INVENTORY SEGMENTATION TESTS PASSED SUCCESSFULLY!');
  } finally {
    serverProc.kill();
  }
}

run().catch((err) => {
  console.error('Test failed:', err);
  serverProc.kill();
  process.exit(1);
});

