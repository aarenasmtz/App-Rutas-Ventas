import type {
  Producto,
  Cliente,
  PresentacionConfig,
  Categoria,
  CategoriaItem,
  RevisionItem,
  CorteTrabajador,
} from '@/types';
import { bitacora, empleados } from '@/constants/mockData';

export const mockEmpleados = empleados;
export const mockBitacora = bitacora;

// ==========================================
// 1. PRODUCTOS CON PRESENTACIONES Y CONVERSIONES
// ==========================================
export const mockProductos: Producto[] = [
  {
    id: 'p1',
    nombre: 'Queso Castel',
    marca: 'Castel',
    categoria: 'Quesos',
    unidad: 'paquete',
    precioBase: 8,
    precioCompra: 5.5,
    existencia: 300,
    precioPorPeso: false,
    manejaMultiplesPresentaciones: true,
    sku: 'CAS-QP-01',
    codigoBarras: '7501002345012',
    favorito: true,
    activo: true,
    presentaciones: [
      { tipo: 'paquete', nombre: 'Paquete', piezasEquivalentes: 1, precio: 8, descripcionEquivalencia: '1 paquete = 1 unidad base', codigoBarras: '7501002345012', activa: true, orden: 1 },
      { tipo: 'exhibidor', nombre: 'Exhibidor', piezasEquivalentes: 10, precio: 80, descripcionEquivalencia: '1 exhibidor = 10 paquetes', codigoBarras: '7501002345029', activa: true, orden: 2 },
      { tipo: 'caja', nombre: 'Caja', piezasEquivalentes: 60, precio: 480, descripcionEquivalencia: '1 caja = 6 exhibidores = 60 paquetes', codigoBarras: '7501002345036', activa: true, orden: 3 },
    ],
  },
  {
    id: 'p2',
    nombre: 'Chiles Jalapeños La Costeña',
    marca: 'La Costeña',
    categoria: 'Enlatados',
    unidad: 'pieza',
    precioBase: 24,
    precioCompra: 17,
    existencia: 48,
    precioPorPeso: false,
    sku: 'LCO-CHI-02',
    codigoBarras: '7501017002014',
    favorito: true,
    activo: true,
    presentaciones: [
      { tipo: 'pieza', nombre: 'Lata individual (Pieza)', piezasEquivalentes: 1, precio: 24, descripcionEquivalencia: '1 lata' },
      { tipo: 'caja', nombre: 'Caja x 6 latas', piezasEquivalentes: 6, precio: 138, descripcionEquivalencia: '1 caja = 6 piezas' },
      { tipo: 'caja', nombre: 'Caja x 24 latas', piezasEquivalentes: 24, precio: 540, descripcionEquivalencia: '1 caja = 24 piezas' },
    ],
  },
  {
    id: 'p3',
    nombre: 'Jamón Virginia',
    marca: 'Zwan',
    categoria: 'Jamón',
    unidad: 'kg',
    precioBase: 185,
    precioCompra: 130,
    existencia: 18,
    precioPorPeso: true,
    sku: 'ZWA-JVP-03',
    codigoBarras: '7501004523101',
    favorito: true,
    activo: true,
    presentaciones: [
      { tipo: 'pieza', nombre: 'Por Kilo / Porción', piezasEquivalentes: 1, precio: 185, descripcionEquivalencia: 'Venta por peso ($185/kg)' },
      { tipo: 'paquete', nombre: 'Paquete x 5 kg', piezasEquivalentes: 5, precio: 900, descripcionEquivalencia: '1 paquete = 5 kg' },
    ],
  },
  {
    id: 'p4',
    nombre: 'Salchicha de Pavo San Rafael',
    marca: 'San Rafael',
    categoria: 'Salchicha',
    unidad: 'kg',
    precioBase: 145,
    precioCompra: 105,
    existencia: 14,
    precioPorPeso: true,
    sku: 'SRA-SAL-04',
    codigoBarras: '7501008812349',
    favorito: true,
    activo: true,
    presentaciones: [
      { tipo: 'pieza', nombre: 'Por Kilo / Porción', piezasEquivalentes: 1, precio: 145, descripcionEquivalencia: 'Venta por peso ($145/kg)' },
    ],
  },
  {
    id: 'p5',
    nombre: 'Chorizo Español Corona',
    marca: 'Corona',
    categoria: 'Chorizo',
    unidad: 'kg',
    precioBase: 210,
    precioCompra: 155,
    existencia: 6.5,
    precioPorPeso: true,
    sku: 'COR-CHO-05',
    codigoBarras: '7501005519821',
    favorito: true,
    activo: true,
    presentaciones: [
      { tipo: 'pieza', nombre: 'Por Kilo / Porción', piezasEquivalentes: 1, precio: 210, descripcionEquivalencia: 'Venta por peso ($210/kg)' },
    ],
  },
  {
    id: 'p6',
    nombre: 'Queso Oaxaca Tradicional',
    marca: 'Los Altos',
    categoria: 'Quesos',
    unidad: 'kg',
    precioBase: 195,
    precioCompra: 140,
    existencia: 24,
    precioPorPeso: true,
    sku: 'LAL-QOA-06',
    codigoBarras: '7501009944112',
    favorito: true,
    activo: true,
    presentaciones: [
      { tipo: 'pieza', nombre: 'Por Kilo / Porción', piezasEquivalentes: 1, precio: 195, descripcionEquivalencia: 'Venta por peso ($195/kg)' },
    ],
  },
  {
    id: 'p7',
    nombre: 'Mantequilla Gloria con Sal',
    marca: 'Gloria',
    categoria: 'Mantequillas',
    unidad: 'pieza',
    precioBase: 32,
    precioCompra: 23,
    existencia: 36,
    precioPorPeso: false,
    sku: 'GLO-MAN-07',
    codigoBarras: '7501023344123',
    favorito: false,
    activo: true,
    presentaciones: [
      { tipo: 'pieza', nombre: 'Barra 90g (Pieza)', piezasEquivalentes: 1, precio: 32, descripcionEquivalencia: '1 barra' },
      { tipo: 'paquete', nombre: 'Paquete x 4 barras', piezasEquivalentes: 4, precio: 124, descripcionEquivalencia: '1 paquete = 4 piezas' },
      { tipo: 'caja', nombre: 'Caja x 40 barras', piezasEquivalentes: 40, precio: 1200, descripcionEquivalencia: '1 caja = 40 piezas' },
    ],
  },
  {
    id: 'p8',
    nombre: 'Mayonesa McCormick con Limón',
    marca: 'McCormick',
    categoria: 'Mayonesas',
    unidad: 'pieza',
    precioBase: 58,
    precioCompra: 42,
    existencia: 18,
    precioPorPeso: false,
    sku: 'MCC-MAY-08',
    codigoBarras: '7501001122334',
    favorito: false,
    activo: true,
    presentaciones: [
      { tipo: 'pieza', nombre: 'Frasco 400g (Pieza)', piezasEquivalentes: 1, precio: 58, descripcionEquivalencia: '1 frasco' },
      { tipo: 'caja', nombre: 'Caja x 12 frascos', piezasEquivalentes: 12, precio: 680, descripcionEquivalencia: '1 caja = 12 piezas' },
    ],
  },
  {
    id: 'p9',
    nombre: 'Queso Manchego Caperucita',
    marca: 'Caperucita',
    categoria: 'Quesos',
    unidad: 'kg',
    precioBase: 280,
    precioCompra: 205,
    existencia: 0, // Agotado
    precioPorPeso: true,
    sku: 'CAP-QMA-09',
    codigoBarras: '7501007788990',
    favorito: false,
    activo: true,
    presentaciones: [
      { tipo: 'pieza', nombre: 'Por Kilo / Porción', piezasEquivalentes: 1, precio: 280, descripcionEquivalencia: 'Venta por peso ($280/kg)' },
    ],
  },
  {
    id: 'p10',
    nombre: 'Chorizo Casero Ranchero',
    marca: 'Ranchero',
    categoria: 'Chorizo',
    unidad: 'kg',
    precioBase: 135,
    precioCompra: 98,
    existencia: 22,
    precioPorPeso: true,
    sku: 'RAN-CHO-10',
    codigoBarras: '7501003322119',
    favorito: false,
    activo: true,
    presentaciones: [
      { tipo: 'pieza', nombre: 'Por Kilo / Porción', piezasEquivalentes: 1, precio: 135, descripcionEquivalencia: 'Venta por peso ($135/kg)' },
    ],
  },
  {
    id: 'p11',
    nombre: 'Atún Dolores en Aceite',
    marca: 'Dolores',
    categoria: 'Enlatados',
    unidad: 'pieza',
    precioBase: 22,
    precioCompra: 16,
    existencia: 60,
    precioPorPeso: false,
    sku: 'DOL-ATU-11',
    codigoBarras: '7501044455667',
    favorito: true,
    activo: true,
    presentaciones: [
      { tipo: 'pieza', nombre: 'Lata 140g (Pieza)', piezasEquivalentes: 1, precio: 22, descripcionEquivalencia: '1 lata' },
      { tipo: 'paquete', nombre: 'Pack x 4 latas', piezasEquivalentes: 4, precio: 85, descripcionEquivalencia: '1 pack = 4 piezas' },
      { tipo: 'caja', nombre: 'Caja x 48 latas', piezasEquivalentes: 48, precio: 980, descripcionEquivalencia: '1 caja = 48 piezas' },
      { tipo: 'exhibidor', nombre: 'Exhibidor mostrador (24 latas)', piezasEquivalentes: 24, precio: 510, descripcionEquivalencia: '1 exhibidor = 24 piezas' },
    ],
  },
  {
    id: 'p12',
    nombre: 'Aceite Nutrioli 946ml',
    marca: 'Nutrioli',
    categoria: 'Abarrotes',
    unidad: 'pieza',
    precioBase: 48,
    precioCompra: 36,
    existencia: 30,
    precioPorPeso: false,
    sku: 'NUT-ACE-12',
    codigoBarras: '7501022233445',
    favorito: false,
    activo: true,
    presentaciones: [
      { tipo: 'pieza', nombre: 'Botella 946ml (Pieza)', piezasEquivalentes: 1, precio: 48, descripcionEquivalencia: '1 botella' },
      { tipo: 'caja', nombre: 'Caja x 12 botellas', piezasEquivalentes: 12, precio: 560, descripcionEquivalencia: '1 caja = 12 piezas' },
    ],
  },
];

