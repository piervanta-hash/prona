"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { certifyMilestone } from "@/app/actions";
import { photoUrl } from "@/lib/photoUrl";
import { fingerprint } from "@/lib/sitephoto";

type Photo = { seed: string; lat: number; lng: number; takenAt: string; captionKey: string };

export default function FieldApp(props: {
  milestoneId: string;
  projectName: string;
  developer: string;
  publicCode: string;
  stage: string;
  stageLabel: string;
  cumulativePct: number;
  certifierName: string;
  registryNo: string;
  items: string[];
  lat: number;
  lng: number;
  alreadyDone: boolean;
  labels: Record<string, string>;
  photoLabels: Record<string, string>;
  formLabels: Record<string, string>;
}) {
  const L = props.labels;
  const [checks, setChecks] = useState<boolean[]>(props.items.map(() => false));
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [outcome, setOutcome] = useState<"PASS" | "FAIL">("PASS");
  const [notes, setNotes] = useState("");
  const [pending, start] = useTransition();
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  const ctx = { stage: props.stage, code: props.publicCode, registry: props.registryNo };
  const allChecked = checks.every(Boolean);

  function capture() {
    // Aggiornamento funzionale: regge anche i clic ravvicinati durante la dimostrazione.
    setPhotos((prev) => {
      const i = prev.length;
      if (i >= 3) return prev;
      // Il rilievo GPS simula il dispositivo in cantiere: piccolo scarto attorno al comune.
      return [
        ...prev,
        {
          seed: `${props.milestoneId.slice(-6)}-${props.stage}-${i}-${Date.now().toString(36)}`,
          lat: +(props.lat + (i - 1) * 0.00042).toFixed(5),
          lng: +(props.lng + i * 0.00058).toFixed(5),
          takenAt: new Date().toISOString(),
          captionKey: `cap${i}`,
        },
      ];
    });
  }

  if (props.alreadyDone) {
    return (
      <div className="mt-4 border-l-4 border-[#2C5F3A] bg-[#EDF4EE] px-6 py-5 rounded-sm">
        <p className="text-[1.1rem] font-semibold text-petrol-800">{L.signed}</p>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-6">
      {/* intestazione del sopralluogo */}
      <div className="bg-petrol-800 text-white rounded-sm px-8 py-6">
        <div className="text-[0.7rem] uppercase tracking-[0.16em] text-petrol-200">{L.title}</div>
        <h1 className="text-[2rem] font-serif font-bold leading-tight mt-1">{props.projectName}</h1>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-5">
          <div>
            <div className="text-[0.68rem] uppercase tracking-[0.12em] text-petrol-200">{L.stage}</div>
            <div className="text-[1.15rem] font-semibold mt-0.5">{props.stageLabel}</div>
          </div>
          <div>
            <div className="text-[0.68rem] uppercase tracking-[0.12em] text-petrol-200">%</div>
            <div className="text-[1.15rem] font-semibold mt-0.5 tabular-nums">{props.cumulativePct}%</div>
          </div>
          <div>
            <div className="text-[0.68rem] uppercase tracking-[0.12em] text-petrol-200">{props.publicCode}</div>
            <div className="text-[0.95rem] mt-0.5">{props.developer}</div>
          </div>
          <div>
            <div className="text-[0.68rem] uppercase tracking-[0.12em] text-petrol-200">{L.autoAssigned}</div>
            <div className="text-[0.95rem] font-semibold mt-0.5">{props.certifierName}</div>
          </div>
        </div>
      </div>

      {/* lista di controllo */}
      <section className="bg-white border border-[#dbe4e7] rounded-sm">
        <h2 className="px-6 py-4 border-b border-[#e9eff1] text-[1.15rem] font-serif font-bold text-petrol-800">{L.checklist}</h2>
        <ul>
          {props.items.map((label, i) => (
            <li key={label} className="border-b border-[#eef2f4] last:border-b-0">
              <button
                type="button"
                onClick={() => setChecks((prev) => prev.map((c, k) => (k === i ? !c : c)))}
                className="w-full text-left px-6 py-4 flex items-center gap-4 hover:bg-[#f7fafb]"
              >
                <span
                  className={`inline-flex h-7 w-7 shrink-0 items-center justify-center border-2 rounded-sm font-bold ${
                    checks[i] ? "bg-petrol-800 border-petrol-800 text-white" : "border-[#c1d0d5] text-transparent"
                  }`}
                >
                  ✓
                </span>
                <span className="text-[1.05rem]">{label}</span>
              </button>
            </li>
          ))}
        </ul>
        {allChecked && <p className="px-6 py-3 text-[0.95rem] text-[#2C5F3A] font-semibold border-t border-[#e9eff1]">{L.allChecked}</p>}
      </section>

      {/* acquisizione foto */}
      <section className="bg-white border border-[#dbe4e7] rounded-sm">
        <div className="px-6 py-4 border-b border-[#e9eff1] flex items-center justify-between gap-4">
          <h2 className="text-[1.15rem] font-serif font-bold text-petrol-800">
            {L.captured} <span className="tabular-nums text-slate-500">{photos.length}/3</span>
          </h2>
          <button
            type="button"
            onClick={capture}
            disabled={photos.length >= 3}
            className="bg-petrol-800 text-white px-5 py-2.5 rounded-sm font-semibold hover:bg-petrol-700 disabled:opacity-40"
          >
            {L.capture}
          </button>
        </div>
        <div className="px-6 py-5">
          {photos.length === 0 ? (
            <p className="text-slate-500">{L.needPhotos}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {photos.map((p) => (
                <figure key={p.seed} className="border border-[#dbe4e7]">
                  <img src={photoUrl(p, ctx, { w: 720, h: 480 }, props.photoLabels[p.captionKey])} alt="" className="w-full block" />
                  <figcaption className="px-3 py-2.5 text-[0.82rem] text-slate-600">
                    <span className="block font-semibold text-petrol-800">{props.photoLabels[p.captionKey]}</span>
                    {L.gps}: {p.lat.toFixed(5)}, {p.lng.toFixed(5)}
                    <span className="block font-mono text-[0.74rem] text-slate-500">{fingerprint(p.seed)}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* esito, note e firma */}
      <section className="bg-white border border-[#dbe4e7] rounded-sm">
        <h2 className="px-6 py-4 border-b border-[#e9eff1] text-[1.15rem] font-serif font-bold text-petrol-800">{L.outcome}</h2>
        <div className="px-6 py-5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(["PASS", "FAIL"] as const).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOutcome(o)}
                className={`text-left px-5 py-4 border-2 rounded-sm ${
                  outcome === o
                    ? o === "PASS"
                      ? "border-[#2C5F3A] bg-[#EDF4EE]"
                      : "border-accent bg-[#FAEDEF]"
                    : "border-[#dbe4e7] bg-white hover:bg-[#f7fafb]"
                }`}
              >
                <span className="text-[1.05rem] font-semibold text-petrol-800">{L[o]}</span>
              </button>
            ))}
          </div>

          <label className="block">
            <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{L.notes}</span>
            <textarea className="field" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>

          <div className="border-t border-[#e9eff1] pt-5">
            <div className="text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold">{L.signature}</div>
            <div className="text-[1.05rem] text-petrol-800 font-semibold mt-1">
              {props.certifierName} · <span className="font-mono text-[0.95rem]">{props.registryNo}</span>
            </div>
            <p className="text-[0.9rem] text-slate-600 mt-1">{L.signatureNote}</p>

            <button
              type="button"
              disabled={pending || photos.length < 3}
              onClick={() => {
                setErr(null);
                const fd = new FormData();
                fd.set("milestoneId", props.milestoneId);
                fd.set("outcome", outcome);
                fd.set("notes", notes);
                fd.set("checklist", JSON.stringify(props.items.map((label, i) => ({ label, ok: checks[i] }))));
                fd.set("photos", JSON.stringify(photos));
                start(async () => {
                  const res = await certifyMilestone(fd);
                  if (res.ok) {
                    setDone(res.message ?? L.signed);
                    router.refresh();
                  } else setErr(res.message ?? props.formLabels.error);
                });
              }}
              className="mt-4 bg-petrol-800 text-white px-7 py-3.5 rounded-sm font-semibold text-[1.05rem] hover:bg-petrol-700 disabled:opacity-40"
            >
              {pending ? L.signing : L.sign}
            </button>
            {photos.length < 3 && <p className="mt-2 text-[0.92rem] text-slate-500">{L.needPhotos}</p>}
            {err && <p className="mt-3 text-accent-700 font-semibold">{err}</p>}
            {done && (
              <div className="mt-4 border-l-4 border-[#2C5F3A] bg-[#EDF4EE] px-5 py-4 rounded-sm">
                <p className="font-semibold text-petrol-800 text-[1.05rem]">{done}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
