/**
 * Modello di visibilita' della demo.
 *
 * Il punto istituzionale da mostrare in sala: nel sistema non tutti vedono tutto.
 * Il cittadino vede la propria posizione e l'avanzamento certificato, non la cassa
 * del costruttore. Il certificatore vede il cantiere, non gli importi: non deve
 * sapere quanto denaro dipende dalla sua firma. La banca vede i movimenti, non le
 * checklist tecniche. Solo l'Agenzia vede tutto.
 */
import type { Role } from "./constants";

export type Scope =
  // denaro
  | "project.escrow.totals" // saldi complessivi del conto vincolato del progetto
  | "project.escrow.iban"
  | "project.releases" // ordini di svincolo: importo, chi ha autorizzato, quando
  | "project.contracts" // elenco contratti e acquirenti del progetto
  | "project.units.prices"
  | "developer.financials" // patrimonio, contenziosi, storico impresa
  // tecnica
  | "milestone.checklist"
  | "milestone.photos"
  | "attachments.technical"
  | "attachments.upload"
  // vigilanza
  | "inspections"
  | "certifier.record" // fascicolo pubblico del certificatore
  | "audit.log"
  // proprio
  | "own.position"; // la propria pratica: prezzo, versato, vincolato

const MATRIX: Record<Role, Scope[]> = {
  CITIZEN: ["milestone.photos", "certifier.record", "own.position"],
  DEVELOPER: [
    "project.escrow.totals",
    "project.escrow.iban",
    "project.releases",
    "project.contracts",
    "project.units.prices",
    "milestone.checklist",
    "milestone.photos",
    "attachments.technical",
    "attachments.upload",
    "certifier.record",
  ],
  CERTIFIER: ["milestone.checklist", "milestone.photos", "attachments.technical", "attachments.upload", "certifier.record"],
  BANK: ["project.escrow.totals", "project.escrow.iban", "project.releases", "project.contracts", "developer.financials", "certifier.record"],
  AGENCY: [
    "project.escrow.totals",
    "project.escrow.iban",
    "project.releases",
    "project.contracts",
    "project.units.prices",
    "developer.financials",
    "milestone.checklist",
    "milestone.photos",
    "attachments.technical",
    "attachments.upload",
    "inspections",
    "certifier.record",
    "audit.log",
    "own.position",
  ],
};

export function can(role: Role, scope: Scope): boolean {
  return MATRIX[role]?.includes(scope) ?? false;
}

// Stesso ordine dei commenti sopra: denaro, tecnica, vigilanza, proprio.
// Fonte unica anche per la pagina pubblica "Kush sheh çfarë".
export const SCOPES: Scope[] = [
  "project.escrow.totals",
  "project.escrow.iban",
  "project.releases",
  "project.contracts",
  "project.units.prices",
  "developer.financials",
  "milestone.checklist",
  "milestone.photos",
  "attachments.technical",
  "attachments.upload",
  "inspections",
  "certifier.record",
  "audit.log",
  "own.position",
];

/** Chiave della spiegazione mostrata al posto del dato nascosto. */
export function denialKey(role: Role): string {
  return `denied.${role}`;
}

// L'identita' selezionabile (chi sei DENTRO il ruolo: quale sviluppatore, quale
// certificatore...) vive in ./identity.ts, che interroga il database. Qui restano
// solo le regole di visibilita', che non dipendono da quale riga sei.
