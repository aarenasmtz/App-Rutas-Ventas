import { Platform } from 'react-native';
import type {
  Producto,
  Cliente,
  CorteTrabajador,
  RevisionItem,
  Empleado,
  SurtidoNotaPdfRequest,
  RutaItem,
} from '@/types';

// Determinación inteligente de la URL base (soporta variables de entorno de Cloudflare Pages y VPS)
export const CLOUD_API_URL = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) 
  ? process.env.EXPO_PUBLIC_API_URL 
  : 'https://statutory-edges-exploration-camps.trycloudflare.com/api/v1';

export const getDefaultApiBaseUrl = (): string => {
  return CLOUD_API_URL;
};

export let API_BASE_URL = getDefaultApiBaseUrl();

export const setApiBaseUrl = (url: string) => {
  API_BASE_URL = url.replace(/\/+$/, '');
};

// DTOs para Request y Response según contratos Fase 2
export interface LoginRequestDto {
  usuario: string;
  password: string;
  dispositivoId?: string;
}

export interface LoginResponseDto {
  token: string;
  refreshToken: string;
  usuario: {
    id: string;
    nombre: string;
    rol: string;
    rutaId: string;
    rutaNombre: string;
  };
}

export interface DashboardResumenDto {
  ventasHoy: number;
  cobranzaHoy: number;
  creditoColocadoHoy: number;
  efectivoEnCaja: number;
  clientesVisitados: number;
  clientesTotalRuta: number;
  totalPiezasVendidas: number;
  clienteCercano?: {
    id: string;
    nombre: string;
    propietario: string;
    saldo: number;
    distanciaMetros: number;
  };
}

export interface RegistrarVentaRequestDto {
  clienteId: string;
  empleadoId: string;
  total: number;
  items: {
    productoId: string;
    presentacionTipo: string;
    presentacionNombre?: string;
    factorConversion?: number;
    cantidadPresentaciones: number;
    piezasTotalesCalculadas: number;
    precioUnitario: number;
    subtotal: number;
  }[];
  pagos: {
    metodo: string;
    monto: number;
  }[];
}

export interface VentaRegistradaResponseDto {
  folio: string;
  fechaHora: string;
  totalVenta: number;
  totalPagado: number;
  creditoOtorgado: number;
  nuevoSaldoCliente: number;
  estado: string;
}

export interface RegistrarAbonoRequestDto {
  clienteId: string;
  monto: number;
  metodoPago: string;
  comentario?: string;
  empleadoId?: string;
}

export interface AbonoRegistradoResponseDto {
  id: number;
  clienteId: string;
  montoAbonado: number;
  nuevoSaldo: number;
  fechaHora: string;
  mensaje: string;
}

export interface AutorizarAjusteInventarioDto {
  empleadoId: string;
  fechaRevision: string;
  ajustes: {
    productoId: string;
    cantidadSistema: number;
    cantidadFisica: number;
    diferencia: number;
    motivo: string;
  }[];
}

class HttpApiService {
  private timeoutMs = 4000;
  private authToken: string | null = null;

  setAuthToken(token: string | null) {
    this.authToken = token;
    if (typeof window !== 'undefined' && window.localStorage) {
      if (token) localStorage.setItem('rtv_auth_token', token);
      else localStorage.removeItem('rtv_auth_token');
    }
  }

  getAuthToken(): string | null {
    if (!this.authToken && typeof window !== 'undefined' && window.localStorage) {
      this.authToken = localStorage.getItem('rtv_auth_token');
    }
    return this.authToken;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const token = this.getAuthToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(options?.headers as any || {}),
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        let errDetail = '';
        try {
          const jsonErr = await res.json();
          errDetail = jsonErr.message || JSON.stringify(jsonErr);
        } catch {
          errDetail = await res.text();
        }
        throw new Error(`HTTP ${res.status}: ${errDetail || res.statusText}`);
      }

