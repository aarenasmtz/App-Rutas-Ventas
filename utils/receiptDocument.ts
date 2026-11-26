import Constants from 'expo-constants';
import { formatCurrency } from './helpers';
import type { VentaTicketData, ReporteTicketData, CorteTicketData, CobranzaTicketData } from '@/services/ticketPrinterService';

export interface BusinessIdentity {
  nombre: string;
  rfc?: string;
  telefono?: string;
  direccion?: string;
}

const STORAGE_KEY = 'miguel_business_identity';

export function getBusinessIdentity(): BusinessIdentity {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.nombre === 'string') return parsed;
      }
    }
  } catch {
    // Fallback to static config
  }

  const config = Constants.expoConfig?.extra?.businessIdentity as BusinessIdentity | undefined;
  return {
    nombre: config?.nombre || 'DISTRIBUIDORA DON MIGUEL',
    rfc: config?.rfc || 'MIGD750412AB1',
    telefono: config?.telefono || '477-123-4567',
    direccion: config?.direccion || 'León, Guanajuato',
  };
}

export function saveBusinessIdentity(identity: BusinessIdentity): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(identity));
    }
  } catch {
    // Ignore storage errors
  }
}

export interface ReceiptRow { label: string; value?: string; detail?: string; emphasis?: boolean }
export interface ReceiptModel { title: string; rows: ReceiptRow[] }

export function businessLines(): string[] {
  const config = getBusinessIdentity();
  return [
    config.nombre,
    config.rfc ? `RFC: ${config.rfc}` : '',
    config.telefono ? `Tel: ${config.telefono}` : '',
    config.direccion || '',
  ].filter((v): v is string => typeof v === 'string' && !!v.trim());
}

export function saleReceipt(data: VentaTicketData): ReceiptModel {
  return {
    title: 'Comprobante de venta',
    rows: [
      ...businessLines().map(label => ({ label })),
      { label: 'Folio', value: data.folio },
      { label: 'Fecha', value: data.fecha },
      { label: 'Vendedor', value: data.vendedorNombre },
      ...(data.rutaNombre ? [{ label: 'Ruta', value: data.rutaNombre }] : []),
      { label: data.clienteNombre, detail: [data.clientePropietario, data.clienteDireccion].filter(Boolean).join(' · '), emphasis: true },
      ...data.items.map(item => ({
        label: item.nombre,
        value: formatCurrency(item.subtotal),
        detail: `${item.isWeight || item.presentacion === 'kg' ? item.cantidad.toFixed(3) : item.cantidad} ${item.presentacion} × ${formatCurrency(item.precioUnitario)}`,
      })),
      { label: 'Subtotal', value: formatCurrency(data.subtotal) },
      ...(data.descuento ? [{ label: 'Descuento', value: formatCurrency(data.descuento) }] : []),
      { label: 'Total', value: formatCurrency(data.total), emphasis: true },
      ...data.pagos.map(p => ({ label: p.metodo, value: formatCurrency(p.monto) })),
      ...(data.pagoCredito && data.nuevoSaldo !== undefined ? [{ label: 'Nuevo saldo', value: formatCurrency(data.nuevoSaldo) }] : []),
      { label: 'Comprobante no fiscal', detail: 'Gracias por su compra.' },
    ],
  };
}

export function cobranzaReceipt(data: CobranzaTicketData): ReceiptModel {
  return {
    title: 'Recibo de Cobranza',
    rows: [
      ...businessLines().map(label => ({ label })),
      { label: 'Folio', value: data.folio },
      { label: 'Fecha', value: data.fecha },
      { label: 'Cobrador', value: data.vendedorNombre },
      { label: data.clienteNombre, detail: data.clientePropietario || '', emphasis: true },
      { label: 'Monto Abonado', value: formatCurrency(data.montoAbonado), emphasis: true },
      { label: 'Método de Pago', value: data.metodoPago },
      { label: 'Saldo Anterior', value: formatCurrency(data.saldoAnterior) },
      { label: 'Nuevo Saldo', value: formatCurrency(data.nuevoSaldo), emphasis: true },
      ...(data.comentario ? [{ label: 'Observaciones', detail: data.comentario }] : []),
      { label: 'Comprobante de abono', detail: 'Gracias por su pago oportuno.' },
    ],
  };
}