// Categorías completas del negocio (Gestión ABC)
export let mockCategorias: CategoriaItem[] = [
  { id: 'cat-1', nombre: 'Quesos', icono: '🧀', descripcion: 'Queso panela, oaxaca, manchego y de barra', activa: true },
  { id: 'cat-2', nombre: 'Jamón', icono: '🥓', descripcion: 'Jamón de pavo, virginia y horneado', activa: true },
  { id: 'cat-3', nombre: 'Salchicha', icono: '🌭', descripcion: 'Salchicha de pavo, viena y para asar', activa: true },
  { id: 'cat-4', nombre: 'Chorizo', icono: '🥩', descripcion: 'Chorizo español, casero y ranchero', activa: true },
  { id: 'cat-5', nombre: 'Mantequillas', icono: '🧈', descripcion: 'Mantequillas con y sin sal, margarinas', activa: true },
  { id: 'cat-6', nombre: 'Mayonesas', icono: '🥫', descripcion: 'Mayonesas con limón y aderezos', activa: true },
  { id: 'cat-7', nombre: 'Enlatados', icono: '🥫', descripcion: 'Chiles jalapeños, atún y conservas', activa: true },
  { id: 'cat-8', nombre: 'Carnes frías', icono: '🍗', descripcion: 'Tocino, salami, pepperoni y pastrami', activa: true },
  { id: 'cat-9', nombre: 'Abarrotes', icono: '📦', descripcion: 'Aceites, frijoles y abarrotes generales', activa: true },
  { id: 'cat-10', nombre: 'Otros', icono: '🏷️', descripcion: 'Artículos varios y promociones', activa: true },
];

