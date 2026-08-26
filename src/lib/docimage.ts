/**
 * Anteprima generata localmente dei documenti tecnici del seed.
 * Non e' un PDF: e' un'immagine di documento, sufficiente a mostrare in sala
 * che al fascicolo e' allegato qualcosa di verificabile.
 */
import { fingerprint } from "./sitephoto";

export type DocOpts = {
  title: string;
  kind: string;
  project: string;
  code: string;
  issuer: string;
  date: string;
  seed: string;
};

export function documentSvg(o: DocOpts): string {
  const w = 850, h = 1200;
  const lines: string[] = [];
  let y = 300;
  const rng = (() => {
    let x = 0;
    for (let i = 0; i < o.seed.length; i++) x = (x * 31 + o.seed.charCodeAt(i)) >>> 0;
    return () => ((x = (x * 1103515245 + 12345) >>> 0) / 4294967296);
  })();

  for (let p = 0; p < 7; p++) {
    for (let i = 0; i < 3 + Math.floor(rng() * 3); i++) {
      const lw = 420 + rng() * 250;
      lines.push(`<rect x="70" y="${y}" width="${lw.toFixed(0)}" height="9" rx="2" fill="#C9D1D4"/>`);
      y += 22;
    }
    y += 18;
    if (y > 900) break;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <rect width="${w}" height="${h}" fill="#FFFFFF"/>
  <rect width="${w}" height="${h}" fill="none" stroke="#D8E0E3" stroke-width="2"/>
  <rect x="0" y="0" width="${w}" height="8" fill="#0E2A33"/>
  <text x="70" y="90" font-family="ui-serif,Georgia,serif" font-size="30" font-weight="700" fill="#0E2A33">${esc(o.title)}</text>
  <text x="70" y="124" font-family="system-ui,sans-serif" font-size="17" fill="#5C7C88">${esc(o.kind)} · ${esc(o.project)}</text>
  <line x1="70" y1="150" x2="${w - 70}" y2="150" stroke="#D8E0E3" stroke-width="2"/>
  <text x="70" y="186" font-family="ui-monospace,Menlo,monospace" font-size="15" fill="#17323B">${esc(o.code)}</text>
  <text x="70" y="212" font-family="ui-monospace,Menlo,monospace" font-size="15" fill="#17323B">${esc(o.issuer)}</text>
  <text x="70" y="238" font-family="ui-monospace,Menlo,monospace" font-size="15" fill="#17323B">${esc(o.date)}</text>
  ${lines.join("\n  ")}
  <g transform="translate(${w - 260},${h - 300}) rotate(-9)">
    <circle cx="100" cy="100" r="92" fill="none" stroke="#0E2A33" stroke-width="4" opacity="0.75"/>
    <circle cx="100" cy="100" r="78" fill="none" stroke="#0E2A33" stroke-width="2" opacity="0.6"/>
    <text x="100" y="88" text-anchor="middle" font-family="system-ui,sans-serif" font-size="19" font-weight="700" fill="#0E2A33" opacity="0.8">PRONA</text>
    <text x="100" y="112" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#0E2A33" opacity="0.75">REGJISTRI PUBLIK</text>
    <text x="100" y="134" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="11" fill="#0E2A33" opacity="0.75">${esc(o.date)}</text>
  </g>
  <path d="M110 ${h - 210} c 40 -46 66 22 104 -20 c 30 -32 52 26 92 -6" stroke="#1D3E5C" stroke-width="3" fill="none" opacity="0.8"/>
  <line x1="70" y1="${h - 150}" x2="${w - 70}" y2="${h - 150}" stroke="#D8E0E3" stroke-width="2"/>
  <text x="70" y="${h - 120}" font-family="ui-monospace,Menlo,monospace" font-size="13" fill="#5C7C88">${fingerprint(o.seed)}</text>
  <text x="70" y="${h - 96}" font-family="system-ui,sans-serif" font-size="13" fill="#8B9CA3">Dokument demonstrativ i gjeneruar lokalisht — të dhëna fiktive</text>
</svg>`;
}

function esc(s: string) {
  return String(s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" } as any)[c]);
}
