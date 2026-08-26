"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProject } from "@/app/actions";

const MUNICIPALITIES = ["Tiranë", "Durrës", "Vlorë", "Shkodër", "Elbasan", "Fier"];

function L({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{label}</span>
      {children}
    </label>
  );
}

export default function NewProjectForm({
  banks,
  labels,
  formLabels,
  attachLabels,
}: {
  banks: { id: string; name: string }[];
  labels: Record<string, string>;
  formLabels: Record<string, string>;
  attachLabels: Record<string, string>;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  return (
    <form
      className="space-y-7"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        start(async () => {
          const res = await createProject(fd);
          if (res.ok && res.id) router.push(`/zhvillues/${res.id}`);
          else setErr(res.message ?? formLabels.error);
        });
      }}
    >
      <section className="bg-white border border-[#dbe4e7] rounded-sm">
        <h2 className="px-6 py-4 border-b border-[#e9eff1] text-[1.15rem] font-serif font-bold text-petrol-800">{labels.step1}</h2>
        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <L label={labels.name}><input name="name" required className="field" defaultValue="Rezidenca Adriatik Park" /></L>
          <L label={labels.municipality}>
            <select name="municipality" className="field" defaultValue="Durrës">
              {MUNICIPALITIES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </L>
          <L label={labels.address}><input name="address" required className="field" defaultValue="Rruga Pavarësia 74" /></L>
          <L label={labels.permitNo}><input name="permitNo" required className="field" defaultValue="LN-DR-2026-0512" /></L>
          <L label={labels.permitDate}><input type="date" name="permitDate" className="field" defaultValue="2026-05-18" /></L>
          <L label={labels.expected}><input type="date" name="expected" className="field" defaultValue="2029-06-30" /></L>
        </div>
      </section>

      <section className="bg-white border border-[#dbe4e7] rounded-sm">
        <h2 className="px-6 py-4 border-b border-[#e9eff1] text-[1.15rem] font-serif font-bold text-petrol-800">{labels.step2}</h2>
        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-5">
          <L label={labels.unitsCount}><input type="number" name="unitsCount" min={1} max={200} className="field" defaultValue={15} /></L>
          <L label={labels.avgArea}><input type="number" name="avgArea" min={25} max={300} className="field" defaultValue={82} /></L>
          <L label={labels.pricePerSqm}><input type="number" name="pricePerSqm" min={300} max={5000} className="field" defaultValue={1450} /></L>
        </div>
      </section>

      <section className="bg-white border border-[#dbe4e7] rounded-sm">
        <h2 className="px-6 py-4 border-b border-[#e9eff1] text-[1.15rem] font-serif font-bold text-petrol-800">{labels.step3}</h2>
        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <L label={labels.bank}>
            <select name="bankId" className="field" required defaultValue={banks[0]?.id}>
              {banks.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
          </L>
          <div />
          <L label={attachLabels.PERMIT}><input type="file" name="permitFile" className="field text-[0.92rem]" /></L>
          <L label={attachLabels.SCHEDULE}><input type="file" name="scheduleFile" className="field text-[0.92rem]" /></L>
        </div>
      </section>

      {err && <p className="text-accent-700 font-semibold">{err}</p>}

      <div className="flex gap-3">
        <button disabled={pending} className="bg-petrol-800 text-white px-6 py-3 rounded-sm font-semibold hover:bg-petrol-700 disabled:opacity-60">
          {pending ? formLabels.save + "…" : labels.submit}
        </button>
        <a href="/zhvillues" className="border border-petrol-200 bg-white px-6 py-3 rounded-sm font-semibold">{formLabels.cancel}</a>
      </div>
    </form>
  );
}
