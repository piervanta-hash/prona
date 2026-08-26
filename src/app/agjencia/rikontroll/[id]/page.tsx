import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Card, CardHead, Note } from "@/components/ui";
import PhotoStrip from "@/components/PhotoStrip";
import RecheckForm from "@/components/RecheckForm";
import { dateShort } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Recheck({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { role, t } = await getSession();
  if (role !== "AGENCY") return <Note tone="warn">{t.common.noAccess}</Note>;

  const ms = await db.milestone.findUnique({
    where: { id },
    include: { project: true, certifier: true },
  });
  if (!ms || !ms.certifier) notFound();

  const checklist = (ms.checklistJson ? JSON.parse(ms.checklistJson) : []) as { label: string; ok: boolean }[];
  // quante verifiche aperte perderebbe: la schermata non promette cio' che non accade
  const openAssignments = await db.milestone.count({
    where: { certifierId: ms.certifierId, status: { in: ["READY", "UNDER_REVIEW", "PENDING"] } },
  });
  const rate = ms.certifier.checksDone > 0 ? (ms.certifier.deviationsFound / ms.certifier.checksDone) * 100 : 0;

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <Link href="/agjencia" className="text-[0.9rem] text-slate-500 hover:text-petrol-700">← {t.agency.title}</Link>
        <h1 className="text-[2rem] font-serif font-bold text-petrol-800 leading-tight mt-2">{t.recheck.title}</h1>
        <p className="text-[1.05rem] text-slate-600 mt-1">{t.recheck.subtitle}</p>
      </div>

      <Card>
        <CardHead
          title={t.recheck.original}
          sub={`${ms.project.name} · ${(t.milestone as any)[ms.type]} · ${ms.cumulativePct}%`}
        />
        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-5 border-b border-[#e9eff1]">
          <div>
            <div className="text-[0.7rem] uppercase tracking-[0.1em] text-slate-500 font-semibold">{t.recheck.originalBy}</div>
            <div className="text-[1.05rem] text-petrol-900 mt-1 font-semibold">{ms.certifier.name}</div>
            <div className="text-[0.85rem] text-slate-500 font-mono">{ms.certifier.registryNo}</div>
          </div>
          <div>
            <div className="text-[0.7rem] uppercase tracking-[0.1em] text-slate-500 font-semibold">{t.milestone.verifiedAt}</div>
            <div className="text-[1.05rem] text-petrol-900 mt-1">{dateShort(ms.verifiedAt)}</div>
          </div>
          <div>
            <div className="text-[0.7rem] uppercase tracking-[0.1em] text-slate-500 font-semibold">{t.recheck.rateBefore}</div>
            <div className="text-[1.05rem] text-petrol-900 mt-1 tabular-nums">
              {rate.toFixed(1)}% <span className="text-slate-500 text-[0.9rem]">({ms.certifier.deviationsFound}/{ms.certifier.checksDone})</span>
            </div>
          </div>
        </div>
        <PhotoStrip
          json={ms.photosJson}
          stage={ms.type}
          code={ms.project.publicCode ?? ms.project.permitNo}
          registry={ms.certifier.registryNo}
          labels={t.photos as any}
        />
      </Card>

      <RecheckForm
        milestoneId={ms.id}
        items={checklist.map((c) => c.label)}
        certifierName={ms.certifier.name}
        checksDone={ms.certifier.checksDone}
        deviations={ms.certifier.deviationsFound}
        openAssignments={openAssignments}
        labels={t.recheck as any}
        formLabels={t.form as any}
        alreadyRevoked={ms.status === "REVOKED"}
      />
    </div>
  );
}