      return (await res.json()) as T;
    } catch (err: any) {
      clearTimeout(timer);
      throw err;
    }
  }

  // Health check rápido
  async checkHealth(): Promise<boolean> {
    try {
      const base = API_BASE_URL.replace('/api/v1', '');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${base}/api/health`, { signal: controller.signal });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  }

  // Autenticación
  async login(credenciales: LoginRequestDto): Promise<LoginResponseDto> {
    return this.request<LoginResponseDto>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credenciales),
    });
  }

  // Dashboard
  async getDashboardResumen(rutaId?: string): Promise<DashboardResumenDto> {
    const query = rutaId ? `?rutaId=${encodeURIComponent(rutaId)}` : '';
    return this.request<DashboardResumenDto>(`/dashboard/resumen${query}`);
  }

  // Productos
  async getProductos(params?: { categoria?: string; search?: string; activo?: boolean }): Promise<Producto[]> {
    const qs = new URLSearchParams();
    if (params?.categoria && params.categoria !== 'Todas') qs.append('categoria', params.categoria);
    if (params?.search) qs.append('search', params.search);
    if (params?.activo !== undefined) qs.append('activo', params.activo.toString());
    const queryStr = qs.toString() ? `?${qs.toString()}` : '';

    const list = await this.request<any[]>(`/productos${queryStr}`);
    // Mapear al modelo Producto de frontend según concepto de venta de Miguel
    return list.map((p) => {
      const isMultipres = Boolean(
        p.manejaMultiplesPresentaciones ||
        (p.presentaciones && p.presentaciones.length > 1) ||
        p.unidad === 'paquete'
      );
      const catLower = (p.categoria || '').toLowerCase();
      const nomLower = (p.nombre || '').toLowerCase();
      const isWeight = !isMultipres && (
        p.precioPorPeso === true ||
        p.unidad === 'kg' ||
        ['jamón', 'jamon', 'salchicha', 'chorizo', 'carnes frías', 'carnes frias'].includes(catLower) ||
        nomLower.includes('jamón') ||
        nomLower.includes('jamon') ||
        nomLower.includes('salchicha') ||
        nomLower.includes('chorizo') ||
        nomLower.includes('tocino') ||
        nomLower.includes('pepperoni')
      );

      return {
        id: p.id,
        nombre: p.nombre,
        nombreAlmacen: p.nombreAlmacen || '',
        marca: p.marca || '',
        categoria: p.categoria,
        unidad: (p.unidad || (isWeight ? 'kg' : 'pieza')) as any,
        precioBase: p.precioBase,
        precioCompra: p.precioCompra || 0,
        existencia: p.existenciaPiezas,
        precioPorPeso: isWeight,
        manejaMultiplesPresentaciones: isMultipres,
        sku: p.sku || p.id,
        codigoBarras: p.codigoBarras || '',
        favorito: p.favorito,
        activo: p.activo,
        presentaciones: p.presentaciones || [],
      };
    });
  }

  // Clientes
  async getClientes(params?: { filtro?: string; search?: string }): Promise<Cliente[]> {
    const qs = new URLSearchParams();
    if (params?.filtro && params.filtro !== 'Todos') qs.append('filtro', params.filtro);
    if (params?.search) qs.append('search', params.search);
    const queryStr = qs.toString() ? `?${qs.toString()}` : '';

    const list = await this.request<any[]>(`/clientes${queryStr}`);
    return list.map((c) => ({
      id: c.id,
      nombre: c.nombre,
      propietario: c.propietario,
      direccion: c.direccion,
      ruta: c.ruta,
      diasVisita: c.diasVisita || ['Lun', 'Mié', 'Vie'],
      saldo: c.saldo,
      limiteCredito: c.limiteCredito,
      estado: c.estadoVisita === 'Visitado' || c.estadoVisita === 'Venta realizada' ? 'Venta realizada' : 'Pendiente',
      ultimaVisita: c.ultimaCompra || '',
      telefono: c.telefono || '',
      distanciaMock: c.distanciaMock || '150m',
      latitud: c.latitud,
      longitud: c.longitud,
      colonia: c.colonia,
      ciudad: c.ciudad || 'León, Gto',
      ultimaCompra: c.ultimaCompra || 'Sin compras recientes',
      ultimoPago: c.ultimoPago || 'Sin pagos recientes',
      sugerido: [],
      historial: [],
    }));
  }

  async getClienteById(id: string): Promise<Cliente> {
    const c = await this.request<any>(`/clientes/${encodeURIComponent(id)}`);
    return {
      id: c.id,
      nombre: c.nombre,
      propietario: c.propietario,
      direccion: c.direccion,
      ruta: c.ruta,
      diasVisita: c.diasVisita || ['Lun', 'Mié', 'Vie'],
      saldo: c.saldo,
      limiteCredito: c.limiteCredito,
      estado: c.estadoVisita === 'Visitado' || c.estadoVisita === 'Venta realizada' ? 'Venta realizada' : 'Pendiente',
      ultimaVisita: c.ultimaCompra || '',
      telefono: c.telefono || '',
      distanciaMock: c.distanciaMock || '150m',
      latitud: c.latitud,
      longitud: c.longitud,
      colonia: c.colonia,
      ciudad: c.ciudad || 'León, Gto',
      ultimaCompra: c.ultimaCompra || 'Sin compras recientes',
      ultimoPago: c.ultimoPago || 'Sin pagos recientes',
      sugerido: [],
      historial: [],
    };
  }

  async createCliente(cliente: Partial<Cliente>): Promise<Cliente> {
    const c = await this.request<any>('/clientes', {
      method: 'POST',
      body: JSON.stringify({
        codigo: cliente.id,
        nombre: cliente.nombre,
        propietario: cliente.propietario,
        direccion: cliente.direccion,
        colonia: cliente.colonia,
        ciudad: cliente.ciudad,
        telefono: cliente.telefono,
        ruta: cliente.ruta || 'Ruta Centro',
        saldo: cliente.saldo ?? 0,
        limiteCredito: cliente.limiteCredito ?? 5000,
        diasVisita: cliente.diasVisita || ['Lun', 'Mié', 'Vie'],
        distanciaMock: cliente.distanciaMock || '500m',
        latitud: cliente.latitud,
        longitud: cliente.longitud,
      }),
    });
    return {
      id: c.id,
      nombre: c.nombre,
      propietario: c.propietario,
      direccion: c.direccion,
      colonia: c.colonia || cliente.colonia,
      ciudad: c.ciudad || cliente.ciudad || 'León, Gto',
      latitud: c.latitud ?? cliente.latitud,
      longitud: c.longitud ?? cliente.longitud,
      ruta: c.ruta,
      diasVisita: c.diasVisita || ['Lun', 'Mié', 'Vie'],
      saldo: c.saldo,
      limiteCredito: c.limiteCredito,
      estado: 'Pendiente',
      ultimaVisita: '',
      telefono: c.telefono || '',
      distanciaMock: c.distanciaMock || '500m',
      sugerido: [],
      historial: [],
    };
  }

  async updateCliente(id: string, cliente: Partial<Cliente>): Promise<Cliente> {
    const c = await this.request<any>(`/clientes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        nombre: cliente.nombre,
        propietario: cliente.propietario,
        direccion: cliente.direccion,
        colonia: cliente.colonia,
        ciudad: cliente.ciudad,
        telefono: cliente.telefono,
        ruta: cliente.ruta,
        saldo: cliente.saldo,
        limiteCredito: cliente.limiteCredito,
        diasVisita: cliente.diasVisita,
        distanciaMock: cliente.distanciaMock,
        latitud: cliente.latitud,
        longitud: cliente.longitud,
      }),
    });
    return {
      id: c.id,
      nombre: c.nombre,
      propietario: c.propietario,
      direccion: c.direccion,
      colonia: c.colonia || cliente.colonia,
      ciudad: c.ciudad || cliente.ciudad || 'León, Gto',
      latitud: c.latitud ?? cliente.latitud,
      longitud: c.longitud ?? cliente.longitud,
      ruta: c.ruta,
      diasVisita: c.diasVisita || ['Lun', 'Mié', 'Vie'],
      saldo: c.saldo,
      limiteCredito: c.limiteCredito,
      estado: 'Pendiente',
      ultimaVisita: '',
      telefono: c.telefono || '',
      distanciaMock: c.distanciaMock || '500m',
      sugerido: [],
      historial: [],
    };
  }

  async deleteCliente(id: string): Promise<boolean> {
    await this.request<any>(`/clientes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return true;
  }

  // ABC Productos
  async createProducto(prod: Partial<Producto>): Promise<Producto> {
    const isMultipres = Boolean(
      prod.manejaMultiplesPresentaciones ||
      (prod.presentaciones && prod.presentaciones.length > 1) ||
      prod.unidad === 'paquete'
    );
    const p = await this.request<any>('/productos', {
      method: 'POST',
      body: JSON.stringify({
        nombre: prod.nombre,
        nombreAlmacen: prod.nombreAlmacen,
        marca: prod.marca,
        categoria: prod.categoria || 'Abarrotes',
        unidad: prod.unidad || (prod.precioPorPeso ? 'kg' : 'pieza'),
        precioBase: prod.precioBase || 0,
        precioCompra: prod.precioCompra || 0,
        existenciaPiezas: prod.existencia || 0,
        sku: prod.sku,
        codigoBarras: prod.codigoBarras,
        favorito: prod.favorito ?? false,
        manejaMultiplesPresentaciones: isMultipres,
        presentaciones: prod.presentaciones || [],
      }),
    });
    return {
      id: p.id,
      nombre: p.nombre,
      nombreAlmacen: p.nombreAlmacen || prod.nombreAlmacen || '',
      marca: p.marca || '',
      categoria: p.categoria,
      unidad: p.unidad || (p.precioPorPeso ? 'kg' : 'pieza'),
      precioBase: p.precioBase,
      precioCompra: p.precioCompra || 0,
      existencia: p.existenciaPiezas ?? p.existencia ?? 0,
      precioPorPeso: isMultipres ? false : (p.precioPorPeso ?? (p.unidad === 'kg')),
      manejaMultiplesPresentaciones: p.manejaMultiplesPresentaciones ?? isMultipres,
      sku: p.sku || p.id,
      codigoBarras: p.codigoBarras || '',
      favorito: p.favorito,
      activo: p.activo,
      presentaciones: p.presentaciones || [],
    };
  }

  async updateProducto(id: string, prod: Partial<Producto>): Promise<Producto> {
    const isMultipres = Boolean(
      prod.manejaMultiplesPresentaciones ||
      (prod.presentaciones && prod.presentaciones.length > 1) ||
      prod.unidad === 'paquete'
    );
    const p = await this.request<any>(`/productos/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({
        nombre: prod.nombre,
        nombreAlmacen: prod.nombreAlmacen,
        marca: prod.marca,
        categoria: prod.categoria,
        unidad: prod.unidad || (prod.precioPorPeso ? 'kg' : 'pieza'),
        precioBase: prod.precioBase,
        precioCompra: prod.precioCompra,
        existenciaPiezas: prod.existencia,
        sku: prod.sku,
        codigoBarras: prod.codigoBarras,
        favorito: prod.favorito,
        manejaMultiplesPresentaciones: isMultipres,
        presentaciones: prod.presentaciones,
      }),
    });
    return {
      id: p.id || id,
      nombre: p.nombre || prod.nombre || '',
      nombreAlmacen: p.nombreAlmacen || prod.nombreAlmacen || '',
      marca: p.marca || prod.marca || '',
      categoria: p.categoria || prod.categoria || '',
      unidad: p.unidad || prod.unidad || (prod.precioPorPeso ? 'kg' : 'pieza'),
      precioBase: p.precioBase ?? prod.precioBase ?? 0,
      precioCompra: p.precioCompra ?? prod.precioCompra ?? 0,
      existencia: p.existenciaPiezas ?? p.existencia ?? prod.existencia ?? 0,
      precioPorPeso: isMultipres ? false : (p.precioPorPeso ?? prod.precioPorPeso ?? (p.unidad === 'kg')),
      manejaMultiplesPresentaciones: p.manejaMultiplesPresentaciones ?? isMultipres,
      sku: p.sku || prod.sku || id,
      codigoBarras: p.codigoBarras || prod.codigoBarras || '',
      favorito: p.favorito ?? prod.favorito ?? false,
      activo: p.activo ?? prod.activo ?? true,
      presentaciones: p.presentaciones || prod.presentaciones || [],
    };
  }

  async deleteProducto(id: string): Promise<boolean> {
    await this.request<any>(`/productos/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return true;
  }

  // Categorías
  async getCategorias(): Promise<any[]> {
    return this.request<any[]>('/categorias');
  }

  async createCategoria(cat: { nombre: string; icono?: string; descripcion?: string }): Promise<any> {
    return this.request<any>('/categorias', {
      method: 'POST',
      body: JSON.stringify(cat),
    });
  }

  async updateCategoria(id: string, cat: { nombre: string; icono?: string; descripcion?: string }): Promise<any> {
    return this.request<any>(`/categorias/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(cat),
    });
  }

  async deleteCategoria(id: string): Promise<boolean> {
    await this.request<any>(`/categorias/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return true;
  }

  // Registrar Venta
  async registrarVenta(req: RegistrarVentaRequestDto): Promise<VentaRegistradaResponseDto> {
    return this.request<VentaRegistradaResponseDto>('/ventas', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  // Obtener Historial de Ventas
  async getVentas(limit = 50): Promise<any[]> {
    return this.request<any[]>(`/ventas?limit=${limit}`);
  }

  // Cobranza / Abonos
  async registrarAbono(req: RegistrarAbonoRequestDto): Promise<AbonoRegistradoResponseDto> {
    return this.request<AbonoRegistradoResponseDto>('/cobranza/abonos', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  // Inventario
  async getInventario(ubicacion?: string): Promise<any> {
    const q = ubicacion ? `?ubicacion=${encodeURIComponent(ubicacion)}` : '';
    return this.request<any>(`/inventario${q}`);
  }

  // Cortes diarios por trabajador
  async getCortes(fecha?: string): Promise<CorteTrabajador[]> {
    const q = fecha ? `?fecha=${encodeURIComponent(fecha)}` : '';
    const list = await this.request<any[]>(`/cortes/diario${q}`);
    return list.map((c) => ({
      empleadoId: c.empleadoId,
      nombre: c.nombre,
      ruta: c.ruta,
      ventasTotales: c.ventasTotales,
      efectivo: c.efectivo,
      transferencias: c.transferencias,
      tarjetas: c.tarjetas,
      credito: c.credito,
      abonosCobranza: c.abonosCobranza,
      gastos: c.gastos,
      devoluciones: c.devoluciones,
      efectivoEsperado: c.efectivoEsperado,
      inventarioInicialPiezas: c.inventarioInicialPiezas,
      inventarioActualPiezas: c.inventarioActualPiezas,
      piezasVendidas: c.piezasVendidas,
      diferenciaCaja: c.diferenciaCaja,
    }));
  }

  // Revisión rápida de inventario
  async getRevisionInventario(rutaId?: string): Promise<RevisionItem[]> {
    const q = rutaId ? `?rutaId=${encodeURIComponent(rutaId)}` : '';
    const list = await this.request<any[]>(`/inventario/revision${q}`);
    return list.map((item) => ({
      productoId: item.productoId,
      productoNombre: item.productoNombre,
      marca: item.marca || '',
      sistema: item.sistema,
      fisico: item.fisico,
      unidad: 'piezas',
      diferencia: item.diferencia,
      revisado: item.revisado,
      comentario: item.comentario || '',
    }));
  }

  async autorizarRevisionInventario(req: AutorizarAjusteInventarioDto): Promise<any> {
    return this.request<any>('/inventario/revision/autorizar', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  // ==========================================
  // Métodos Fase 3: Gastos, Devoluciones, Corte y Carga
  // ==========================================
  async getGastos(fecha?: string, empleadoId?: string): Promise<GastoDto[]> {
    const qs = new URLSearchParams();
    if (fecha) qs.append('fecha', fecha);
    if (empleadoId) qs.append('empleadoId', empleadoId);
    const q = qs.toString() ? `?${qs.toString()}` : '';
    return this.request<GastoDto[]>(`/gastos${q}`);
  }

  async registrarGasto(req: RegistrarGastoRequestDto): Promise<GastoDto> {
    return this.request<GastoDto>('/gastos', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async getDevoluciones(clienteId?: string): Promise<DevolucionDto[]> {
    const q = clienteId ? `?clienteId=${encodeURIComponent(clienteId)}` : '';
    return this.request<DevolucionDto[]>(`/devoluciones${q}`);
  }

  async registrarDevolucion(req: RegistrarDevolucionRequestDto): Promise<DevolucionDto> {
    return this.request<DevolucionDto>('/devoluciones', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async cerrarCorteCaja(req: CerrarCorteCajaRequestDto): Promise<any> {
    return this.request<any>('/cortes/cerrar', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async confirmarCargaInicial(req: ConfirmarCargaInicialRequestDto): Promise<any> {
    return this.request<any>('/inventario/carga-inicial', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  // Reportes y Exportación (Fase 4)
  async getReporteResumen(periodo: string = 'Semana', rutaId?: string): Promise<ReporteResumenDto> {
    const qs = new URLSearchParams();
    qs.append('periodo', periodo);
    if (rutaId) qs.append('rutaId', rutaId);
    return this.request<ReporteResumenDto>(`/reportes/resumen?${qs.toString()}`);
  }

  getExportCsvUrl(periodo: string = 'Semana'): string {
    return `${API_BASE_URL}/reportes/export/csv?periodo=${encodeURIComponent(periodo)}`;
  }

  // Sincronización Offline Bidireccional (Fase 5)
  async syncBatch(req: SyncBatchRequestDto): Promise<SyncBatchResponseDto> {
    return this.request<SyncBatchResponseDto>('/sync/batch', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async pullCatalog(): Promise<SyncPullCatalogResponseDto> {
    return this.request<SyncPullCatalogResponseDto>('/sync/pull');
  }

  async getSyncStatus(): Promise<any> {
    return this.request<any>('/sync/status');
  }

  // Bitácora y Auditoría (Fase 6)
  async getBitacora(params?: { tipo?: string; modulo?: string; limite?: number }): Promise<any[]> {
    const qs = new URLSearchParams();
    if (params?.tipo && params.tipo !== 'Todos') qs.append('tipo', params.tipo);
    if (params?.modulo && params.modulo !== 'Todos') qs.append('modulo', params.modulo);
    if (params?.limite) qs.append('limite', params.limite.toString());
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return this.request<any[]>(`/bitacora${query}`);
  }

  async registrarBitacora(evento: {
    tipo?: string;
    modulo?: string;
    accion: string;
    usuario?: string;
    usuarioNombre?: string;
    usuarioId?: number;
    dispositivo?: string;
    detalle?: string;
    estado?: string;
  }): Promise<any> {
    return this.request<any>('/bitacora', {
      method: 'POST',
      body: JSON.stringify(evento),
    });
  }

  async getBitacoraResumen(): Promise<any> {
    return this.request<any>('/bitacora/resumen');
  }

  // Surtido de Inventario por Nota de Compra PDF
  async surtirNotaPdf(request: SurtidoNotaPdfRequest): Promise<any> {
    return this.request<any>('/inventario/surtido-nota', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  // Empleados y Permisos
  async getEmpleados(): Promise<Empleado[]> {
    const list = await this.request<any[]>('/empleados');
    return list.map((e) => ({
      id: e.id?.toString() || '',
      nombre: e.nombre || '',
      usuario: e.usuario || '',
      rol: e.rol || 'Vendedor',
      ruta: e.ruta || '',
      telefono: e.telefono || '',
      pin: e.pin || '',
      estado: e.estado || 'Activo',
      ventasHoy: e.ventasHoy ?? 0,
      cobranzaHoy: e.cobranzaHoy ?? 0,
      clientesVisitados: e.clientesVisitados ?? 0,
      permisos: e.permisos || {
        puedeVender: true,
        puedeVerClientes: true,
        puedeCrearClientes: true,
        puedeVerProductos: true,
        soloLecturaInventario: true,
        puedeCobrar: true,
      },
    }));
  }

  async getEmpleadoById(id: string): Promise<Empleado> {
    const e = await this.request<any>(`/empleados/${encodeURIComponent(id)}`);
    return {
      id: e.id?.toString() || '',
      nombre: e.nombre || '',
      usuario: e.usuario || '',
      rol: e.rol || 'Vendedor',
      ruta: e.ruta || '',
      telefono: e.telefono || '',
      pin: e.pin || '',
      estado: e.estado || 'Activo',
      ventasHoy: e.ventasHoy ?? 0,
      cobranzaHoy: e.cobranzaHoy ?? 0,
      clientesVisitados: e.clientesVisitados ?? 0,
      permisos: e.permisos,
    };
  }

  async createEmpleado(req: {
    nombre: string;
    usuario: string;
    password?: string;
    pin?: string;
    rol?: string;
    rutaAsignada?: string;
    telefono?: string;
    permisos?: any;
  }): Promise<Empleado> {
    const e = await this.request<any>('/empleados', {
      method: 'POST',
      body: JSON.stringify(req),
    });
    return {
      id: e.id?.toString() || '',
      nombre: e.nombre || '',
      usuario: e.usuario || '',
      rol: e.rol || 'Vendedor',
      ruta: e.ruta || '',
      telefono: e.telefono || '',
      pin: e.pin || '',
      estado: e.estado || 'Activo',
      ventasHoy: e.ventasHoy ?? 0,
      cobranzaHoy: e.cobranzaHoy ?? 0,
      clientesVisitados: e.clientesVisitados ?? 0,
      permisos: e.permisos,
    };
  }

  async updateEmpleado(id: string, req: {
    nombre?: string;
    usuario?: string;
    password?: string;
    pin?: string;
    rol?: string;
    rutaAsignada?: string;
    telefono?: string;
    activo?: boolean;
    permisos?: any;
  }): Promise<Empleado> {
    const e = await this.request<any>(`/empleados/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(req),
    });
    return {
      id: e.id?.toString() || '',
      nombre: e.nombre || '',
      usuario: e.usuario || '',
      rol: e.rol || 'Vendedor',
      ruta: e.ruta || '',
      telefono: e.telefono || '',
      pin: e.pin || '',
      estado: e.estado || 'Activo',
      ventasHoy: e.ventasHoy ?? 0,
      cobranzaHoy: e.cobranzaHoy ?? 0,
      clientesVisitados: e.clientesVisitados ?? 0,
      permisos: e.permisos,
    };
  }

  async deleteEmpleado(id: string): Promise<boolean> {
    await this.request<any>(`/empleados/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return true;
  }

  // Rutas (ABC)
  async getRutas(activa?: boolean): Promise<RutaItem[]> {
    const qs = activa !== undefined ? `?activa=${activa}` : '';
    return this.request<RutaItem[]>(`/rutas${qs}`);
  }

  async createRuta(req: { nombre: string; descripcion?: string; activa?: boolean }): Promise<RutaItem> {
    return this.request<RutaItem>('/rutas', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  async updateRuta(id: number, req: { nombre?: string; descripcion?: string; activa?: boolean }): Promise<RutaItem> {
    return this.request<RutaItem>(`/rutas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(req),
    });
  }

  async deleteRuta(id: number): Promise<boolean> {
    await this.request<any>(`/rutas/${id}`, {
      method: 'DELETE',
    });
    return true;
  }

  // Perfil JWT (Fase 6)
  async getPerfil(): Promise<any> {
    return this.request<any>('/auth/perfil');
  }
}

