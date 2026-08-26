// Azzera il database della demo: cancella il file SQLite.
// Il ripopolamento avviene subito dopo, da "npm run reset".
import { rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const f of ["prisma/dev.db", "prisma/dev.db-journal"]) {
  const p = join(root, f);
  if (existsSync(p)) {
    rmSync(p);
    console.log("Rimosso", f);
  }
}
console.log("Database azzerato.");