// ==========================================
// 2. CLIENTES ENRIQUECIDOS - LEÓN, GUANAJUATO
// ==========================================
export let mockClientes: Cliente[] = [
  {
    id: 'c1',
    nombre: 'ABTS ARENAS',
    propietario: 'Aaron Arenas',
    direccion: 'Blvd. Adolfo López Mateos 810, Centro, León, Gto',
    colonia: 'Centro',
    ciudad: 'León, Gto',
    ruta: 'Ruta Centro',
    diasVisita: ['Lun', 'Mié', 'Vie'],
    saldo: 1250,
    limiteCredito: 5000,
    estado: 'Pendiente',
    ultimaVisita: '2026-09-11',
    telefono: '477 713 2450',
    distanciaMock: '50m · ¡Estás aquí!',
    ultimaCompra: 'hace 4 días · $2,350',
    ultimoPago: 'hace 7 días · $1,500',
    latitud: 21.1221,
    longitud: -101.6828,
    activo: true,
    precioEspecial: { p1: 185, p3: 175, p6: 185 },
    historial: [
      { id: 'h1', fecha: '2026-09-11', total: 2350, estado: 'Crédito', items: [{ productoNombre: 'Jamón Virginia', cantidad: 2, unidad: 'kg' }, { productoNombre: 'Queso Oaxaca', cantidad: 2, unidad: 'kg' }] },
      { id: 'h2', fecha: '2026-09-08', total: 1820, estado: 'Pagado', items: [{ productoNombre: 'Chorizo Corona', cantidad: 2, unidad: 'pieza' }] },
    ],
    sugerido: [
      { productoId: 'p1', cantidad: 2, frecuencia: 'Compra en 4 de 5 visitas' },
      { productoId: 'p3', cantidad: 3, frecuencia: 'Compra en 4 de 5 visitas' },
      { productoId: 'p2', cantidad: 2, frecuencia: 'Compra en 3 de 5 visitas' },
      { productoId: 'p6', cantidad: 2, frecuencia: 'Compra en 3 de 5 visitas' },
    ],
  },
  {
    id: 'c2',
    nombre: 'Cremería La Esquina',
    propietario: 'Marcela Vega',
    direccion: 'Calle Francisco I. Madero 420, Zona Centro, León, Gto',
    colonia: 'Centro',
    ciudad: 'León, Gto',
    ruta: 'Ruta Centro',
    diasVisita: ['Lun', 'Mié', 'Vie'],
    saldo: 0,
    limiteCredito: 4000,
    estado: 'Pendiente',
    ultimaVisita: '2026-09-11',
    telefono: '477 714 8920',
    distanciaMock: '320m',
    ultimaCompra: 'hace 4 días · $980',
    ultimoPago: 'hace 4 días · $980',
    latitud: 21.1245,
    longitud: -101.6790,
    activo: true,
    sugerido: [
      { productoId: 'p1', cantidad: 1, frecuencia: 'Compra habitual' },
      { productoId: 'p6', cantidad: 2, frecuencia: 'Compra habitual' },
    ],
    historial: [
      { id: 'h3', fecha: '2026-09-11', total: 980, estado: 'Pagado', items: [{ productoNombre: 'Queso Castel', cantidad: 1, unidad: 'pieza' }] },
    ],
  },
  {
    id: 'c3',
    nombre: 'Abarrotes El Chuy',
    propietario: 'Jesús Martínez',
    direccion: 'Calle Rosas Moreno 112, Col. San Juan de Dios, León, Gto',
    colonia: 'San Juan de Dios',
    ciudad: 'León, Gto',
    ruta: 'Ruta Centro',
    diasVisita: ['Lun', 'Jue'],
    saldo: 3200,
    limiteCredito: 4500,
    estado: 'Pendiente',
    ultimaVisita: '2026-09-10',
    telefono: '477 716 3311',
    distanciaMock: '750m',
    ultimaCompra: 'hace 5 días · $2,800',
    ultimoPago: 'hace 12 días · $2,000',
    latitud: 21.1180,
    longitud: -101.6775,
    activo: true,
    sugerido: [
      { productoId: 'p2', cantidad: 4, frecuencia: 'Chiles y conservas' },
      { productoId: 'p11', cantidad: 1, frecuencia: 'Atún display' },
    ],
    historial: [],
  },
  {
    id: 'c4',
    nombre: 'Abarrotes La Bendición',
    propietario: 'Lucía Méndez',
    direccion: 'Blvd. Hilario Medina 402, Col. El Coecillo, León, Gto',
    colonia: 'El Coecillo',
    ciudad: 'León, Gto',
    ruta: 'Ruta Sur',
    diasVisita: ['Mar', 'Vie'],
    saldo: 5600,
    limiteCredito: 5000,
    estado: 'Pendiente',
    ultimaVisita: '2026-09-12',
    telefono: '477 763 1245',
    distanciaMock: '1.2 km',
    ultimaCompra: 'hace 6 días · $3,200',
    ultimoPago: 'hace 18 días · $1,000',
    latitud: 21.1270,
    longitud: -101.6680,
    activo: true,
    sugerido: [{ productoId: 'p3', cantidad: 2, frecuencia: 'Semanal' }],
    historial: [],
  },
  {
    id: 'c5',
    nombre: 'Abarrotes San Juan',
    propietario: 'Juan Pablo Rivas',
    direccion: 'Blvd. Mariano Escobedo 1804, Col. León Moderno, León, Gto',
    colonia: 'León Moderno',
    ciudad: 'León, Gto',
    ruta: 'Ruta Centro',
    diasVisita: ['Lun', 'Mié', 'Vie'],
    saldo: 0,
    limiteCredito: 3000,
    estado: 'Venta realizada',
    ultimaVisita: '2026-09-15',
    telefono: '477 711 9044',
    distanciaMock: '900m',
    ultimaCompra: 'Hoy · $1,890',
    ultimoPago: 'Hoy · $1,890 (Efectivo)',
    latitud: 21.1090,
    longitud: -101.6750,
    activo: true,
    sugerido: [],
    historial: [],
  },
  {
    id: 'c6',
    nombre: 'Super y Carnicería Campestre',
    propietario: 'Roberto Gómez',
    direccion: 'Blvd. Juan Alonso de Torres 1400, Valle del Campestre, León, Gto',
    colonia: 'Valle del Campestre',
    ciudad: 'León, Gto',
    ruta: 'Ruta Norte',
    diasVisita: ['Mar', 'Sáb'],
    saldo: 1800,
    limiteCredito: 6000,
    estado: 'Pendiente',
    ultimaVisita: '2026-09-14',
    telefono: '477 717 6500',
    distanciaMock: '2.5 km',
    ultimaCompra: 'hace 2 días · $4,500',
    ultimoPago: 'hace 2 días · $2,700',
    latitud: 21.1520,
    longitud: -101.6950,
    activo: true,
    sugerido: [{ productoId: 'p1', cantidad: 3, frecuencia: 'Semanal' }],
    historial: [],
  },
];

