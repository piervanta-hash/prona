"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerPayment } from "@/app/actions";

type C = { id: string; label: string; suggested: number; paid: number };

export default function PaymentForm({
  contracts,
  labels,
  blockLabels,
  formLabels,
}: {
  contracts: C[];
  labels: Record<string, string>;
  blockLabels: Record<string, string>;
  formLabels: Record<string, string>;
}) {
  const [chosen, setChosen] = useState("");
  const [pending, start] = useTransition();
  const [ok, setOk] = useState<string | null>(null);
  const [block, setBlock] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();
  // L'elenco dei contratti cambia mentre la demo procede: la scelta si riallinea da sola.
  const contractId = contracts.some((c) => c.id === chosen) ? chosen : contracts[0]?.id ?? "";
  const selected = contracts.find((c) => c.id === contractId);

  if (contracts.length === 0) {
    return (
      <div className="bg-white border border-[#dbe4e7] rounded-sm">
        <div className="px-6 py-4 border-b border-[#e9eff1]">
          <h2 className="text-[1.15rem] font-serif font-bold text-petrol-800">{labels.paymentTitle}</h2>
        </div>
        <p className="px-6 py-5 text-slate-500">{labels.noContracts}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#dbe4e7] rounded-sm">
      <div className="px-6 py-4 border-b border-[#e9eff1]">
        <h2 className="text-[1.15rem] font-serif font-bold text-petrol-800">{labels.paymentTitle}</h2>
      </div>
      <form
        className="px-6 py-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          fd.set("contractId", contractId);
          setOk(null);
          setBlock(null);
          setErr(null);
          start(async () => {
            const res = await registerPayment(fd);
            if (res.ok) {
              setOk(`${labels.paymentOk} · ${res.message}`);
              router.refresh();
            } else if (res.message === "ESCROW_NOT_ACTIVE") {
              setBlock("ESCROW_NOT_ACTIVE");
            } else {
              setErr(res.message ?? formLabels.error);
            }
          });
        }}
      >
        <label className="block">
          <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{labels.unit}</span>
          <select className="field" value={contractId} onChange={(e) => setChosen(e.target.value)}>
            {contracts.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{labels.paymentAmount}</span>
            <input name="amount" type="number" className="field" key={contractId + ":" + (selected?.suggested ?? 0)} defaultValue={selected?.suggested ?? 0} />
          </label>
          <label className="block">
            <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{labels.paymentRef}</span>
            <input name="reference" className="field" defaultValue="" placeholder="TRF-…" />
          </label>
        </div>
        <button disabled={pending} className="bg-petrol-800 text-white px-6 py-3 rounded-sm font-semibold hover:bg-petrol-700 disabled:opacity-60">
          {pending ? "…" : labels.payment}
        </button>
      </form>

      {err && <p className="px-6 pb-4 text-accent-700 font-semibold">{err}</p>}

      {ok && (
        <div className="mx-6 mb-6 border-l-4 border-[#2C5F3A] bg-[#EDF4EE] px-5 py-4 rounded-sm">
          <p className="font-semibold text-petrol-800">{ok}</p>
        </div>
      )}
      {block && (
        <div className="mx-6 mb-6 border-2 border-accent bg-[#FAEDEF] px-6 py-5 rounded-sm">
          <div className="text-[0.72rem] uppercase tracking-[0.14em] font-bold text-accent-700">{blockLabels.title}</div>
          <p className="text-[1.15rem] text-petrol-900 mt-2 font-semibold leading-snug">{blockLabels[block]}</p>
        </div>
      )}
    </div>
  );
}
