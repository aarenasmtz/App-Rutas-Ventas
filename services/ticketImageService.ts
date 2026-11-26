import { receiptCanvas, saleReceipt } from '@/utils/receiptDocument';
import { Platform } from 'react-native';
import { formatCurrency } from '@/utils/helpers';
import type { VentaTicketData } from '@/services/ticketPrinterService';

export class TicketImageService {
  /**
   * Genera un elemento HTMLCanvasElement con el diseño gráfico del ticket en alta resolución
   */
  generateCanvas(data: VentaTicketData): HTMLCanvasElement | null {
    return receiptCanvas(saleReceipt(data));
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
