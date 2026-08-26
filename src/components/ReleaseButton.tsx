"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveRelease, executeRelease } from "@/app/actions";

export default function ReleaseButton({
  id,
  label,
  busy,
  mode = "execute",
  blockLabels = {},
}: {
  id: string;
  label: string;
  busy: string;
  mode?: "execute" | "approve";
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
            const res = mode === "approve" ? await approveRelease(id) : await executeRelease(id);
            if (!res.ok) setErr(blockLabels[res.message ?? ""] ?? res.message ?? "");
            router.refresh();
          })
        }
        className="bg-petrol-800 text-white px-4 py-2 rounded-sm text-sm font-semibold hover:bg-petrol-700 disabled:opacity-50 whitespace-nowrap"
      >
        {pending ? busy : label}
      </button>
      {err && <span className="block text-accent-700 text-[0.8rem] font-semibold mt-1">{err}</span>}
    </span>
  );
}
