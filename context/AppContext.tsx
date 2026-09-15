import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ItemCarrito, MetodoPago, Pago } from '@/types';

type ConexionEstado = 'Sincronizado' | 'Pendiente' | 'Sin conexión';
type AuthUser = { nombre: string; rol: string } | null;

interface AppContextType {
  loggedIn: boolean;
  user: AuthUser;
  login: () => void;
  logout: () => void;

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
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<AuthUser>(null);
  const [online, setOnline] = useState(true);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [pagos, setPagosState] = useState<Pago[]>([]);
  const [ventaTotal, setVentaTotal] = useState(0);
  const [clienteActivoId, setClienteActivoId] = useState<string | null>(null);

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

  return (
    <AppContext.Provider
      value={{
        loggedIn,
        user,
        login,
        logout,
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
