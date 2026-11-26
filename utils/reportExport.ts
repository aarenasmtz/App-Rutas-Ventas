export function periodRange(period: string, now = new Date()) {
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const p = (period || 'Semana').toLowerCase();
  if (p === 'mes') {
    start.setDate(1);
  } else if (p === 'dia' || p === 'día' || p === 'hoy') {
    // start is already today at 00:00:00
  } else {
    // Semana: Lunes como inicio
    start.setDate(start.getDate() - (start.getDay() + 6) % 7);
  }
  return { start, end: now };
}
export function csvCell(value: unknown): string {
  const text = value == null ? '' : String(value);
  // Preserve text while preventing spreadsheet formulas from untrusted names.
  const safe = typeof value === 'string' && /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
export function reportCsv(report: any): string {
  if (!report || !report.fechaInicio || !report.fechaFin || !Number.isFinite(report.ventasTotales)) throw new Error('El reporte no está listo para exportar.');
  const rows: unknown[][] = [['Reporte',report.periodo],['Desde',report.fechaInicio],['Hasta',report.fechaFin],[],['Indicador','Importe o cantidad'],
    ['Ventas',report.ventasTotales],['Cobranza',report.cobranzaTotal],['Crédito',report.creditoColocado],['Gastos',report.gastosTotal],['Utilidad estimada',report.utilidadEstimada],['Ticket promedio',report.ticketPromedio],['Pedidos',report.pedidosTotal],[],['Forma de pago','Importe'],
    ...Object.entries(report.metodosPago || {}),[],['Producto','Presentación / unidad','Cantidad','Importe'],
    ...(report.topProductos || []).map((p:any)=>[p.nombre,p.presentacion || p.unidad || 'unidades base',p.cantidadPresentaciones ?? p.cantidadVendida,p.importeTotal])];
  return '\uFEFF' + rows.map(row=>row.map(csvCell).join(';')).join('\r\n')+'\r\n';
}
export function reportFilename(report: any) {
  return `Reporte_${report.periodo.normalize('NFD').replace(/[\u0300-\u036f]/g,'')}_${String(report.fechaInicio).slice(0,10)}_${String(report.fechaFin).slice(0,10)}.csv`;
}
