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
export const mockProductos: Producto[] = [];

export let mockCategorias: CategoriaItem[] = [];

export let mockClientes: Cliente[] = [];

export const mockRevisionItems: RevisionItem[] = [];

export const mockCortesTrabajadores: CorteTrabajador[] = [];

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
      if (Array.isArray(live)) return live;
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
      if (Array.isArray(live)) return live;
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
      if (Array.isArray(list)) return list;
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
      if (Array.isArray(live)) return live;
    } catch {
      // Fallback
    }
    return mockCortesTrabajadores;
  },

  getRevisionInventario: async (rutaId?: string): Promise<RevisionItem[]> => {
    try {
      const live = await apiService.getRevisionInventario(rutaId);
      if (Array.isArray(live)) return live;
    } catch {
      // Fallback
    }
    return mockRevisionItems;
  },

  getRevisionItems: async (rutaId?: string): Promise<RevisionItem[]> => {
    try {
      const live = await apiService.getRevisionInventario(rutaId);
      if (Array.isArray(live)) return live;
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

  createEmpleado: async (req: any) => {
    try {
      return await apiService.createEmpleado(req);
    } catch {
      const nuevo = {
        id: 'e' + Date.now(),
        nombre: req.nombre,
        usuario: req.usuario,
        rol: req.rol || 'Vendedor',
        ruta: req.rutaAsignada || 'Ruta Centro',
        telefono: req.telefono || '',
        estado: 'Activo' as const,
        ventasHoy: 0,
        cobranzaHoy: 0,
        clientesVisitados: 0,
        permisos: req.permisos,
      };
      return nuevo;
    }
  },

  updateEmpleado: async (id: string, req: any) => {
    try {
      return await apiService.updateEmpleado(id, req);
    } catch {
      return { id, ...req };
    }
  },

  deleteEmpleado: async (id: string) => {
    try {
      return await apiService.deleteEmpleado(id);
    } catch {
      return true;
    }
  },

  surtirNotaPdf: async (req: any) => {
    return await apiService.surtirNotaPdf(req);
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


