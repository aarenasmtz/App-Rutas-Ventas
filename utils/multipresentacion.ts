import type { Producto, PresentacionConfig, Cliente } from '@/types';

export interface DesglosePresentacionItem {
  nombre: string;
  tipo: string;
  cantidad: number;
  factor: number;
}

/**
 * Desglosa el inventario total en unidades base en su jerarquía de presentaciones
 * Ejemplo: 217 paquetes de Castel -> 3 cajas + 3 exhibidores + 7 paquetes
 */
export function desglosarInventario(
  existencia: number,
  presentaciones?: PresentacionConfig[],
  unidadBase: string = 'pieza'
): string {
  if (!presentaciones || presentaciones.length === 0) {
    return `${existencia} ${unidadBase}${existencia === 1 ? '' : 's'}`;
  }

  const parts = desglosarInventarioParts(existencia, presentaciones, unidadBase);
  if (parts.length === 0) {
    return `0 ${unidadBase}s`;
  }

  return parts
    .map((p) => {
      const plural = p.cantidad === 1 ? '' : (p.nombre.endsWith('r') || p.nombre.endsWith('l') ? 'es' : 's');
      return `${p.cantidad} ${p.nombre.toLowerCase()}${plural}`;
    })
    .join(' + ');
}

/**
 * Retorna las partes estructuradas del desglose de inventario para chips/badges UI
 */
export function desglosarInventarioParts(
  existencia: number,
  presentaciones?: PresentacionConfig[],
  unidadBase: string = 'pieza'
): DesglosePresentacionItem[] {
  if (!presentaciones || presentaciones.length === 0 || existencia <= 0) {
    return existencia > 0
      ? [{ nombre: unidadBase, tipo: 'base', cantidad: existencia, factor: 1 }]
      : [];
  }

  // Filtrar activas y ordenar de mayor factor a menor
  const presOrdenadas = [...presentaciones]
    .filter((p) => p.activa !== false && p.piezasEquivalentes > 0)
    .sort((a, b) => b.piezasEquivalentes - a.piezasEquivalentes);

  if (presOrdenadas.length === 0) {
    return [{ nombre: unidadBase, tipo: 'base', cantidad: existencia, factor: 1 }];
  }

  const items: DesglosePresentacionItem[] = [];
  let resto = Math.max(0, existencia);

  for (let i = 0; i < presOrdenadas.length; i++) {
    const p = presOrdenadas[i];
    const factor = p.piezasEquivalentes;
    const esUltima = i === presOrdenadas.length - 1;

    if (factor > 1) {
      const cantidad = Math.floor(resto / factor);
      if (cantidad > 0) {
        items.push({
          nombre: p.nombre,
          tipo: p.tipo,
          cantidad,
          factor,
        });
        resto = resto % factor;
      }
    } else {
      // Factor 1 (unidad base)
      if (resto > 0 || items.length === 0) {
        items.push({
          nombre: p.nombre || unidadBase,
          tipo: p.tipo,
          cantidad: resto,
          factor: 1,
        });
        resto = 0;
      }
    }

    if (esUltima && resto > 0) {
      items.push({
        nombre: unidadBase,
        tipo: 'base',
        cantidad: resto,
        factor: 1,
      });
      resto = 0;
    }
  }

  return items;
}

/**
 * Resuelve el precio de venta de una presentación respetando la prioridad de precios especiales por cliente
 * Prioridad:
 * 1. Precio especial del cliente para esa presentación específica (ej: "p1:caja" o "p1_caja")
 * 2. Si no es multipresentación, precio especial general del producto
 * 3. Precio de la presentación configurado en catálogo
 * Regla de negocio: No convertir automáticamente un precio especial por paquete a caja salvo configurado
 */
export function getPrecioPresentacion(
  producto: Producto,
  presentacion: PresentacionConfig,
  cliente?: Cliente | null
): number {
  if (cliente?.precioEspecial) {
    // Clave específica producto:presentacionTipo
    const keyColon = `${producto.id}:${presentacion.tipo}`;
    if (cliente.precioEspecial[keyColon] !== undefined) {
      return cliente.precioEspecial[keyColon];
    }

    const keyUnder = `${producto.id}_${presentacion.tipo}`;
    if (cliente.precioEspecial[keyUnder] !== undefined) {
      return cliente.precioEspecial[keyUnder];
    }

    const keyDash = `${producto.id}-${presentacion.tipo}`;
    if (cliente.precioEspecial[keyDash] !== undefined) {
      return cliente.precioEspecial[keyDash];
    }

    // Si el producto no maneja multipresentación o la presentación es la unidad base
    if (!producto.manejaMultiplesPresentaciones && cliente.precioEspecial[producto.id] !== undefined) {
      return cliente.precioEspecial[producto.id];
    }
  }

  return presentacion.precio > 0 ? presentacion.precio : producto.precioBase;
}

/**
 * Calcula las unidades base totales a descontar de inventario
 */
export function calcularUnidadesBase(cantidad: number, presentacion?: PresentacionConfig | null): number {
  const factor = presentacion?.piezasEquivalentes || 1;
  return Math.round(cantidad * factor);
}
