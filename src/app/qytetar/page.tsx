import { redirect } from "next/navigation";

// Errore di battitura comune ("qytetar" invece di "qytetari"): reindirizza invece di un vicolo cieco.
export default function QytetarRedirect() {
  redirect("/qytetari");
}