export interface SyncBatchRequestDto {
  dispositivoId: string;
  empleadoId: string;
  fechaEnvio: string;
  operaciones: {
    id: string;
    tipo: string;
    idempotencyKey: string;
    fechaGeneracion: string;
    payloadJson: string;
  }[];
}

export interface SyncBatchResponseDto {
  exitoso: boolean;
  totalRecibidas: number;
  sincronizadasCorrectas: number;
  duplicadasOmitidas: number;
  conError: number;
  resultados: {
    id: string;
    idempotencyKey: string;
    estado: string;
    mensaje?: string;
    folioAsignado?: string;
  }[];
  timestampServidor: string;
}

export interface SyncPullCatalogResponseDto {
  timestampGeneracion: string;
  productos: Producto[];
  clientes: Cliente[];
}

export interface ReporteResumenDto {
  periodo: string;
  fechaInicio: string;
  fechaFin: string;
  ventasTotales: number;
  cobranzaTotal: number;
  creditoColocado: number;
  gastosTotal: number;
  utilidadEstimada: number;
  ticketPromedio: number;
  pedidosTotal: number;
  clientesVisitados: number;
  clientesTotalRuta: number;
  efectividadVisitas: number;
  topProductos: {
    productoId: string;
    nombre: string;
    cantidadVendida: number;
    importeTotal: number;
  }[];
  metodosPago: {
    efectivo: number;
    transferencia: number;
    tarjeta: number;
    credito: number;
  };
}

