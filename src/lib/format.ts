import { EUR_TO_ALL } from "./constants";

export function eur(n: number | null | undefined): string {
  const v = Math.round(n ?? 0);
  return v.toLocaleString("de-DE") + " €";
}

export function lek(n: number | null | undefined): string {
  const v = Math.round((n ?? 0) * EUR_TO_ALL);
  return v.toLocaleString("de-DE") + " L";
}

/** Importo in euro con equivalente in lekë, per le schermate istituzionali. */
export function money(n: number | null | undefined) {
  return { eur: eur(n), lek: lek(n) };
}

export function dateShort(v: Date | string | null | undefined): string {
  if (!v) return "—";
  const dt = typeof v === "string" ? new Date(v) : v;
  return dt.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function pct(n: number): string {
  return `${Math.round(n)}%`;
}
