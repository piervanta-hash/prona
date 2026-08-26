/**
 * Elaborati tecnici generati localmente: prospetto, planimetria, sezione,
 * inquadramento urbano. Non sono foto ne' materiale scaricato: sono disegni
 * vettoriali in stile tecnico monocromatico, calcolati dai dati reali del
 * progetto (numero di unita', tipologia, piani) cosi' che ogni progetto abbia
 * un elaborato coerente e sempre uguale a se stesso fra un reset e l'altro.
 */
import { fingerprint } from "./sitephoto";

const INK = "#17323B";
const INK_SOFT = "#5C7C88";
const PAPER = "#FFFFFF";
const FAINT = "#C9D4D8";

export type BlueprintOpts = {
  seed: string;
  code: string;
  projectName: string;
  floors: number; // piani fuori terra, oltre al piano terra
  unitsPerFloor: number;
  typology: string; // es. "2+1"
  drawingLabel: string; // es. "PROSPEKTI KRYESOR"
  scaleLabel?: string;
};

function rngFrom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  let x = (h >>> 0) || 1;
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5; x >>>= 0;
    return x / 4294967296;
  };
}

function esc(s: string) {
  return String(s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" } as any)[c]);
}

/** Cornice tecnica e cartiglio, comuni a tutti gli elaborati. */
function frame(o: BlueprintOpts, w: number, h: number, body: string) {
  const blockW = 300, blockH = 96;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" font-family="ui-monospace,Menlo,monospace">
  <rect width="${w}" height="${h}" fill="${PAPER}"/>
  <rect x="14" y="14" width="${w - 28}" height="${h - 28}" fill="none" stroke="${INK}" stroke-width="1.5"/>
  <rect x="20" y="20" width="${w - 40}" height="${h - 40}" fill="none" stroke="${FAINT}" stroke-width="1"/>
  <g>${body}</g>
  <g transform="translate(${w - blockW - 24},${h - blockH - 24})">
    <rect width="${blockW}" height="${blockH}" fill="${PAPER}" stroke="${INK}" stroke-width="1.5"/>
    <line x1="0" y1="26" x2="${blockW}" y2="26" stroke="${INK}" stroke-width="1"/>
    <text x="10" y="18" font-size="13" font-weight="700" fill="${INK}">${esc(o.drawingLabel)}</text>
    <text x="10" y="42" font-size="11" fill="${INK_SOFT}">${esc(o.projectName)}</text>
    <text x="10" y="58" font-size="11" fill="${INK_SOFT}">${esc(o.code)}</text>
    <text x="10" y="74" font-size="10.5" fill="${INK_SOFT}">${esc(o.scaleLabel ?? "Shkalla 1:200")}</text>
    <text x="10" y="90" font-size="9" fill="${FAINT}">${fingerprint(o.seed + o.drawingLabel)}</text>
  </g>
</svg>`;
}

// ---------------------------------------------------------------- PROSPEKTI

export function elevationSvg(o: BlueprintOpts): string {
  const W = 900, H = 620;
  const r = rngFrom(o.seed + "elev");
  const bays = Math.max(3, o.unitsPerFloor * 2);
  const floors = Math.max(2, o.floors);
  const bayW = 56, floorH = 46;
  const bw = bays * bayW;
  const bx = (W - bw) / 2;
  const groundY = H - 170;
  const roofY = groundY - floors * floorH;
  const parts: string[] = [];

  parts.push(`<line x1="70" y1="${groundY}" x2="${W - 70}" y2="${groundY}" stroke="${INK}" stroke-width="2"/>`);
  for (let i = 0; i < 14; i++) {
    const gx = 76 + i * ((W - 150) / 13);
    parts.push(`<line x1="${gx}" y1="${groundY}" x2="${gx - 10}" y2="${groundY + 10}" stroke="${INK_SOFT}" stroke-width="1"/>`);
  }
  parts.push(`<rect x="${bx}" y="${roofY}" width="${bw}" height="${floors * floorH}" fill="none" stroke="${INK}" stroke-width="1.75"/>`);
  for (let f = 1; f < floors; f++) {
    const fy = roofY + f * floorH;
    parts.push(`<line x1="${bx}" y1="${fy}" x2="${bx + bw}" y2="${fy}" stroke="${INK_SOFT}" stroke-width="1"/>`);
  }
  for (let f = 0; f < floors; f++) {
    const fy = roofY + f * floorH;
    for (let b = 0; b < bays; b++) {
      const wx = bx + b * bayW + bayW * 0.22;
      const ww = bayW * 0.56;
      const wy = fy + floorH * 0.28;
      const wh = floorH * 0.5;
      parts.push(`<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="${ww.toFixed(1)}" height="${wh.toFixed(1)}" fill="none" stroke="${INK}" stroke-width="1"/>`);
      if (r() > 0.55) {
        const by = fy + floorH * 0.86;
        parts.push(`<line x1="${wx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${(wx + ww).toFixed(1)}" y2="${by.toFixed(1)}" stroke="${INK_SOFT}" stroke-width="1"/>`);
      }
    }
  }
  parts.push(`<line x1="${bx}" y1="${roofY}" x2="${bx + bw}" y2="${roofY}" stroke="${INK}" stroke-width="2.5"/>`);
  parts.push(`<line x1="${bx - 14}" y1="${roofY}" x2="${bx + bw + 14}" y2="${roofY}" stroke="${INK}" stroke-width="1"/>`);

  const dimX = bx + bw + 46;
  parts.push(`<line x1="${dimX}" y1="${roofY}" x2="${dimX}" y2="${groundY}" stroke="${INK_SOFT}" stroke-width="1"/>`);
  parts.push(`<line x1="${dimX - 5}" y1="${roofY}" x2="${dimX + 5}" y2="${roofY}" stroke="${INK_SOFT}" stroke-width="1"/>`);
  parts.push(`<line x1="${dimX - 5}" y1="${groundY}" x2="${dimX + 5}" y2="${groundY}" stroke="${INK_SOFT}" stroke-width="1"/>`);
  parts.push(`<text x="${dimX + 10}" y="${(roofY + groundY) / 2}" font-size="12" fill="${INK_SOFT}" transform="rotate(90 ${dimX + 10} ${(roofY + groundY) / 2})" text-anchor="middle">Përdhesë + ${floors - 1} kate</text>`);

  parts.push(`<text x="${bx}" y="${groundY + 34}" font-size="12" fill="${INK_SOFT}">Kuota ± 0.00</text>`);

  return frame(o, W, H, parts.join("\n"));
}

// ---------------------------------------------------------- PLANIMETRIA

export function floorPlanSvg(o: BlueprintOpts): string {
  const W = 900, H = 620;
  const r = rngFrom(o.seed + "plan");
  const units = Math.max(2, Math.min(4, o.unitsPerFloor));
  const px = 90, py = 90, pw = W - 220, ph = H - 260;
  const parts: string[] = [];

  parts.push(`<rect x="${px}" y="${py}" width="${pw}" height="${ph}" fill="none" stroke="${INK}" stroke-width="2"/>`);

  // corridoio centrale con vano scala e ascensore
  const corW = 90;
  const corX = px + pw / 2 - corW / 2;
  parts.push(`<line x1="${corX}" y1="${py}" x2="${corX}" y2="${py + ph}" stroke="${INK_SOFT}" stroke-width="1"/>`);
  parts.push(`<line x1="${corX + corW}" y1="${py}" x2="${corX + corW}" y2="${py + ph}" stroke="${INK_SOFT}" stroke-width="1"/>`);
  const stW = corW * 0.42;
  const stX = corX + 6, stY = py + ph / 2 - 46;
  parts.push(`<rect x="${stX}" y="${stY}" width="${stW}" height="92" fill="none" stroke="${INK}" stroke-width="1.25"/>`);
  for (let i = 1; i < 9; i++) {
    const sy = stY + (92 / 9) * i;
    parts.push(`<line x1="${stX}" y1="${sy.toFixed(1)}" x2="${(stX + stW).toFixed(1)}" y2="${sy.toFixed(1)}" stroke="${INK_SOFT}" stroke-width="0.75"/>`);
  }
  const evX = corX + corW - stW - 6;
  parts.push(`<rect x="${evX}" y="${stY + 16}" width="${stW}" height="${stW}" fill="none" stroke="${INK}" stroke-width="1.25"/>`);
  parts.push(`<line x1="${evX}" y1="${stY + 16}" x2="${evX + stW}" y2="${stY + 16 + stW}" stroke="${INK_SOFT}" stroke-width="0.75"/>`);
  parts.push(`<line x1="${evX + stW}" y1="${stY + 16}" x2="${evX}" y2="${stY + 16 + stW}" stroke="${INK_SOFT}" stroke-width="0.75"/>`);

  // unita' a sinistra e a destra del corridoio
  const leftW = corX - px, rightW = px + pw - (corX + corW);
  const leftUnits = Math.ceil(units / 2), rightUnits = units - leftUnits;
  const drawUnit = (ux: number, uw: number, uy: number, uh: number, doorSide: "l" | "r") => {
    parts.push(`<rect x="${ux.toFixed(1)}" y="${uy.toFixed(1)}" width="${uw.toFixed(1)}" height="${uh.toFixed(1)}" fill="none" stroke="${INK}" stroke-width="1.25"/>`);
    // partizioni interne (camera / soggiorno / bagno)
    const nRooms = 2 + Math.floor(r() * 2);
    for (let i = 1; i < nRooms; i++) {
      if (r() > 0.5) {
        const lx = ux + (uw / nRooms) * i;
        parts.push(`<line x1="${lx.toFixed(1)}" y1="${uy.toFixed(1)}" x2="${lx.toFixed(1)}" y2="${(uy + uh * 0.62).toFixed(1)}" stroke="${INK_SOFT}" stroke-width="0.9"/>`);
      } else {
        const ly = uy + (uh / nRooms) * i;
        parts.push(`<line x1="${ux.toFixed(1)}" y1="${ly.toFixed(1)}" x2="${(ux + uw * 0.6).toFixed(1)}" y2="${ly.toFixed(1)}" stroke="${INK_SOFT}" stroke-width="0.9"/>`);
      }
    }
    // porta di ingresso con arco di apertura
    const doorX = doorSide === "l" ? ux + uw - 2 : ux + 2;
    const doorY = uy + uh / 2;
    const sweep = doorSide === "l" ? 1 : 0;
    parts.push(`<path d="M${doorX.toFixed(1)} ${doorY.toFixed(1)} a24 24 0 0 ${sweep} ${(doorSide === "l" ? -24 : 24)} 24" fill="none" stroke="${INK_SOFT}" stroke-width="0.9"/>`);
    // balcone
    const bw2 = uw * 0.5;
    parts.push(`<rect x="${(ux + uw / 2 - bw2 / 2).toFixed(1)}" y="${(uy - 12).toFixed(1)}" width="${bw2.toFixed(1)}" height="10" fill="none" stroke="${INK_SOFT}" stroke-width="1"/>`);
  };

  for (let i = 0; i < leftUnits; i++) {
    const uh = ph / leftUnits;
    drawUnit(px, leftW, py + i * uh, uh, "l");
  }
  for (let i = 0; i < rightUnits; i++) {
    const uh = ph / Math.max(1, rightUnits);
    drawUnit(corX + corW, rightW, py + i * uh, uh, "r");
  }

  // quote perimetrali
  parts.push(`<line x1="${px}" y1="${py - 26}" x2="${px + pw}" y2="${py - 26}" stroke="${INK_SOFT}" stroke-width="0.75"/>`);
  parts.push(`<text x="${px + pw / 2}" y="${py - 32}" font-size="12" fill="${INK_SOFT}" text-anchor="middle">${(pw / 38).toFixed(2)} m</text>`);
  parts.push(`<line x1="${px - 26}" y1="${py}" x2="${px - 26}" y2="${py + ph}" stroke="${INK_SOFT}" stroke-width="0.75"/>`);
  parts.push(`<text x="${px - 34}" y="${py + ph / 2}" font-size="12" fill="${INK_SOFT}" text-anchor="middle" transform="rotate(-90 ${px - 34} ${py + ph / 2})">${(ph / 38).toFixed(2)} m</text>`);

  // freccia nord
  const nx = W - 130, ny = 70;
  parts.push(`<g transform="translate(${nx},${ny})"><line x1="0" y1="24" x2="0" y2="-10" stroke="${INK}" stroke-width="1.5"/><path d="M0 -10 L-6 4 L6 4 Z" fill="${INK}"/><text x="0" y="40" font-size="12" fill="${INK_SOFT}" text-anchor="middle">V</text></g>`);
  parts.push(`<text x="${px}" y="${py + ph + 30}" font-size="12" fill="${INK_SOFT}">Tipologji: ${esc(o.typology)} · ${units} njësi për kat</text>`);

  return frame(o, W, H, parts.join("\n"));
}

// -------------------------------------------------------------------- PRERJA

export function sectionSvg(o: BlueprintOpts): string {
  const W = 900, H = 620;
  const floors = Math.max(2, o.floors);
  const floorH = 46, bw = 420;
  const bx = (W - bw) / 2;
  const groundY = H - 200;
  const roofY = groundY - floors * floorH;
  const parts: string[] = [];

  parts.push(`<line x1="60" y1="${groundY}" x2="${W - 60}" y2="${groundY}" stroke="${INK}" stroke-width="2"/>`);
  // fondacione tratteggiata
  const fdY = groundY, fdH = 46;
  parts.push(`<rect x="${bx - 10}" y="${fdY}" width="${bw + 20}" height="${fdH}" fill="none" stroke="${INK}" stroke-width="1.5"/>`);
  for (let i = 0; i < 18; i++) {
    const hx = bx - 10 + i * ((bw + 20) / 17);
    parts.push(`<line x1="${hx.toFixed(1)}" y1="${fdY}" x2="${(hx - 10).toFixed(1)}" y2="${fdY + fdH}" stroke="${INK_SOFT}" stroke-width="0.75"/>`);
  }

  // solette (bande scure) e piani
  for (let f = 0; f <= floors; f++) {
    const fy = roofY + f * floorH;
    parts.push(`<rect x="${bx}" y="${(fy - 4).toFixed(1)}" width="${bw}" height="8" fill="${INK}"/>`);
    if (f < floors) {
      parts.push(`<line x1="${bx + 14}" y1="${fy.toFixed(1)}" x2="${bx + 14}" y2="${(fy + floorH).toFixed(1)}" stroke="${INK_SOFT}" stroke-width="1"/>`);
      parts.push(`<line x1="${(bx + bw - 14).toFixed(1)}" y1="${fy.toFixed(1)}" x2="${(bx + bw - 14).toFixed(1)}" y2="${(fy + floorH).toFixed(1)}" stroke="${INK_SOFT}" stroke-width="1"/>`);
      parts.push(`<text x="${bx + 22}" y="${(fy + floorH / 2 + 4).toFixed(1)}" font-size="10.5" fill="${INK_SOFT}">2.85</text>`);
    }
  }

  // vano scala in sezione (zig-zag)
  const stX = bx + bw / 2 - 40;
  let zig = `M${stX} ${groundY}`;
  for (let f = 0; f < floors; f++) {
    const y0 = groundY - f * floorH, y1 = groundY - (f + 1) * floorH;
    zig += ` L${stX + 40} ${y0 - floorH * 0.5} L${stX} ${y1}`;
  }
  parts.push(`<path d="${zig}" fill="none" stroke="${INK_SOFT}" stroke-width="1"/>`);

  // copertura
  parts.push(`<line x1="${bx - 16}" y1="${roofY}" x2="${bx + bw + 16}" y2="${roofY}" stroke="${INK}" stroke-width="2.5"/>`);
  parts.push(`<rect x="${bx + bw / 2 - 22}" y="${roofY - 34}" width="44" height="34" fill="none" stroke="${INK_SOFT}" stroke-width="1"/>`);

  // quota totale
  const dimX = bx + bw + 44;
  parts.push(`<line x1="${dimX}" y1="${roofY}" x2="${dimX}" y2="${groundY}" stroke="${INK_SOFT}" stroke-width="1"/>`);
  parts.push(`<text x="${dimX + 10}" y="${(roofY + groundY) / 2}" font-size="12" fill="${INK_SOFT}" transform="rotate(90 ${dimX + 10} ${(roofY + groundY) / 2})" text-anchor="middle">Lartësia totale ${(floors * 2.85).toFixed(1)} m</text>`);

  return frame(o, W, H, parts.join("\n"));
}

// ------------------------------------------------------ INQUADRIMI URBAN

export function siteSvg(o: BlueprintOpts): string {
  const W = 900, H = 620;
  const r = rngFrom(o.seed + "site");
  const plotX = 160, plotY = 90, plotW = 560, plotH = 380;
  const parts: string[] = [];

  parts.push(`<rect x="${plotX}" y="${plotY}" width="${plotW}" height="${plotH}" fill="none" stroke="${INK_SOFT}" stroke-width="1.5" stroke-dasharray="6 5"/>`);

  const bw2 = plotW * 0.5, bh2 = plotH * 0.42;
  const bx2 = plotX + plotW * 0.24, by2 = plotY + plotH * 0.28;
  parts.push(`<rect x="${bx2}" y="${by2}" width="${bw2}" height="${bh2}" fill="${INK}" opacity="0.14" stroke="${INK}" stroke-width="1.75"/>`);
  parts.push(`<text x="${bx2 + bw2 / 2}" y="${by2 + bh2 / 2}" font-size="12" fill="${INK}" text-anchor="middle">${esc(o.projectName)}</text>`);

  // strada di accesso
  parts.push(`<rect x="0" y="${plotY + plotH + 20}" width="${W}" height="34" fill="#EEF2F3" stroke="${INK_SOFT}" stroke-width="1"/>`);
  parts.push(`<line x1="0" y1="${plotY + plotH + 37}" x2="${W}" y2="${plotY + plotH + 37}" stroke="${INK_SOFT}" stroke-width="1" stroke-dasharray="10 8"/>`);
  parts.push(`<text x="${W / 2}" y="${plotY + plotH + 41}" font-size="11" fill="${INK_SOFT}" text-anchor="middle" dy="14">Rrugë ekzistuese</text>`);

  // lotti vicini, schematici
  const neighbours = [
    { x: 40, y: 90, w: 90, h: 130 },
    { x: 40, y: 250, w: 90, h: 160 },
    { x: 760, y: 90, w: 100, h: 150 },
    { x: 760, y: 270, w: 100, h: 150 },
  ];
  for (const n of neighbours) {
    parts.push(`<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" fill="#F1F4F5" stroke="${FAINT}" stroke-width="1"/>`);
  }
  void r;

  // freccia nord e scala grafica
  parts.push(`<g transform="translate(${W - 90},60)"><line x1="0" y1="26" x2="0" y2="-8" stroke="${INK}" stroke-width="1.5"/><path d="M0 -8 L-6 6 L6 6 Z" fill="${INK}"/><text x="0" y="42" font-size="12" fill="${INK_SOFT}" text-anchor="middle">V</text></g>`);
  const sbX = 60, sbY = plotY + plotH + 78;
  parts.push(`<line x1="${sbX}" y1="${sbY}" x2="${sbX + 120}" y2="${sbY}" stroke="${INK}" stroke-width="1.5"/>`);
  parts.push(`<line x1="${sbX}" y1="${sbY - 5}" x2="${sbX}" y2="${sbY + 5}" stroke="${INK}" stroke-width="1.5"/>`);
  parts.push(`<line x1="${sbX + 120}" y1="${sbY - 5}" x2="${sbX + 120}" y2="${sbY + 5}" stroke="${INK}" stroke-width="1.5"/>`);
  parts.push(`<text x="${sbX + 60}" y="${sbY - 8}" font-size="11" fill="${INK_SOFT}" text-anchor="middle">20 m</text>`);

  return frame(o, W, H, parts.join("\n"));
}

