"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { registerSale } from "@/app/actions";

type U = { id: string; label: string; typology: string; areaSqm: number; priceEur: number };

export default function SaleForm({
  units,
  soldUnits,
  labels,
  blockLabels,
  formLabels,
}: {
  units: U[];
  soldUnits: U[];
  labels: Record<string, string>;
  blockLabels: Record<string, string>;
  formLabels: Record<string, string>;
}) {
  const all = [...units, ...soldUnits].sort((a, b) => a.label.localeCompare(b.label));
  const [chosen, setChosen] = useState("");
  const unitId = all.some((u) => u.id === chosen) ? chosen : units[0]?.id ?? all[0]?.id ?? "";
  const [pending, start] = useTransition();
  const [ok, setOk] = useState<string | null>(null);
  const [block, setBlock] = useState<{ code: string; info?: any } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const selected = all.find((u) => u.id === unitId);

  return (
    <div className="bg-white border border-[#dbe4e7] rounded-sm">
      <div className="px-6 py-4 border-b border-[#e9eff1]">
        <h2 className="text-[1.15rem] font-serif font-bold text-petrol-800">{labels.sellTitle}</h2>
      </div>

      <form
        className="px-6 py-5 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          fd.set("unitId", unitId);
          setOk(null);
          setBlock(null);
          setErr(null);
          start(async () => {
            const res = await registerSale(fd);
            if (res.ok) {
              setOk(`${labels.saleOk} · ${res.message}`);
              // L'unita' appena venduta resta selezionata: un secondo invio deve
              // ricadere sulla doppia vendita, non scivolare su un'altra unita'.
              setChosen(unitId);
              router.refresh();
            } else if (res.message === "ALREADY_SOLD" || res.message === "NOT_REGISTERED") {
              setBlock({ code: res.message, info: (res as any).blockedBy });
            } else {
              setErr(res.message ?? formLabels.error);
            }
          });
        }}
      >
        <label className="block">
          <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{labels.selectUnit}</span>
          <select className="field" value={unitId} onChange={(e) => setChosen(e.target.value)}>
            {all.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label} · {u.typology} · {u.areaSqm} m² {soldUnits.some((s) => s.id === u.id) ? "•" : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{labels.priceEur}</span>
            <input name="priceEur" type="number" className="field" key={unitId} defaultValue={selected?.priceEur ?? 0} />
          </label>
          <label className="block">
            <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{labels.depositPct}</span>
            <input name="depositPct" type="number" min={5} max={50} className="field" defaultValue={25} />
          </label>
          <label className="block">
            <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{labels.buyerName}</span>
            <input name="buyerName" required className="field" defaultValue="Endrit Kola" />
          </label>
          <label className="block">
            <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{labels.buyerId}</span>
            <input name="buyerId" required className="field" defaultValue="J75102043M" />
          </label>
          <label className="block">
            <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{labels.buyerPhone}</span>
            <input name="phone" className="field" defaultValue="+355 69 204 7781" />
          </label>
          <label className="block">
            <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{labels.buyerEmail}</span>
            <input name="email" className="field" defaultValue="endrit.kola@example.al" />
          </label>
        </div>

        <button disabled={pending} className="bg-petrol-800 text-white px-6 py-3 rounded-sm font-semibold hover:bg-petrol-700 disabled:opacity-60">
          {pending ? "…" : labels.confirmSale}
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
          <p className="text-[1.15rem] text-petrol-900 mt-2 font-semibold leading-snug">{blockLabels[block.code]}</p>
          {block.info && (
            <div className="mt-4 bg-white border border-[#E5CBD1] rounded-sm px-5 py-4">
              <div className="text-[0.7rem] uppercase tracking-[0.1em] text-slate-500 font-semibold">{blockLabels.existing}</div>
              <div className="mt-1.5 text-[1.05rem] font-mono font-bold text-petrol-800">{block.info.code}</div>
              <div className="text-[0.95rem] text-slate-700 mt-1">
                {block.info.buyer} · {new Date(block.info.signedAt).toLocaleDateString("it-IT")}
              </div>
              <div className="text-[0.9rem] text-slate-500 font-mono mt-0.5">{block.info.cadastreRef}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