// ==========================================
// 3. REVISIÓN RÁPIDA DE INVENTARIO (ADMIN)
// ==========================================
export const mockRevisionItems: RevisionItem[] = [
  { productoId: 'p1', productoNombre: 'Queso Castel Barra', marca: 'Castel', sistema: 80, fisico: 78, unidad: 'piezas', diferencia: -2, revisado: true, comentario: 'Faltan 2 piezas por merma de ruta' },
  { productoId: 'p2', productoNombre: 'Chiles Jalapeños La Costeña', marca: 'La Costeña', sistema: 48, fisico: 48, unidad: 'piezas', diferencia: 0, revisado: true, comentario: 'Conteo exacto' },
  { productoId: 'p3', productoNombre: 'Jamón Virginia Pavo Zwan', marca: 'Zwan', sistema: 18, fisico: 18, unidad: 'piezas', diferencia: 0, revisado: true, comentario: 'OK' },
  { productoId: 'p4', productoNombre: 'Salchicha de Pavo San Rafael', marca: 'San Rafael', sistema: 14, fisico: 15, unidad: 'piezas', diferencia: +1, revisado: true, comentario: 'Sobrante detectado' },
  { productoId: 'p5', productoNombre: 'Chorizo Español Corona', marca: 'Corona', sistema: 6, fisico: 6, unidad: 'piezas', diferencia: 0, revisado: true, comentario: 'OK' },
  { productoId: 'p6', productoNombre: 'Queso Oaxaca Tradicional', marca: 'Los Altos', sistema: 24, fisico: 24, unidad: 'piezas', diferencia: 0, revisado: true, comentario: 'OK' },
  { productoId: 'p7', productoNombre: 'Mantequilla Gloria con Sal', marca: 'Gloria', sistema: 36, fisico: 36, unidad: 'piezas', diferencia: 0, revisado: false, comentario: '' },
  { productoId: 'p8', productoNombre: 'Mayonesa McCormick con Limón', marca: 'McCormick', sistema: 18, fisico: 18, unidad: 'piezas', diferencia: 0, revisado: false, comentario: '' },
  { productoId: 'p9', productoNombre: 'Queso Manchego Caperucita', marca: 'Caperucita', sistema: 0, fisico: 0, unidad: 'piezas', diferencia: 0, revisado: false, comentario: '' },
  { productoId: 'p10', productoNombre: 'Chorizo Casero Ranchero', marca: 'Ranchero', sistema: 22, fisico: 22, unidad: 'piezas', diferencia: 0, revisado: false, comentario: '' },
  { productoId: 'p11', productoNombre: 'Atún Dolores en Aceite', marca: 'Dolores', sistema: 60, fisico: 60, unidad: 'piezas', diferencia: 0, revisado: false, comentario: '' },
  { productoId: 'p12', productoNombre: 'Aceite Nutrioli 946ml', marca: 'Nutrioli', sistema: 30, fisico: 30, unidad: 'piezas', diferencia: 0, revisado: false, comentario: '' },
];

// ==========================================
// 4. CORTES POR TRABAJADOR (ADMIN)
// ==========================================
export const mockCortesTrabajadores: CorteTrabajador[] = [
  {
    empleadoId: 'e1',
    nombre: 'Miguel (Tú)',
    ruta: 'Ruta Centro',
    ventasTotales: 8450,
    efectivo: 4250,
    transferencias: 1200,
    tarjetas: 800,
    credito: 2200,
    abonosCobranza: 3200,
    gastos: 515,
    devoluciones: 480,
    efectivoEsperado: 7435, // 500 inicial + 4250 efectivo + 3200 cobranza - 515 gastos
    inventarioInicialPiezas: 340,
    inventarioActualPiezas: 278,
    piezasVendidas: 62,
    diferenciaCaja: 0,
  },
  {
    empleadoId: 'e2',
    nombre: 'Juan Pérez',
    ruta: 'Ruta Norte',
    ventasTotales: 5800,
    efectivo: 3100,
    transferencias: 900,
    tarjetas: 600,
    credito: 1200,
    abonosCobranza: 1450,
    gastos: 380,
    devoluciones: 150,
    efectivoEsperado: 4470,
    inventarioInicialPiezas: 290,
    inventarioActualPiezas: 248,
    piezasVendidas: 42,
    diferenciaCaja: -50,
  },
  {
    empleadoId: 'e3',
    nombre: 'Pedro Ramírez',
    ruta: 'Ruta Sur',
    ventasTotales: 4600,
    efectivo: 2400,
    transferencias: 800,
    tarjetas: 400,
    credito: 1000,
    abonosCobranza: 980,
    gastos: 410,
    devoluciones: 0,
    efectivoEsperado: 3270,
    inventarioInicialPiezas: 260,
    inventarioActualPiezas: 224,
    piezasVendidas: 36,
    diferenciaCaja: 0,
  },
];

