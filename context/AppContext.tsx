import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type {
  Producto, Cliente, Empleado, BitacoraEntry, BitacoraError, Gasto,
  MovimientoSincronizacion, Devolucion, ItemCarrito, Pago, DiaVisita, Categoria, Unidad,
} from '@/types';
import {
  initialProductos, initialClientes, initialRutas, initialEmpleados,
  initialBitacora, initialBitacoraErrores, initialGastos, initialMovimientosSync,
  initialDevoluciones, initialCargaInicial, totalCargaInicial,
} from '@/constants/mockData';

type ConexionEstado = 'Sincronizado' | 'Pendiente' | 'Sin conexión';
type AuthUser = { nombre: string; rol: string } | null;

export interface NuevaVenta {
  clienteId: string;
  items: ItemCarrito[];
  total: number;
  pagos: Pago[];
  fecha: string;
}

interface AppContextType {
  // Auth
  loggedIn: boolean;
  user: AuthUser;
  login: () => void;
  logout: () => void;

  // Connectivity
  online: boolean;
  toggleOnline: () => void;
  conexionEstado: ConexionEstado;

  // Carrito (transient)
  carrito: ItemCarrito[];
  addToCarrito: (item: ItemCarrito) => void;
  updateCarritoItem: (index: number, item: ItemCarrito) => void;
  removeFromCarrito: (index: number) => void;
  clearCarrito: () => void;
  ventaTotal: number;
  setVentaTotal: (n: number) => void;
  pagos: Pago[];
  setPagos: (p: Pago[]) => void;
  clienteActivoId: string | null;
  setClienteActivoId: (id: string | null) => void;

  // Productos
  productos: Producto[];
  addProducto: (p: { nombre: string; categoria: Categoria; unidad: Unidad; precioBase: number; existencia: number; precioPorPeso: boolean }) => void;
  updateProducto: (id: string, p: Partial<Producto>) => void;
  deleteProducto: (id: string) => void;

  // Clientes
  clientes: Cliente[];
  addCliente: (c: { nombre: string; propietario: string; direccion: string; ruta: string; diasVisita: DiaVisita[]; limiteCredito: number }) => void;
  updateCliente: (id: string, c: Partial<Cliente>) => void;

  // Rutas
  rutas: string[];
  addRuta: (nombre: string) => void;
  deleteRuta: (nombre: string) => void;

  // Ventas
  ventas: NuevaVenta[];
  registrarVenta: (venta: NuevaVenta) => void;

  // Cobranza
  registrarAbono: (clienteId: string, monto: number, metodo: 'Efectivo' | 'Transferencia') => void;

  // Devoluciones
  devoluciones: Devolucion[];
  addDevolucion: (d: { clienteId: string; productoId: string; cantidad: number; motivo: Devolucion['motivo']; destino: Devolucion['destino'] }) => void;

  // Gastos
  gastos: Gasto[];
  addGasto: (g: { concepto: Gasto['concepto']; importe: number; metodo: Gasto['metodo']; observaciones: string }) => void;
  deleteGasto: (id: string) => void;

  // Empleados
  empleados: Empleado[];

  // Bitácora
  bitacora: BitacoraEntry[];
  bitacoraErrores: BitacoraError[];
  addBitacora: (modulo: string, accion: string) => void;

  // Sincronización
  movimientosSync: MovimientoSincronizacion[];
  addMovimientoSync: (tipo: string, cliente: string) => void;

  // Carga inicial
  cargaInicial: typeof initialCargaInicial;
  costoTotalCarga: number;

  // Visitas
  iniciarVisita: (clienteId: string) => void;
  marcarSinCompra: (clienteId: string) => void;

  // Corte
  corteRealizado: boolean;
  realizarCorte: (efectivoContado: number) => void;

