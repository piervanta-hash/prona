/**
 * Georeferenziazione della demo: nessuna chiamata di rete a runtime.
 *
 * Le tile OpenStreetMap sono state scaricate una sola volta in fase di
 * preparazione (scripts/fetch-tiles.mjs) e vivono in public/tiles/. Qui si
 * calcola solo la posizione del segnaposto sopra la griglia di tile gia'
 * salvata: e' matematica pura, non una richiesta esterna.
 *
 * Gli indirizzi del seed sono plausibili ma non reali: al progetto viene
 * assegnata una coordinata dedotta in modo deterministico dal suo id, entro
 * poche centinaia di metri dal centro della sua citta' — abbastanza per un
 * segnaposto credibile, sempre dentro alla griglia di tile gia' scaricata.
 */

export const TILE_ZOOM = 15;

export const CITY_CENTERS: Record<string, { lat: number; lng: number; key: string }> = {
  "Tiranë": { lat: 41.3275, lng: 19.8187, key: "tirane" },
  "Durrës": { lat: 41.3231, lng: 19.4414, key: "durres" },
  "Vlorë": { lat: 40.4667, lng: 19.4897, key: "vlore" },
  "Shkodër": { lat: 42.0683, lng: 19.5126, key: "shkoder" },
};

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function projectCoords(projectId: string, municipality: string) {
  const c = CITY_CENTERS[municipality] ?? CITY_CENTERS["Tiranë"];
  const h = hash(projectId);
  // scarto entro +-0.005/0.006 gradi (circa 400-550 metri): resta sempre
  // dentro alla griglia 3x3 scaricata per la citta'.
  const dLat = (((h % 2000) / 1000) - 1) * 0.005;
  const dLng = ((((h >> 12) % 2000) / 1000) - 1) * 0.006;
  return { lat: c.lat + dLat, lng: c.lng + dLng, cityKey: c.key, cityLat: c.lat, cityLng: c.lng };
}

export function lonToTileX(lon: number, z: number): number {
  return ((lon + 180) / 360) * 2 ** z;
}

export function latToTileY(lat: number, z: number): number {
  const r = (lat * Math.PI) / 180;
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z;
}

export function tileXToLon(x: number, z: number): number {
  return (x / 2 ** z) * 360 - 180;
}

export function tileYToLat(y: number, z: number): number {
  const n = Math.PI - (2 * Math.PI * y) / 2 ** z;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

/** Confini esatti della griglia 3x3 di tile gia' scaricata per una citta' — oltre non ci sono tile. */
export function cityTileBounds(cityLat: number, cityLng: number) {
  const z = TILE_ZOOM;
  const centerTileX = Math.floor(lonToTileX(cityLng, z));
  const centerTileY = Math.floor(latToTileY(cityLat, z));
  const west = tileXToLon(centerTileX - 1, z);
  const east = tileXToLon(centerTileX + 2, z);
  const north = tileYToLat(centerTileY - 1, z);
  const south = tileYToLat(centerTileY + 2, z);
  return { north, south, east, west };
}

/** Pixel del segnaposto dentro la griglia 3x3 (768x768) gia' scaricata per la citta'. */
export function pinPixel(lat: number, lng: number, cityLat: number, cityLng: number) {
  const z = TILE_ZOOM;
  const centerTileX = Math.floor(lonToTileX(cityLng, z));
  const centerTileY = Math.floor(latToTileY(cityLat, z));
  const px = (lonToTileX(lng, z) - (centerTileX - 1)) * 256;
  const py = (latToTileY(lat, z) - (centerTileY - 1)) * 256;
  return { x: px, y: py, centerTileX, centerTileY };
}
