/**
 * Generatore locale di fotogrammi di cantiere.
 *
 * Nessuna immagine scaricata: la scena e' costruita a partire da una stringa seme,
 * quindi la stessa verifica mostra sempre la stessa foto, anche dopo un reset.
 * L'aspetto voluto e' quello di una foto di documentazione tecnica, non di un rendering:
 * inquadratura sporca, sovrimpressione con data, coordinate e impronta del file.
 */

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rngFrom(seed: string) {
  let x = hash(seed) || 1;
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5; x >>>= 0;
    return x / 4294967296;
  };
}

export function fingerprint(seed: string): string {
  const a = hash(seed).toString(16).padStart(8, "0");
  const b = hash(seed + "::2").toString(16).padStart(8, "0");
  return (a + b).toUpperCase().slice(0, 16).replace(/(.{4})(?=.)/g, "$1 ");
}

export type PhotoOpts = {
  seed: string;
  stage: string;
  date: string;
  lat: string;
  lng: string;
  code: string;
  registry: string;
  caption: string;
  w?: number;
  h?: number;
};

const SKY = ["#A8BAC4", "#B3C2C7", "#9DB0BC", "#BAC6C6"];
const GROUND = ["#7A7062", "#816F5C", "#726A5D"];
const CONCRETE = ["#7C776E", "#726C62", "#847E74"];

