import { Platform } from 'react-native';
import { formatCurrency } from '@/utils/helpers';
import type { VentaTicketData } from '@/services/ticketPrinterService';

export class TicketImageService {
  /**
   * Genera un elemento HTMLCanvasElement con el diseño gráfico del ticket en alta resolución
   */
  generateCanvas(data: VentaTicketData): HTMLCanvasElement | null {
    if (typeof document === 'undefined') return null;

    const scale = 2; // Factor Retina 2x para nitidez máxima en pantallas móviles
    const logicalWidth = 460;

    // Calcular altura dinámica según cantidad de items y secciones
    const baseHeight = 580;
    const itemHeight = 44;
    const itemsExtraHeight = data.items.length * itemHeight;
    const pagosExtraHeight = (data.pagos.length + (data.pagoCredito ? 1 : 0)) * 24;
    const logicalHeight = baseHeight + itemsExtraHeight + pagosExtraHeight;

    const canvas = document.createElement('canvas');
    canvas.width = logicalWidth * scale;
    canvas.height = logicalHeight * scale;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.scale(scale, scale);

    // 1. Fondo blanco de recibo térmico con esquinas redondeadas
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    // Borde exterior suave
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, logicalWidth, logicalHeight);

    // Franja azul superior de marca
    ctx.fillStyle = '#1E40AF';
    ctx.fillRect(0, 0, logicalWidth, 8);

    let y = 30;

    // 2. ENCABEZADO
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DISTRIBUIDORA DE ALIMENTOS', logicalWidth / 2, y);

    y += 20;
    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#3B82F6';
    ctx.fillText('VENTA Y REPARTO EN RUTA · LEÓN, GTO.', logicalWidth / 2, y);

    y += 18;
    ctx.font = '400 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText('RFC: VEM-980112-AB1  ·  Tel: (477) 713-2450', logicalWidth / 2, y);

    // Separador punteado
    y += 16;
    this.drawDashedLine(ctx, 20, y, logicalWidth - 20, y);

    // 3. METADATOS (FOLIO, FECHA, VENDEDOR)
    y += 22;
    ctx.textAlign = 'left';

    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.fillText(`Folio: #${data.folio}`, 24, y);

    ctx.textAlign = 'right';
    ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(data.fecha, logicalWidth - 24, y);

    y += 18;
    ctx.textAlign = 'left';
    ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText(`Vendedor: ${data.vendedorNombre} (${data.rutaNombre || 'Ruta Centro'})`, 24, y);

    // 4. TARJETA DE CLIENTE
    y += 16;
    const clientBoxY = y;
    const clientBoxH = data.clienteDireccion ? 76 : 58;

    ctx.fillStyle = '#F8FAFC';
    this.roundRect(ctx, 20, clientBoxY, logicalWidth - 40, clientBoxH, 8, true, true);

    ctx.textAlign = 'left';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.fillText(`🏪 ${data.clienteNombre}`, 32, clientBoxY + 24);

    ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#475569';
    const atnText = data.clientePropietario ? `Atn: ${data.clientePropietario}` : '';
    ctx.fillText(atnText, 32, clientBoxY + 42);

    if (data.clienteDireccion) {
      ctx.font = '400 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#64748B';
      const truncatedDir = data.clienteDireccion.length > 55 ? data.clienteDireccion.substring(0, 52) + '...' : data.clienteDireccion;
      ctx.fillText(truncatedDir, 32, clientBoxY + 60);
    }

    y = clientBoxY + clientBoxH + 18;

    // 5. CABECERA DE PRODUCTOS
    this.drawDashedLine(ctx, 20, y, logicalWidth - 20, y);
    y += 18;

    ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.textAlign = 'left';
    ctx.fillText('PRODUCTO / CANTIDAD', 24, y);

    ctx.textAlign = 'right';
    ctx.fillText('IMPORTE', logicalWidth - 24, y);

    y += 10;
    this.drawDashedLine(ctx, 20, y, logicalWidth - 20, y);
    y += 16;

