import { Platform, Linking } from 'react-native';
import { formatCurrency } from '@/utils/helpers';
import { ticketImageService } from './ticketImageService';

export interface VentaTicketData {
  folio: string;
  fecha: string;
  clienteNombre: string;
  clientePropietario?: string;
  clienteDireccion?: string;
  clienteTelefono?: string;
  vendedorNombre: string;
  rutaNombre?: string;
  items: {
    nombre: string;
    presentacion: string;
    isWeight?: boolean;
    cantidad: number;
    piezasTotales?: number;
    precioUnitario: number;
    subtotal: number;
  }[];
  subtotal: number;
  descuento?: number;
  total: number;
  pagos: {
    metodo: string;
    monto: number;
  }[];
  saldoAnterior?: number;
  pagoCredito?: number;
  nuevoSaldo?: number;
}

export interface CobranzaTicketData {
  folio: string;
  fecha: string;
  clienteNombre: string;
  clientePropietario?: string;
  vendedorNombre: string;
  montoAbonado: number;
  metodoPago: string;
  saldoAnterior: number;
  nuevoSaldo: number;
  comentario?: string;
}

export interface CorteTicketData {
  fecha: string;
  vendedorNombre: string;
  rutaNombre: string;
  ventasTotales: number;
  efectivo: number;
  transferencias: number;
  tarjetas: number;
  credito: number;
  abonosCobranza: number;
  gastos: number;
  efectivoEsperado: number;
  efectivoContado: number;
  diferenciaCaja: number;
  piezasVendidas?: number;
  inventarioActualPiezas?: number;
}

export interface ReporteTicketData {
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  ventasTotales: number;
  cobranzaTotal: number;
  creditoColocado: number;
  gastosTotal: number;
  utilidadEstimada: number;
  ticketPromedio: number;
  pedidosTotal: number;
  clientesVisitados: number;
  topProductos: { nombre: string; cantidad: number; total: number }[];
  metodosPago: { efectivo: number; transferencia: number; tarjeta: number; credito: number };
}

class TicketPrinterService {
  /**
   * Genera texto plano monoespaciado estilo ESC/POS para impresoras de 58mm (32 columnas)
   */
  generateVentaText(data: VentaTicketData, width: 58 | 80 = 58): string {
    const col = width === 58 ? 32 : 44;
    const div = '-'.repeat(col);
    const dblDiv = '='.repeat(col);

    const center = (text: string) => {
      const pad = Math.max(0, Math.floor((col - text.length) / 2));
      return ' '.repeat(pad) + text;
    };

    const row = (left: string, right: string) => {
      const space = Math.max(1, col - left.length - right.length);
      return left + ' '.repeat(space) + right;
    };

    const lines: string[] = [];
    lines.push(dblDiv);
    lines.push(center('DISTRIBUIDORA MIGUEL'));
    lines.push(center('Venta y Reparto en Ruta'));
    lines.push(center('RFC: VEM-980112-AB1'));
    lines.push(center('Tel: (449) 912-3456'));
    lines.push(div);
    lines.push(row('Folio:', data.folio));
    lines.push(row('Fecha:', data.fecha));
    lines.push(row('Ruta:', data.rutaNombre || 'Ruta 1'));
    lines.push(row('Vendedor:', data.vendedorNombre));
    lines.push(div);
    lines.push(`CLIENTE: ${data.clienteNombre}`);
    if (data.clientePropietario) lines.push(`Atn: ${data.clientePropietario}`);
    if (data.clienteDireccion) lines.push(`Dir: ${data.clienteDireccion}`);
    lines.push(div);

    lines.push(row('CANT DESCRIPCIÓN', 'IMPORTE'));
    lines.push(div);

    data.items.forEach((it) => {
      const nombreLine = it.nombre.slice(0, col - 2);
      lines.push(nombreLine);
      const detail = `  ${it.cantidad} ${it.presentacion} x ${formatCurrency(it.precioUnitario)}`;
      const sub = formatCurrency(it.subtotal);
      lines.push(row(detail, sub));
    });

    lines.push(div);
    lines.push(row('SUBTOTAL:', formatCurrency(data.subtotal)));
    if (data.descuento && data.descuento > 0) {
      lines.push(row('DESCUENTO:', `-${formatCurrency(data.descuento)}`));
    }
    lines.push(row('TOTAL VENTA:', formatCurrency(data.total)));
    lines.push(dblDiv);

    lines.push(center('DESGLOSE DE PAGO'));
    data.pagos.forEach((p) => {
      lines.push(row(`• ${p.metodo}:`, formatCurrency(p.monto)));
    });

    if (data.pagoCredito && data.pagoCredito > 0) {
      lines.push(div);
      lines.push(row('Crédito otorgado hoy:', formatCurrency(data.pagoCredito)));
      if (data.nuevoSaldo !== undefined) {
        lines.push(row('Nuevo saldo pendiente:', formatCurrency(data.nuevoSaldo)));
      }
    }

    lines.push(div);
    lines.push(center('¡GRACIAS POR SU COMPRA!'));
    lines.push(center('Comprobante oficial de entrega'));
    lines.push(center('Conserve este ticket'));
    lines.push(dblDiv);

    return lines.join('\n');
  }

