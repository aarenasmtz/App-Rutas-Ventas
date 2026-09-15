import type { Producto, Cliente, Empleado, BitacoraEntry, BitacoraError, Gasto, MovimientoSincronizacion, Devolucion } from '@/types';

export const productos: Producto[] = [
  { id: 'p1', nombre: 'Jamón Virginia', categoria: 'Jamón', unidad: 'kg', precioBase: 185, existencia: 12.5, precioPorPeso: true },
  { id: 'p2', nombre: 'Salchicha de Pavo', categoria: 'Salchicha', unidad: 'kg', precioBase: 145, existencia: 8.0, precioPorPeso: true },
  { id: 'p3', nombre: 'Chorizo Rojo', categoria: 'Chorizo', unidad: 'kg', precioBase: 210, existencia: 6.0, precioPorPeso: true },
  { id: 'p4', nombre: 'Queso Oaxaca', categoria: 'Quesos', unidad: 'kg', precioBase: 195, existencia: 4.5, precioPorPeso: true },
  { id: 'p5', nombre: 'Queso Chihuahua', categoria: 'Quesos', unidad: 'kg', precioBase: 175, existencia: 5.0, precioPorPeso: true },
  { id: 'p6', nombre: 'Salchicha Longaniza', categoria: 'Carnes frías', unidad: 'kg', precioBase: 160, existencia: 3.5, precioPorPeso: true },
  { id: 'p7', nombre: 'Jamón Ahumado', categoria: 'Carnes frías', unidad: 'kg', precioBase: 225, existencia: 2.0, precioPorPeso: true },
  { id: 'p8', nombre: 'Pepperoni', categoria: 'Carnes frías', unidad: 'kg', precioBase: 250, existencia: 1.5, precioPorPeso: true },
  { id: 'p9', nombre: 'Queso Manchego', categoria: 'Quesos', unidad: 'kg', precioBase: 280, existencia: 0.0, precioPorPeso: true },
  { id: 'p10', nombre: 'Jamón Pierna', categoria: 'Jamón', unidad: 'kg', precioBase: 170, existencia: 9.0, precioPorPeso: true },
  { id: 'p11', nombre: 'Sopa Maruchan', categoria: 'Abarrotes', unidad: 'pieza', precioBase: 18, existencia: 48, precioPorPeso: false },
  { id: 'p12', nombre: 'Coca Cola 600ml', categoria: 'Abarrotes', unidad: 'pieza', precioBase: 15, existencia: 60, precioPorPeso: false },
  { id: 'p13', nombre: 'Refresco 2L', categoria: 'Abarrotes', unidad: 'pieza', precioBase: 32, existencia: 24, precioPorPeso: false },
  { id: 'p14', nombre: 'Galletas Marías', categoria: 'Abarrotes', unidad: 'paquete', precioBase: 22, existencia: 36, precioPorPeso: false },
  { id: 'p15', nombre: 'Aceite 1L', categoria: 'Abarrotes', unidad: 'pieza', precioBase: 45, existencia: 18, precioPorPeso: false },
  { id: 'p16', nombre: 'Frijol 1kg', categoria: 'Abarrotes', unidad: 'pieza', precioBase: 38, existencia: 20, precioPorPeso: false },
  { id: 'p17', nombre: 'Arroz 1kg', categoria: 'Abarrotes', unidad: 'pieza', precioBase: 28, existencia: 15, precioPorPeso: false },
  { id: 'p18', nombre: 'Detergente 1kg', categoria: 'Abarrotes', unidad: 'pieza', precioBase: 35, existencia: 0, precioPorPeso: false },
];

