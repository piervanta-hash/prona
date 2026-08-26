"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { freezeProject, unfreezeProject } from "@/app/actions";

export default function FreezePanel({
  projectId,
  frozen,
  reason,
  labels,
  formLabels,
}: {
  projectId: string;
  frozen: boolean;
  reason: string;
  labels: Record<string, string>;
  formLabels: Record<string, string>;
}) {
  const [text, setText] = useState(labels.defaultReason);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  if (frozen) {
    return (
      <div className="border-2 border-accent bg-[#FAEDEF] px-7 py-6 rounded-sm">
        <div className="text-[0.72rem] uppercase tracking-[0.14em] font-bold text-accent-700">{labels.title}</div>
        <p className="text-[1.4rem] font-serif font-bold text-petrol-900 mt-2">{labels.done}</p>
        {reason && <p className="text-[1rem] text-slate-700 mt-2 max-w-3xl">{reason}</p>}
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              await unfreezeProject(projectId);
              router.refresh();
            })
          }
          className="mt-5 border border-petrol-200 bg-white px-5 py-2.5 rounded-sm font-semibold text-sm disabled:opacity-50"
        >
          {labels.undo}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#dbe4e7] rounded-sm">
      <div className="px-6 py-4 border-b border-[#e9eff1]">
        <h2 className="text-[1.15rem] font-serif font-bold text-petrol-800">{labels.title}</h2>
      </div>
      <div className="px-6 py-5 flex flex-wrap items-end gap-5">
        <label className="flex-1 min-w-[320px]">
          <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{labels.reason}</span>
          <input className="field" value={text} onChange={(e) => setText(e.target.value)} />
        </label>
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const res = await freezeProject(projectId, text);
              setMsg(res.message ?? "");
              router.refresh();
            })
          }
          className="bg-accent text-white px-7 py-3 rounded-sm font-semibold hover:bg-accent-700 disabled:opacity-50"
        >
          {pending ? labels.acting : labels.action}
        </button>
      </div>
      {msg && <p className="px-6 pb-5 font-semibold text-petrol-800">{msg}</p>}
    </div>
  );
}