  /**
   * Genera el mensaje formateado con emojis y negritas para WhatsApp
   */
  generateWhatsAppMessage(data: VentaTicketData): string {
    const lines: string[] = [];
    lines.push('🧾 *COMPROBANTE DE VENTA EN RUTA*');
    lines.push('*DISTRIBUIDORA DE ALIMENTOS*');
    lines.push('📍 *León, Guanajuato*');
    lines.push('--------------------------------');
    lines.push(`📄 *Folio:* ${data.folio}`);
    lines.push(`📅 *Fecha:* ${data.fecha}`);
    lines.push(`🏢 *Cliente:* ${data.clienteNombre}`);
    if (data.clientePropietario) lines.push(`👤 *Atención:* ${data.clientePropietario}`);
    if (data.clienteDireccion) lines.push(`📍 *Dirección:* ${data.clienteDireccion}`);
    lines.push(`🚚 *Vendedor:* ${data.vendedorNombre} (${data.rutaNombre || 'Ruta Centro'})`);
    lines.push('--------------------------------');
    lines.push('🛒 *DETALLE DE PRODUCTOS:*');

    data.items.forEach((it, idx) => {
      const isWeight = it.isWeight || it.presentacion === 'kg' || it.cantidad % 1 !== 0;
      const unitLabel = isWeight ? 'kg' : (it.presentacion || 'pza');
      const qtyStr = isWeight ? `${it.cantidad.toFixed(3)} kg` : `${it.cantidad} ${unitLabel}`;
      lines.push(`${idx + 1}. *${it.nombre}*`);
      lines.push(`   ${qtyStr} x ${formatCurrency(it.precioUnitario)} = *${formatCurrency(it.subtotal)}*`);
    });

    lines.push('--------------------------------');
    lines.push(`*SUBTOTAL:* ${formatCurrency(data.subtotal)}`);
    if (data.descuento && data.descuento > 0) {
      lines.push(`*DESCUENTO:* -${formatCurrency(data.descuento)}`);
    }
    lines.push(`💰 *TOTAL:* *${formatCurrency(data.total)}*`);
    lines.push('--------------------------------');
    lines.push('💳 *FORMA DE PAGO:*');
    data.pagos.forEach((p) => {
      lines.push(`• ${p.metodo}: ${formatCurrency(p.monto)}`);
    });

    if (data.pagoCredito && data.pagoCredito > 0) {
      lines.push('--------------------------------');
      lines.push(`*Crédito otorgado hoy:* ${formatCurrency(data.pagoCredito)}`);
      if (data.nuevoSaldo !== undefined) {
        lines.push(`⚠️ *Nuevo saldo pendiente:* *${formatCurrency(data.nuevoSaldo)}*`);
      }
    }

    lines.push('--------------------------------');
    lines.push('✅ _¡Muchas gracias por su preferencia!_');
    lines.push('📌 _Conserve este mensaje como comprobante de entrega en León, Gto._');

    return lines.join('\n');
  }

  /**
   * Comparte el comprobante como IMAGEN en WhatsApp (vía Web Share API en celular o descarga automática)
   */
  async shareTicketWhatsApp(data: VentaTicketData, telefono?: string): Promise<boolean> {
    try {
      const res = await ticketImageService.shareTicketAsImage(data, telefono);
      return res.success;
    } catch {
      return this.shareTicketWhatsAppText(data, telefono);
    }
  }