    // 6. LISTADO DE PRODUCTOS
    data.items.forEach((it, index) => {
      // Línea de nombre del producto
      ctx.textAlign = 'left';
      ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#0F172A';
      const itemTitle = `${index + 1}. ${it.nombre}`;
      const safeTitle = itemTitle.length > 38 ? itemTitle.substring(0, 36) + '...' : itemTitle;
      ctx.fillText(safeTitle, 24, y);

      // Importe del producto
      ctx.textAlign = 'right';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.fillText(formatCurrency(it.subtotal), logicalWidth - 24, y);

      y += 16;

      // Línea de detalle: "0.500 kg x $185.00/kg" o "3 pza x $24.00"
      ctx.textAlign = 'left';
      ctx.font = '400 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#64748B';

      const isKilo = it.presentacion === 'kg' || it.cantidad % 1 !== 0;
      const unitLabel = isKilo ? 'kg' : (it.presentacion || 'pza');
      const qtyFormatted = isKilo ? `${it.cantidad.toFixed(3)} ${unitLabel}` : `${it.cantidad} ${unitLabel}`;
      ctx.fillText(`   ${qtyFormatted} × ${formatCurrency(it.precioUnitario)}`, 24, y);

      y += 20;
    });

    // Separador antes de totales
    this.drawDashedLine(ctx, 20, y, logicalWidth - 20, y);
    y += 20;

    // 7. TOTALES FINANCIEROS
    ctx.textAlign = 'left';
    ctx.font = '500 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#475569';
    ctx.fillText('Subtotal:', 24, y);

    ctx.textAlign = 'right';
    ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#0F172A';
    ctx.fillText(formatCurrency(data.subtotal), logicalWidth - 24, y);

    if (data.descuento && data.descuento > 0) {
      y += 18;
      ctx.textAlign = 'left';
      ctx.fillStyle = '#DC2626';
      ctx.fillText('Descuento:', 24, y);
      ctx.textAlign = 'right';
      ctx.fillText(`-${formatCurrency(data.descuento)}`, logicalWidth - 24, y);
    }

    // Cuadro destacado de TOTAL
    y += 14;
    const totalBoxY = y;
    ctx.fillStyle = '#EFF6FF';
    this.roundRect(ctx, 20, totalBoxY, logicalWidth - 40, 48, 8, true, true, '#BFDBFE');

    ctx.textAlign = 'left';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#1E3A8A';
    ctx.fillText('TOTAL A PAGAR:', 36, totalBoxY + 30);

    ctx.textAlign = 'right';
    ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#1D4ED8';
    ctx.fillText(formatCurrency(data.total), logicalWidth - 36, totalBoxY + 31);

    y = totalBoxY + 62;

    // 8. FORMA DE PAGO Y CRÉDITO
    ctx.textAlign = 'left';
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText('💳 FORMAS DE PAGO RECIBIDAS:', 24, y);

    y += 16;
    data.pagos.forEach((p) => {
      ctx.font = '500 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#475569';
      ctx.textAlign = 'left';
      ctx.fillText(`  • ${p.metodo}:`, 28, y);

      ctx.textAlign = 'right';
      ctx.font = '600 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#0F172A';
      ctx.fillText(formatCurrency(p.monto), logicalWidth - 28, y);
      y += 16;
    });

    if (data.pagoCredito && data.pagoCredito > 0) {
      y += 4;
      ctx.fillStyle = '#FEF3C7';
      this.roundRect(ctx, 20, y, logicalWidth - 40, 32, 6, true, false);

      ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#92400E';
      ctx.textAlign = 'left';
      ctx.fillText(`  Crédito otorgado: ${formatCurrency(data.pagoCredito)}`, 28, y + 20);

      if (data.nuevoSaldo !== undefined) {
        ctx.textAlign = 'right';
        ctx.fillText(`Nuevo saldo: ${formatCurrency(data.nuevoSaldo)}  `, logicalWidth - 28, y + 20);
      }
      y += 42;
    } else {
      y += 12;
    }

    // 9. PIE DE TICKET Y AGRADECIMIENTO
    this.drawDashedLine(ctx, 20, y, logicalWidth - 20, y);
    y += 24;

    ctx.textAlign = 'center';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#15803D';
    ctx.fillText('¡Muchas gracias por su preferencia!', logicalWidth / 2, y);

    y += 18;
    ctx.font = '400 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#64748B';
    ctx.fillText('Comprobante oficial de entrega expedido en ruta.', logicalWidth / 2, y);

