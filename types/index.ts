export type Unidad = 'kg' | 'pieza' | 'paquete';

export type Categoria =
  | 'Jamón'
  | 'Salchicha'
  | 'Chorizo'
  | 'Quesos'
  | 'Carnes frías'
  | 'Abarrotes';

export interface Producto {
  id: string;
  nombre: string;
  categoria: Categoria;
  unidad: Unidad;
  precioBase: number;
  existencia: number;
  precioPorPeso: boolean;
  ultimaCategoria?: string;
}

export type DiaVisita = 'Lun' | 'Mar' | 'Mié' | 'Jue' | 'Vie' | 'Sáb' | 'Dom';

export type EstadoCliente =
  | 'Pendiente'
  | 'Visitado'
  | 'Venta realizada'
  | 'Sin compra'
  | 'Cerrado';

export interface Cliente {
  id: string;
  nombre: string;
  propietario: string;
  direccion: string;
  ruta: string;
  diasVisita: DiaVisita[];
  saldo: number;
  limiteCredito: number;
  estado: EstadoCliente;
  ultimaVisita: string;
  precioEspecial?: { [productoId: string]: number };
  historial: HistorialVenta[];
  sugerido: { productoId: string; cantidad: number; frecuencia: string }[];
}

export interface HistorialVenta {
  id: string;
  fecha: string;
  total: number;
  items: { productoNombre: string; cantidad: number; unidad: Unidad }[];
  estado: 'Pagado' | 'Crédito' | 'Vencido';
}

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
  precioLista: number;
  descuento: number;
  precioFinal: number;
  subtotal: number;
}

export type MetodoPago = 'Efectivo' | 'Transferencia' | 'Crédito';

export interface Pago {
  metodo: MetodoPago;
  monto: number;
}

export interface MovimientoSincronizacion {
  id: string;
  tipo: string;
  cliente: string;
  fecha: string;
  estado: 'Sincronizado' | 'Pendiente' | 'Error';
}

export interface Empleado {
  id: string;
  nombre: string;
  rol: string;
  ruta: string;
  estado: 'Activo' | 'Inactivo';
  ventasHoy: number;
}

export interface BitacoraEntry {
  id: string;
  fecha: string;
  usuario: string;
  modulo: string;
  accion: string;
}

export interface BitacoraError {
  id: string;
  fecha: string;
  usuario: string;
  dispositivo: string;
  error: string;
  estado: 'Resuelto' | 'Pendiente' | 'Ignorado';
}

export interface Gasto {
  id: string;
  concepto: 'Gasolina' | 'Comida' | 'Estacionamiento' | 'Mantenimiento' | 'Otro';
  importe: number;
  metodo: MetodoPago;
  observaciones: string;
  fecha: string;
}

export type EstadoStock = 'Normal' | 'Bajo' | 'Agotado';

export interface Devolucion {
  id: string;
  cliente: string;
  producto: string;
  cantidad: number;
  unidad: Unidad;
  motivo: 'Producto dañado' | 'Caducidad' | 'Cambio' | 'Pedido incorrecto' | 'Otro';
  destino: 'Inventario' | 'Merma' | 'Cambio';
  fecha: string;
}
