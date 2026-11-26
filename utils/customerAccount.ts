export interface CustomerAccount {
  clienteId: string; saldo: number; limiteCredito: number;
  movimientos: { id: string; fecha: string; concepto: string; monto: number; tipo: 'cargo' | 'abono' }[];
}
export function validateAccount(value: any, id: string): CustomerAccount {
  if (!value || String(value.clienteId) !== id || !Number.isFinite(value.saldo) || !Number.isFinite(value.limiteCredito) || !Array.isArray(value.movimientos)) {
    throw new Error('La respuesta de cuenta está incompleta. Intenta consultar de nuevo.');
  }
  if (value.movimientos.some((m: any) => !m || !m.id || !m.fecha || !Number.isFinite(m.monto) || !['cargo', 'abono'].includes(m.tipo))) throw new Error('Hay movimientos incompletos en la respuesta.');
  return value;
}