export const clientes: Cliente[] = [
  {
    id: 'c1',
    nombre: 'Abarrotes Arenas',
    propietario: 'Aaron',
    direccion: 'Calle Hidalgo 23, Centro',
    ruta: 'Ruta Centro',
    diasVisita: ['Lun', 'Mié', 'Vie'],
    saldo: 1250,
    limiteCredito: 5000,
    estado: 'Pendiente',
    ultimaVisita: '2026-09-11',
    precioEspecial: { p1: 175, p4: 185, p3: 200 },
    historial: [
      { id: 'h1', fecha: '2026-09-11', total: 2350, estado: 'Crédito', items: [{ productoNombre: 'Jamón Virginia', cantidad: 2, unidad: 'kg' }, { productoNombre: 'Queso Oaxaca', cantidad: 1.5, unidad: 'kg' }] },
      { id: 'h2', fecha: '2026-09-08', total: 1820, estado: 'Pagado', items: [{ productoNombre: 'Chorizo Rojo', cantidad: 1, unidad: 'kg' }, { productoNombre: 'Salchicha de Pavo', cantidad: 1.5, unidad: 'kg' }] },
      { id: 'h3', fecha: '2026-09-04', total: 2150, estado: 'Pagado', items: [{ productoNombre: 'Jamón Virginia', cantidad: 2.5, unidad: 'kg' }, { productoNombre: 'Coca Cola 600ml', cantidad: 12, unidad: 'pieza' }] },
      { id: 'h4', fecha: '2026-09-01', total: 3200, estado: 'Pagado', items: [{ productoNombre: 'Queso Oaxaca', cantidad: 3, unidad: 'kg' }, { productoNombre: 'Jamón Pierna', cantidad: 2, unidad: 'kg' }] },
      { id: 'h5', fecha: '2026-08-28', total: 1950, estado: 'Pagado', items: [{ productoNombre: 'Chorizo Rojo', cantidad: 1.5, unidad: 'kg' }, { productoNombre: 'Salchicha de Pavo', cantidad: 2, unidad: 'kg' }] },
    ],
    sugerido: [
      { productoId: 'p1', cantidad: 2, frecuencia: 'Compró en 4 de sus últimas 5 visitas' },
      { productoId: 'p4', cantidad: 1.5, frecuencia: 'Compró en 4 de sus últimas 5 visitas' },
      { productoId: 'p3', cantidad: 1, frecuencia: 'Compró en 3 de sus últimas 5 visitas' },
      { productoId: 'p2', cantidad: 3, frecuencia: 'Compró en 2 de sus últimas 5 visitas' },
    ],
  },
  {
    id: 'c2',
    nombre: 'Cremería La Esquina',
    propietario: 'Marcela',
    direccion: 'Av. Juárez 145, Centro',
    ruta: 'Ruta Centro',
    diasVisita: ['Lun', 'Mié', 'Vie'],
    saldo: 0,
    limiteCredito: 3000,
    estado: 'Pendiente',
    ultimaVisita: '2026-09-11',
    historial: [
      { id: 'h6', fecha: '2026-09-11', total: 980, estado: 'Pagado', items: [{ productoNombre: 'Queso Chihuahua', cantidad: 2, unidad: 'kg' }] },
      { id: 'h7', fecha: '2026-09-08', total: 1450, estado: 'Pagado', items: [{ productoNombre: 'Queso Oaxaca', cantidad: 2, unidad: 'kg' }] },
    ],
    sugerido: [
      { productoId: 'p5', cantidad: 2, frecuencia: 'Compró en 4 de sus últimas 5 visitas' },
      { productoId: 'p4', cantidad: 2, frecuencia: 'Compró en 3 de sus últimas 5 visitas' },
    ],
  },
  {
    id: 'c3',
    nombre: 'Abarrotes El Chuy',
    propietario: 'Jesús',
    direccion: 'Calle Morelos 67, Col. Obrera',
    ruta: 'Ruta Centro',
    diasVisita: ['Lun', 'Jue'],
    saldo: 3200,
    limiteCredito: 4000,
    estado: 'Pendiente',
    ultimaVisita: '2026-09-10',
    historial: [
      { id: 'h8', fecha: '2026-09-10', total: 2800, estado: 'Crédito', items: [{ productoNombre: 'Jamón Virginia', cantidad: 3, unidad: 'kg' }, { productoNombre: 'Sopa Maruchan', cantidad: 24, unidad: 'pieza' }] },
    ],
    sugerido: [
      { productoId: 'p1', cantidad: 3, frecuencia: 'Compró en 4 de sus últimas 5 visitas' },
      { productoId: 'p11', cantidad: 24, frecuencia: 'Compró en 3 de sus últimas 5 visitas' },
    ],
  },
  {
    id: 'c4',
    nombre: 'Abarrotes La Esperanza',
    propietario: 'Rosa',
    direccion: 'Calle Aldama 12, Centro',
    ruta: 'Ruta Centro',
    diasVisita: ['Lun', 'Mié', 'Vie'],
    saldo: 450,
    limiteCredito: 2000,
    estado: 'Visitado',
    ultimaVisita: '2026-09-15',
    historial: [
      { id: 'h9', fecha: '2026-09-15', total: 670, estado: 'Pagado', items: [{ productoNombre: 'Salchicha de Pavo', cantidad: 1, unidad: 'kg' }, { productoNombre: 'Galletas Marías', cantidad: 5, unidad: 'paquete' }] },
    ],
    sugerido: [
      { productoId: 'p2', cantidad: 1.5, frecuencia: 'Compró en 3 de sus últimas 5 visitas' },
    ],
  },
  {
    id: 'c5',
    nombre: 'Abarrotes San Juan',
    propietario: 'Juan',
    direccion: 'Calle Zaragoza 89, Centro',
    ruta: 'Ruta Centro',
    diasVisita: ['Lun', 'Mié', 'Vie'],
    saldo: 0,
    limiteCredito: 2500,
    estado: 'Venta realizada',
    ultimaVisita: '2026-09-15',
    historial: [
      { id: 'h10', fecha: '2026-09-15', total: 1890, estado: 'Pagado', items: [{ productoNombre: 'Chorizo Rojo', cantidad: 2, unidad: 'kg' }, { productoNombre: 'Refresco 2L', cantidad: 8, unidad: 'pieza' }] },
    ],
    sugerido: [
      { productoId: 'p3', cantidad: 2, frecuencia: 'Compró en 4 de sus últimas 5 visitas' },
      { productoId: 'p13', cantidad: 8, frecuencia: 'Compró en 3 de sus últimas 5 visitas' },
    ],
  },
  {
    id: 'c6',
    nombre: 'Cremería Don Pedro',
    propietario: 'Pedro',
    direccion: 'Av. Insurgentes 230, Norte',
    ruta: 'Ruta Norte',
    diasVisita: ['Mar', 'Jue', 'Sáb'],
    saldo: 1800,
    limiteCredito: 5000,
    estado: 'Pendiente',
    ultimaVisita: '2026-09-12',
    historial: [
      { id: 'h11', fecha: '2026-09-12', total: 1650, estado: 'Crédito', items: [{ productoNombre: 'Queso Manchego', cantidad: 2, unidad: 'kg' }] },
    ],
    sugerido: [
      { productoId: 'p9', cantidad: 2, frecuencia: 'Compró en 3 de sus últimas 5 visitas' },
      { productoId: 'p4', cantidad: 1, frecuencia: 'Compró en 2 de sus últimas 5 visitas' },
    ],
  },
  {
    id: 'c7',
    nombre: 'Abarrotes La Bendición',
    propietario: 'Lucía',
    direccion: 'Calle Reforma 56, Sur',
    ruta: 'Ruta Sur',
    diasVisita: ['Mar', 'Vie'],
    saldo: 5600,
    limiteCredito: 5000,
    estado: 'Pendiente',
    ultimaVisita: '2026-09-12',
    historial: [
      { id: 'h12', fecha: '2026-09-12', total: 3200, estado: 'Vencido', items: [{ productoNombre: 'Jamón Ahumado', cantidad: 3, unidad: 'kg' }] },
    ],
    sugerido: [
      { productoId: 'p7', cantidad: 2, frecuencia: 'Compró en 3 de sus últimas 5 visitas' },
    ],
  },
  {
    id: 'c8',
    nombre: 'Abarrotes Mi Hogar',
    propietario: 'Carmen',
    direccion: 'Calle Libertad 78, Norte',
    ruta: 'Ruta Norte',
    diasVisita: ['Mar', 'Jue', 'Sáb'],
    saldo: 0,
    limiteCredito: 3000,
    estado: 'Cerrado',
    ultimaVisita: '2026-09-14',
    historial: [
      { id: 'h13', fecha: '2026-09-14', total: 540, estado: 'Pagado', items: [{ productoNombre: 'Frijol 1kg', cantidad: 6, unidad: 'pieza' }] },
    ],
    sugerido: [
      { productoId: 'p16', cantidad: 6, frecuencia: 'Compró en 4 de sus últimas 5 visitas' },
    ],
  },
  {
    id: 'c9',
    nombre: 'Abarrotes El Sol',
    propietario: 'Fernando',
    direccion: 'Calle Hidalgo 200, Sur',
    ruta: 'Ruta Sur',
    diasVisita: ['Mar', 'Vie'],
    saldo: 800,
    limiteCredito: 3000,
    estado: 'Pendiente',
    ultimaVisita: '2026-09-12',
    historial: [
      { id: 'h14', fecha: '2026-09-12', total: 1200, estado: 'Crédito', items: [{ productoNombre: 'Pepperoni', cantidad: 2, unidad: 'kg' }] },
    ],
    sugerido: [
      { productoId: 'p8', cantidad: 1.5, frecuencia: 'Compró en 2 de sus últimas 5 visitas' },
    ],
  },
  {
    id: 'c10',
    nombre: 'Abarrotes La Economía',
    propietario: 'Sofía',
    direccion: 'Calle Madero 34, Centro',
    ruta: 'Ruta Centro',
    diasVisita: ['Lun', 'Mié', 'Vie'],
    saldo: 0,
    limiteCredito: 2000,
    estado: 'Sin compra',
    ultimaVisita: '2026-09-15',
    historial: [],
    sugerido: [],
  },
];

