/** Punti di controllo di campo per ciascuna fase. */
export const CHECKLIST: Record<string, string[]> = {
  FOUNDATION: [
    "Gërmimi sipas kuotës së projektit",
    "Armatura e themeleve sipas detajit",
    "Klasa e betonit C25/30 e vërtetuar",
    "Hidroizolimi i kryer",
    "Testi i rezistencës 28-ditor",
  ],
  STRUCTURE: [
    "Kolonat sipas planimetrisë",
    "Solete të derdhura deri në katin e deklaruar",
    "Trashësia mbrojtëse e betonit",
    "Shkallët dhe boshti i ashensorit",
    "Raporti i laboratorit i bashkëngjitur",
  ],
  ROOF: [
    "Solete e fundit e derdhur",
    "Hidroizolimi i çatisë",
    "Sistemi i largimit të ujërave",
    "Parapeti dhe siguria",
  ],
  ENVELOPE: [
    "Muret e jashtme të përfunduara",
    "Dritaret e montuara",
    "Izolimi termik i fasadës",
    "Suvatimi i jashtëm",
  ],
  FINISHES: [
    "Instalimet elektrike të përfunduara",
    "Instalimet hidrosanitare",
    "Dyshemetë dhe veshjet",
    "Ashensori i vënë në punë",
  ],
  HANDOVER: [
    "Certifikata e përdorimit",
    "Zonat e përbashkëta të përfunduara",
    "Sistemimi i jashtëm",
    "Dorëzimi i çelësave",
  ],
};

export function checklistFor(type: string, ok = false) {
  return (CHECKLIST[type] ?? []).map((label) => ({ label, ok }));
}

/** Coordinate del comune, usate per simulare il rilievo GPS del dispositivo. */
export const CITY_COORDS: Record<string, [number, number]> = {
  "Tiranë": [41.3275, 19.8187],
  "Durrës": [41.3231, 19.4414],
  "Vlorë": [40.4667, 19.4897],
  "Shkodër": [42.0683, 19.5126],
  "Elbasan": [41.1125, 20.0822],
  "Fier": [40.7239, 19.5567],
};
