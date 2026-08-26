/**
 * Storico del progetto: unisce eventi da piu' tabelle (vendite, verifiche,
 * svincoli, ispezioni) con i pochi fatti che esistono solo nel registro delle
 * attivita' (congelamento, rifiuto) in un'unica sequenza cronologica.
 */
import { db } from "./db";

export type HistoryEvent = {
  at: Date;
  kind: string; // chiave di traduzione in t.history
  title: string; // dettaglio gia' pronto per la visualizzazione (nessun enum grezzo)
  who?: string;
  // per gli eventi il cui testo contiene un enum (fase, esito): tradotto a schermo, non qui,
  // perche' questa funzione non conosce la lingua attiva.
  meta?: { type?: string; outcome?: string; pct?: number };
};

export async function getProjectHistory(projectId: string): Promise<HistoryEvent[]> {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: {
      units: { include: { contract: { include: { buyer: true } } } },
      milestones: { include: { certifier: true }, orderBy: { orderIndex: "asc" } },
      inspections: true,
      escrow: { include: { releases: { include: { milestone: true } } } },
    },
  });
  if (!project) return [];

  const events: HistoryEvent[] = [];

  events.push({ at: project.permitDate, kind: "SUBMITTED", title: project.permitNo });
  if (project.registeredAt) events.push({ at: project.registeredAt, kind: "REGISTERED", title: project.publicCode ?? "" });

  for (const u of project.units) {
    if (u.contract) {
      events.push({
        at: u.contract.signedAt,
        kind: "SALE",
        title: `${u.label} · ${u.contract.buyer.name} · ${u.contract.priceEur.toLocaleString("it-IT")} €`,
      });
    }
  }

  for (const m of project.milestones) {
    if (m.status === "CERTIFIED" && m.verifiedAt) {
      events.push({ at: m.verifiedAt, kind: "CERTIFIED", title: "", who: m.certifier?.name, meta: { type: m.type, pct: m.cumulativePct } });
    }
  }

  if (project.escrow) {
    for (const r of project.escrow.releases) {
      events.push({ at: r.requestedAt, kind: "RELEASE_REQUESTED", title: `${r.code} · ${r.amountEur.toLocaleString("it-IT")} €` });
      if (r.approvedAt) events.push({ at: r.approvedAt, kind: "RELEASE_APPROVED", title: `${r.code} · ${r.amountEur.toLocaleString("it-IT")} €` });
      if (r.executedAt) events.push({ at: r.executedAt, kind: "RELEASE_EXECUTED", title: `${r.code} · ${r.amountEur.toLocaleString("it-IT")} €` });
      if (r.status === "BLOCKED" && r.blockReason) events.push({ at: r.approvedAt ?? r.requestedAt, kind: "RELEASE_BLOCKED", title: r.blockReason });
    }
  }

  for (const i of project.inspections) {
    events.push({ at: i.performedAt, kind: "INSPECTION", title: "", who: i.inspector, meta: { type: i.type, outcome: i.outcome } });
  }

  if (project.rejectionReason) {
    // nessun campo dedicato per la data del rifiuto: si usa la data di deposito come riferimento piu' vicino disponibile.
    const rejected = await db.auditLog.findFirst({ where: { action: "PROJECT_REJECTED", entityRef: project.name } });
    events.push({ at: rejected?.createdAt ?? project.permitDate, kind: "REJECTED", title: project.rejectionReason });
  }

  const frozen = await db.auditLog.findMany({
    where: { action: { in: ["PROJECT_FROZEN", "PROJECT_UNFROZEN"] }, entityRef: project.name },
    orderBy: { createdAt: "asc" },
  });
  for (const f of frozen) {
    events.push({ at: f.createdAt, kind: f.action === "PROJECT_FROZEN" ? "FROZEN" : "UNFROZEN", title: f.detail });
  }

  events.sort((a, b) => a.at.getTime() - b.at.getTime());
  return events;
}
