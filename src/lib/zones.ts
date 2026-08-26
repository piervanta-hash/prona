/**
 * Aggregazioni per zona urbana: la vista "Zonat në zhvillim" e la scheda di
 * zona leggono da qui, non ricalcolano ciascuna per conto proprio.
 */
import { db } from "./db";
import { projectCoords } from "./geo";

export type ZoneSummary = {
  zone: string;
  municipality: string;
  projectCount: number;
  unitsTotal: number;
  unitsAvailable: number;
  avgPricePerSqm: number;
  avgProgress: number;
  avgDelivery: Date | null;
  lat: number;
  lng: number;
};

export async function getZoneSummaries(): Promise<ZoneSummary[]> {
  const projects = await db.project.findMany({
    where: { zone: { not: null } },
    include: { units: true },
  });

  const byZone = new Map<string, typeof projects>();
  for (const p of projects) {
    const key = p.zone!;
    if (!byZone.has(key)) byZone.set(key, []);
    byZone.get(key)!.push(p);
  }

  const out: ZoneSummary[] = [];
  for (const [zone, list] of byZone) {
    let unitsTotal = 0, unitsAvailable = 0, priceSum = 0, priceCount = 0, progressSum = 0, deliverySum = 0;
    let latSum = 0, lngSum = 0;
    for (const p of list) {
      unitsTotal += p.units.length;
      unitsAvailable += p.units.filter((u) => u.status === "FREE").length;
      for (const u of p.units) {
        priceSum += Math.round(u.priceEur / u.areaSqm);
        priceCount++;
      }
      progressSum += p.progressPct;
      deliverySum += p.expectedDelivery.getTime();
      const c = projectCoords(p.id, p.municipality);
      latSum += c.lat;
      lngSum += c.lng;
    }
    out.push({
      zone,
      municipality: list[0].municipality,
      projectCount: list.length,
      unitsTotal,
      unitsAvailable,
      avgPricePerSqm: priceCount ? Math.round(priceSum / priceCount) : 0,
      avgProgress: Math.round(progressSum / list.length),
      avgDelivery: list.length ? new Date(deliverySum / list.length) : null,
      lat: latSum / list.length,
      lng: lngSum / list.length,
    });
  }

  return out.sort((a, b) => b.projectCount - a.projectCount || a.zone.localeCompare(b.zone));
}

export async function getZoneDetail(zone: string) {
  const projects = await db.project.findMany({
    where: { zone },
    include: { developer: true, units: true },
    orderBy: { name: "asc" },
  });
  const priceStats = await db.zonePriceStat.findMany({ where: { zone }, orderBy: { quarter: "asc" } });
  const transactions = await db.contract.count({ where: { unit: { project: { zone } } } });

  const typologyCount = new Map<string, number>();
  for (const p of projects) for (const u of p.units) typologyCount.set(u.typology, (typologyCount.get(u.typology) ?? 0) + 1);
  let dominantTypology = "—";
  let maxCount = 0;
  for (const [ty, c] of typologyCount) {
    if (c > maxCount) {
      maxCount = c;
      dominantTypology = ty;
    }
  }

  const withOriginal = projects.filter((p) => p.originalDelivery);
  const delayed = withOriginal.filter((p) => p.expectedDelivery.getTime() > p.originalDelivery!.getTime());
  const delayedShare = withOriginal.length ? Math.round((delayed.length / withOriginal.length) * 100) : 0;

  return { projects, priceStats, transactions, dominantTypology, delayedShare };
}
