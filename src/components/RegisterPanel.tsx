"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerProject } from "@/app/actions";

type Check = { key: string; ok: boolean; detail: string };

export default function RegisterPanel({
  projectId,
  registered,
  checks,
  labels,
  devLabels,
  escrowLabels,
  iban,
  bank,
}: {
  projectId: string;
  registered: boolean;
  checks: Check[];
  labels: Record<string, string>;
  devLabels: Record<string, string>;
  escrowLabels: Record<string, string>;
  iban: string;
  bank: string;
}) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const router = useRouter();
  const allOk = checks.every((c) => c.ok);

  if (registered) {
    return (
      <div className="border-l-4 border-[#2C5F3A] bg-[#EDF4EE] px-6 py-5 rounded-sm">
        <h2 className="text-[1.2rem] font-serif font-bold text-petrol-800">{devLabels.registered}</h2>
        <p className="text-[1.02rem] text-slate-700 mt-1.5 max-w-3xl">{devLabels.registeredNote}</p>
        <div className="mt-3 text-[0.92rem] text-slate-600">
          {escrowLabels.bank}: <span className="font-semibold">{bank}</span> · {escrowLabels.iban}:{" "}
          <span className="font-mono">{iban}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#dbe4e7] rounded-sm">
      <div className="px-6 py-4 border-b border-[#e9eff1]">
        <h2 className="text-[1.15rem] font-serif font-bold text-petrol-800">{labels.title}</h2>
      </div>
      <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
        {checks.map((c) => (
          <div key={c.key} className="flex items-start gap-3 text-[1rem]">
            <span className={`mt-0.5 w-5 text-center font-bold ${c.ok ? "text-[#2C5F3A]" : "text-accent"}`}>{c.ok ? "✓" : "✕"}</span>
            <span className="flex-1">
              {labels[c.key]}
              <span className="block text-[0.85rem] text-slate-500 font-mono">{c.detail}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Scenario 1a: la vendita e' spenta finche' il progetto non e' registrato, con la ragione a schermo. */}
      <div className="px-6 py-5 border-t border-[#e9eff1] flex flex-wrap items-start gap-4">
        <button
          type="button"
          disabled
          title={devLabels.putOnSaleBlocked}
          className="bg-[#eef2f3] text-slate-400 px-5 py-3 rounded-sm font-semibold cursor-not-allowed border border-[#dbe4e7]"
        >
          {devLabels.putOnSale}
        </button>
        <p className="flex-1 min-w-[280px] text-[0.98rem] text-slate-600 leading-snug max-w-2xl">
          {devLabels.putOnSaleBlocked}
        </p>
      </div>

      <div className="px-6 py-5 border-t border-[#e9eff1]">
        <button
          type="button"
          disabled={pending || !allOk}
          onClick={() =>
            start(async () => {
              const res = await registerProject(projectId);
              setDone(res.ok ? res.message ?? "" : res.message ?? "");
              router.refresh();
            })
          }
          className="bg-petrol-800 text-white px-6 py-3 rounded-sm font-semibold hover:bg-petrol-700 disabled:opacity-50"
        >
          {pending ? "…" : devLabels.submit}
        </button>
        {done && <p className="mt-3 font-semibold text-petrol-800">{done}</p>}
      </div>
    </div>
  );
}