export function corteReceipt(data: CorteTicketData): ReceiptModel {
  return {
    title: 'Arqueo y Corte de Caja',
    rows: [
      ...businessLines().map(label => ({ label })),
      { label: 'Fecha', value: data.fecha },
      { label: 'Vendedor', value: data.vendedorNombre },
      { label: 'Ruta', value: data.rutaNombre },
      { label: 'Ventas Totales', value: formatCurrency(data.ventasTotales), emphasis: true },
      { label: '  • En Efectivo', value: formatCurrency(data.efectivo) },
      { label: '  • Transferencias', value: formatCurrency(data.transferencias) },
      { label: '  • Tarjetas', value: formatCurrency(data.tarjetas) },
      { label: '  • A Crédito', value: formatCurrency(data.credito) },
      ...(data.fondoInicial !== undefined && data.fondoInicial > 0 ? [{ label: '+ Fondo Inicial', value: formatCurrency(data.fondoInicial) }] : []),
      { label: '+ Cobranza / Abonos', value: formatCurrency(data.abonosCobranza) },
      { label: '- Gastos en Ruta', value: `-${formatCurrency(data.gastos)}` },
      { label: 'Efectivo Esperado', value: formatCurrency(data.efectivoEsperado), emphasis: true },
      { label: 'Efectivo Físico', value: formatCurrency(data.efectivoContado), emphasis: true },
      { label: 'Diferencia Caja', value: formatCurrency(data.diferenciaCaja), emphasis: true },
      ...(data.piezasVendidas !== undefined ? [{ label: 'Piezas Vendidas', value: `${data.piezasVendidas} pzas` }] : []),
      ...(data.inventarioActualPiezas !== undefined ? [{ label: 'Remanente Camioneta', value: `${data.inventarioActualPiezas} pzas` }] : []),
      { label: 'Firma Chofer / Auditor', detail: 'Entrega y recepción conforme de valores.' },
    ],
  };
}

export function reportReceipt(data: ReporteTicketData): ReceiptModel {
  const date = (value: string) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' });
  };
  return {
    title: `Reporte · ${data.periodo}`,
    rows: [
      ...businessLines().map(label => ({ label })),
      { label: 'Periodo', detail: `${date(data.fechaInicio)} — ${date(data.fechaFin)}` },
      { label: 'Generado', value: data.fechaGeneracion || new Date().toLocaleString('es-MX') },
      ...[['Ventas', data.ventasTotales], ['Cobranza', data.cobranzaTotal], ['Crédito colocado', data.creditoColocado], ['Gastos', data.gastosTotal], ['Utilidad estimada', data.utilidadEstimada], ['Ticket promedio', data.ticketPromedio]].map(([label, value]) => ({ label: String(label), value: formatCurrency(value) })),
      { label: 'Pedidos', value: String(data.pedidosTotal) },
      { label: 'Clientes atendidos', value: String(data.clientesVisitados) },
      { label: 'Formas de pago', emphasis: true },
      ...[['Efectivo', data.metodosPago.efectivo], ['Transferencia', data.metodosPago.transferencia], ['Tarjeta', data.metodosPago.tarjeta], ['Crédito', data.metodosPago.credito]].map(([label, value]) => ({ label: String(label), value: formatCurrency(value) })),
      { label: 'Productos más vendidos', emphasis: true },
      ...data.topProductos.map(p => ({ label: p.nombre, value: formatCurrency(p.total), detail: `${p.cantidad} ${p.presentacion || 'unidades base'}` })),
      ...(!data.topProductos.length ? [{ label: 'Sin productos vendidos en este periodo.' }] : []),
    ],
  };
}