  /**
   * Abre directamente WhatsApp con el ticket en texto plano como respaldo
   */
  async shareTicketWhatsAppText(data: VentaTicketData, telefono?: string): Promise<boolean> {
    const rawPhone = telefono || data.clienteTelefono || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const message = this.generateWhatsAppMessage(data);
    const encoded = encodeURIComponent(message);

    // Si tiene 10 dígitos (México ej. 4771234567), anteponer 52
    const targetPhone = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone;

    const url = targetPhone
      ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${encoded}`
      : `https://api.whatsapp.com/send?text=${encoded}`;

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(url, '_blank');
        return true;
      } else {
        const canOpen = await Linking.canOpenURL(url);
        if (canOpen) {
          await Linking.openURL(url);
          return true;
        } else {
          await Linking.openURL(`https://wa.me/?text=${encoded}`);
          return true;
        }
      }
    } catch {
      return false;
    }
  }

  /**
   * Genera HTML formal para imprimir o guardar como PDF
   */
  generateVentaPdfHtml(data: VentaTicketData): string {
    const itemsHtml = data.items
      .map(
        (it) => `
        <tr>
          <td style="padding: 8px 4px; border-bottom: 1px solid #e2e8f0; font-weight: 500;">
            ${it.nombre}<br/>
            <small style="color: #64748b;">${it.cantidad % 1 !== 0 ? it.cantidad.toFixed(3) : it.cantidad} ${it.presentacion} x ${formatCurrency(it.precioUnitario)}</small>
          </td>
          <td style="padding: 8px 4px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">
            ${formatCurrency(it.subtotal)}
          </td>
        </tr>`
      )
      .join('');

    const pagosHtml = data.pagos
      .map(
        (p) => `
        <div style="display: flex; justify-content: space-between; font-size: 13px; color: #475569; margin-top: 2px;">
          <span>• ${p.metodo}:</span>
          <span>${formatCurrency(p.monto)}</span>
        </div>`
      )
      .join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Ticket_${data.folio}</title>
        <style>
          @page { size: auto; margin: 5mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #0f172a; margin: 0; padding: 12px; max-width: 420px; margin: auto; background: #fff; }
          .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 12px; margin-bottom: 12px; }
          .title { font-size: 18px; font-weight: 800; color: #1e3a8a; }
          .sub { font-size: 12px; color: #64748b; margin-top: 2px; }
          .meta-row { display: flex; justify-content: space-between; font-size: 12px; color: #334155; margin-bottom: 3px; }
          .client-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin: 10px 0; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px; }
          .totals-row { display: flex; justify-content: space-between; font-size: 14px; margin-top: 4px; }
          .total-big { font-size: 18px; font-weight: 800; color: #1e3a8a; border-top: 2px solid #cbd5e1; padding-top: 6px; margin-top: 6px; }
          .footer { text-align: center; margin-top: 20px; padding-top: 10px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">DISTRIBUIDORA DE ALIMENTOS</div>
          <div class="sub">Venta y Entrega en Ruta · León, Guanajuato</div>
          <div class="sub">RFC: VEM-980112-AB1 · Tel: (477) 713-2450</div>
        </div>

        <div class="meta-row"><span><strong>Folio:</strong></span><span>#${data.folio}</span></div>
        <div class="meta-row"><span><strong>Fecha:</strong></span><span>${data.fecha}</span></div>
        <div class="meta-row"><span><strong>Vendedor:</strong></span><span>${data.vendedorNombre} (${data.rutaNombre || 'Ruta Centro'})</span></div>

        <div class="client-box">
          <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${data.clienteNombre}</div>
          ${data.clientePropietario ? `<div style="color: #475569;">Atn: ${data.clientePropietario}</div>` : ''}
          ${data.clienteDireccion ? `<div style="color: #64748b;">${data.clienteDireccion}</div>` : ''}
        </div>

        <table>
          <thead>
            <tr style="border-bottom: 2px solid #cbd5e1; font-size: 11px; color: #475569; text-transform: uppercase;">
              <th style="text-align: left; padding: 4px;">Concepto</th>
              <th style="text-align: right; padding: 4px;">Importe</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals-row"><span>Subtotal:</span><span>${formatCurrency(data.subtotal)}</span></div>
        ${data.descuento && data.descuento > 0 ? `<div class="totals-row" style="color: #dc2626;"><span>Descuento:</span><span>-${formatCurrency(data.descuento)}</span></div>` : ''}
        <div class="totals-row total-big"><span>Total Venta:</span><span>${formatCurrency(data.total)}</span></div>

        <div style="margin-top: 12px; padding: 8px; background: #f8fafc; border-radius: 6px;">
          <div style="font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 4px;">Forma de Pago:</div>
          ${pagosHtml}
          ${data.pagoCredito && data.pagoCredito > 0 ? `
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #b45309; font-weight: 600;">
              Crédito hoy: ${formatCurrency(data.pagoCredito)} | Nuevo saldo: ${formatCurrency(data.nuevoSaldo || 0)}
            </div>` : ''}
        </div>

        <div class="footer">
          <p>¡Gracias por su compra!<br/>Comprobante oficial de entrega expedido en León, Gto.</p>
        </div>

        <script>
          window.onload = function() {
            window.focus();
            window.print();
          };
        </script>
      </body>
      </html>
    `;
  }

  /**
   * Abre la ventana de impresión para guardar como PDF o imprimir
   */
  openPdfPrintTicket(data: VentaTicketData): boolean {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return false;
    }
    const printWindow = window.open('', '_blank', 'width=450,height=700');
    if (!printWindow) {
      alert('Por favor habilita las ventanas emergentes para ver el comprobante PDF');
      return false;
    }
    printWindow.document.open();
    printWindow.document.write(this.generateVentaPdfHtml(data));
    printWindow.document.close();
    return true;
  }

  /**
   * Genera texto plano para recibo de cobranza (Abono)
   */
  generateCobranzaText(data: CobranzaTicketData, width: 58 | 80 = 58): string {
    const col = width === 58 ? 32 : 44;
    const div = '-'.repeat(col);
    const dblDiv = '='.repeat(col);

    const center = (text: string) => {
      const pad = Math.max(0, Math.floor((col - text.length) / 2));
      return ' '.repeat(pad) + text;
    };

    const row = (left: string, right: string) => {
      const space = Math.max(1, col - left.length - right.length);
      return left + ' '.repeat(space) + right;
    };

    const lines: string[] = [];
    lines.push(dblDiv);
    lines.push(center('RECIBO DE COBRANZA'));
    lines.push(center('DISTRIBUIDORA MIGUEL'));
    lines.push(div);
    lines.push(row('Recibo:', data.folio));
    lines.push(row('Fecha:', data.fecha));
    lines.push(row('Cobrador:', data.vendedorNombre));
    lines.push(div);
    lines.push(`CLIENTE: ${data.clienteNombre}`);
    if (data.clientePropietario) lines.push(`Propietario: ${data.clientePropietario}`);
    lines.push(div);

    lines.push(row('Saldo Anterior:', formatCurrency(data.saldoAnterior)));
    lines.push(row('ABONO RECIBIDO:', formatCurrency(data.montoAbonado)));
    lines.push(row('Método de pago:', data.metodoPago));
    lines.push(dblDiv);
    lines.push(row('NUEVO SALDO RESTANTE:', formatCurrency(data.nuevoSaldo)));
    lines.push(div);

    lines.push('');
    lines.push(center('__________________________'));
    lines.push(center('Firma de Conformidad'));
    lines.push(center('Cliente / Encargado'));
    lines.push('');
    lines.push(center('¡Gracias por su puntual pago!'));
    lines.push(dblDiv);

    return lines.join('\n');
  }

  /**
   * Genera texto plano para el ticket de cierre / arqueo de jornada
   */
  generateCorteText(data: CorteTicketData, width: 58 | 80 = 58): string {
    const col = width === 58 ? 32 : 44;
    const div = '-'.repeat(col);
    const dblDiv = '='.repeat(col);

    const center = (text: string) => {
      const pad = Math.max(0, Math.floor((col - text.length) / 2));
      return ' '.repeat(pad) + text;
    };

    const row = (left: string, right: string) => {
      const space = Math.max(1, col - left.length - right.length);
      return left + ' '.repeat(space) + right;
    };

    const lines: string[] = [];
    lines.push(dblDiv);
    lines.push(center('ARQUEO Y CORTE DE CAJA'));
    lines.push(center('DISTRIBUIDORA MIGUEL'));
    lines.push(div);
    lines.push(row('Fecha:', data.fecha));
    lines.push(row('Vendedor:', data.vendedorNombre));
    lines.push(row('Ruta:', data.rutaNombre));
    lines.push(div);

    lines.push(row('VENTAS TOTALES:', formatCurrency(data.ventasTotales)));
    lines.push(row('  • En Efectivo:', formatCurrency(data.efectivo)));
    lines.push(row('  • Transferencias:', formatCurrency(data.transferencias)));
    lines.push(row('  • Tarjetas:', formatCurrency(data.tarjetas)));
    lines.push(row('  • A Crédito:', formatCurrency(data.credito)));
    lines.push(div);

    lines.push(row('+ Cobranza / Abonos:', formatCurrency(data.abonosCobranza)));
    lines.push(row('- Gastos en Ruta:', `-${formatCurrency(data.gastos)}`));
    lines.push(dblDiv);

    lines.push(row('EFECTIVO ESPERADO:', formatCurrency(data.efectivoEsperado)));
    lines.push(row('EFECTIVO FÍSICO:', formatCurrency(data.efectivoContado)));
    lines.push(row('DIFERENCIA CAJA:', formatCurrency(data.diferenciaCaja)));
    lines.push(div);

    if (data.piezasVendidas !== undefined) {
      lines.push(row('Piezas Vendidas:', `${data.piezasVendidas} pzas`));
    }
    if (data.inventarioActualPiezas !== undefined) {
      lines.push(row('Remanente Camioneta:', `${data.inventarioActualPiezas} pzas`));
    }

    lines.push('');
    lines.push(row('________________', '________________'));
    lines.push(row('  Firma Chofer  ', ' Firma Auditor  '));
    lines.push(dblDiv);

    return lines.join('\n');
  }

  /**
   * Genera texto plano para el reporte ejecutivo
   */
  generateReporteText(data: ReporteTicketData, width: 58 | 80 = 58): string {
    const col = width === 58 ? 32 : 44;
    const div = '-'.repeat(col);
    const dblDiv = '='.repeat(col);

    const center = (text: string) => {
      const pad = Math.max(0, Math.floor((col - text.length) / 2));
      return ' '.repeat(pad) + text;
    };

    const row = (left: string, right: string) => {
      const space = Math.max(1, col - left.length - right.length);
      return left + ' '.repeat(space) + right;
    };

    const lines: string[] = [];
    lines.push(dblDiv);
    lines.push(center('REPORTE EJECUTIVO'));
    lines.push(center(`PERIODO: ${data.periodo.toUpperCase()}`));
    lines.push(center('DISTRIBUIDORA MIGUEL'));
    lines.push(div);

    lines.push(row('Ventas Totales:', formatCurrency(data.ventasTotales)));
    lines.push(row('Cobranza Total:', formatCurrency(data.cobranzaTotal)));
    lines.push(row('Crédito Colocado:', formatCurrency(data.creditoColocado)));
    lines.push(row('Gastos en Ruta:', formatCurrency(data.gastosTotal)));
    lines.push(row('Utilidad Estimada:', formatCurrency(data.utilidadEstimada)));
    lines.push(row('Ticket Promedio:', formatCurrency(data.ticketPromedio)));
    lines.push(row('Pedidos Cerrados:', `${data.pedidosTotal}`));
    lines.push(row('Clientes Atendidos:', `${data.clientesVisitados}`));
    lines.push(div);

    lines.push(center('TOP PRODUCTOS VENDIDOS'));
    data.topProductos.forEach((p, idx) => {
      lines.push(`${idx + 1}. ${p.nombre.slice(0, col - 12)}`);
      lines.push(row(`   ${p.cantidad} piezas`, formatCurrency(p.total)));
    });

    lines.push(div);
    lines.push(center('MÉTODOS DE PAGO'));
    lines.push(row('Efectivo:', formatCurrency(data.metodosPago.efectivo)));
    lines.push(row('Transferencia:', formatCurrency(data.metodosPago.transferencia)));
    lines.push(row('Tarjeta:', formatCurrency(data.metodosPago.tarjeta)));
    lines.push(row('Crédito:', formatCurrency(data.metodosPago.credito)));
    lines.push(dblDiv);
    lines.push(center('Generado desde App Ruta Ventas'));

    return lines.join('\n');
  }

  /**
   * Invoca la impresión en navegador web con soporte nativo para ancho térmico de 58mm / 80mm
   */
  printTicketWeb(ticketText: string, title: string = 'Ticket Térmico', width: 58 | 80 = 58): boolean {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return false;
    }

    const printWindow = window.open('', '_blank', `width=${width === 58 ? 320 : 420},height=600`);
    if (!printWindow) {
      alert('Por favor permite ventanas emergentes para imprimir tickets');
      return false;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>${title}</title>
        <style>
          @page {
            size: ${width}mm auto;
            margin: 0mm;
          }
          @media print {
            body {
              margin: 0;
              padding: 4mm;
            }
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: ${width === 58 ? '11px' : '13px'};
            line-height: 1.25;
            color: #000;
            background: #fff;
            margin: 0 auto;
            padding: 8px;
            width: ${width}mm;
            max-width: 100%;
            white-space: pre;
            word-break: break-word;
          }
        </style>
      </head>
      <body>${this.escapeHtml(ticketText)}</body>
      <script>
        window.onload = function() {
          window.focus();
          window.print();
          setTimeout(function() { window.close(); }, 1000);
        };
      </script>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    return true;
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

export const ticketPrinter = new TicketPrinterService();
