export type PhotoMeta = { seed: string; lat: number; lng: number; takenAt: string; captionKey: string };

export function photoUrl(
  m: PhotoMeta,
  ctx: { stage: string; code: string; registry: string },
  size?: { w: number; h: number },
  caption?: string
) {
  const p = new URLSearchParams({
    s: m.seed,
    t: ctx.stage,
    d: new Date(m.takenAt).toLocaleString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }),
    lat: m.lat.toFixed(5),
    lng: m.lng.toFixed(5),
    c: ctx.code,
    r: ctx.registry,
    cap: caption ?? "",
  });
  if (size) { p.set("w", String(size.w)); p.set("h", String(size.h)); }
  return `/api/foto?${p.toString()}`;
}

export function parsePhotos(json: string | null | undefined): PhotoMeta[] {
  if (!json) return [];
  try { return JSON.parse(json); } catch { return []; }
}