// ------------------------------------------------------------- RENDERIMI

/**
 * Render i ngjyrosur në stil marketing (qiell, bimësi, xham, fasadë e
 * ngrohtë) — gjenerohet tërësisht lokalisht nga të njëjtat të dhëna
 * dimensionale të projektit si prospekti teknik. Nuk është foto e vërtetë
 * dhe nuk shkarkohet asgjë nga interneti; vetëm paleta dhe stili ndryshojnë
 * nga vizatimi teknik monokromatik.
 */
export function renderSvg(o: BlueprintOpts): string {
  const W = 900, H = 620;
  const r = rngFrom(o.seed + "render");
  const bays = Math.max(3, o.unitsPerFloor * 2);
  const floors = Math.max(2, o.floors);
  const bayW = 62, floorH = 50;
  const bw = bays * bayW;
  const bx = (W - bw) / 2;
  const groundY = 470;
  const roofY = groundY - floors * floorH;

  const FACADE = "#EDE4D3";
  const FACADE_DARK = "#DCCEB4";
  const TRIM = "#8A6D53";
  const GLASS_A = "#BFE3EE";
  const GLASS_B = "#6FAFC9";
  const GRASS_A = "#7FAE6B";
  const GRASS_B = "#5C8F4C";
  const SKY_TOP = "#7FBEE8";
  const SKY_HORIZON = "#DCEEF2";
  const PAVE = "#D8D3C9";

  const parts: string[] = [];

  parts.push(`<defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${SKY_TOP}"/>
      <stop offset="1" stop-color="${SKY_HORIZON}"/>
    </linearGradient>
    <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GRASS_A}"/>
      <stop offset="1" stop-color="${GRASS_B}"/>
    </linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GLASS_A}"/>
      <stop offset="1" stop-color="${GLASS_B}"/>
    </linearGradient>
  </defs>`);

  parts.push(`<rect width="${W}" height="${H}" fill="url(#sky)"/>`);
  const sunX = 90 + r() * 120, sunY = 70 + r() * 40;
  parts.push(`<circle cx="${sunX.toFixed(0)}" cy="${sunY.toFixed(0)}" r="34" fill="#FFF6DE" opacity="0.85"/>`);

  const hillY = groundY - 30;
  parts.push(`<path d="M0 ${hillY} Q ${W * 0.2} ${hillY - 26} ${W * 0.42} ${hillY - 8} T ${W} ${hillY - 14} V ${groundY} H0 Z" fill="#A9C7A1" opacity="0.55"/>`);

  parts.push(`<rect x="0" y="${groundY}" width="${W}" height="${H - groundY}" fill="url(#grass)"/>`);
  parts.push(`<rect x="0" y="${groundY - 4}" width="${W}" height="8" fill="${PAVE}"/>`);

  const plazaW = bw + 160, plazaX = bx - 80;
  parts.push(`<rect x="${plazaX}" y="${groundY}" width="${plazaW}" height="${H - groundY}" fill="${PAVE}"/>`);
  for (let i = 0; i < 12; i++) {
    const px = plazaX + (plazaW / 12) * i;
    parts.push(`<line x1="${px.toFixed(1)}" y1="${groundY}" x2="${px.toFixed(1)}" y2="${H}" stroke="#C3BCAE" stroke-width="1"/>`);
  }

  // building shadow
  parts.push(`<ellipse cx="${(bx + bw / 2).toFixed(1)}" cy="${groundY + 10}" rx="${bw / 2 + 24}" ry="12" fill="#2E4A33" opacity="0.18"/>`);

  // building volume
  parts.push(`<rect x="${bx}" y="${roofY}" width="${bw}" height="${groundY - roofY}" fill="${FACADE}"/>`);
  for (let f = 1; f < floors; f++) {
    const fy = roofY + f * floorH;
    parts.push(`<rect x="${bx}" y="${fy.toFixed(1)}" width="${bw}" height="3" fill="${FACADE_DARK}"/>`);
  }
  parts.push(`<rect x="${bx}" y="${roofY - 12}" width="${bw}" height="12" fill="${TRIM}"/>`);

  for (let f = 0; f < floors; f++) {
    const fy = roofY + f * floorH;
    const hasBalcony = r() > 0.45;
    for (let b = 0; b < bays; b++) {
      const wx = bx + b * bayW + bayW * 0.16;
      const ww = bayW * 0.68;
      const wy = fy + floorH * 0.2;
      const wh = floorH * 0.62;
      parts.push(`<rect x="${wx.toFixed(1)}" y="${wy.toFixed(1)}" width="${ww.toFixed(1)}" height="${wh.toFixed(1)}" fill="url(#glass)" stroke="${TRIM}" stroke-width="1.5"/>`);
      parts.push(`<line x1="${(wx + ww / 2).toFixed(1)}" y1="${wy.toFixed(1)}" x2="${(wx + ww / 2).toFixed(1)}" y2="${(wy + wh).toFixed(1)}" stroke="${TRIM}" stroke-width="1"/>`);
      if (hasBalcony && f > 0) {
        const balY = fy - 4;
        parts.push(`<rect x="${(wx - 6).toFixed(1)}" y="${balY.toFixed(1)}" width="${(ww + 12).toFixed(1)}" height="6" fill="${TRIM}"/>`);
        parts.push(`<rect x="${(wx - 6).toFixed(1)}" y="${(balY - 26).toFixed(1)}" width="${(ww + 12).toFixed(1)}" height="26" fill="${GLASS_A}" opacity="0.35" stroke="${TRIM}" stroke-width="1"/>`);
      }
    }
  }

  // rooftop greenery accent
  for (let i = 0; i < 5; i++) {
    const tx = bx + 20 + r() * (bw - 40);
    parts.push(`<circle cx="${tx.toFixed(1)}" cy="${(roofY - 14).toFixed(1)}" r="6" fill="${GRASS_A}"/>`);
  }

  // entrance canopy
  const doorW = bayW * 1.4, doorX = bx + bw / 2 - doorW / 2;
  parts.push(`<rect x="${doorX.toFixed(1)}" y="${(groundY - 46).toFixed(1)}" width="${doorW.toFixed(1)}" height="46" fill="#3B4A46"/>`);
  parts.push(`<rect x="${(doorX - 14).toFixed(1)}" y="${(groundY - 58).toFixed(1)}" width="${(doorW + 28).toFixed(1)}" height="8" fill="${TRIM}"/>`);

  // trees flanking the plaza
  const treeSpots = [plazaX - 30, plazaX + 20, plazaX + plazaW - 20, plazaX + plazaW + 30];
  for (const tx of treeSpots) {
    const ty = groundY - 6;
    const trunkH = 14 + r() * 6;
    parts.push(`<rect x="${(tx - 2).toFixed(1)}" y="${(ty - trunkH).toFixed(1)}" width="4" height="${trunkH.toFixed(1)}" fill="#6B5641"/>`);
    const crownR = 16 + r() * 8;
    parts.push(`<circle cx="${tx.toFixed(1)}" cy="${(ty - trunkH - crownR * 0.6).toFixed(1)}" r="${crownR.toFixed(1)}" fill="${GRASS_A}"/>`);
    parts.push(`<circle cx="${(tx - crownR * 0.4).toFixed(1)}" cy="${(ty - trunkH - crownR * 0.3).toFixed(1)}" r="${(crownR * 0.7).toFixed(1)}" fill="${GRASS_B}" opacity="0.8"/>`);
  }

  // two small figures for scale
  for (const fx of [plazaX + plazaW * 0.28, plazaX + plazaW * 0.7]) {
    const fy2 = groundY + 20;
    parts.push(`<circle cx="${fx.toFixed(1)}" cy="${(fy2 - 16).toFixed(1)}" r="4" fill="#3B4A46"/>`);
    parts.push(`<rect x="${(fx - 3).toFixed(1)}" y="${(fy2 - 12).toFixed(1)}" width="6" height="16" rx="2" fill="#3B4A46"/>`);
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${parts.join("\n")}</svg>`;
}

export function blueprintFor(kind: string, o: BlueprintOpts): string {
  if (kind === "RENDER") return renderSvg(o);
  if (kind === "PLAN") return floorPlanSvg(o);
  if (kind === "SECTION") return sectionSvg(o);
  if (kind === "SITE") return siteSvg(o);
  return elevationSvg(o);
}
