import type { ItemCarrito } from '@/types';

/** Commercial quantities, never add kilograms to pieces or convert prices. */
export function resumenCantidades(items: ItemCarrito[]): string {
  const groups = new Map<string, number>();
  for (const item of items) {
    const unit = item.presentacion?.nombre || item.presentacionNombre || item.unidad || item.producto.unidad || 'pieza';
    const weight = item.producto.unidad === 'kg' && (!item.presentacion || item.presentacion.piezasEquivalentes === 1);
    const label = weight ? 'kg' : unit.toLocaleLowerCase('es-MX');
    groups.set(label, (groups.get(label) || 0) + item.cantidad);
  }
  const plurals: Record<string, string> = { pieza: 'piezas', paquete: 'paquetes', caja: 'cajas', exhibidor: 'exhibidores', unidad: 'unidades' };
  return [...groups].map(([unit, quantity]) => `${unit === 'kg' ? quantity.toFixed(3) : Number(quantity.toFixed(3))} ${quantity !== 1 ? plurals[unit] || unit : unit}`).join(' · ') || 'Sin productos';
}
