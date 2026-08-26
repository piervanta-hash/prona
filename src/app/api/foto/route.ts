import { sitePhotoSvg } from "@/lib/sitephoto";

// Immagine generata localmente: nessuna richiesta di rete, funziona offline.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const svg = sitePhotoSvg({
    seed: q.get("s") ?? "prona",
    stage: q.get("t") ?? "STRUCTURE",
    date: q.get("d") ?? "—",
    lat: q.get("lat") ?? "41.32750",
    lng: q.get("lng") ?? "19.81870",
    code: q.get("c") ?? "PRONA",
    registry: q.get("r") ?? "IN-0000-0000",
    caption: q.get("cap") ?? "Verifikim në terren",
    w: Number(q.get("w") ?? 1200),
    h: Number(q.get("h") ?? 800),
  });
  return new Response(svg, {
    headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public, max-age=31536000, immutable" },
  });
}