    y += 14;
    ctx.font = 'italic 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.fillText('León, Guanajuato · México', logicalWidth / 2, y);

    return canvas;
  }

  /**
   * Genera el DataURL (PNG base64) del ticket para mostrarlo inmediatamente en <Image /> o modal
   */
  generateDataUrl(data: VentaTicketData): string | null {
    const canvas = this.generateCanvas(data);
    if (!canvas) return null;
    return canvas.toDataURL('image/png');
  }

  /**
   * Genera un Blob de imagen PNG del ticket
   */
  async generateBlob(data: VentaTicketData): Promise<Blob | null> {
    const canvas = this.generateCanvas(data);
    if (!canvas) return null;
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  }

  /**
   * Descarga la imagen PNG directamente al dispositivo (galería / descargas)
   */
  async downloadImage(data: VentaTicketData): Promise<boolean> {
    const dataUrl = this.generateDataUrl(data);
    if (!dataUrl || typeof document === 'undefined') return false;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `Ticket_${data.folio}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  }

  /**
   * Copia la imagen del ticket al portapapeles para pegar en WhatsApp Web o chat
   */
  async copyImageToClipboard(data: VentaTicketData): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.clipboard || typeof ClipboardItem === 'undefined') {
      return false;
    }
    try {
      const blob = await this.generateBlob(data);
      if (!blob) return false;
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Comparte el ticket directamente como ARCHIVO DE IMAGEN (.PNG)
   * En celulares Android / iOS abre WhatsApp con la IMAGEN adjunta.
   * Si el navegador no soporta Web Share con archivos, descarga la imagen y abre WhatsApp.
   */
  async shareTicketAsImage(
    data: VentaTicketData,
    telefono?: string
  ): Promise<{ success: boolean; method: 'web-share' | 'download-and-whatsapp' | 'download-only'; message?: string }> {
    const blob = await this.generateBlob(data);
    if (!blob) {
      return { success: false, method: 'download-only', message: 'No se pudo generar la imagen' };
    }

    const fileName = `Ticket_${data.folio}.png`;
    const imageFile = new File([blob], fileName, { type: 'image/png' });

    // 1. Probar Web Share API con archivos (Soportado en navegadores móviles Android Chrome y iOS Safari)
    if (
      typeof navigator !== 'undefined' &&
      navigator.share &&
      navigator.canShare &&
      navigator.canShare({ files: [imageFile] })
    ) {
      try {
        await navigator.share({
          files: [imageFile],
          title: `Ticket ${data.folio} - ${data.clienteNombre}`,
          text: `Comprobante de Entrega #${data.folio} (${formatCurrency(data.total)})`,
        });
        return { success: true, method: 'web-share' };
      } catch (err: any) {
        // Si el usuario canceló el share dialog, no consideramos error fatal
        if (err?.name === 'AbortError') {
          return { success: true, method: 'web-share' };
        }
      }
    }

    // 2. Fallback: Descargar automáticamente la imagen PNG a la galería/descargas
    await this.downloadImage(data);

    // Y abrir el chat de WhatsApp del cliente indicando que la imagen está lista
    const rawPhone = telefono || data.clienteTelefono || '';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const targetPhone = cleanPhone.length === 10 ? `52${cleanPhone}` : cleanPhone;
    const textMsg = encodeURIComponent(
      `🧾 *Comprobante de Venta #${data.folio}*\nTotal: *${formatCurrency(data.total)}*\nSe ha generado y descargado la imagen del ticket en su dispositivo para enviarla.`
    );

    const waUrl = targetPhone
      ? `https://api.whatsapp.com/send?phone=${targetPhone}&text=${textMsg}`
      : `https://api.whatsapp.com/send?text=${textMsg}`;

    if (typeof window !== 'undefined') {
      window.open(waUrl, '_blank');
    }

    return {
      success: true,
      method: 'download-and-whatsapp',
      message: 'Imagen descargada. Se abrió WhatsApp para adjuntarla.',
    };
  }

  // Métodos auxiliares de dibujo en Canvas
  private drawDashedLine(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) {
    ctx.save();
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  private roundRect(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill = true,
    stroke = false,
    strokeColor = '#E2E8F0'
  ) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }
}

export const ticketImageService = new TicketImageService();
