import { blueprintFor } from "@/lib/blueprint";

// Elaborato tecnico generato al volo dai dati del progetto: nessuna immagine scaricata.
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  const svg = blueprintFor(q.get("t") ?? "ELEVATION", {
    seed: q.get("s") ?? "prona",
    code: q.get("c") ?? "PRONA",
    projectName: q.get("n") ?? "Projekt",
    floors: Number(q.get("f") ?? 5),
    unitsPerFloor: Number(q.get("u") ?? 3),
    typology: q.get("ty") ?? "2+1",
    drawingLabel: q.get("l") ?? "PROSPEKTI KRYESOR",
  });
  return new Response(svg, {
    headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public, max-age=31536000, immutable" },
  });
}
