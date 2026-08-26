"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { handoverUnit } from "@/app/actions";

export default function HandoverButton({
  unitId,
  label,
  busy,
  blockLabels = {},
}: {
  unitId: string;
  label: string;
  busy: string;
  blockLabels?: Record<string, string>;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  return (
    <span>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await handoverUnit(unitId);
            if (!res.ok) setErr(blockLabels[res.message ?? ""] ?? res.message ?? "");
            router.refresh();
          })
        }
        className="bg-petrol-800 text-white px-3 py-1.5 rounded-sm text-[0.82rem] font-semibold hover:bg-petrol-700 disabled:opacity-50 whitespace-nowrap"
      >
        {pending ? busy : label}
      </button>
      {err && <span className="block text-accent-700 text-[0.76rem] font-semibold mt-1">{err}</span>}
    </span>
  );
}
