"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sampleRecheck } from "@/app/actions";

export default function RecheckForm({
  milestoneId,
  items,
  certifierName,
  checksDone,
  deviations,
  openAssignments,
  labels,
  formLabels,
  alreadyRevoked,
}: {
  milestoneId: string;
  items: string[];
  certifierName: string;
  checksDone: number;
  deviations: number;
  openAssignments: number;
  labels: Record<string, string>;
  formLabels: Record<string, string>;
  alreadyRevoked: boolean;
}) {
  const [failed, setFailed] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState<{ deviation: boolean; text: string; reassigned: number } | null>(null);
  const router = useRouter();

  const outcome = failed.length > 0 ? "DEVIATION" : "PASS";
  const rateBefore = checksDone > 0 ? (deviations / checksDone) * 100 : 0;
  const rateAfter = checksDone > 0 ? ((deviations + 1) / checksDone) * 100 : 0;

  if (alreadyRevoked && !done) {
    return (
      <div className="border-2 border-accent bg-[#FAEDEF] px-7 py-6 rounded-sm">
        <p className="text-[1.15rem] font-semibold text-petrol-900">{labels.doneDeviation}</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#dbe4e7] rounded-sm">
      <div className="px-6 py-4 border-b border-[#e9eff1]">
        <h2 className="text-[1.15rem] font-serif font-bold text-petrol-800">{labels.myCheck}</h2>
        <p className="text-[0.92rem] text-slate-600 mt-1">{labels.markFail}</p>
      </div>

      <ul>
        {items.map((label) => {
          const bad = failed.includes(label);
          return (
            <li key={label} className="border-b border-[#eef2f4] last:border-b-0">
              <button
                type="button"
                onClick={() => setFailed((p) => (p.includes(label) ? p.filter((x) => x !== label) : [...p, label]))}
                className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-[#f7fafb]"
              >
                <span
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center border-2 rounded-sm font-bold ${
                    bad ? "bg-accent border-accent text-white" : "border-[#c1d0d5] text-transparent"
                  }`}
                >
                  ✕
                </span>
                <span className={`text-[1.05rem] ${bad ? "font-semibold text-accent-700" : ""}`}>{label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="px-6 py-5 space-y-5 border-t border-[#e9eff1]">
        <label className="block">
          <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{labels.notes}</span>
          <textarea className="field" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>

        <div
          className={`border-2 rounded-sm px-5 py-4 ${
            outcome === "DEVIATION" ? "border-accent bg-[#FAEDEF]" : "border-[#CADDCE] bg-[#EDF4EE]"
          }`}
        >
          <div className="text-[0.72rem] uppercase tracking-[0.12em] font-bold text-slate-600">{labels.myCheck}</div>
          <div className="text-[1.2rem] font-semibold text-petrol-900 mt-1">{labels[outcome]}</div>
        </div>

        {outcome === "DEVIATION" && (
          <div className="border-l-4 border-accent bg-[#FAEDEF] px-5 py-4 rounded-sm">
            <div className="text-[0.72rem] uppercase tracking-[0.12em] font-bold text-accent-700">{labels.consequences}</div>
            <ul className="mt-2 space-y-1 text-[1rem] text-petrol-900">
              <li>· {labels.suspended} — <span className="font-semibold">{certifierName}</span></li>
              {openAssignments > 0 && (
                <li>· {labels.reassigned} ({openAssignments})</li>
              )}
              <li>· {labels.revoked}</li>
              <li>
                · {labels.rateBefore} <span className="tabular-nums font-semibold">{rateBefore.toFixed(1)}%</span> →{" "}
                {labels.rateAfter} <span className="tabular-nums font-bold text-accent-700">{rateAfter.toFixed(1)}%</span>
              </li>
            </ul>
          </div>
        )}

        <div className="border-t border-[#e9eff1] pt-5">
          <div className="text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold">{labels.inspector}</div>
          <div className="text-[1.05rem] text-petrol-800 font-semibold mt-1">Insp. Merita Zeka</div>
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              const fd = new FormData();
              fd.set("milestoneId", milestoneId);
              fd.set("outcome", outcome);
              fd.set("notes", notes);
              fd.set("failed", JSON.stringify(failed));
              start(async () => {
                const res = await sampleRecheck(fd);
                if (res.ok) {
                  setDone({ deviation: outcome === "DEVIATION", text: res.message ?? "", reassigned: Number(res.id ?? 0) });
                  router.refresh();
                }
              });
            }}
            className={`mt-4 text-white px-7 py-3.5 rounded-sm font-semibold text-[1.05rem] disabled:opacity-50 ${
              outcome === "DEVIATION" ? "bg-accent hover:bg-accent-700" : "bg-petrol-800 hover:bg-petrol-700"
            }`}
          >
            {pending ? labels.submitting : labels.submit}
          </button>

          {done && (
            <div
              className={`mt-5 border-l-4 px-5 py-4 rounded-sm ${
                done.deviation ? "border-accent bg-[#FAEDEF]" : "border-[#2C5F3A] bg-[#EDF4EE]"
              }`}
            >
              <p className="text-[1.1rem] font-semibold text-petrol-900">{done.text}</p>
              {done.deviation && done.reassigned > 0 && (
                <p className="text-[0.95rem] text-slate-700 mt-1">
                  {labels.reassigned} ({done.reassigned})
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
