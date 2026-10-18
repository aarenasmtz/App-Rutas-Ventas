import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ItemCarrito, Pago } from '@/types';
import { apiService } from '@/services/httpApiService';

type ConexionEstado = 'Sincronizado' | 'Pendiente' | 'Sin conexión';
export type UserRole = 'Administrador' | 'Vendedor';
export type AuthUser = {
  id?: string;
  nombre: string;
  rol: UserRole;
  token?: string;
  rutaNombre?: string;
} | null;

interface AppContextType {
  loggedIn: boolean;
  user: AuthUser;
  login: (credentials?: { usuario?: string; password?: string; role?: UserRole } | UserRole) => Promise<void> | void;
  logout: () => void;
  switchRole: (role: UserRole) => void;

  online: boolean;
  toggleOnline: () => void;
  conexionEstado: ConexionEstado;

  carrito: ItemCarrito[];
  addToCarrito: (item: ItemCarrito) => void;
  updateCarritoItem: (index: number, item: ItemCarrito) => void;
  removeFromCarrito: (index: number) => void;
  clearCarrito: () => void;

  pagos: Pago[];
  setPagos: (p: Pago[]) => void;

  ventaTotal: number;
  setVentaTotal: (n: number) => void;

  clienteActivoId: string | null;
  setClienteActivoId: (id: string | null) => void;

  ultimoFolioVenta: string | null;
  setUltimoFolioVenta: (folio: string | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(true); // Default logged in for immediate demo experience
  const [user, setUser] = useState<AuthUser>({ id: '1', nombre: 'Miguel', rol: 'Administrador', rutaNombre: 'Ruta Centro' });
  const [online, setOnline] = useState(true);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [pagos, setPagosState] = useState<Pago[]>([]);
  const [ventaTotal, setVentaTotal] = useState(0);
  const [clienteActivoId, setClienteActivoId] = useState<string | null>(null);
  const [ultimoFolioVenta, setUltimoFolioVenta] = useState<string | null>(null);

  const login = useCallback(async (params?: { usuario?: string; password?: string; role?: UserRole } | UserRole) => {
    let targetRole: UserRole = 'Administrador';
    let targetName = 'Miguel';
    let targetId = '1';
    let targetToken = '';

    if (typeof params === 'string') {
      targetRole = params;
      targetName = params === 'Administrador' ? 'Miguel' : 'Juan';
    } else if (params && typeof params === 'object') {
      const { usuario, password, role } = params;
      if (usuario && password) {
        try {
          const resp = await apiService.login({ usuario, password });
          if (resp && resp.usuario) {
            targetId = resp.usuario.id;
            targetName = resp.usuario.nombre;
            targetRole = resp.usuario.rol as UserRole;
            targetToken = resp.token;
          }
        } catch {
          // Fallback a credenciales mock
          if (role) targetRole = role;
          targetName = usuario.toLowerCase().includes('juan') ? 'Juan' : 'Miguel';
        }
      } else if (role) {
        targetRole = role;
        targetName = role === 'Administrador' ? 'Miguel' : 'Juan';
      }
    }

    setLoggedIn(true);
    setUser({
      id: targetId,
      nombre: targetName,
      rol: targetRole,
      token: targetToken,
      rutaNombre: 'Ruta Centro',
    });
  }, []);

  const switchRole = useCallback((role: UserRole) => {
    setUser({
      id: role === 'Administrador' ? '1' : '2',
      nombre: role === 'Administrador' ? 'Miguel' : 'Juan',
      rol: role,
      rutaNombre: role === 'Administrador' ? 'Ruta Centro' : 'Ruta Norte',
    });
  }, []);

  const logout = useCallback(() => {
    setLoggedIn(false);
    setUser(null);
    setCarrito([]);
    setPagosState([]);
    setVentaTotal(0);
    setClienteActivoId(null);
    setUltimoFolioVenta(null);
  }, []);

  const toggleOnline = useCallback(() => setOnline((v) => !v), []);

  const conexionEstado: ConexionEstado = online ? 'Sincronizado' : 'Sin conexión';

  const addToCarrito = useCallback((item: ItemCarrito) => {
    setCarrito((prev) => {
      // Comparar por ID de producto Y presentación
      const existing = prev.findIndex(
        (i) =>
          i.producto.id === item.producto.id &&
          (i.presentacion?.tipo === item.presentacion?.tipo || (!i.presentacion && !item.presentacion))
      );

      if (existing >= 0) {
        const updated = [...prev];
        const prevItem = updated[existing];
        const newCantidad = prevItem.cantidad + item.cantidad;
        const factor = item.presentacion?.piezasEquivalentes || 1;
        updated[existing] = {
          ...prevItem,
          cantidad: newCantidad,
          piezasTotales: newCantidad * factor,
          subtotal: newCantidad * prevItem.precioFinal,
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

  return (
    <AppContext.Provider
      value={{
        loggedIn,
        user,
        login,
        logout,
        switchRole,
        online,
        toggleOnline,
        conexionEstado,
        carrito,
        addToCarrito,
        updateCarritoItem,
        removeFromCarrito,
        clearCarrito,
        pagos,
        setPagos,
        ventaTotal,
        setVentaTotal,
        clienteActivoId,
        setClienteActivoId,
        ultimoFolioVenta,
        setUltimoFolioVenta,
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
