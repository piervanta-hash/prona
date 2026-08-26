import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Badge, Card, CardHead, Kpi, Note, Progress, SectionTitle } from "@/components/ui";
import { dateShort, eur } from "@/lib/format";
import { ExpandableTableBody } from "@/components/Expandable";

export const dynamic = "force-dynamic";

export default async function DeveloperArea() {
  const { role, t, identity } = await getSession();
  if (role !== "DEVELOPER") return <Note tone="warn">{t.common.noAccess}</Note>;

  const projects = await db.project.findMany({
    where: { developerId: identity.id },
    include: { escrow: true, units: true },
    orderBy: { createdAt: "desc" },
  });

  const units = projects.flatMap((p) => p.units);
  const collected = projects.reduce((s, p) => s + (p.escrow?.collectedEur ?? 0), 0);
  const released = projects.reduce((s, p) => s + (p.escrow?.releasedEur ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <SectionTitle sub={t.dev.subtitle}>{t.dev.title}</SectionTitle>
        <Link
          href="/zhvillues/projekt-i-ri"
          className="bg-petrol-800 text-white px-5 py-3 rounded-sm font-semibold hover:bg-petrol-700"
        >
          {t.dev.newProject}
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label={t.dev.myProjects} value={String(projects.length)} />
        <Kpi label={t.dev.soldUnits} value={`${units.filter((u) => u.status !== "FREE").length} / ${units.length}`} />
        <Kpi label={t.escrow.collected} value={eur(collected)} />
        <Kpi label={t.escrow.released} value={eur(released)} />
      </div>

      <Card>
        <CardHead title={t.dev.myProjects} />
        <div className="overflow-x-auto">
          <table className="prona w-full">
            <thead>
              <tr>
                <th className="w-44">{t.project.code}</th>
                <th className="w-64">{t.project.name}</th>
                <th>{t.project.municipality}</th>
                <th className="text-right">{t.project.units}</th>
                <th>{t.project.status}</th>
                <th className="w-52">{t.project.progress}</th>
                <th className="text-right">{t.escrow.collected}</th>
                <th>{t.project.delivery}</th>
              </tr>
            </thead>
            <ExpandableTableBody total={projects.length} colSpan={8} more={t.common.showMore} less={t.common.showLess}>
              {projects.map((p) => (
                <tr key={p.id} className="relative cursor-pointer">
                  <td className="font-mono text-[0.8rem] font-semibold text-petrol-700 whitespace-nowrap">
                    {p.publicCode ?? <span className="font-sans italic text-slate-500">{t.project.notRegistered}</span>}
                  </td>
                  <td className="font-semibold text-[1.02rem]">
                    <Link href={`/zhvillues/${p.id}`} className="text-petrol-800 hover:underline after:absolute after:inset-0">{p.name}</Link>
                  </td>
                  <td>{p.municipality}</td>
                  <td className="text-right tabular-nums">{p.units.length}</td>
                  <td><Badge code={p.status} label={(t.status as any)[p.status]} /></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Progress value={p.progressPct} />
                      <span className="tabular-nums font-semibold text-sm w-10 text-right">{p.progressPct}%</span>
                    </div>
                  </td>
                  <td className="text-right tabular-nums font-semibold">{eur(p.escrow?.collectedEur ?? 0)}</td>
                  <td className="tabular-nums">{dateShort(p.expectedDelivery)}</td>
                </tr>
              ))}
            </ExpandableTableBody>
          </table>
        </div>
      </Card>
    </div>
  );
}