export const empleados: Empleado[] = [
  { id: 'e1', nombre: 'Miguel', rol: 'Administrador', ruta: 'Ruta Centro', estado: 'Activo', ventasHoy: 4250 },
  { id: 'e2', nombre: 'Juan', rol: 'Vendedor', ruta: 'Ruta Norte', estado: 'Activo', ventasHoy: 2800 },
  { id: 'e3', nombre: 'Pedro', rol: 'Vendedor', ruta: 'Ruta Sur', estado: 'Activo', ventasHoy: 1950 },
];

export const bitacora: BitacoraEntry[] = [
  { id: 'b1', fecha: '2026-09-15 08:32', usuario: 'Miguel', modulo: 'Inventario', accion: 'Carga inicial registrada' },
  { id: 'b2', fecha: '2026-09-15 09:15', usuario: 'Miguel', modulo: 'Venta', accion: 'Venta a Abarrotes San Juan' },
  { id: 'b3', fecha: '2026-09-15 09:42', usuario: 'Miguel', modulo: 'Cobranza', accion: 'Abono de Cremería La Esquina' },
  { id: 'b4', fecha: '2026-09-15 10:05', usuario: 'Miguel', modulo: 'Venta', accion: 'Venta a Abarrotes La Esperanza' },
  { id: 'b5', fecha: '2026-09-15 10:30', usuario: 'Miguel', modulo: 'Devolución', accion: 'Devolución de Abarrotes El Chuy' },
  { id: 'b6', fecha: '2026-09-14 16:20', usuario: 'Juan', modulo: 'Corte', accion: 'Corte diario realizado' },
  { id: 'b7', fecha: '2026-09-14 15:45', usuario: 'Pedro', modulo: 'Gastos', accion: 'Gasto de gasolina registrado' },
  { id: 'b8', fecha: '2026-09-14 13:10', usuario: 'Juan', modulo: 'Cliente', accion: 'Cliente actualizado: Cremería Don Pedro' },
];

