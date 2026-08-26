export const EUR_TO_ALL = 98;

export const ROLES = ["CITIZEN", "DEVELOPER", "CERTIFIER", "BANK", "AGENCY"] as const;
export type Role = (typeof ROLES)[number];

export const LOCALES = ["sq", "en", "it"] as const;
export type Locale = (typeof LOCALES)[number];

// Scala di svincolo: % cumulata del riscosso che puo' essere liberata
export const MILESTONE_LADDER = [
  { type: "FOUNDATION", orderIndex: 1, cumulativePct: 25 },
  { type: "STRUCTURE", orderIndex: 2, cumulativePct: 45 },
  { type: "ROOF", orderIndex: 3, cumulativePct: 60 },
  { type: "ENVELOPE", orderIndex: 4, cumulativePct: 75 },
  { type: "FINISHES", orderIndex: 5, cumulativePct: 90 },
  { type: "HANDOVER", orderIndex: 6, cumulativePct: 95 },
] as const;

export const RETENTION_PCT = 5;
