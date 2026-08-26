// Punto d'ingresso da riga di comando: `npm run db:seed`.
import { seedDatabase } from "../src/lib/seed";

seedDatabase()
  .then((counts) => {
    console.log("PRONA seed OK:", counts);
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