export const bitacoraErrores: BitacoraError[] = [
  { id: 'be1', fecha: '2026-09-14 14:22', usuario: 'Juan', dispositivo: 'Samsung A54', error: 'Timeout de sincronización', estado: 'Resuelto' },
  { id: 'be2', fecha: '2026-09-13 10:05', usuario: 'Pedro', dispositivo: 'Motorola G84', error: 'Error de conexión al guardar venta', estado: 'Resuelto' },
  { id: 'be3', fecha: '2026-09-12 11:30', usuario: 'Miguel', dispositivo: 'iPhone 14', error: 'GPS no disponible en vista de ruta', estado: 'Ignorado' },
];

export const gastos: Gasto[] = [
  { id: 'g1', concepto: 'Gasolina', importe: 400, metodo: 'Efectivo', observaciones: 'Tanque lleno', fecha: '2026-09-15' },
  { id: 'g2', concepto: 'Comida', importe: 85, metodo: 'Efectivo', observaciones: 'Almuerzo', fecha: '2026-09-15' },
  { id: 'g3', concepto: 'Estacionamiento', importe: 30, metodo: 'Efectivo', observaciones: 'Centro', fecha: '2026-09-15' },
  { id: 'g4', concepto: 'Mantenimiento', importe: 250, metodo: 'Transferencia', observaciones: 'Cambio de aceite', fecha: '2026-09-12' },
  { id: 'g5', concepto: 'Gasolina', importe: 380, metodo: 'Efectivo', observaciones: 'Tanque lleno', fecha: '2026-09-10' },
];

