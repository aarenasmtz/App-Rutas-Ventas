import type {
  Producto, Cliente, Empleado, BitacoraEntry, BitacoraError, Gasto,
  MovimientoSincronizacion, Devolucion, ItemCarrito, MetodoPago, Pago,
  HistorialVenta, DiaVisita, Categoria, Unidad,
} from '@/types';

// Initial data moved here as initial state factories
export const initialProductos: Producto[] = [];

export const initialClientes: Cliente[] = [];

export const initialRutas: string[] = ['Ruta Centro', 'Ruta Norte', 'Ruta Sur'];

export const initialEmpleados: Empleado[] = [
  { id: 'e1', nombre: 'Miguel', rol: 'Administrador', ruta: 'Ruta Centro', estado: 'Activo', ventasHoy: 4250 },
  { id: 'e2', nombre: 'Juan', rol: 'Vendedor', ruta: 'Ruta Norte', estado: 'Activo', ventasHoy: 2800 },
  { id: 'e3', nombre: 'Pedro', rol: 'Vendedor', ruta: 'Ruta Sur', estado: 'Activo', ventasHoy: 1950 },
];

export const initialBitacora: BitacoraEntry[] = [];

export const initialBitacoraErrores: BitacoraError[] = [];

export const initialGastos: Gasto[] = [];

export const initialMovimientosSync: MovimientoSincronizacion[] = [];

export const initialDevoluciones: Devolucion[] = [];

export const categorias: Categoria[] = ['Jamón', 'Salchicha', 'Chorizo', 'Quesos', 'Carnes frías', 'Abarrotes'];
export const categoriasConTodas: string[] = ['Todas', ...categorias];

export const diasSemana: DiaVisita[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const initialCargaInicial: any[] = [];

export const totalCargaInicial = initialCargaInicial.reduce((s, c) => s + c.importe, 0);

// Export aliases for backwards compatibility
export const empleados = initialEmpleados;
export const bitacora = initialBitacora;
export const cargaInicial = initialCargaInicial;