export interface RegistrarGastoRequestDto {
  empleadoId: string;
  concepto: string;
  importe: number;
  metodoPago: string;
  observaciones?: string;
}

export interface GastoDto {
  id: number;
  empleadoId: string;
  empleadoNombre: string;
  concepto: string;
  importe: number;
  metodoPago: string;
  observaciones?: string;
  fechaHora: string;
}

export interface RegistrarDevolucionRequestDto {
  clienteId: string;
  empleadoId: string;
  productoId: string;
  cantidad: number;
  presentacionTipo: string;
  precioUnitario: number;
  total: number;
  motivo: string;
  destino: string;
  metodoReembolso: string;
  observaciones?: string;
}

export interface DevolucionDto {
  id: number;
  folio: string;
  clienteId: string;
  clienteNombre: string;
  productoId: string;
  productoNombre: string;
  cantidad: number;
  presentacionTipo: string;
  total: number;
  motivo: string;
  destino: string;
  metodoReembolso: string;
  fechaHora: string;
}

export interface CerrarCorteCajaRequestDto {
  empleadoId: string;
  efectivoContado: number;
  observaciones?: string;
}

export interface ConfirmarCargaInicialRequestDto {
  empleadoId: string;
  ubicacionDestino: string;
  lotes: { productoId: string; piezas: number }[];
}

export const apiService = new HttpApiService();

