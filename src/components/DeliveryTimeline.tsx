import { dateShort } from "@/lib/format";

/**
 * Riga temporale compatta: permesso, registrazione, consegna dichiarata
 * all'origine, consegna attuale, oggi. Se la consegna attuale è slittata
 * rispetto a quella dichiarata, il tratto fra le due è evidenziato in rosso.
 *
 * Permesso e registrazione cadono quasi sempre a poche settimane di distanza,
 * contro un arco di anni fra permesso e consegna: su una scala proporzionale
 * le loro etichette si sovrappongono quasi sempre. Le etichette troppo vicine
 * vengono perciò sfalsate su una seconda riga, invece di lasciarle scontrarsi.
 */
export default function DeliveryTimeline({
  permitDate,
  registeredAt,
  originalDelivery,
  expectedDelivery,
  labels,
}: {
  permitDate: Date;
  registeredAt: Date | null;
  originalDelivery: Date | null;
  expectedDelivery: Date;
  labels: Record<string, string>;
}) {
  const today = new Date();
  const raw: { at: Date; label: string; key: string }[] = [{ at: permitDate, label: labels.permit, key: "permit" }];
  if (registeredAt) raw.push({ at: registeredAt, label: labels.registered, key: "registered" });
  if (originalDelivery) raw.push({ at: originalDelivery, label: labels.original, key: "original" });
  raw.push({ at: expectedDelivery, label: labels.current, key: "current" });
  raw.push({ at: today, label: labels.today, key: "today" });

  const min = Math.min(...raw.map((p) => p.at.getTime()));
  const max = Math.max(...raw.map((p) => p.at.getTime()));
  const span = Math.max(1, max - min);
  const pct = (t: number) => ((t - min) / span) * 100;

  // ordina per data e sceglie, per ciascuna tappa, la riga (0 o 1) che ha
  // abbastanza margine dall'ultima etichetta gia' piazzata su quella riga —
  // non solo dalla precedente in ordine cronologico, altrimenti tre tappe
  // ravvicinate su quattro finirebbero comunque tutte sulla stessa riga.
  const sorted = [...raw].map((p) => ({ ...p, pct: pct(p.at.getTime()) })).sort((a, b) => a.pct - b.pct);
  const MIN_GAP_PCT = 16;
  const lastPctInRow = [-Infinity, -Infinity];
  const points = sorted.map((p) => {
    const gap0 = p.pct - lastPctInRow[0];
    const gap1 = p.pct - lastPctInRow[1];
    const row = gap0 >= MIN_GAP_PCT ? 0 : gap1 >= MIN_GAP_PCT ? 1 : gap0 >= gap1 ? 0 : 1;
    lastPctInRow[row] = p.pct;
    return { ...p, row };
  });
  const hasSecondRow = points.some((p) => p.row === 1);

  const slippedDays = originalDelivery ? Math.round((expectedDelivery.getTime() - originalDelivery.getTime()) / 864e5) : 0;
  const slippedMonths = Math.round(slippedDays / 30);

  return (
    <div className="px-6 py-6">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[0.7rem] uppercase tracking-[0.1em] text-slate-500 font-semibold">{labels.title}</span>
        {originalDelivery && (
          slippedMonths > 0 ? (
            <span className="text-[0.85rem] font-semibold text-accent-700">{labels.delayedBy} {slippedMonths} {labels.months}</span>
          ) : (
            <span className="text-[0.85rem] font-semibold text-[#2C5F3A]">{labels.onTime}</span>
          )
        )}
      </div>
      <div className={`relative h-1.5 bg-[#e4ebee] rounded-sm mt-8 ${hasSecondRow ? "mb-16" : "mb-10"}`}>
        {originalDelivery && slippedMonths > 0 && (
          <div
            className="absolute h-1.5 bg-accent rounded-sm"
            style={{ left: `${pct(originalDelivery.getTime())}%`, width: `${pct(expectedDelivery.getTime()) - pct(originalDelivery.getTime())}%` }}
          />
        )}
        {points.map((p) => (
          <div key={p.key} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${p.pct}%` }}>
            <div className={`w-2.5 h-2.5 rounded-full -translate-x-1/2 ${p.key === "today" ? "bg-petrol-800" : "bg-slate-400"}`} />
            <div
              className="absolute -translate-x-1/2 text-center whitespace-nowrap"
              style={{ top: p.row === 0 ? 16 : 52 }}
            >
              <div className="text-[0.72rem] text-slate-500 font-semibold">{p.label}</div>
              <div className="text-[0.78rem] text-petrol-800 font-semibold tabular-nums">{dateShort(p.at)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
