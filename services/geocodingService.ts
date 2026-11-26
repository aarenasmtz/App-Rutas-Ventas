import { normalizeNominatim, validCoordinates } from '@/utils/location';

export async function reverseGeocode(lat: number, lng: number) {
  if (!validCoordinates(lat, lng)) throw new Error('Coordenadas fuera de rango.');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&accept-language=es&lat=${lat}&lon=${lng}`, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('No se pudo consultar la dirección.');
    const data = await response.json();
    if (data.error || !data.address) throw new Error('El servicio no devolvió una dirección.');
    return normalizeNominatim(data.address);
  } finally { clearTimeout(timer); }
}

export async function searchGeocode(query: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(),8000);
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&accept-language=es&limit=1&q=${encodeURIComponent(query)}`,{signal:controller.signal,headers:{Accept:'application/json'}});
    if (!response.ok) throw new Error('Servicio de dirección no disponible.');
    const data = await response.json(), first = data?.[0];
    const lat = Number(first?.lat), lng = Number(first?.lon);
    if (!first || !validCoordinates(lat,lng)) throw new Error('No se encontró la dirección.');
    return {lat,lng,...normalizeNominatim(first.address)};
  } finally { clearTimeout(timer); }
}
