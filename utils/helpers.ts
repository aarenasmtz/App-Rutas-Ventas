export function formatCurrency(n: number): string {
  return '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function formatCantidad(n: number, unidad: string): string {
  if (unidad === 'kg') {
    return n.toFixed(3) + ' kg';
  }
  return n.toString() + ' ' + unidad;
}

export function getEstadoColor(estado: string): 'verde' | 'amber' | 'rojo' | 'azul' | 'neutral' {
  switch (estado) {
    case 'Pagado':
    case 'Visitado':
    case 'Venta realizada':
    case 'Cerrado':
    case 'Sincronizado':
    case 'Al corriente':
    case 'Normal':
    case 'Resuelto':
    case 'Activo':
      return 'verde';
    case 'Crédito':
    case 'Pendiente':
    case 'Sin compra':
    case 'Bajo':
    case 'Pendiente de sincronizar':
      return 'amber';
    case 'Vencido':
    case 'Agotado':
    case 'Error':
    case 'Diferencia':
      return 'rojo';
    default:
      return 'neutral';
  }
}

export function getStockEstado(existencia: number, esPeso: boolean): 'Normal' | 'Bajo' | 'Agotado' {
  if (existencia <= 0) return 'Agotado';
  const threshold = esPeso ? 3 : 10;
  if (existencia <= threshold) return 'Bajo';
  return 'Normal';
}

export function todayDia(): 'Lun' | 'Mar' | 'Mié' | 'Jue' | 'Vie' | 'Sáb' | 'Dom' {
  const days: Array<'Lun' | 'Mar' | 'Mié' | 'Jue' | 'Vie' | 'Sáb' | 'Dom'> = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const today = new Date();
  return days[today.getDay()];
}
