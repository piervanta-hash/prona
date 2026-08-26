/**
 * Risoluzione dell'identita' selezionata all'interno di un ruolo.
 *
 * La demo non ha un vero login: un cookie porta l'id del "soggetto" scelto
 * (uno sviluppatore, un certificatore, una banca, un cittadino). L'Agenzia
 * resta un soggetto unico — e' il regolatore, non un'impresa fra tante.
 * Se il cookie e' assente o non corrisponde piu' a nulla (es. dopo un
 * azzeramento dei dati), si ricade sull'identita' predefinita del ruolo,
 * cosi' la demo non mostra mai una schermata vuota per un id scaduto.
 */
import { db } from "./db";
import type { Role } from "./constants";

export type Identity = { id: string; name: string; sub?: string };

export const DEFAULT_IDENTITY_ID: Record<Role, string> = {
  CITIZEN: "buyer-demo",
  DEVELOPER: "dev-1",
  CERTIFIER: "cert-3",
  BANK: "bank-bkt",
  AGENCY: "agency",
};

// I soli cittadini pensati come identita' selezionabili: gli altri acquirenti
// del seed sono comparse nelle tabelle dei contratti, non persone "in cui entrare".
export const DEMO_CITIZEN_IDS = ["buyer-demo", "citizen-2", "citizen-3"];

const AGENCY_IDENTITY: Identity = { id: "agency", name: "Agjencia PRONA — Zyra e Mbikëqyrjes" };

export async function resolveIdentity(role: Role, requestedId: string | null): Promise<Identity> {
  if (role === "AGENCY") return AGENCY_IDENTITY;

  const id = requestedId || DEFAULT_IDENTITY_ID[role];

  if (role === "DEVELOPER") {
    const d = (await db.developer.findUnique({ where: { id } })) ?? (await db.developer.findUnique({ where: { id: DEFAULT_IDENTITY_ID.DEVELOPER } }));
    return d ? { id: d.id, name: d.name, sub: d.city } : { id, name: "—" };
  }
  if (role === "CERTIFIER") {
    const c = (await db.certifier.findUnique({ where: { id } })) ?? (await db.certifier.findUnique({ where: { id: DEFAULT_IDENTITY_ID.CERTIFIER } }));
    return c ? { id: c.id, name: c.name, sub: c.registryNo } : { id, name: "—" };
  }
  if (role === "BANK") {
    const b = (await db.bank.findUnique({ where: { id } })) ?? (await db.bank.findUnique({ where: { id: DEFAULT_IDENTITY_ID.BANK } }));
    return b ? { id: b.id, name: b.name, sub: b.swift } : { id, name: "—" };
  }
  // CITIZEN
  const buyer = (await db.buyer.findUnique({ where: { id } })) ?? (await db.buyer.findUnique({ where: { id: DEFAULT_IDENTITY_ID.CITIZEN } }));
  return buyer ? { id: buyer.id, name: buyer.name, sub: buyer.idNumber } : { id, name: "—" };
}

/** Elenco dei soggetti fra cui scegliere per un ruolo: la lista mostrata nella schermata di accesso. */
export async function listIdentities(role: Role): Promise<Identity[]> {
  if (role === "AGENCY") return [AGENCY_IDENTITY];
  if (role === "DEVELOPER") {
    const rows = await db.developer.findMany({ orderBy: { name: "asc" } });
    return rows.map((d) => ({ id: d.id, name: d.name, sub: `${d.city} · ${d.tier}` }));
  }
  if (role === "CERTIFIER") {
    const rows = await db.certifier.findMany({ orderBy: { name: "asc" } });
    return rows.map((c) => ({ id: c.id, name: c.name, sub: c.registryNo }));
  }
  if (role === "BANK") {
    const rows = await db.bank.findMany({ orderBy: { name: "asc" } });
    return rows.map((b) => ({ id: b.id, name: b.name, sub: b.swift }));
  }
  // CITIZEN
  const rows = await db.buyer.findMany({ where: { id: { in: DEMO_CITIZEN_IDS } } });
  const byId = new Map(rows.map((b) => [b.id, b]));
  return DEMO_CITIZEN_IDS.filter((id) => byId.has(id)).map((id) => {
    const b = byId.get(id)!;
    return { id: b.id, name: b.name, sub: b.idNumber };
  });
}

/** Cerca un soggetto per identificativo digitato a mano, sul modello e-Albania. */
export async function findIdentityByCode(role: Role, code: string): Promise<Identity | null> {
  const needle = code.trim();
  if (!needle) return null;
  if (role === "DEVELOPER") {
    const d = await db.developer.findUnique({ where: { nipt: needle } });
    return d ? { id: d.id, name: d.name, sub: d.city } : null;
  }
  if (role === "CERTIFIER") {
    const c = await db.certifier.findUnique({ where: { registryNo: needle } });
    return c ? { id: c.id, name: c.name, sub: c.registryNo } : null;
  }
  if (role === "BANK") {
    const b = await db.bank.findFirst({ where: { swift: needle } });
    return b ? { id: b.id, name: b.name, sub: b.swift } : null;
  }
  if (role === "CITIZEN") {
    const b = await db.buyer.findFirst({ where: { idNumber: needle, id: { in: DEMO_CITIZEN_IDS } } });
    return b ? { id: b.id, name: b.name, sub: b.idNumber } : null;
  }
  return null;
}
