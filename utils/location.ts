export interface AddressLocation {
  latitud?: unknown; longitud?: unknown; direccion?: unknown; colonia?: unknown; ciudad?: unknown;
}
export function cleanAddress(value: unknown): string {
  if (typeof value !== 'string') return '';
  const text = value.trim();
  return text.split(',').map(part=>part.trim()).filter(part=>part && !/^(undefined|null)$/i.test(part)).join(', ');
}
export function validCoordinates(lat: unknown, lng: unknown): boolean {
  return typeof lat === 'number' && Number.isFinite(lat) && lat >= -90 && lat <= 90 && typeof lng === 'number' && Number.isFinite(lng) && lng >= -180 && lng <= 180;
}
export function mapsDestination(cliente: AddressLocation): string | null {
  if (validCoordinates(cliente.latitud, cliente.longitud)) return `${cliente.latitud},${cliente.longitud}`;
  const address = cleanAddress(cliente.direccion);
  const colony = cleanAddress(cliente.colonia);
  if (!address && !colony) return null;
  return [...new Set([address, colony, cleanAddress(cliente.ciudad)].filter(Boolean))].join(', ');
}
export function buildMapsUrl(cliente: AddressLocation): string | null {
  const destination = mapsDestination(cliente);
  return destination ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving` : null;
}
/** Smallest address area first. City/municipality are never used as colonia. */
export function normalizeNominatim(address: Record<string, unknown> = {}) {
  const first = (keys: string[]) => keys.map(k => cleanAddress(address[k])).find(Boolean) || '';
  const road = first(['road', 'pedestrian', 'footway', 'path']);
  const number = cleanAddress(address.house_number);
  return {
    direccion: [road, number].filter(Boolean).join(' '),
    colonia: first(['neighbourhood', 'quarter', 'suburb', 'residential']),
    ciudad: first(['city', 'town', 'village', 'municipality']),
  };
}
