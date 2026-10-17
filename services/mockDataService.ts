import type {
  Producto,
  Cliente,
  PresentacionConfig,
  Categoria,
  CategoriaItem,
  RevisionItem,
  CorteTrabajador,
} from '@/types';
import { bitacora, empleados, initialProductos, initialClientes } from '@/constants/mockData';

export const mockEmpleados = empleados;
export const mockBitacora = bitacora;

// Cargar productos iniciales desde localStorage o constants
function getProductosIniciales(): Producto[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('miguel_mock_productos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch {}
  return [...initialProductos];
}

function getClientesIniciales(): Cliente[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('miguel_mock_clientes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    }
  } catch {}
  return [...initialClientes];
}

// ==========================================
// 1. PRODUCTOS CON PRESENTACIONES Y CONVERSIONES
// ==========================================
export const mockProductos: Producto[] = getProductosIniciales();

export function saveProductosToStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('miguel_mock_productos', JSON.stringify(mockProductos));
    }
  } catch (e) {
    console.error('Error saving productos to storage:', e);
  }
}

export let mockCategorias: CategoriaItem[] = [];

export let mockClientes: Cliente[] = getClientesIniciales();

export function saveClientesToStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('miguel_mock_clientes', JSON.stringify(mockClientes));
    }
  } catch (e) {
    console.error('Error saving clientes to storage:', e);
  }
}

function getVentasIniciales(): any[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('miguel_mock_ventas');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch {}
  return [];
}

export let mockVentas: any[] = getVentasIniciales();

export function saveVentasToStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('miguel_mock_ventas', JSON.stringify(mockVentas));
    }
  } catch (e) {
    console.error('Error saving ventas to storage:', e);
  }
}

function getGastosIniciales(): any[] {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem('miguel_mock_gastos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    }
  } catch {}
  return [];
}

export let mockGastos: any[] = getGastosIniciales();

export function saveGastosToStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('miguel_mock_gastos', JSON.stringify(mockGastos));
    }
  } catch (e) {
    console.error('Error saving gastos to storage:', e);
  }
}

export const mockRevisionItems: RevisionItem[] = [];

export const mockCortesTrabajadores: CorteTrabajador[] = [];

import { apiService, type RegistrarVentaRequestDto, type RegistrarAbonoRequestDto, type AutorizarAjusteInventarioDto } from './httpApiService';
import { offlineSyncQueue } from './offlineSyncQueueService';