export const movimientosSync: MovimientoSincronizacion[] = [
  { id: 's1', tipo: 'Venta', cliente: 'Abarrotes San Juan', fecha: '09:15', estado: 'Sincronizado' },
  { id: 's2', tipo: 'Cobranza', cliente: 'Cremería La Esquina', fecha: '09:42', estado: 'Sincronizado' },
  { id: 's3', tipo: 'Venta', cliente: 'Abarrotes La Esperanza', fecha: '10:05', estado: 'Sincronizado' },
  { id: 's4', tipo: 'Devolución', cliente: 'Abarrotes El Chuy', fecha: '10:30', estado: 'Sincronizado' },
  { id: 's5', tipo: 'Gasto', cliente: '—', fecha: '08:10', estado: 'Sincronizado' },
  { id: 's6', tipo: 'Carga inicial', cliente: '—', fecha: '08:32', estado: 'Sincronizado' },
  { id: 's7', tipo: 'Venta', cliente: 'Abarrotes La Economía', fecha: '10:45', estado: 'Pendiente' },
  { id: 's8', tipo: 'Abono', cliente: 'Abarrotes Arenas', fecha: '11:00', estado: 'Pendiente' },
  { id: 's9', tipo: 'Cobranza', cliente: 'Abarrotes El Sol', fecha: '11:15', estado: 'Pendiente' },
];

export const devoluciones: Devolucion[] = [
  { id: 'd1', cliente: 'Abarrotes El Chuy', producto: 'Chorizo Rojo', cantidad: 1, unidad: 'kg', motivo: 'Producto dañado', destino: 'Merma', fecha: '2026-09-15' },
  { id: 'd2', cliente: 'Abarrotes La Esperanza', producto: 'Salchicha de Pavo', cantidad: 0.5, unidad: 'kg', motivo: 'Caducidad', destino: 'Merma', fecha: '2026-09-14' },
  { id: 'd3', cliente: 'Cremería La Esquina', producto: 'Queso Chihuahua', cantidad: 1, unidad: 'kg', motivo: 'Cambio', destino: 'Cambio', fecha: '2026-09-13' },
];

export const categorias = ['Todas', 'Jamón', 'Salchicha', 'Chorizo', 'Quesos', 'Carnes frías', 'Abarrotes'];

export const diasSemana: Array<'Lun' | 'Mar' | 'Mié' | 'Jue' | 'Vie' | 'Sáb' | 'Dom'> = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export const dashboardData = {
  ventasHoy: 8450,
  cobranza: 3200,
  creditoVendido: 5200,
  cajaActual: 5670,
  clientesVisitados: 4,
  clientesTotal: 31,
  siguienteCliente: 'c1',
};

export const cargaInicial = [
  { producto: 'Jamón Virginia', cantidad: 15, unidad: 'kg' as const, costo: 130, importe: 1950 },
  { producto: 'Salchicha de Pavo', cantidad: 10, unidad: 'kg' as const, costo: 95, importe: 950 },
  { producto: 'Chorizo Rojo', cantidad: 8, unidad: 'kg' as const, costo: 150, importe: 1200 },
  { producto: 'Queso Oaxaca', cantidad: 6, unidad: 'kg' as const, costo: 140, importe: 840 },
  { producto: 'Queso Chihuahua', cantidad: 6, unidad: 'kg' as const, costo: 125, importe: 750 },
  { producto: 'Salchicha Longaniza', cantidad: 5, unidad: 'kg' as const, costo: 110, importe: 550 },
  { producto: 'Jamón Ahumado', cantidad: 4, unidad: 'kg' as const, costo: 165, importe: 660 },
  { producto: 'Pepperoni', cantidad: 3, unidad: 'kg' as const, costo: 180, importe: 540 },
  { producto: 'Jamón Pierna', cantidad: 12, unidad: 'kg' as const, costo: 120, importe: 1440 },
  { producto: 'Sopa Maruchan', cantidad: 60, unidad: 'pieza' as const, costo: 12, importe: 720 },
  { producto: 'Coca Cola 600ml', cantidad: 72, unidad: 'pieza' as const, costo: 10, importe: 720 },
  { producto: 'Refresco 2L', cantidad: 30, unidad: 'pieza' as const, costo: 22, importe: 660 },
  { producto: 'Galletas Marías', cantidad: 40, unidad: 'paquete' as const, costo: 15, importe: 600 },
  { producto: 'Aceite 1L', cantidad: 24, unidad: 'pieza' as const, costo: 32, importe: 768 },
  { producto: 'Frijol 1kg', cantidad: 24, unidad: 'pieza' as const, costo: 27, importe: 648 },
  { producto: 'Arroz 1kg', cantidad: 20, unidad: 'pieza' as const, costo: 20, importe: 400 },
];

export const totalCargaInicial = cargaInicial.reduce((s, c) => s + c.importe, 0);