  // Reset demo
  resetDemo: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

function todayStr(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function nowTimeStr(): string {
  const d = new Date();
  return d.toTimeString().slice(0, 5);
}

function nowDateTimeStr(): string {
  const d = new Date();
  const date = d.toISOString().slice(0, 10);
  const time = d.toTimeString().slice(0, 5);
  return `${date} ${time}`;
}

let idCounter = 1000;
function nextId(prefix: string): string {
  idCounter++;
  return `${prefix}${idCounter}`;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser>(null);
  const [online, setOnline] = useState(true);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [pagos, setPagosState] = useState<Pago[]>([]);
  const [ventaTotal, setVentaTotal] = useState(0);
  const [clienteActivoId, setClienteActivoId] = useState<string | null>(null);

  const [productos, setProductos] = useState<Producto[]>(initialProductos);
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [rutas, setRutas] = useState<string[]>(initialRutas);
  const [ventas, setVentas] = useState<NuevaVenta[]>([]);
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>(initialDevoluciones);
  const [gastos, setGastos] = useState<Gasto[]>(initialGastos);
  const [empleados] = useState<Empleado[]>(initialEmpleados);
  const [bitacora, setBitacora] = useState<BitacoraEntry[]>(initialBitacora);
  const [bitacoraErrores] = useState<BitacoraError[]>(initialBitacoraErrores);
  const [movimientosSync, setMovimientosSync] = useState<MovimientoSincronizacion[]>(initialMovimientosSync);
  const [corteRealizado, setCorteRealizado] = useState(false);

  const login = useCallback(() => {
    setLoggedIn(true);
    setUser({ nombre: 'Miguel', rol: 'Administrador' });
  }, []);

  const logout = useCallback(() => {
    setLoggedIn(false);
    setUser(null);
    setCarrito([]);
    setPagosState([]);
    setVentaTotal(0);
    setClienteActivoId(null);
  }, []);

  const toggleOnline = useCallback(() => setOnline((v) => !v), []);
  const conexionEstado: ConexionEstado = online ? 'Sincronizado' : 'Sin conexión';

  // Carrito ops
  const addToCarrito = useCallback((item: ItemCarrito) => {
    setCarrito((prev) => {
      const existing = prev.findIndex((i) => i.producto.id === item.producto.id);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = {
          ...updated[existing],
          cantidad: updated[existing].cantidad + item.cantidad,
          subtotal: (updated[existing].cantidad + item.cantidad) * item.precioFinal,
        };
        return updated;
      }
      return [...prev, item];
    });
  }, []);

  const updateCarritoItem = useCallback((index: number, item: ItemCarrito) => {
    setCarrito((prev) => {
      const updated = [...prev];
      updated[index] = item;
      return updated;
    });
  }, []);

  const removeFromCarrito = useCallback((index: number) => {
    setCarrito((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearCarrito = useCallback(() => {
    setCarrito([]);
    setPagosState([]);
    setVentaTotal(0);
  }, []);

  const setPagos = useCallback((p: Pago[]) => setPagosState(p), []);

  // Bitácora helper
  const addBitacora = useCallback((modulo: string, accion: string) => {
    setBitacora((prev) => [
      { id: nextId('b'), fecha: nowDateTimeStr(), usuario: 'Miguel', modulo, accion },
      ...prev,
    ]);
  }, []);

  // Sync helper
  const addMovimientoSync = useCallback((tipo: string, cliente: string) => {
    setMovimientosSync((prev) => [
      { id: nextId('s'), tipo, cliente, fecha: nowTimeStr(), estado: 'Sincronizado' },
      ...prev,
    ]);
  }, []);

  // Productos CRUD
  const addProducto = useCallback((p: { nombre: string; categoria: Categoria; unidad: Unidad; precioBase: number; existencia: number; precioPorPeso: boolean }) => {
    const nuevo: Producto = { id: nextId('p'), ...p };
    setProductos((prev) => [...prev, nuevo]);
    addBitacora('Productos', `Producto agregado: ${p.nombre}`);
  }, [addBitacora]);

  const updateProducto = useCallback((id: string, p: Partial<Producto>) => {
    setProductos((prev) => prev.map((item) => item.id === id ? { ...item, ...p } : item));
    addBitacora('Productos', `Producto actualizado: ${id}`);
  }, [addBitacora]);

  const deleteProducto = useCallback((id: string) => {
    setProductos((prev) => prev.filter((item) => item.id !== id));
    addBitacora('Productos', `Producto eliminado: ${id}`);
  }, [addBitacora]);

  // Clientes CRUD
  const addCliente = useCallback((c: { nombre: string; propietario: string; direccion: string; ruta: string; diasVisita: DiaVisita[]; limiteCredito: number }) => {
    const nuevo: Cliente = {
      id: nextId('c'),
      ...c,
      saldo: 0,
      estado: 'Pendiente',
      ultimaVisita: todayStr(),
      historial: [],
      sugerido: [],
    };
    setClientes((prev) => [...prev, nuevo]);
    addBitacora('Cliente', `Cliente agregado: ${c.nombre}`);
  }, [addBitacora]);

  const updateCliente = useCallback((id: string, c: Partial<Cliente>) => {
    setClientes((prev) => prev.map((item) => item.id === id ? { ...item, ...c } : item));
    addBitacora('Cliente', `Cliente actualizado: ${id}`);
  }, [addBitacora]);

  // Rutas CRUD
  const addRuta = useCallback((nombre: string) => {
    setRutas((prev) => [...prev, nombre]);
    addBitacora('Rutas', `Ruta agregada: ${nombre}`);
  }, [addBitacora]);

  const deleteRuta = useCallback((nombre: string) => {
    setRutas((prev) => prev.filter((r) => r !== nombre));
    addBitacora('Rutas', `Ruta eliminada: ${nombre}`);
  }, [addBitacora]);

  // Ventas
  const registrarVenta = useCallback((venta: NuevaVenta) => {
    setVentas((prev) => [...prev, venta]);

    // Update cliente saldo for credit payments
    const creditoPagado = venta.pagos.find((p) => p.metodo === 'Crédito')?.monto || 0;
    setClientes((prev) => prev.map((c) => {
      if (c.id !== venta.clienteId) return c;
      const nuevoHistorial: typeof c.historial = [
        {
          id: nextId('h'),
          fecha: venta.fecha,
          total: venta.total,
          estado: creditoPagado > 0 ? 'Crédito' : 'Pagado',
          items: venta.items.map((i) => ({
            productoNombre: i.producto.nombre,
            cantidad: i.cantidad,
            unidad: i.producto.unidad,
          })),
        },
        ...c.historial,
      ];
      return {
        ...c,
        saldo: c.saldo + creditoPagado,
        estado: 'Venta realizada',
        ultimaVisita: venta.fecha,
        historial: nuevoHistorial,
      };
    }));

    // Reduce inventory
    setProductos((prev) => prev.map((p) => {
      const item = venta.items.find((i) => i.producto.id === p.id);
      if (!item) return p;
      return { ...p, existencia: Math.max(0, p.existencia - item.cantidad) };
    }));

    const clienteNombre = clientes.find((c) => c.id === venta.clienteId)?.nombre || '';
    addBitacora('Venta', `Venta a ${clienteNombre} por $${venta.total}`);
    addMovimientoSync('Venta', clienteNombre);
  }, [clientes, addBitacora, addMovimientoSync]);

  // Cobranza
  const registrarAbono = useCallback((clienteId: string, monto: number, metodo: 'Efectivo' | 'Transferencia') => {
    setClientes((prev) => prev.map((c) => {
      if (c.id !== clienteId) return c;
      return { ...c, saldo: Math.max(0, c.saldo - monto) };
    }));
    const clienteNombre = clientes.find((c) => c.id === clienteId)?.nombre || '';
    addBitacora('Cobranza', `Abono de ${clienteNombre} por $${monto}`);
    addMovimientoSync('Cobranza', clienteNombre);
  }, [clientes, addBitacora, addMovimientoSync]);

  // Devoluciones
  const addDevolucion = useCallback((d: { clienteId: string; productoId: string; cantidad: number; motivo: Devolucion['motivo']; destino: Devolucion['destino'] }) => {
    const cliente = clientes.find((c) => c.id === d.clienteId);
    const producto = productos.find((p) => p.id === d.productoId);
    if (!cliente || !producto) return;

    const nueva: Devolucion = {
      id: nextId('d'),
      cliente: cliente.nombre,
      producto: producto.nombre,
      cantidad: d.cantidad,
      unidad: producto.unidad,
      motivo: d.motivo,
      destino: d.destino,
      fecha: todayStr(),
    };
    setDevoluciones((prev) => [nueva, ...prev]);

    // If returns to inventory, add back
    if (d.destino === 'Inventario') {
      setProductos((prev) => prev.map((p) => p.id === d.productoId ? { ...p, existencia: p.existencia + d.cantidad } : p));
    }

    addBitacora('Devolución', `Devolución de ${cliente.nombre}: ${d.cantidad} ${producto.unidad} ${producto.nombre}`);
    addMovimientoSync('Devolución', cliente.nombre);
  }, [clientes, productos, addBitacora, addMovimientoSync]);

  // Gastos
  const addGasto = useCallback((g: { concepto: Gasto['concepto']; importe: number; metodo: Gasto['metodo']; observaciones: string }) => {
    const nuevo: Gasto = {
      id: nextId('g'),
      ...g,
      fecha: todayStr(),
    };
    setGastos((prev) => [nuevo, ...prev]);
    addBitacora('Gastos', `Gasto registrado: ${g.concepto} por $${g.importe}`);
    addMovimientoSync('Gasto', '—');
  }, [addBitacora, addMovimientoSync]);

  const deleteGasto = useCallback((id: string) => {
    setGastos((prev) => prev.filter((g) => g.id !== id));
  }, []);

  // Visitas
  const iniciarVisita = useCallback((clienteId: string) => {
    setClientes((prev) => prev.map((c) => {
      if (c.id !== clienteId) return c;
      if (c.estado === 'Venta realizada') return c;
      return { ...c, estado: 'Visitado', ultimaVisita: todayStr() };
    }));
    const clienteNombre = clientes.find((c) => c.id === clienteId)?.nombre || '';
    addBitacora('Ruta', `Visita iniciada: ${clienteNombre}`);
  }, [clientes, addBitacora]);

  const marcarSinCompra = useCallback((clienteId: string) => {
    setClientes((prev) => prev.map((c) => c.id === clienteId ? { ...c, estado: 'Sin compra', ultimaVisita: todayStr() } : c));
    const clienteNombre = clientes.find((c) => c.id === clienteId)?.nombre || '';
    addBitacora('Ruta', `Sin compra: ${clienteNombre}`);
  }, [clientes, addBitacora]);

  // Corte
  const realizarCorte = useCallback((efectivoContado: number) => {
    setCorteRealizado(true);
    addBitacora('Corte', `Corte realizado. Efectivo contado: $${efectivoContado}`);
    addMovimientoSync('Corte', '—');
  }, [addBitacora, addMovimientoSync]);

  // Reset demo
  const resetDemo = useCallback(() => {
    setProductos(initialProductos);
    setClientes(initialClientes);
    setRutas(initialRutas);
    setVentas([]);
    setDevoluciones(initialDevoluciones);
    setGastos(initialGastos);
    setBitacora(initialBitacora);
    setMovimientosSync(initialMovimientosSync);
    setCorteRealizado(false);
    setCarrito([]);
    setPagosState([]);
    setVentaTotal(0);
    setClienteActivoId(null);
  }, []);

  return (
    <AppContext.Provider
      value={{
        loggedIn, user, login, logout,
        online, toggleOnline, conexionEstado,
        carrito, addToCarrito, updateCarritoItem, removeFromCarrito, clearCarrito,
        ventaTotal, setVentaTotal, pagos, setPagos, clienteActivoId, setClienteActivoId,
        productos, addProducto, updateProducto, deleteProducto,
        clientes, addCliente, updateCliente,
        rutas, addRuta, deleteRuta,
        ventas, registrarVenta,
        registrarAbono,
        devoluciones, addDevolucion,
        gastos, addGasto, deleteGasto,
        empleados,
        bitacora, bitacoraErrores, addBitacora,
        movimientosSync, addMovimientoSync,
        cargaInicial: initialCargaInicial,
        costoTotalCarga: totalCargaInicial,
        iniciarVisita, marcarSinCompra,
        corteRealizado, realizarCorte,
        resetDemo,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
