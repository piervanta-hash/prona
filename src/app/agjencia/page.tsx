import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Badge, Card, CardHead, Kpi, Money, Note, Progress, SectionTitle } from "@/components/ui";
import { dateShort, eur } from "@/lib/format";
import ReleaseButton from "@/components/ReleaseButton";
import { ExpandableTableBody } from "@/components/Expandable";

export const dynamic = "force-dynamic";

export default async function AgencyArea() {
  const { role, t } = await getSession();
  if (role !== "AGENCY") return <Note tone="warn">{t.common.noAccess}</Note>;

  const queue = await db.releaseRequest.findMany({
    where: { status: "REQUESTED" },
    include: {
      milestone: { include: { project: { include: { developer: true } }, certifier: true } },
      escrow: { include: { bank: true } },
    },
    orderBy: { requestedAt: "asc" },
  });

  const certifiers = await db.certifier.findMany({ orderBy: { registryNo: "asc" } });
  const watch = await db.project.findMany({
    where: { OR: [{ status: "STALLED" }, { status: "FROZEN" }] },
    include: { developer: true, escrow: true },
  });
  const certified = await db.milestone.findMany({
    where: { status: "CERTIFIED" },
    include: { project: true, certifier: true },
    orderBy: { verifiedAt: "desc" },
    take: 8,
  });
  const projects = await db.project.findMany({ include: { escrow: true } });
  const locked = projects.reduce((s, p) => s + ((p.escrow?.collectedEur ?? 0) - (p.escrow?.releasedEur ?? 0)), 0);
  const reports = await db.report.findMany({ include: { project: true }, orderBy: { createdAt: "desc" }, take: 8 });
  const openReports = reports.filter((r) => r.status === "OPEN" || r.status === "IN_REVIEW").length;

  return (
    <div className="space-y-6">
      <SectionTitle sub={t.agency.subtitle}>{t.agency.title}</SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label={t.agency.queue} value={String(queue.length)} />
        <Kpi label={t.kpi.escrowLocked} value={eur(locked)} />
        <Kpi label={t.agency.watchlist} value={String(watch.length)} />
        <Kpi label={t.agency.reports} value={String(openReports)} />
      </div>

      <Card>
        <CardHead title={t.agency.queue} sub={t.citizen.progressNote} />
        <div className="overflow-x-auto">
          <table className="prona w-full">
            <thead>
              <tr>
                <th>{t.release.code}</th>
                <th>{t.project.one}</th>
                <th>{t.field.stage}</th>
                <th>{t.milestone.certifier}</th>
                <th className="text-right">{t.release.amount}</th>
                <th>{t.release.unlocks}</th>
                <th>{t.escrow.bank}</th>
                <th></th>
              </tr>
            </thead>
            <ExpandableTableBody total={queue.length} colSpan={8} more={t.common.showMore} less={t.common.showLess}>
              {queue.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono font-semibold text-[0.88rem]">{r.code}</td>
                  <td className="font-semibold">
                    <Link href={`/projekte/${r.milestone.projectId}`} className="text-petrol-800 hover:underline">
                      {r.milestone.project.name}
                    </Link>
                    <span className="block text-[0.82rem] text-slate-500 font-normal">{r.milestone.project.developer.name}</span>
                  </td>
                  <td>{(t.milestone as any)[r.milestone.type]}</td>
                  <td className="text-[0.9rem]">
                    {r.milestone.certifier?.name}
                    <span className="block text-[0.78rem] text-slate-500 font-mono">{r.milestone.certifier?.registryNo}</span>
                  </td>
                  <td className="text-right"><Money value={r.amountEur} sub={false} /></td>
                  <td className="tabular-nums font-semibold">{r.milestone.cumulativePct}%</td>
                  <td className="text-[0.88rem]">{r.escrow.bank.name}</td>
                  <td>
                    <ReleaseButton id={r.id} mode="approve" label={t.agency.approve} busy={t.agency.approving} blockLabels={t.block as any} />
                  </td>
                </tr>
              ))}
              {queue.length === 0 && <tr><td colSpan={8} className="text-slate-500">{t.agency.noQueue}</td></tr>}
            </ExpandableTableBody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead title={t.agency.certifiers} />
        <div className="overflow-x-auto">
          <table className="prona w-full">
            <thead>
              <tr>
                <th>{t.milestone.certifier}</th>
                <th>{t.project.permit}</th>
                <th className="text-right">{t.agency.checksDone}</th>
                <th className="text-right">{t.agency.deviations}</th>
                <th className="w-56">{t.agency.deviationRate}</th>
                <th>{t.project.status}</th>
              </tr>
            </thead>
            <ExpandableTableBody total={certifiers.length} colSpan={6} more={t.common.showMore} less={t.common.showLess}>
              {certifiers.map((c) => {
                const rate = c.checksDone > 0 ? (c.deviationsFound / c.checksDone) * 100 : 0;
                return (
                  <tr key={c.id}>
                    <td className="font-semibold">{c.name}<span className="block text-[0.82rem] text-slate-500 font-normal">{c.specialty}</span></td>
                    <td className="font-mono text-[0.85rem]">{c.registryNo}</td>
                    <td className="text-right tabular-nums">{c.checksDone}</td>
                    <td className="text-right tabular-nums">{c.deviationsFound}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Progress value={Math.min(100, rate * 5)} />
                        <span className="tabular-nums font-semibold text-sm w-12 text-right">{rate.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td><Badge code={c.state} label={(t.license as any)[c.state]} /></td>
                  </tr>
                );
              })}
            </ExpandableTableBody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead title={t.agency.reports} />
        <div className="overflow-x-auto">
          <table className="prona w-full">
            <thead>
              <tr>
                <th>{t.release.code}</th>
                <th>{t.project.one}</th>
                <th>{t.roles.CITIZEN}</th>
                <th>{t.attach.docTitle}</th>
                <th>{t.common.date}</th>
                <th>{t.project.status}</th>
                <th></th>
              </tr>
            </thead>
            <ExpandableTableBody total={reports.length} colSpan={7} more={t.common.showMore} less={t.common.showLess}>
              {reports.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono text-[0.85rem] font-semibold">{r.code}</td>
                  <td className="font-semibold">{r.project.name}</td>
                  <td>{r.authorName}</td>
                  <td className="text-[0.92rem] text-slate-600 max-w-md">{r.subject}</td>
                  <td className="tabular-nums">{dateShort(r.createdAt)}</td>
                  <td><Badge code={r.status === "ANSWERED" || r.status === "CLOSED" ? "CERTIFIED" : "READY"} label={(t.reportStatus as any)[r.status] ?? r.status} /></td>
                  <td>
                    <Link href={`/agjencia/kantier/${r.projectId}`} className="text-petrol-700 font-semibold hover:underline whitespace-nowrap">
                      {t.frozen.dossier}
                    </Link>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && <tr><td colSpan={7} className="text-slate-500">{t.common.empty}</td></tr>}
            </ExpandableTableBody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead title={t.recheck.pick} sub={t.recheck.subtitle} />
        <div className="overflow-x-auto">
          <table className="prona w-full">
            <thead>
              <tr>
                <th>{t.project.one}</th>
                <th>{t.field.stage}</th>
                <th>{t.milestone.certifier}</th>
                <th>{t.milestone.verifiedAt}</th>
                <th>{t.milestone.outcome}</th>
                <th></th>
              </tr>
            </thead>
            <ExpandableTableBody total={certified.length} colSpan={6} more={t.common.showMore} less={t.common.showLess}>
              {certified.map((m) => (
                <tr key={m.id}>
                  <td className="font-semibold">{m.project.name}</td>
                  <td>{(t.milestone as any)[m.type]}</td>
                  <td className="text-[0.9rem]">
                    {m.certifier?.name}
                    <span className="block text-[0.78rem] text-slate-500 font-mono">{m.certifier?.registryNo}</span>
                  </td>
                  <td className="tabular-nums">{dateShort(m.verifiedAt)}</td>
                  <td>{m.outcome ? (t.milestone as any)[m.outcome] : "—"}</td>
                  <td>
                    <Link
                      href={`/agjencia/rikontroll/${m.id}`}
                      className="border border-petrol-200 bg-white px-4 py-2 rounded-sm text-sm font-semibold hover:bg-petrol-50 whitespace-nowrap"
                    >
                      {t.recheck.open}
                    </Link>
                  </td>
                </tr>
              ))}
              {certified.length === 0 && <tr><td colSpan={6} className="text-slate-500">{t.recheck.none}</td></tr>}
            </ExpandableTableBody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead title={t.agency.watchlist} />
        <div className="overflow-x-auto">
          <table className="prona w-full">
            <thead>
              <tr>
                <th>{t.project.one}</th>
                <th>{t.project.developer}</th>
                <th>{t.project.status}</th>
                <th className="text-right">{t.escrow.locked}</th>
                <th>{t.agency.lastActivity}</th>
                <th></th>
              </tr>
            </thead>
            <ExpandableTableBody total={watch.length} colSpan={6} more={t.common.showMore} less={t.common.showLess}>
              {watch.map((p) => (
                <tr key={p.id}>
                  <td className="font-semibold">{p.name}</td>
                  <td className="text-[0.9rem]">{p.developer.name}</td>
                  <td><Badge code={p.status} label={(t.status as any)[p.status]} /></td>
                  <td className="text-right tabular-nums font-semibold">
                    {eur((p.escrow?.collectedEur ?? 0) - (p.escrow?.releasedEur ?? 0))}
                  </td>
                  <td className="tabular-nums">{dateShort(p.lastSiteActivity)}</td>
                  <td>
                    <Link
                      href={`/agjencia/kantier/${p.id}`}
                      className="bg-petrol-800 text-white px-4 py-2 rounded-sm text-sm font-semibold hover:bg-petrol-700 whitespace-nowrap"
                    >
                      {t.frozen.dossier}
                    </Link>
                  </td>
                </tr>
              ))}
              {watch.length === 0 && <tr><td colSpan={6} className="text-slate-500">{t.common.empty}</td></tr>}
            </ExpandableTableBody>
          </table>
        </div>
      </Card>
    </div>
  );
}