export function sitePhotoSvg(o: PhotoOpts): string {
  const w = o.w ?? 1200;
  const h = o.h ?? 800;
  const r = rngFrom(o.seed);
  const horizon = h * (0.58 + r() * 0.06);
  const sky = SKY[Math.floor(r() * SKY.length)];
  const ground = GROUND[Math.floor(r() * GROUND.length)];
  const conc = CONCRETE[Math.floor(r() * CONCRETE.length)];

  const parts: string[] = [];
  const tilt = (r() * 1.6 - 0.8).toFixed(2); // leggera inclinazione: foto scattata a mano

  // cielo e terreno
  parts.push(`<rect width="${w}" height="${horizon}" fill="${sky}"/>`);
  parts.push(`<rect y="${horizon}" width="${w}" height="${h - horizon}" fill="${ground}"/>`);

  // profilo urbano lontano
  let x = -20;
  while (x < w + 40) {
    const bw = 40 + r() * 90;
    const bh = 30 + r() * 90;
    parts.push(`<rect x="${x.toFixed(0)}" y="${(horizon - bh).toFixed(0)}" width="${bw.toFixed(0)}" height="${bh.toFixed(0)}" fill="#9BAAB2" opacity="0.55"/>`);
    x += bw * (0.7 + r() * 0.5);
  }
  // collina
  parts.push(`<path d="M0 ${horizon} Q ${w * 0.25} ${horizon - 120} ${w * 0.55} ${horizon - 40} T ${w} ${horizon - 70} L ${w} ${horizon} Z" fill="#8FA1A6" opacity="0.5"/>`);

  // foschia dietro al soggetto: stacca l'edificio dallo skyline
  parts.push(`<rect y="${horizon - 170}" width="${w}" height="190" fill="${sky}" opacity="0.32"/>`);

  parts.push(scene(o.stage, w, h, horizon, conc, r));

  // fango / tracce
  for (let i = 0; i < 26; i++) {
    const px = r() * w, py = horizon + r() * (h - horizon);
    parts.push(`<ellipse cx="${px.toFixed(0)}" cy="${py.toFixed(0)}" rx="${(12 + r() * 55).toFixed(0)}" ry="${(3 + r() * 9).toFixed(0)}" fill="#000" opacity="${(0.03 + r() * 0.06).toFixed(2)}"/>`);
  }

  // grana e vignettatura: fa leggere l'immagine come una foto, non come un disegno
  parts.push(`<rect width="${w}" height="${h}" fill="url(#grain)" opacity="0.22"/>`);
  parts.push(`<rect width="${w}" height="${h}" fill="#6B5B3E" opacity="0.04"/>`);
  parts.push(`<rect width="${w}" height="${h}" fill="url(#vig)"/>`);

  // sovrimpressione tecnica
  const barH = 96;
  parts.push(`<rect y="${h - barH}" width="${w}" height="${barH}" fill="#0E2A33" opacity="0.86"/>`);
  parts.push(`<text x="26" y="${h - barH + 34}" fill="#FFFFFF" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="24" font-weight="600">${esc(o.date)}   ${esc(o.lat)}, ${esc(o.lng)}</text>`);
  parts.push(`<text x="26" y="${h - barH + 68}" fill="#AFC4CC" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="20">${esc(o.code)} · ${esc(o.stage)} · ${esc(o.registry)} · ${fingerprint(o.seed)}</text>`);
  parts.push(`<rect x="24" y="24" width="${Math.min(560, 26 + o.caption.length * 13)}" height="44" fill="#0E2A33" opacity="0.72"/>`);
  parts.push(`<text x="40" y="54" fill="#FFFFFF" font-family="system-ui,sans-serif" font-size="22" font-weight="600">${esc(o.caption)}</text>`);
  // mirino tecnico
  parts.push(`<g stroke="#FFFFFF" stroke-width="2" opacity="0.5" fill="none"><path d="M${w / 2 - 26} ${horizon} h18 M${w / 2 + 8} ${horizon} h18 M${w / 2} ${horizon - 26} v18 M${w / 2} ${horizon + 8} v18"/></g>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(o.caption)}">
<defs>
  <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
  <pattern id="grain" width="${w}" height="${h}" patternUnits="userSpaceOnUse"><rect width="${w}" height="${h}" filter="url(#g)"/></pattern>
  <radialGradient id="vig" cx="50%" cy="45%" r="70%"><stop offset="50%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity="0.3"/></radialGradient>
</defs>
<g transform="rotate(${tilt} ${w / 2} ${h / 2}) scale(1.03) translate(${-w * 0.015} ${-h * 0.015})">
${parts.slice(0, parts.length - 6).join("\n")}
</g>
${parts.slice(parts.length - 6).join("\n")}
</svg>`;
}

function esc(s: string) {
  return String(s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" } as any)[c]);
}

function scene(stage: string, w: number, h: number, horizon: number, conc: string, r: () => number): string {
  const p: string[] = [];
  const groundH = h - horizon;

  const crane = (cx: number, topRaw: number) => {
    const top = Math.max(56, topRaw);
    return `
    <g stroke="#D9A441" stroke-width="7" fill="none" opacity="0.95">
      <path d="M${cx} ${horizon + 10} V ${top}"/>
      <path d="M${cx - 210} ${top + 16} H ${cx + 320}"/>
      <path d="M${cx} ${top - 46} L ${cx - 200} ${top + 14} M${cx} ${top - 46} L ${cx + 310} ${top + 14}"/>
    </g>
    <path d="M${cx + 190} ${top + 16} V ${top + 150}" stroke="#4A4A4A" stroke-width="3"/>
    <rect x="${cx + 170}" y="${top + 150}" width="42" height="26" fill="#6B6B6B"/>`;
  };

  // materiali in primo piano: danno profondita' e "sporcano" l'inquadratura
  const foreground = () => {
    const out: string[] = [];
    const py = h - 40;
    out.push(`<path d="M0 ${h} L 0 ${py - 30} Q ${w * 0.2} ${py - 80} ${w * 0.42} ${py - 20} L ${w * 0.42} ${h} Z" fill="#6A6154"/>`);
    for (let i = 0; i < 5; i++) {
      const bx2 = w * 0.5 + i * 26;
      out.push(`<rect x="${bx2.toFixed(0)}" y="${(py - 46 - i * 9).toFixed(0)}" width="180" height="12" fill="#8B98A0"/>`);
    }
    out.push(`<rect x="${w * 0.76}" y="${py - 58}" width="150" height="58" fill="#7A6A52"/>`);
    for (let i = 0; i < 4; i++) out.push(`<rect x="${w * 0.76}" y="${py - 58 + i * 15}" width="150" height="4" fill="#5E5240"/>`);
    return out.join("");
  };

  const fence = () => {
    const out: string[] = [];
    for (let i = 0; i < w + 60; i += 58) {
      out.push(`<rect x="${i}" y="${horizon + groundH * 0.52}" width="52" height="${groundH * 0.26}" fill="#4E6E76" opacity="0.92"/>`);
      out.push(`<rect x="${i}" y="${horizon + groundH * 0.52}" width="52" height="10" fill="#0E2A33" opacity="0.4"/>`);
    }
    return out.join("");
  };

  if (stage === "FOUNDATION") {
    const pitY = horizon + groundH * 0.04;
    p.push(`<path d="M${w * 0.06} ${pitY} L ${w * 0.94} ${pitY} L ${w * 0.99} ${h} L ${w * 0.01} ${h} Z" fill="#4E4539"/>`);
    p.push(`<path d="M${w * 0.13} ${pitY + 46} L ${w * 0.87} ${pitY + 46} L ${w * 0.92} ${h} L ${w * 0.08} ${h} Z" fill="#6B6151"/>`);
    p.push(`<rect x="${w * 0.13}" y="${pitY + 46}" width="${w * 0.74}" height="10" fill="#3A332A"/>`);
    // gabbie di armatura
    for (let gx = w * 0.18; gx < w * 0.84; gx += 86) {
      for (let gy = pitY + 70; gy < h - 120; gy += 44) {
        p.push(`<rect x="${gx.toFixed(0)}" y="${gy.toFixed(0)}" width="70" height="34" fill="none" stroke="#A87A4C" stroke-width="4" opacity="0.95"/>`);
      }
    }
    // casseforme
    p.push(`<rect x="${w * 0.12}" y="${pitY - 30}" width="${w * 0.76}" height="30" fill="#9A7B4E"/>`);
    p.push(`<rect x="${w * 0.12}" y="${pitY - 30}" width="${w * 0.76}" height="6" fill="#6E572F"/>`);
    p.push(crane(w * 0.78, horizon - 300));
    p.push(foreground());
    // autobetoniera
    p.push(`<g transform="translate(${w * 0.08},${horizon - 6})"><rect x="0" y="-46" width="150" height="46" fill="#5C6E74"/><circle cx="112" cy="-56" r="34" fill="${conc}"/><circle cx="30" cy="6" r="16" fill="#333"/><circle cx="120" cy="6" r="16" fill="#333"/></g>`);
    p.push(fence());
  } else if (stage === "STRUCTURE" || stage === "ROOF") {
    const floors = stage === "ROOF" ? 7 : 4 + Math.floor(r() * 2);
    const bw = w * 0.56, bx = w * 0.2, fh = 62;
    const top = horizon - floors * fh;
    p.push(crane(w * 0.85, top - 190));
    p.push(`<rect x="${bx}" y="${top}" width="${bw}" height="${floors * fh}" fill="${conc}"/>`);
    for (let i = 0; i <= floors; i++) {
      p.push(`<rect x="${bx - 8}" y="${(horizon - i * fh - 12).toFixed(0)}" width="${bw + 16}" height="12" fill="#9C9992"/>`);
    }
    for (let c = 0; c <= 5; c++) {
      p.push(`<rect x="${(bx + (c * bw) / 5 - 9).toFixed(0)}" y="${top}" width="18" height="${floors * fh}" fill="#A5A29B"/>`);
    }
    // ponteggio
    p.push(`<g stroke="#7E8B90" stroke-width="3" opacity="0.85" fill="none">`);
    for (let i = 0; i <= floors; i++) p.push(`<path d="M${bx - 26} ${horizon - i * fh} H ${bx + bw + 26}"/>`);
    for (let c = 0; c <= 8; c++) p.push(`<path d="M${bx - 26 + (c * (bw + 52)) / 8} ${horizon} V ${top}"/>`);
    p.push(`</g>`);
    if (stage === "ROOF") {
      p.push(`<rect x="${bx - 14}" y="${top - 20}" width="${bw + 28}" height="20" fill="#5F6B63"/>`);
      p.push(`<rect x="${bx + 40}" y="${top - 46}" width="120" height="26" fill="#2E4A5A"/>`);
      p.push(`<rect x="${bx + bw - 190}" y="${top - 44}" width="150" height="24" fill="#7A5F3E"/>`);
    }
    p.push(`<path d="M${bx + bw} ${top} l 70 34 v ${floors * fh} l -70 -30 Z" fill="#6F6C66"/>`);
    p.push(fence());
    p.push(foreground());
  } else if (stage === "ENVELOPE") {
    const floors = 8, bw = w * 0.6, bx = w * 0.18, fh = 56;
    const top = horizon - floors * fh;
    p.push(`<rect x="${bx}" y="${top}" width="${bw}" height="${floors * fh}" fill="#C6C1B7"/>`);
    for (let i = 0; i < floors; i++) {
      for (let c = 0; c < 6; c++) {
        p.push(`<rect x="${(bx + 26 + (c * (bw - 52)) / 6).toFixed(0)}" y="${(top + 16 + i * fh).toFixed(0)}" width="${((bw - 52) / 6 - 20).toFixed(0)}" height="30" fill="#4A6672" opacity="${(0.6 + r() * 0.35).toFixed(2)}"/>`);
      }
    }
    p.push(`<rect x="${bx - 30}" y="${top}" width="${bw + 60}" height="${floors * fh}" fill="#3E5A46" opacity="0.16"/>`);
    p.push(`<path d="M${bx + bw} ${top} l 66 32 v ${floors * fh} l -66 -28 Z" fill="#7C776E"/>`);
    p.push(`<g stroke="#7E8B90" stroke-width="3" opacity="0.7" fill="none">`);
    for (let i = 0; i <= floors; i++) p.push(`<path d="M${bx - 30} ${horizon - i * fh} H ${bx + bw + 30}"/>`);
    p.push(`</g>`);
    p.push(fence());
    p.push(foreground());
  } else if (stage === "FINISHES") {
    // interno di un appartamento al grezzo avanzato
    p.push(`<rect width="${w}" height="${h}" fill="#D6D2C9"/>`);
    p.push(`<rect y="${h * 0.72}" width="${w}" height="${h * 0.28}" fill="#A9A093"/>`);
    p.push(`<rect x="${w * 0.55}" y="${h * 0.16}" width="${w * 0.32}" height="${h * 0.44}" fill="#8FA6B2"/>`);
    p.push(`<rect x="${w * 0.55}" y="${h * 0.16}" width="${w * 0.32}" height="${h * 0.44}" fill="none" stroke="#5B6B72" stroke-width="10"/>`);
    p.push(`<path d="M${w * 0.71} ${h * 0.16} V ${h * 0.6}" stroke="#5B6B72" stroke-width="8"/>`);
    p.push(`<rect x="${w * 0.08}" y="${h * 0.2}" width="${w * 0.3}" height="${h * 0.52}" fill="#C8C3B8"/>`);
    for (let i = 0; i < 5; i++) p.push(`<rect x="${w * 0.1}" y="${h * (0.24 + i * 0.09)}" width="${w * 0.26}" height="6" fill="#B0AA9E"/>`);
    p.push(`<g stroke="#A8823E" stroke-width="6" fill="none"><path d="M${w * 0.42} ${h * 0.95} L ${w * 0.46} ${h * 0.34} M${w * 0.5} ${h * 0.95} L ${w * 0.46} ${h * 0.34}"/>`);
    for (let i = 0; i < 6; i++) p.push(`<path d="M${w * (0.435 + i * 0.005)} ${h * (0.9 - i * 0.1)} h ${w * 0.05}"/>`);
    p.push(`</g>`);
    p.push(`<rect x="${w * 0.04}" y="${h * 0.78}" width="${w * 0.12}" height="${h * 0.1}" fill="#6E7B6A"/>`);
  } else {
    // HANDOVER / generico: edificio ultimato
    const floors = 8, bw = w * 0.56, bx = w * 0.22, fh = 56;
    const top = horizon - floors * fh;
    p.push(`<rect x="${bx}" y="${top}" width="${bw}" height="${floors * fh}" fill="#DAD5CA"/>`);
    p.push(`<rect x="${bx}" y="${top}" width="${bw}" height="14" fill="#B9B2A6"/>`);
    for (let i = 0; i < floors; i++)
      for (let c = 0; c < 6; c++)
        p.push(`<rect x="${(bx + 26 + (c * (bw - 52)) / 6).toFixed(0)}" y="${(top + 18 + i * fh).toFixed(0)}" width="${((bw - 52) / 6 - 18).toFixed(0)}" height="32" fill="#3F5C69" opacity="${(0.55 + r() * 0.4).toFixed(2)}"/>`);
    p.push(`<path d="M${bx + bw} ${top} l 62 30 v ${floors * fh} l -62 -26 Z" fill="#B6B0A4"/>`);
    p.push(`<rect x="${bx + bw * 0.42}" y="${horizon - 62}" width="90" height="62" fill="#2E4A5A"/>`);
    for (let i = 0; i < 7; i++) {
      const tx = 60 + r() * (w - 120);
      p.push(`<circle cx="${tx.toFixed(0)}" cy="${(horizon - 26).toFixed(0)}" r="${(20 + r() * 16).toFixed(0)}" fill="#4E6B4A" opacity="0.9"/>`);
      p.push(`<rect x="${(tx - 3).toFixed(0)}" y="${(horizon - 20).toFixed(0)}" width="6" height="26" fill="#5C4A33"/>`);
    }
  }
  return p.join("\n");
}
