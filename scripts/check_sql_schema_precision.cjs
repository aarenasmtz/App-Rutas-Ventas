const sql = require('mssql');

const config = {
  user: 'sa',
  password: 'Password123!',
  server: '179.236.248.165',
  port: 1433,
  database: 'RutaVentasDb',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  connectionTimeout: 10000,
};

async function check() {
  const pool = await sql.connect(config);
  const result = await pool.request().query(`
    SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, NUMERIC_PRECISION, NUMERIC_SCALE
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME IN ('Productos', 'VentaDetalles', 'InventarioMovimientos')
      AND COLUMN_NAME IN ('Existencia', 'PiezasTotales', 'CantidadPresentaciones', 'Piezas')
  `);
  console.log(result.recordset);
  await pool.close();
}

check().catch(console.error);

