// Scarica UNA SOLA VOLTA, in fase di preparazione della demo, le tile OSM per le
// quattro citta' del seed. Da questo momento in poi l'app non fa piu' alcuna
// richiesta di rete per la mappa: serve i PNG salvati in public/tiles/.
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const ZOOM = 15;
const RADIUS = 1; // griglia 3x3 attorno al centro citta'

const CITIES = {
  tirane: { lat: 41.3275, lng: 19.8187 },
  durres: { lat: 41.3231, lng: 19.4414 },
  vlore: { lat: 40.4667, lng: 19.4897 },
  shkoder: { lat: 42.0683, lng: 19.5126 },
};

function lonToTileX(lon, z) { return Math.floor(((lon + 180) / 360) * 2 ** z); }
function latToTileY(lat, z) {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
}

async function fetchTile(z, x, y, dest) {
  if (existsSync(dest)) return "cache";
  const url = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  const res = await fetch(url, { headers: { "User-Agent": "PRONA-demo-setup/1.0 (one-time build asset fetch)" } });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(dest, buf);
  return "fetched";
}

for (const [city, c] of Object.entries(CITIES)) {
  const cx = lonToTileX(c.lng, ZOOM);
  const cy = latToTileY(c.lat, ZOOM);
  const dir = path.join("public", "tiles", city, String(ZOOM));
  await mkdir(dir, { recursive: true });
  for (let dx = -RADIUS; dx <= RADIUS; dx++) {
    for (let dy = -RADIUS; dy <= RADIUS; dy++) {
      const x = cx + dx, y = cy + dy;
      const dest = path.join(dir, `${x}_${y}.png`);
      const status = await fetchTile(ZOOM, x, y, dest);
      console.log(city, x, y, status);
      await new Promise((r) => setTimeout(r, 120)); // rispetta il server dei tile
    }
  }
}
console.log("fatto — mappa salvata localmente in public/tiles/");
