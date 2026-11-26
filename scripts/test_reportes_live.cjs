const http = require('http');
const { spawn } = require('child_process');

console.log('Testing Reportes live API against SQL Server backend...');

const PORT = 5220;
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

    // Test 1: Semana
    const resSemana = await getJson(`http://127.0.0.1:${PORT}/api/v1/reportes/resumen?periodo=Semana`);
    console.log('Status Semana:', resSemana.status);
    console.log('VentasTotales Semana:', resSemana.body?.ventasTotales);
    console.log('UtilidadEstimada Semana:', resSemana.body?.utilidadEstimada);
    if (resSemana.status !== 200) throw new Error('Reporte Semana failed');

    // Test 2: Dia
    const resDia = await getJson(`http://127.0.0.1:${PORT}/api/v1/reportes/resumen?periodo=Dia`);
    console.log('Status Dia:', resDia.status);
    console.log('VentasTotales Dia:', resDia.body?.ventasTotales);
    console.log('UtilidadEstimada Dia:', resDia.body?.utilidadEstimada);
    if (resDia.status !== 200) throw new Error('Reporte Dia failed');

    // Test 3: Mes
    const resMes = await getJson(`http://127.0.0.1:${PORT}/api/v1/reportes/resumen?periodo=Mes`);
    console.log('Status Mes:', resMes.status);
    console.log('VentasTotales Mes:', resMes.body?.ventasTotales);
    console.log('UtilidadEstimada Mes:', resMes.body?.utilidadEstimada);
    if (resMes.status !== 200) throw new Error('Reporte Mes failed');

    console.log('ALL LIVE REPORT INTEGRATION TESTS PASSED SUCCESSFULLY!');
  } finally {
    serverProc.kill();
  }
}

run().catch((err) => {
  console.error('Test failed:', err);
  serverProc.kill();
  process.exit(1);
});

