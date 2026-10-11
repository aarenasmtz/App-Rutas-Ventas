import { Platform } from 'react-native';
import { apiService, type SyncBatchRequestDto, type SyncBatchResponseDto } from './httpApiService';

export interface SyncQueueItem {
  id: string; // ID único local
  tipo: 'Venta' | 'Abono' | 'Gasto' | 'Devolucion';
  idempotencyKey: string;
  descripcion: string;
  monto?: number;
  payload: any;
  estado: 'Pendiente' | 'Sincronizando' | 'Sincronizado' | 'Error' | 'DuplicadoOmitido';
  fechaCreacion: string;
  fechaSincronizacion?: string;
  intentos: number;
  errorDetalle?: string;
  folioAsignado?: string;
}

const STORAGE_KEY_QUEUE = 'RUTA_VENTAS_OFFLINE_QUEUE_V1';
const STORAGE_KEY_CATALOG = 'RUTA_VENTAS_CACHED_CATALOG_V1';

type Listener = (queue: SyncQueueItem[]) => void;

class OfflineSyncQueueService {
  private queue: SyncQueueItem[] = [];
  private listeners: Set<Listener> = new Set();
  private isSyncing: boolean = false;

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY_QUEUE);
        if (raw) {
          this.queue = JSON.parse(raw);
          return;
        }
      }
    } catch {
      // Fallback
    }

    // Si está vacío, sembrar operaciones de ejemplo para auditoría
    if (this.queue.length === 0) {
      this.queue = [
        {
          id: 'SYNC-001',
          tipo: 'Venta',
          idempotencyKey: 'FOL-20260930-001',
          descripcion: 'Venta a ABTS ARENAS · 2 Queso Castel Barra',
          monto: 390,
          payload: {},
          estado: 'Sincronizado',
          fechaCreacion: new Date(Date.now() - 3600000).toISOString(),
          fechaSincronizacion: new Date(Date.now() - 3500000).toISOString(),
          intentos: 1,
          folioAsignado: 'FOL-20260930-001',
        },
        {
          id: 'SYNC-002',
          tipo: 'Gasto',
          idempotencyKey: 'GAS-20260930-001',
          descripcion: 'Gasolina magna en ruta',
          monto: 350,
          payload: {},
          estado: 'Sincronizado',
          fechaCreacion: new Date(Date.now() - 1800000).toISOString(),
          fechaSincronizacion: new Date(Date.now() - 1700000).toISOString(),
          intentos: 1,
        },
        {
          id: 'SYNC-003',
          tipo: 'Devolucion',
          idempotencyKey: 'DEV-20260930-001',
          descripcion: 'Devolución empaque roto · ABTS ARENAS',
          monto: 0,
          payload: {},
          estado: 'Sincronizado',
          fechaCreacion: new Date(Date.now() - 900000).toISOString(),
          fechaSincronizacion: new Date(Date.now() - 850000).toISOString(),
          intentos: 1,
          folioAsignado: 'DEV-20260930-001',
        },
      ];
    }
  }

  private saveToStorage() {
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(this.queue));
      }
    } catch {
      // Ignorar fallos de cuota
    }
    this.notify();
  }

  public subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.queue);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.queue));
  }

  public getQueue(): SyncQueueItem[] {
    return [...this.queue];
  }

  public getStats() {
    const total = this.queue.length;
    const sincronizadas = this.queue.filter((q) => q.estado === 'Sincronizado' || q.estado === 'DuplicadoOmitido').length;
    const pendientes = this.queue.filter((q) => q.estado === 'Pendiente' || q.estado === 'Sincronizando').length;
    const errores = this.queue.filter((q) => q.estado === 'Error').length;
    return { total, sincronizadas, pendientes, errores };
  }

  /**
   * Encola una operación para sincronización en segundo plano con idempotencia
   */
  public enqueue(
    tipo: 'Venta' | 'Abono' | 'Gasto' | 'Devolucion',
    payload: any,
    descripcion: string,
    idempotencyKey?: string,
    monto?: number
  ): SyncQueueItem {
    const id = `OFF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const key = idempotencyKey || id;

    const item: SyncQueueItem = {
      id,
      tipo,
      idempotencyKey: key,
      descripcion,
      monto,
      payload,
      estado: 'Pendiente',
      fechaCreacion: new Date().toISOString(),
      intentos: 0,
    };

    this.queue.unshift(item);
    this.saveToStorage();
    return item;
  }

  /**
   * Envía en lote todas las operaciones pendientes a la API .NET 9
   */
  public async syncAll(): Promise<SyncBatchResponseDto | null> {
    if (this.isSyncing) return null;

    const pending = this.queue.filter((q) => q.estado === 'Pendiente' || q.estado === 'Error');
    if (pending.length === 0) {
      return {
        exitoso: true,
        totalRecibidas: 0,
        sincronizadasCorrectas: 0,
        duplicadasOmitidas: 0,
        conError: 0,
        resultados: [],
        timestampServidor: new Date().toISOString(),
      };
    }

    this.isSyncing = true;
    pending.forEach((p) => {
      p.estado = 'Sincronizando';
      p.intentos++;
    });
    this.notify();

    try {
      const batchRequest: SyncBatchRequestDto = {
        dispositivoId: 'DISP-RUTAMIGUEL-01',
        empleadoId: '1',
        fechaEnvio: new Date().toISOString(),
        operaciones: pending.map((p) => ({
          id: p.id,
          tipo: p.tipo,
          idempotencyKey: p.idempotencyKey,
          fechaGeneracion: p.fechaCreacion,
          payloadJson: typeof p.payload === 'string' ? p.payload : JSON.stringify(p.payload),
        })),
      };

      const result = await apiService.syncBatch(batchRequest);

      // Mapear resultados del servidor a los items de la cola
      result.resultados.forEach((res) => {
        const item = this.queue.find((q) => q.id === res.id || q.idempotencyKey === res.idempotencyKey);
        if (item) {
          if (res.estado === 'Sincronizado') {
            item.estado = 'Sincronizado';
            item.fechaSincronizacion = new Date().toISOString();
            if (res.folioAsignado) item.folioAsignado = res.folioAsignado;
          } else if (res.estado === 'DuplicadoOmitido') {
            item.estado = 'DuplicadoOmitido';
            item.fechaSincronizacion = new Date().toISOString();
            if (res.folioAsignado) item.folioAsignado = res.folioAsignado;
          } else {
            item.estado = 'Error';
            item.errorDetalle = res.mensaje || 'Error al procesar en servidor';
          }
        }
      });

      this.saveToStorage();
      return result;
    } catch (err: any) {
      pending.forEach((p) => {
        p.estado = 'Error';
        p.errorDetalle = err.message || 'Sin conexión al servidor';
      });
      this.saveToStorage();
      throw err;
    } finally {
      this.isSyncing = false;
      this.notify();
    }
  }

  /**
   * Pre-carga el catálogo maestro para que la app funcione 100% offline
   */
  public async preloadCatalog(): Promise<{ productos: number; clientes: number }> {
    const data = await apiService.pullCatalog();
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_KEY_CATALOG, JSON.stringify(data));
    }
    return {
      productos: data.productos.length,
      clientes: data.clientes.length,
    };
  }

  /**
   * Prueba el estado de conexión y latencia (ping en ms)
   */
  public async checkHealth(): Promise<{ online: boolean; pingMs: number; error?: string }> {
    const start = Date.now();
    try {
      const isOnline = await apiService.checkHealth();
      const pingMs = Date.now() - start;
      return { online: isOnline, pingMs };
    } catch (err: any) {
      return { online: false, pingMs: 0, error: err.message };
    }
  }

  /**
   * Limpia operaciones sincronizadas archivadas
   */
  public clearCompleted() {
    this.queue = this.queue.filter((q) => q.estado === 'Pendiente' || q.estado === 'Error' || q.estado === 'Sincronizando');
    this.saveToStorage();
  }
}

export const offlineSyncQueue = new OfflineSyncQueueService();