export function escapeReceipt(value: string): string {
  return String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

export function receiptHtml(model: ReceiptModel, width: 58 | 80 = 58): string {
  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="receipt-paper-width" content="${width}"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeReceipt(model.title)}</title><style>
    @page {
      size: ${width}mm auto;
      margin: 2mm 1mm;
    }
    * { box-sizing: border-box; }
    html, body {
      background: #fff;
      margin: 0;
      color: #1d2418;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: ${width === 58 ? 11 : 13}px;
      line-height: 1.35;
    }
    body {
      width: 100%;
      max-width: ${width}mm;
      margin: auto;
      padding: 3mm 2mm;
    }
    h1 {
      font-size: ${width === 58 ? 15 : 18}px;
      color: #46522b;
      border-bottom: 2px solid #556133;
      margin: 0 0 8px;
      padding-bottom: 6px;
      text-align: center;
      overflow-wrap: anywhere;
    }
    .row {
      padding: 5px 0;
      border-bottom: 1px dashed #d8dccf;
      break-inside: avoid;
      page-break-inside: avoid;
      overflow-wrap: anywhere;
    }
    .line {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 6px;
    }
    .label {
      flex: 1;
      min-width: 0;
    }
    .value {
      max-width: 48%;
      text-align: right;
      font-weight: bold;
      overflow-wrap: anywhere;
      white-space: nowrap;
    }
    .detail {
      color: #414b36;
      font-size: 0.9em;
      margin-top: 2px;
    }
    .strong {
      font-weight: bold;
      color: #354020;
      border-top: 1.5px solid #556133;
      border-bottom: 1.5px solid #556133;
      padding: 6px 0;
      background: rgba(85,97,51,0.04);
    }
    @media print {
      @page {
        size: ${width}mm auto;
        margin: 1mm 1mm;
      }
      body {
        width: ${width}mm !important;
        max-width: ${width}mm !important;
        padding: 1mm 2mm !important;
        margin: 0 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .row {
        border-color: #888;
        page-break-inside: avoid;
        break-inside: avoid;
      }
      .strong, h1 {
        color: #000;
        border-color: #000;
      }
    }
  </style>
  <script>
    function triggerPrint() {
      window.focus();
      setTimeout(function() { window.print(); }, 200);
    }
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      triggerPrint();
    } else {
      window.addEventListener('DOMContentLoaded', triggerPrint);
    }
  </script>
  </head><body><h1>${escapeReceipt(model.title)}</h1>${model.rows.map(row => `<div class="row${row.emphasis ? ' strong' : ''}"><div class="line"><span class="label">${escapeReceipt(row.label)}</span>${row.value !== undefined ? `<span class="value">${escapeReceipt(row.value)}</span>` : ''}</div>${row.detail ? `<div class="detail">${escapeReceipt(row.detail)}</div>` : ''}</div>`).join('')}</body></html>`;
}

export function receiptCanvas(model: ReceiptModel): HTMLCanvasElement | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas'), context = canvas.getContext('2d');
  if (!context) return null;
  const width = 460, padding = 24, lineHeight = 19;
  const wrap = (text: string, max: number) => {
    const result: string[] = [];
    let line = '';
    for (const word of String(text).split(/\s+/)) {
      if (context.measureText(line + (line ? ' ' : '') + word).width > max && line) {
        result.push(line);
        line = '';
      }
      if (context.measureText(word).width > max) {
        for (const char of word) {
          if (context.measureText(line + char).width > max) {
            result.push(line);
            line = '';
          }
          line += char;
        }
      } else line += (line ? ' ' : '') + word;
    }
    if (line) result.push(line);
    return result;
  };
  context.font = 'bold 14px Arial';
  const rows = model.rows.map(row => ({
    ...row,
    lines: wrap(row.label, row.value ? width - 2 * padding - 118 : width - 2 * padding),
    details: wrap(row.detail || '', width - 2 * padding),
  }));
  const titleLines = wrap(model.title, width - 2 * padding);
  const height = padding * 2 + titleLines.length * 26 + rows.reduce((n, row) => n + 18 + lineHeight * (Math.max(row.lines.length, 1) + row.details.length), 0);
  canvas.width = width * 2;
  canvas.height = height * 2;
  context.scale(2, 2);
  context.fillStyle = '#fff';
  context.fillRect(0, 0, width, height);
  let y = padding;
  context.fillStyle = '#46522b';
  context.font = 'bold 20px Arial';
  for (const text of titleLines) {
    y += 26;
    context.fillText(text, padding, y);
  }
  for (const row of rows) {
    y += 18;
    context.font = row.emphasis ? 'bold 14px Arial' : '14px Arial';
    context.fillStyle = row.emphasis ? '#354020' : '#1d2418';
    const top = y;
    for (const text of row.lines) {
      context.fillText(text, padding, y);
      y += lineHeight;
    }
    if (row.value !== undefined) {
      context.textAlign = 'right';
      context.fillText(row.value, width - padding, top);
      context.textAlign = 'left';
    }
    context.font = '13px Arial';
    context.fillStyle = '#414b36';
    for (const text of row.details) {
      context.fillText(text, padding, y);
      y += lineHeight;
    }
    context.strokeStyle = '#d8dccf';
    context.beginPath();
    context.moveTo(padding, y + 5);
    context.lineTo(width - padding, y + 5);
    context.stroke();
  }
  return canvas;
}