import { apiService, type RegistrarVentaRequestDto, type RegistrarAbonoRequestDto, type AutorizarAjusteInventarioDto } from './httpApiService';
import { offlineSyncQueue } from './offlineSyncQueueService';

// ==========================================
// 5. SERVICIO UNIFICADO (LIVE .NET 9 API CON FALLBACK INTELIGENTE)
// ==========================================
export const DataService = {
  isLive: async (): Promise<boolean> => {
    return await apiService.checkHealth();
  },

  getProductos: async (filtro?: { categoria?: string; search?: string }): Promise<Producto[]> => {
    try {
      const live = await apiService.getProductos({
        categoria: filtro?.categoria,
        search: filtro?.search,
      });
      if (live && live.length > 0) return live;
    } catch {
      // Fallback a memoria local
    }

    let result = [...mockProductos];
    if (filtro?.categoria && filtro.categoria !== 'Todas') {
      result = result.filter((p) => p.categoria === filtro.categoria);
    }
    if (filtro?.search) {
      const q = filtro.search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.marca?.toLowerCase().includes(q) ||
          p.sku?.toLowerCase().includes(q) ||
          p.codigoBarras?.includes(q)
      );
    }
    return result;
  },

  getClientes: async (filtro?: 'Todos' | 'Hoy' | 'Pendientes de cobro' | 'Con crédito' | 'Cercanos' | string): Promise<Cliente[]> => {
    try {
      const live = await apiService.getClientes({ filtro });
      if (live && live.length > 0) return live;
    } catch {
      // Fallback a memoria local
    }

    let result = [...mockClientes];
    if (filtro === 'Hoy') {
      result = result.filter((c) => c.diasVisita.includes('Lun') || c.diasVisita.includes('Mié'));
    } else if (filtro === 'Pendientes de cobro' || filtro === 'Con crédito') {
      result = result.filter((c) => c.saldo > 0);
    } else if (filtro === 'Cercanos') {
      result = result.filter((c) => c.distanciaMock?.includes('m') && !c.distanciaMock?.includes('km'));
    }
    return result;
  },

  getClienteById: async (id: string): Promise<Cliente | undefined> => {
    try {
      const live = await apiService.getClienteById(id);
      if (live) return live;
    } catch {
      // Fallback
    }
    return mockClientes.find((c) => c.id === id);
  },

  createCliente: async (clienteData: Partial<Cliente>): Promise<Cliente> => {
    try {
      const created = await apiService.createCliente(clienteData);
      mockClientes.unshift(created);
      return created;
    } catch {
      const newId = 'c' + (mockClientes.length + 1);
      const nuevo: Cliente = {
        id: newId,
        nombre: clienteData.nombre || 'Nuevo Cliente',
        propietario: clienteData.propietario || '',
        direccion: clienteData.direccion || 'León, Gto',
        colonia: clienteData.colonia || 'Centro',
        ciudad: clienteData.ciudad || 'León, Gto',
        ruta: clienteData.ruta || 'Ruta Centro',
        diasVisita: clienteData.diasVisita || ['Lun', 'Mié', 'Vie'],
        saldo: clienteData.saldo || 0,
        limiteCredito: clienteData.limiteCredito || 3000,
        estado: clienteData.estado || 'Pendiente',
        ultimaVisita: new Date().toISOString().split('T')[0],
        telefono: clienteData.telefono || '477 000 0000',
        distanciaMock: clienteData.distanciaMock || '500m',
        latitud: clienteData.latitud || (21.1221 + (Math.random() - 0.5) * 0.03),
        longitud: clienteData.longitud || (-101.6828 + (Math.random() - 0.5) * 0.03),
        activo: true,
        historial: [],
        sugerido: [],
      };
      mockClientes.unshift(nuevo);
      return nuevo;
    }
  },

  updateCliente: async (id: string, updates: Partial<Cliente>): Promise<Cliente> => {
    try {
      const updated = await apiService.updateCliente(id, updates);
      const idx = mockClientes.findIndex((c) => c.id === id);
      if (idx >= 0) mockClientes[idx] = updated;
      return updated;
    } catch {
      const idx = mockClientes.findIndex((c) => c.id === id);
      if (idx >= 0) {
        mockClientes[idx] = { ...mockClientes[idx], ...updates };
        return mockClientes[idx];
      }
      throw new Error('Cliente no encontrado');
    }
  },

  deleteCliente: async (id: string): Promise<boolean> => {
    try {
      await apiService.deleteCliente(id);
      const idx = mockClientes.findIndex((c) => c.id === id);
      if (idx >= 0) {
        mockClientes[idx].activo = false;
      }
      return true;
    } catch {
      const idx = mockClientes.findIndex((c) => c.id === id);
      if (idx >= 0) {
        mockClientes[idx].activo = false;
        return true;
      }
      return false;
    }
  },

  createProducto: async (prodData: Partial<Producto>): Promise<Producto> => {
    try {
      const created = await apiService.createProducto(prodData);
      mockProductos.unshift(created);
      return created;
    } catch {
      const newId = 'p' + (mockProductos.length + 1);
      const nuevo: Producto = {
        id: newId,
        nombre: prodData.nombre || 'Nuevo Producto',
        marca: prodData.marca || 'Genérica',
        categoria: prodData.categoria || 'Abarrotes',
        unidad: prodData.unidad || 'pieza',
        precioBase: prodData.precioBase || 100,
        precioCompra: prodData.precioCompra || 70,
        existencia: prodData.existencia || 10,
        precioPorPeso: prodData.precioPorPeso ?? false,
        sku: prodData.sku || `SKU-${Date.now().toString().slice(-4)}`,
        codigoBarras: prodData.codigoBarras || `750${Date.now().toString().slice(-9)}`,
        favorito: false,
        activo: true,
        presentaciones: prodData.presentaciones || [
          {
            tipo: 'pieza',
            nombre: prodData.precioPorPeso ? 'Por Kilo / Porción' : 'Pieza Individual',
            piezasEquivalentes: 1,
            precio: prodData.precioBase || 100,
            descripcionEquivalencia: prodData.precioPorPeso ? 'Venta por peso' : '1 pieza',
          },
        ],
      };
      mockProductos.unshift(nuevo);
      return nuevo;
    }
  },

  updateProducto: async (id: string, updates: Partial<Producto>): Promise<Producto> => {
    try {
      const updated = await apiService.updateProducto(id, updates);
      const idx = mockProductos.findIndex((p) => p.id === id);
      if (idx >= 0) mockProductos[idx] = updated;
      return updated;
    } catch {
      const idx = mockProductos.findIndex((p) => p.id === id);
      if (idx >= 0) {
        mockProductos[idx] = { ...mockProductos[idx], ...updates };
        return mockProductos[idx];
      }
      throw new Error('Producto no encontrado');
    }
  },

  deleteProducto: async (id: string): Promise<boolean> => {
    try {
      await apiService.deleteProducto(id);
      const idx = mockProductos.findIndex((p) => p.id === id);
      if (idx >= 0) {
        mockProductos[idx].activo = false;
      }
      return true;
    } catch {
      const idx = mockProductos.findIndex((p) => p.id === id);
      if (idx >= 0) {
        mockProductos[idx].activo = false;
        return true;
      }
      return false;
    }
  },

  getCategorias: async (): Promise<CategoriaItem[]> => {
    try {
      const list = await apiService.getCategorias();
      if (list && list.length > 0) return list;
    } catch {
      // Fallback
    }
    return [...mockCategorias];
  },

  createCategoria: async (catData: Partial<CategoriaItem>): Promise<CategoriaItem> => {
    try {
      const created = await apiService.createCategoria({
        nombre: catData.nombre || 'Nueva Categoría',
        icono: catData.icono || '🏷️',
        descripcion: catData.descripcion || '',
      });
      mockCategorias.push(created);
      return created;
    } catch {
      const newId = 'cat-' + (mockCategorias.length + 1);
      const nueva: CategoriaItem = {
        id: newId,
        nombre: catData.nombre || 'Nueva Categoría',
        icono: catData.icono || '🏷️',
        descripcion: catData.descripcion || '',
        activa: true,
      };
      mockCategorias.push(nueva);
      return nueva;
    }
  },

  updateCategoria: async (id: string, updates: Partial<CategoriaItem>): Promise<CategoriaItem> => {
    try {
      const updated = await apiService.updateCategoria(id, {
        nombre: updates.nombre || '',
        icono: updates.icono,
        descripcion: updates.descripcion,
      });
      const idx = mockCategorias.findIndex((c) => c.id === id);
      if (idx >= 0) mockCategorias[idx] = { ...mockCategorias[idx], ...updated };
      return updated;
    } catch {
      const idx = mockCategorias.findIndex((c) => c.id === id);
      if (idx >= 0) {
        mockCategorias[idx] = { ...mockCategorias[idx], ...updates };
        return mockCategorias[idx];
      }
      throw new Error('Categoría no encontrada');
    }
  },

  deleteCategoria: async (id: string): Promise<boolean> => {
    try {
      await apiService.deleteCategoria(id);
      const idx = mockCategorias.findIndex((c) => c.id === id);
      if (idx >= 0) {
        mockCategorias[idx].activa = false;
      }
      return true;
    } catch {
      const idx = mockCategorias.findIndex((c) => c.id === id);
      if (idx >= 0) {
        mockCategorias[idx].activa = false;
        return true;
      }
      return false;
    }
  },

  getDashboardResumen: async (rutaId?: string) => {
    try {
      return await apiService.getDashboardResumen(rutaId);
    } catch {
      return {
        ventasHoy: 0,
        cobranzaHoy: 0,
        creditoColocadoHoy: 0,
        efectivoEnCaja: 0,
        clientesVisitados: 0,
        clientesTotalRuta: 0,
        totalPiezasVendidas: 0,
        clienteCercano: undefined,
      };
    }
  },

  registrarVenta: async (venta: RegistrarVentaRequestDto) => {
    try {
      return await apiService.registrarVenta(venta);
    } catch (err: any) {
      // Simular respuesta local y encolar para sincronización
      const folio = `FOL-OFF-${Date.now().toString().slice(-4)}`;
      const cliente = mockClientes.find((c) => c.id === venta.clienteId);
      const creditoOtorgado = venta.pagos.find((p) => p.metodo === 'Crédito')?.monto || 0;
      if (cliente) {
        cliente.saldo += creditoOtorgado;
        cliente.estado = 'Venta realizada';
        cliente.ultimaCompra = 'Hoy (En cola sync)';
      }

      offlineSyncQueue.enqueue(
        'Venta',
        venta,
        `Venta a ${cliente?.nombre || 'Cliente'} (${venta.items.length} prods)`,
        folio,
        venta.total
      );

      return {
        folio,
        fechaHora: new Date().toISOString(),
        totalVenta: venta.total,
        totalPagado: venta.total - creditoOtorgado,
        creditoOtorgado,
        nuevoSaldoCliente: cliente ? cliente.saldo : 0,
        estado: 'Completada',
      };
    }
  },

  registrarAbono: async (abono: RegistrarAbonoRequestDto) => {
    try {
      const res = await apiService.registrarAbono(abono);
      const cliente = mockClientes.find((c) => c.id === abono.clienteId || (c as any).codigo === abono.clienteId);
      if (cliente) {
        cliente.saldo = (res as any)?.nuevoSaldo !== undefined ? (res as any).nuevoSaldo : Math.max(0, cliente.saldo - abono.monto);
        cliente.ultimoPago = `Hoy · $${abono.monto}`;
      }
      return res;
    } catch {
      const cliente = mockClientes.find((c) => c.id === abono.clienteId);
      if (cliente) {
        cliente.saldo = Math.max(0, cliente.saldo - abono.monto);
        cliente.ultimoPago = `Hoy · $${abono.monto} (En cola sync)`;
      }

      offlineSyncQueue.enqueue(
        'Abono',
        abono,
        `Abono de ${cliente?.nombre || 'Cliente'} - $${abono.monto}`,
        undefined,
        abono.monto
      );

      return {
        id: Math.floor(Math.random() * 1000),
        clienteId: abono.clienteId,
        montoAbonado: abono.monto,
        nuevoSaldo: cliente ? cliente.saldo : 0,
        fechaHora: new Date().toISOString(),
        mensaje: 'Abono guardado en cola local para sincronización',
      };
    }
  },

  getCortes: async (fecha?: string): Promise<CorteTrabajador[]> => {
    try {
      const live = await apiService.getCortes(fecha);
      if (live && live.length > 0) return live;
    } catch {
      // Fallback
    }
    return mockCortesTrabajadores;
  },

  getRevisionInventario: async (rutaId?: string): Promise<RevisionItem[]> => {
    try {
      const live = await apiService.getRevisionInventario(rutaId);
      if (live && live.length > 0) return live;
    } catch {
      // Fallback
    }
    return mockRevisionItems;
  },

  getRevisionItems: async (rutaId?: string): Promise<RevisionItem[]> => {
    try {
      const live = await apiService.getRevisionInventario(rutaId);
      if (live && live.length > 0) return live;
    } catch {
      // Fallback
    }
    return mockRevisionItems;
  },

  getResumenDia: async () => {
    try {
      const live = await apiService.getDashboardResumen();
      return {
        ventasTotales: live.ventasHoy,
        pedidosCount: live.totalPiezasVendidas,
        efectivoEnCaja: live.efectivoEnCaja,
        cobranzaDelDia: live.cobranzaHoy,
        clientesVisitados: live.clientesVisitados,
        clientesTotal: live.clientesTotalRuta,
        gastosTotal: 0,
      };
    } catch {
      return {
        ventasTotales: 0,
        pedidosCount: 0,
        efectivoEnCaja: 0,
        cobranzaDelDia: 0,
        clientesVisitados: 0,
        clientesTotal: 0,
        gastosTotal: 0,
      };
    }
  },

  autorizarRevision: async (req: AutorizarAjusteInventarioDto) => {
    const res = await apiService.autorizarRevisionInventario(req);
    if (req.ajustes) {
      req.ajustes.forEach(aj => {
        const prod = mockProductos.find(p => p.id === aj.productoId || p.sku === aj.productoId);
        if (prod) {
          prod.existencia = aj.cantidadFisica;
        }
      });
    }
    return res;
  },

  // ==========================================
  // Métodos Fase 3
  // ==========================================
  getGastos: async (fecha?: string, empleadoId?: string) => {
    try {
      const live = await apiService.getGastos(fecha, empleadoId);
      if (live) return live;
    } catch {
      // Fallback
    }
    return [
      { id: 1, empleadoId: '1', empleadoNombre: 'Miguel', concepto: 'Gasolina', importe: 350, metodoPago: 'Efectivo', observaciones: 'Carga inicial magna', fechaHora: new Date().toISOString() },
      { id: 2, empleadoId: '1', empleadoNombre: 'Miguel', concepto: 'Comida', importe: 120, metodoPago: 'Efectivo', observaciones: 'Almuerzo en ruta', fechaHora: new Date().toISOString() },
      { id: 3, empleadoId: '1', empleadoNombre: 'Miguel', concepto: 'Estacionamiento', importe: 45, metodoPago: 'Efectivo', observaciones: 'Estacionamiento mercado', fechaHora: new Date().toISOString() },
    ];
  },

  registrarGasto: async (req: { empleadoId: string; concepto: string; importe: number; metodoPago: string; observaciones?: string }) => {
    try {
      return await apiService.registrarGasto(req);
    } catch {
      return {
        id: Math.floor(Math.random() * 1000),
        empleadoId: req.empleadoId,
        empleadoNombre: 'Miguel',
        concepto: req.concepto,
        importe: req.importe,
        metodoPago: req.metodoPago,
        observaciones: req.observaciones,
        fechaHora: new Date().toISOString(),
      };
    }
  },

  getDevoluciones: async (clienteId?: string) => {
    try {
      const live = await apiService.getDevoluciones(clienteId);
      if (live) return live;
    } catch {
      // Fallback
    }
    return [
      { id: 1, folio: 'DEV-20260915-001', clienteId: 'c1', clienteNombre: 'ABTS ARENAS', productoId: 'p3', productoNombre: 'Jamón Virginia Pavo Zwan', cantidad: 1, presentacionTipo: 'pieza', total: 185, motivo: 'Caducado', destino: 'Merma', metodoReembolso: 'SaldoAFavor', fechaHora: new Date().toISOString() },
    ];
  },

  registrarDevolucion: async (req: { clienteId: string; empleadoId: string; productoId: string; cantidad: number; presentacionTipo: string; precioUnitario: number; total: number; motivo: string; destino: string; metodoReembolso: string; observaciones?: string }) => {
    try {
      return await apiService.registrarDevolucion(req);
    } catch {
      const cliente = mockClientes.find((c) => c.id === req.clienteId);
      if (cliente && req.metodoReembolso === 'SaldoAFavor') {
        cliente.saldo = Math.max(0, cliente.saldo - req.total);
      }
      return {
        id: Math.floor(Math.random() * 1000),
        folio: `DEV-MOCK-${Date.now().toString().slice(-4)}`,
        clienteId: req.clienteId,
        clienteNombre: cliente ? cliente.nombre : 'Cliente',
        productoId: req.productoId,
        productoNombre: 'Producto',
        cantidad: req.cantidad,
        presentacionTipo: req.presentacionTipo,
        total: req.total,
        motivo: req.motivo,
        destino: req.destino,
        metodoReembolso: req.metodoReembolso,
        fechaHora: new Date().toISOString(),
      };
    }
  },

  cerrarCorteCaja: async (req: { empleadoId: string; efectivoContado: number; observaciones?: string }) => {
    try {
      return await apiService.cerrarCorteCaja(req);
    } catch {
      return {
        message: 'Corte cerrado localmente',
        empleadoId: req.empleadoId,
        efectivoContado: req.efectivoContado,
        diferenciaCaja: 0,
        estado: 'Cerrado',
      };
    }
  },

  confirmarCargaInicial: async (req: { empleadoId: string; ubicacionDestino: string; lotes: { productoId: string; piezas: number }[] }) => {
    try {
      return await apiService.confirmarCargaInicial(req);
    } catch {
      return {
        message: 'Carga inicial confirmada localmente',
        piezasCargadas: req.lotes.reduce((s, l) => s + l.piezas, 0),
        ubicacion: req.ubicacionDestino,
      };
    }
  },

  // ==========================================
  // Reportes y Exportación (Fase 4)
  // ==========================================
  getReporteResumen: async (periodo: string = 'Semana', rutaId?: string) => {
    try {
      const live = await apiService.getReporteResumen(periodo, rutaId);
      if (live) return live;
    } catch {
      // Fallback
    }
    return {
      periodo,
      fechaInicio: new Date().toISOString(),
      fechaFin: new Date().toISOString(),
      ventasTotales: 84250,
      cobranzaTotal: 32000,
      creditoColocado: 14300,
      gastosTotal: 1545,
      utilidadEstimada: 28400,
      ticketPromedio: 1850,
      pedidosTotal: 45,
      clientesVisitados: 28,
      clientesTotalRuta: 35,
      efectividadVisitas: 80,
      topProductos: [
        { productoId: 'p1', nombre: 'Queso Castel Barra', cantidadVendida: 42, importeTotal: 8190 },
        { productoId: 'p3', nombre: 'Jamón Virginia Pavo Zwan', cantidadVendida: 35, importeTotal: 6475 },
        { productoId: 'p6', nombre: 'Queso Oaxaca Tradicional', cantidadVendida: 28, importeTotal: 5460 },
        { productoId: 'p4', nombre: 'Salchicha de Pavo San Rafael', cantidadVendida: 24, importeTotal: 3480 },
        { productoId: 'p2', nombre: 'Chiles Jalapeños La Costeña', cantidadVendida: 52, importeTotal: 1248 },
      ],
      metodosPago: {
        efectivo: 45200,
        transferencia: 18450,
        tarjeta: 6300,
        credito: 14300,
      },
    };
  },

  getExportCsvUrl: (periodo: string = 'Semana') => {
    return apiService.getExportCsvUrl(periodo);
  },

  // ==========================================
  // Sincronización Offline Bidireccional (Fase 5)
  // ==========================================
  syncAll: async () => {
    return await offlineSyncQueue.syncAll();
  },
  getSyncQueue: () => {
    return offlineSyncQueue.getQueue();
  },
  getSyncStats: () => {
    return offlineSyncQueue.getStats();
  },
  preloadCatalog: async () => {
    return await offlineSyncQueue.preloadCatalog();
  },
  checkSyncHealth: async () => {
    return await offlineSyncQueue.checkHealth();
  },
  subscribeToSyncQueue: (fn: (queue: any[]) => void) => {
    return offlineSyncQueue.subscribe(fn);
  },
  clearCompletedSync: () => {
    offlineSyncQueue.clearCompleted();
  },

  // ==========================================
  // Auditoría, Bitácora y Empleados (Fase 6)
  // ==========================================
  getBitacora: async (params?: { tipo?: string; modulo?: string; limite?: number }) => {
    try {
      const live = await apiService.getBitacora(params);
      if (live && live.length > 0) return live;
    } catch {
      // Fallback a bitacora local
    }
    return (bitacora as any[]).map((b: any) => ({
      id: parseInt(b.id) || Math.floor(Math.random() * 1000),
      fecha: b.fecha,
      hora: '12:00:00',
      fechaHora: new Date().toISOString(),
      tipo: 'Actividad',
      modulo: b.modulo,
      accion: b.accion,
      usuario: b.usuario,
      dispositivo: 'Terminal Móvil',
      detalle: '',
      estado: 'Exitoso',
    }));
  },

  registrarBitacora: async (evento: {
    tipo?: string;
    modulo?: string;
    accion: string;
    usuarioNombre?: string;
    dispositivo?: string;
    detalle?: string;
    estado?: string;
  }) => {
    try {
      return await apiService.registrarBitacora(evento);
    } catch {
      return { id: Date.now(), ...evento, fecha: new Date().toISOString().split('T')[0] };
    }
  },

  getEmpleados: async () => {
    try {
      const live = await apiService.getEmpleados();
      if (live && live.length > 0) return live;
    } catch {
      // Fallback
    }
    return empleados;
  },

  loginApi: async (req: { usuario: string; password: string; dispositivoId?: string }) => {
    const res = await apiService.login(req);
    if (res && res.token) {
      apiService.setAuthToken(res.token);
    }
    return res;
  },

  setAuthToken: (token: string | null) => {
    apiService.setAuthToken(token);
  },

  getAuthToken: () => {
    return apiService.getAuthToken();
  },
};

// Mantener compatibilidad absoluta con MockService
export const MockService = DataService;


