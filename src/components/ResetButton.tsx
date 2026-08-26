"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { resetDemo } from "@/app/actions";

/** Doppio passaggio voluto: nessuno azzera la demo con un clic distratto. */
export default function ResetButton({ labels }: { labels: Record<string, string> }) {
  const [armed, setArmed] = useState(false);
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);
  const router = useRouter();

  if (done) return <span className="text-petrol-100">{labels.done}</span>;

  if (!armed) {
    return (
      <button type="button" onClick={() => setArmed(true)} className="text-petrol-200 hover:text-white underline underline-offset-2" title={labels.hint}>
        {labels.label}
      </button>
    );
  }

  return (
    <span className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            await resetDemo();
            setDone(true);
            router.refresh();
            setTimeout(() => { setDone(false); setArmed(false); }, 3000);
          })
        }
        className="bg-accent text-white px-3 py-1 rounded-sm font-semibold disabled:opacity-60"
      >
        {pending ? labels.doing : labels.confirm}
      </button>
      <button type="button" onClick={() => setArmed(false)} className="text-petrol-200 hover:text-white">
        ✕
      </button>
    </span>
  );
}
