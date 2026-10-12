export type Unidad = 'kg' | 'pieza' | 'paquete';

export type Categoria =
  | 'Jamón'
  | 'Salchicha'
  | 'Chorizo'
  | 'Quesos'
  | 'Carnes frías'
  | 'Abarrotes'
  | 'Mantequillas'
  | 'Mayonesas'
  | 'Enlatados'
  | 'Otros';

export type PresentacionTipo = 'pieza' | 'paquete' | 'caja' | 'exhibidor';

export interface PresentacionConfig {
  tipo: PresentacionTipo;
  nombre: string;
  piezasEquivalentes: number;
  precio: number;
  descripcionEquivalencia?: string;
  codigoBarras?: string;
  activa?: boolean;
  orden?: number;
}

export interface Producto {
  id: string;
  nombre: string;
  nombreAlmacen?: string;
  marca?: string;
  categoria: Categoria;
  unidad: Unidad;
  precioBase: number;
  precioCompra?: number;
  existencia: number; // Siempre expresado en piezas totales en inventario
  precioPorPeso: boolean;
  ultimaCategoria?: string;
  sku?: string;
  codigoBarras?: string;
  favorito?: boolean;
  activo?: boolean;
  manejaMultiplesPresentaciones?: boolean;
  imagen?: string;
  presentaciones?: PresentacionConfig[];
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
  telefono?: string;
  distanciaMock?: string;
  ultimaCompra?: string;
  ultimoPago?: string;
  latitud?: number;
  longitud?: number;
  ciudad?: string;
  colonia?: string;
  activo?: boolean;
  precioEspecial?: { [productoId: string]: number };
  historial: HistorialVenta[];
  sugerido: { productoId: string; cantidad: number; frecuencia: string }[];
}

export interface CategoriaItem {
  id: string;
  nombre: string;
  icono: string;
  descripcion?: string;
  activa?: boolean;
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
  unidad?: string;
  presentacion?: PresentacionConfig;
  presentacionNombre?: string;
  factorConversion?: number;
  piezasTotales?: number;
  precioLista: number;
  descuento: number;
  precioFinal: number;
  subtotal: number;
}

export type MetodoPago = 'Efectivo' | 'Transferencia' | 'Tarjeta' | 'Crédito';

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

export interface PermisosEmpleado {
  puedeVender: boolean;
  puedeVerClientes: boolean;
  puedeCrearClientes: boolean;
  puedeVerProductos: boolean;
  soloLecturaInventario: boolean;
  puedeCobrar: boolean;
}

export interface Empleado {
  id: string;
  nombre: string;
  usuario?: string;
  rol: string;
  ruta: string;
  telefono?: string;
  pin?: string;
  estado: 'Activo' | 'Inactivo';
  ventasHoy: number;
  cobranzaHoy?: number;
  clientesVisitados?: number;
  permisos?: PermisosEmpleado;
}

export interface ItemNotaPdf {
  productoAlmacen: string;
  um: string;
  cantidadNota: number;
  equivalencias: string;
  productoId?: number;
  productoNombreApp?: string;
  piezasCalculadas: number;
  recordarVinculacion?: boolean;
}

export interface SurtidoNotaPdfRequest {
  folioNota?: string;
  fechaNota?: string;
  observaciones?: string;
  items: ItemNotaPdf[];
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

export interface RevisionItem {
  productoId: string;
  productoNombre: string;
  marca?: string;
  sistema: number;
  fisico: number;
  unidad: string;
  diferencia: number;
  revisado: boolean;
  comentario: string;
}

export interface CorteTrabajador {
  empleadoId: string;
  nombre: string;
  ruta: string;
  ventasTotales: number;
  efectivo: number;
  transferencias: number;
  tarjetas: number;
  credito: number;
  abonosCobranza: number;
  gastos: number;
  devoluciones: number;
  efectivoEsperado: number;
  inventarioInicialPiezas: number;
  inventarioActualPiezas: number;
  piezasVendidas: number;
  diferenciaCaja: number;
}