function applyClienteFiltro(list: Cliente[], filtro?: string): Cliente[] {
  let result = [...list];
  if (filtro === 'Hoy') {
    result = result.filter((c) => (c.diasVisita || []).includes('Lun') || (c.diasVisita || []).includes('Mié'));
  } else if (filtro === 'Pendientes de cobro' || filtro === 'Con crédito') {
    result = result.filter((c) => (c.saldo || 0) > 0);
  } else if (filtro === 'Cercanos') {
    result = result.filter((c) => c.distanciaMock?.includes('m') && !c.distanciaMock?.includes('km'));
  }
  return result;
}

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
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('miguel_mock_clientes');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            mockClientes = parsed;
          }
        }
      }
    } catch {}

    try {
      const live = await apiService.getClientes({ filtro });
      if (Array.isArray(live) && live.length > 0) {
        const liveIds = new Set(live.map((c) => c.id));
        const localsOnly = mockClientes.filter((c) => !liveIds.has(c.id));
        mockClientes = [...localsOnly, ...live];
        saveClientesToStorage();
        return applyClienteFiltro(mockClientes, filtro);
      }
    } catch {
      // Fallback a memoria local
    }

    return applyClienteFiltro(mockClientes, filtro);
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
      saveClientesToStorage();
      return created;
    } catch {
      const newId = 'c' + Date.now();
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
        latitud: clienteData.latitud !== undefined ? clienteData.latitud : undefined,
        longitud: clienteData.longitud !== undefined ? clienteData.longitud : undefined,
        activo: true,
        historial: [],
        sugerido: [],
      };
      mockClientes.unshift(nuevo);
      saveClientesToStorage();
      return nuevo;
    }
  },

  updateCliente: async (id: string, updates: Partial<Cliente>): Promise<Cliente> => {
    try {
      const updated = await apiService.updateCliente(id, updates);
      const idx = mockClientes.findIndex((c) => c.id === id);
      if (idx >= 0) mockClientes[idx] = updated;
      saveClientesToStorage();
      return updated;
    } catch {
      const idx = mockClientes.findIndex((c) => c.id === id);
      if (idx >= 0) {
        mockClientes[idx] = { ...mockClientes[idx], ...updates };
        saveClientesToStorage();
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
        saveClientesToStorage();
      }
      return true;
    } catch {
      const idx = mockClientes.findIndex((c) => c.id === id);
      if (idx >= 0) {
        mockClientes[idx].activo = false;
        saveClientesToStorage();
        return true;
      }
      return false;
    }
  },

  createProducto: async (prodData: Partial<Producto>): Promise<Producto> => {
    try {
      const created = await apiService.createProducto(prodData);
      mockProductos.unshift(created);
      saveProductosToStorage();
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
      saveProductosToStorage();
      return nuevo;
    }
  },

  updateProducto: async (id: string, updates: Partial<Producto>): Promise<Producto> => {
    try {
      const updated = await apiService.updateProducto(id, updates);
      const idx = mockProductos.findIndex((p) => p.id === id);
      if (idx >= 0) mockProductos[idx] = updated;
      saveProductosToStorage();
      return updated;
    } catch {
      const idx = mockProductos.findIndex((p) => p.id === id);
      if (idx >= 0) {
        mockProductos[idx] = { ...mockProductos[idx], ...updates };
        saveProductosToStorage();
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
        saveProductosToStorage();
      }
      return true;
    } catch {
      const idx = mockProductos.findIndex((p) => p.id === id);
      if (idx >= 0) {
        mockProductos[idx].activo = false;
        saveProductosToStorage();
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

  getVentas: async (limit = 50) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('miguel_mock_ventas');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) mockVentas = parsed;
        }
      }
    } catch {}

    try {
      const live = await apiService.getVentas(limit);
      if (Array.isArray(live) && live.length > 0) return live;
    } catch {
      // Fallback
    }
    return [...mockVentas];
  },

  registrarVenta: async (venta: RegistrarVentaRequestDto) => {
    const folio = `FOL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Date.now().toString().slice(-4)}`;
    const cliente = mockClientes.find((c) => c.id === venta.clienteId);
    const creditoOtorgado = venta.pagos.find((p) => p.metodo === 'Crédito')?.monto || 0;
    if (cliente) {
      cliente.saldo += creditoOtorgado;
      cliente.estado = 'Venta realizada';
      cliente.ultimaCompra = 'Hoy';
      saveClientesToStorage();
    }

    const ventaRegistro = {
      id: Date.now(),
      folio,
      clienteId: venta.clienteId,
      cliente: cliente
        ? {
            id: cliente.id,
            nombre: cliente.nombre,
            propietario: cliente.propietario,
            direccion: cliente.direccion,
            ruta: cliente.ruta,
          }
        : { id: 0, nombre: 'Mostrador / General' },
      usuario: { id: 1, nombre: 'Miguel', rol: 'Administrador' },
      total: venta.total,
      subtotal: (venta as any).subtotal || venta.total,
      estado: 'Completada',
      fechaHora: new Date().toISOString(),
      detalles: (venta.items || []).map((it) => ({
        productoId: it.productoId,
        presentacionNombre: it.presentacionNombre || 'Pieza',
        cantidadPresentaciones: it.cantidadPresentaciones,
        precioUnitario: it.precioUnitario,
        subtotal: it.subtotal,
      })),
      pagos: venta.pagos,
    };

    try {
      const liveRes = await apiService.registrarVenta(venta);
      mockVentas.unshift(ventaRegistro);
      saveVentasToStorage();
      return liveRes;
    } catch (err: any) {
      mockVentas.unshift(ventaRegistro);
      saveVentasToStorage();

      offlineSyncQueue.enqueue(
        'Venta',
        venta,
        `Venta a ${cliente?.nombre || 'Cliente'} (${venta.items.length} prods)`,
        folio,
        venta.total
      );

      return {
        folio,
        fechaHora: ventaRegistro.fechaHora,
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
        saveClientesToStorage();
      }
      return res;
    } catch {
      const cliente = mockClientes.find((c) => c.id === abono.clienteId);
      if (cliente) {
        cliente.saldo = Math.max(0, cliente.saldo - abono.monto);
        cliente.ultimoPago = `Hoy · $${abono.monto} (En cola sync)`;
        saveClientesToStorage();
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
      const ventasHoyList = mockVentas.filter((v) => {
        try {
          return new Date(v.fechaHora).toDateString() === new Date().toDateString();
        } catch {
          return false;
        }
      });
      const ventasTotales = ventasHoyList.reduce((sum, v) => sum + (v.total || 0), 0);
      const totalPiezas = ventasHoyList.reduce(
        (sum, v) => sum + (v.detalles?.reduce((s: number, d: any) => s + (d.cantidadPresentaciones || 0), 0) || 0),
        0
      );
      const cobranzaDelDia = ventasHoyList.reduce((sum, v) => {
        const efectivo = v.pagos?.find((p: any) => p.metodo === 'Efectivo')?.monto || 0;
        return sum + efectivo;
      }, 0);
      const gastosTotal = mockGastos.reduce((sum, g) => sum + (g.importe || 0), 0);

      return {
        ventasTotales,
        pedidosCount: totalPiezas,
        efectivoEnCaja: Math.max(0, cobranzaDelDia - gastosTotal),
        cobranzaDelDia,
        clientesVisitados: mockClientes.filter((c) => c.estado === 'Venta realizada' || c.estado === 'Visitado').length,
        clientesTotal: mockClientes.length,
        gastosTotal,
      };
    }
  },

  autorizarRevision: async (req: AutorizarAjusteInventarioDto) => {
    const res = await apiService.autorizarRevisionInventario(req);
    if (req.ajustes) {
      req.ajustes.forEach((aj) => {
        const prod = mockProductos.find((p) => p.id === aj.productoId || p.sku === aj.productoId);
        if (prod) {
          prod.existencia = aj.cantidadFisica;
        }
      });
      saveProductosToStorage();
    }
    return res;
  },

  // ==========================================
  // Métodos Fase 3
  // ==========================================
  getGastos: async (fecha?: string, empleadoId?: string) => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = window.localStorage.getItem('miguel_mock_gastos');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) mockGastos = parsed;
        }
      }
    } catch {}

    try {
      const live = await apiService.getGastos(fecha, empleadoId);
      if (Array.isArray(live) && live.length > 0) return live;
    } catch {
      // Fallback
    }
    return [...mockGastos];
  },

  registrarGasto: async (req: { empleadoId: string; concepto: string; importe: number; metodoPago: string; observaciones?: string }) => {
    const nuevoGasto = {
      id: Date.now(),
      empleadoId: req.empleadoId,
      empleadoNombre: 'Miguel',
      concepto: req.concepto,
      importe: req.importe,
      metodoPago: req.metodoPago,
      observaciones: req.observaciones || '',
      fechaHora: new Date().toISOString(),
    };
    try {
      const liveRes = await apiService.registrarGasto(req);
      if (liveRes) {
        mockGastos.unshift(liveRes);
        saveGastosToStorage();
        return liveRes;
      }
    } catch {
      // Fallback local
    }
    mockGastos.unshift(nuevoGasto);
    saveGastosToStorage();
    return nuevoGasto;
  },

  getDevoluciones: async (clienteId?: string) => {
    try {
      const live = await apiService.getDevoluciones(clienteId);
      if (Array.isArray(live) && live.length > 0) return live;
    } catch {
      // Fallback
    }
    return [];
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
    const ventasTotales = mockVentas.reduce((sum, v) => sum + (v.total || 0), 0);
    const gastosTotal = mockGastos.reduce((sum, g) => sum + (g.importe || 0), 0);
    const pedidosTotal = mockVentas.length;
    const ticketPromedio = pedidosTotal > 0 ? Math.round(ventasTotales / pedidosTotal) : 0;
    const visitadosSet = new Set(mockVentas.map((v) => v.clienteId).filter(Boolean));
    const clientesVisitados = visitadosSet.size;
    const clientesTotalRuta = mockClientes.length;
    const efectividadVisitas = clientesTotalRuta > 0 ? Math.round((clientesVisitados / clientesTotalRuta) * 100) : 0;

    let efectivo = 0;
    let transferencia = 0;
    let tarjeta = 0;
    let credito = 0;

    for (const v of mockVentas) {
      for (const p of v.pagos || []) {
        const met = (p.metodo || '').toLowerCase();
        const m = Number(p.monto) || 0;
        if (met.includes('efectivo')) efectivo += m;
        else if (met.includes('transf')) transferencia += m;
        else if (met.includes('tarj')) tarjeta += m;
        else if (met.includes('crédito') || met.includes('credito')) credito += m;
        else efectivo += m;
      }
    }

    const cobranzaTotal = efectivo + transferencia + tarjeta;
    const utilidadEstimada = Math.max(0, ventasTotales - gastosTotal);

    // Calcular top productos dinámicamente
    const prodsMap: { [id: string]: { productoId: string; nombre: string; cantidadVendida: number; importeTotal: number } } = {};
    for (const v of mockVentas) {
      for (const det of v.detalles || []) {
        const id = det.productoId || det.id;
        if (!id) continue;
        if (!prodsMap[id]) {
          prodsMap[id] = {
            productoId: id,
            nombre: det.presentacionNombre || det.nombre || `Producto ${id}`,
            cantidadVendida: 0,
            importeTotal: 0,
          };
        }
        prodsMap[id].cantidadVendida += (det.cantidadPresentaciones || det.piezasTotales || 1);
        prodsMap[id].importeTotal += (det.subtotal || 0);
      }
    }

    const topProductos = Object.values(prodsMap)
      .sort((a, b) => b.importeTotal - a.importeTotal)
      .slice(0, 5);

    return {
      periodo,
      fechaInicio: new Date().toISOString(),
      fechaFin: new Date().toISOString(),
      ventasTotales,
      cobranzaTotal,
      creditoColocado: credito,
      gastosTotal,
      utilidadEstimada,
      ticketPromedio,
      pedidosTotal,
      clientesVisitados,
      clientesTotalRuta,
      efectividadVisitas,
      topProductos,
      metodosPago: {
        efectivo,
        transferencia,
        tarjeta,
        credito,
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
    usuario?: string;
    usuarioNombre?: string;
    dispositivo?: string;
    detalle?: string;
    estado?: string;
  }) => {
    try {
      const payload = {
        ...evento,
        usuarioNombre: evento.usuarioNombre || evento.usuario || 'Sistema',
      };
      return await apiService.registrarBitacora(payload);
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
    try {
      const live = await apiService.surtirNotaPdf(req);
      if (live) return live;
    } catch {
      // Fallback a memoria local / offline cuando la API no esté disponible
    }

    let totalPiezas = 0;
    let actualizados = 0;
    const items = req.items || [];

    for (const item of items) {
      const pzas = item.piezasASurtir > 0 ? item.piezasASurtir : (item.piezasCalculadas || item.cantidadNota || 0);
      if (pzas <= 0) continue;

      let prod = mockProductos.find(
        (p) =>
          (item.productoId && p.id === String(item.productoId)) ||
          (item.productoIdApp && p.id === String(item.productoIdApp))
      );

      if (!prod && item.productoAlmacen) {
        const almNorm = item.productoAlmacen.trim().toLowerCase();
        prod = mockProductos.find(
          (p) =>
            (p.nombreAlmacen || '').trim().toLowerCase() === almNorm ||
            p.nombre.trim().toLowerCase() === almNorm
        );
      }

      if (prod) {
        prod.existencia = (prod.existencia || 0) + pzas;
        if (item.recordarVinculacion && item.productoAlmacen) {
          prod.nombreAlmacen = item.productoAlmacen.trim();
        }
        actualizados++;
        totalPiezas += pzas;
      } else if (item.productoAlmacen) {
        // Auto-crear producto en catálogo local si no existe
        const isKg = (item.um || '').toUpperCase() === 'KG';
        const nuevoProd: Producto = {
          id: 'p' + (mockProductos.length + 100),
          nombre: item.productoAlmacen.trim(),
          nombreAlmacen: item.productoAlmacen.trim(),
          categoria: isKg ? 'Jamón' : 'Abarrotes',
          unidad: isKg ? 'kg' : 'pieza',
          precioBase: 50,
          existencia: pzas,
          precioPorPeso: isKg,
        };
        mockProductos.unshift(nuevoProd);
        actualizados++;
        totalPiezas += pzas;
      }
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem('miguel_mock_productos', JSON.stringify(mockProductos));
      }
    } catch {}

    return {
      message: `Nota #${req.folioNota || 'S/N'} procesada con éxito: ${totalPiezas} piezas surtidas en ${actualizados} productos.`,
      folio: req.folioNota || 'S/N',
      totalPiezas,
      productosSurtidos: actualizados,
    };
  },

  // Rutas (ABC)
  getRutas: async (activa?: boolean) => {
    try {
      const live = await apiService.getRutas(activa);
      if (live && live.length > 0) return live;
    } catch {
      // Fallback
    }
    return [
      { id: 1, nombre: 'Ruta Centro', descripcion: 'Zona Centro, San Juan de Dios, Madero', activa: true, totalClientes: 0, vendedorAsignado: 'Miguel' },
      { id: 2, nombre: 'Ruta Norte', descripcion: 'Echeveste, Delta, Coecillo Norte', activa: true, totalClientes: 0, vendedorAsignado: 'Juan Pérez' },
      { id: 3, nombre: 'Ruta Sur', descripcion: 'León Moderno, San Jerónimo, Sur', activa: true, totalClientes: 0, vendedorAsignado: 'Pedro Ramírez' },
    ];
  },

  createRuta: async (req: { nombre: string; descripcion?: string; activa?: boolean }) => {
    return await apiService.createRuta(req);
  },

  updateRuta: async (id: number, req: { nombre?: string; descripcion?: string; activa?: boolean }) => {
    return await apiService.updateRuta(id, req);
  },

  deleteRuta: async (id: number) => {
    return await apiService.deleteRuta(id);
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


