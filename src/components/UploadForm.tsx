"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { uploadAttachment } from "@/app/actions";

const KINDS = ["PERMIT", "SCHEDULE", "STRUCTURAL", "LAB_TEST", "CADASTRE", "INSURANCE", "OTHER"];

export default function UploadForm({
  projectId,
  milestoneId,
  labels,
  formLabels,
}: {
  projectId?: string;
  milestoneId?: string;
  labels: Record<string, string>;
  formLabels: Record<string, string>;
}) {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="bg-petrol-800 text-white px-4 py-2 rounded-sm text-sm font-semibold hover:bg-petrol-700">
        {labels.upload}
      </button>
    );
  }

  return (
    <form
      ref={ref}
      className="w-[420px] space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        if (projectId) fd.set("projectId", projectId);
        if (milestoneId) fd.set("milestoneId", milestoneId);
        start(async () => {
          const res = await uploadAttachment(fd);
          setMsg({ ok: res.ok, text: res.message ?? "" });
          if (res.ok) {
            ref.current?.reset();
            router.refresh();
            setTimeout(() => { setOpen(false); setMsg(null); }, 1600);
          }
        });
      }}
    >
      <input name="title" className="field" placeholder={labels.docTitle} />
      <select name="kind" className="field" defaultValue="STRUCTURAL">
        {KINDS.map((k) => <option key={k} value={k}>{labels[k]}</option>)}
      </select>
      <input type="file" name="file" required className="field text-[0.9rem]" />
      <div className="flex gap-2">
        <button disabled={pending} className="bg-petrol-800 text-white px-4 py-2 rounded-sm text-sm font-semibold disabled:opacity-60">
          {pending ? labels.uploading : labels.upload}
        </button>
        <button type="button" onClick={() => { setOpen(false); setMsg(null); }} className="border border-petrol-200 px-4 py-2 rounded-sm text-sm font-semibold">
          {formLabels.cancel}
        </button>
      </div>
      {msg && <p className={`text-sm font-semibold ${msg.ok ? "text-[#2C5F3A]" : "text-accent-700"}`}>{msg.text}</p>}
    </form>
  );
}
