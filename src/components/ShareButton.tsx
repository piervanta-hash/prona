"use client";

import { useState } from "react";

/** Condivisione nativa se disponibile, altrimenti copia il link. Nessuna rete coinvolta. */
export default function ShareButton({ url, title, label, copiedLabel }: { url: string; title: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        if (typeof navigator !== "undefined" && (navigator as any).share) {
          try {
            await (navigator as any).share({ title, url });
            return;
          } catch {
            // annullato dall'utente: nessuna azione
          }
        }
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        } catch {
          // clipboard non disponibile: ignorato in silenzio
        }
      }}
      className="border border-petrol-200 bg-white px-4 py-2 rounded-sm text-sm font-semibold hover:bg-petrol-50 whitespace-nowrap"
    >
      {copied ? copiedLabel : label}
    </button>
  );
}
