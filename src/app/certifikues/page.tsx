import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Badge, Card, CardHead, Kpi, Note, SectionTitle } from "@/components/ui";
import { dateShort } from "@/lib/format";
import { ExpandableTableBody } from "@/components/Expandable";

export const dynamic = "force-dynamic";

export default async function CertifierArea() {
  const { role, t, identity } = await getSession();
  if (role !== "CERTIFIER") return <Note tone="warn">{t.common.noAccess}</Note>;

  const me = await db.certifier.findUnique({ where: { id: identity.id } });
  const pending = await db.milestone.findMany({
    where: { certifierId: identity.id, status: { in: ["READY", "UNDER_REVIEW"] } },
    include: { project: { include: { developer: true } } },
    orderBy: { orderIndex: "asc" },
  });
  const done = await db.milestone.findMany({
    where: { certifierId: identity.id, status: { in: ["CERTIFIED", "REJECTED", "REVOKED"] } },
    include: { project: true },
    orderBy: { verifiedAt: "desc" },
    take: 10,
  });

  const rate = me && me.checksDone > 0 ? Math.round((me.deviationsFound / me.checksDone) * 1000) / 10 : 0;

  return (
    <div className="space-y-6">
      <SectionTitle sub={t.field.subtitle}>{t.field.title}</SectionTitle>

      {me?.state === "SUSPENDED" && (
        <Note tone="bad">
          <p className="text-[1.1rem] font-semibold text-petrol-900">{t.license.SUSPENDED}</p>
        </Note>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label={t.field.assigned} value={String(pending.length)} />
        <Kpi label={t.agency.checksDone} value={String(me?.checksDone ?? 0)} />
        <Kpi label={t.agency.deviations} value={String(me?.deviationsFound ?? 0)} />
        <Kpi label={t.agency.deviationRate} value={`${rate}%`} />
      </div>

      <Card>
        <CardHead title={t.field.assigned} sub={t.field.autoAssigned} />
        <div className="overflow-x-auto">
          <table className="prona w-full">
            <thead>
              <tr>
                <th>{t.project.one}</th>
                <th>{t.project.municipality}</th>
                <th>{t.project.developer}</th>
                <th>{t.field.stage}</th>
                <th className="text-right">{t.milestone.cumulative}</th>
                <th>{t.project.status}</th>
                <th></th>
              </tr>
            </thead>
            <ExpandableTableBody total={pending.length} colSpan={7} more={t.common.showMore} less={t.common.showLess}>
              {pending.map((m) => (
                <tr key={m.id}>
                  <td className="font-semibold text-[1.02rem]">{m.project.name}</td>
                  <td>{m.project.municipality}</td>
                  <td className="text-[0.9rem]">{m.project.developer.name}</td>
                  <td className="font-semibold">{(t.milestone as any)[m.type]}</td>
                  <td className="text-right tabular-nums font-semibold">{m.cumulativePct}%</td>
                  <td><Badge code={m.status} label={(t.milestone as any)[m.status]} /></td>
                  <td>
                    <Link href={`/certifikues/${m.id}`} className="bg-petrol-800 text-white px-4 py-2 rounded-sm text-sm font-semibold hover:bg-petrol-700 whitespace-nowrap">
                      {t.field.open}
                    </Link>
                  </td>
                </tr>
              ))}
              {pending.length === 0 && <tr><td colSpan={7} className="text-slate-500">{t.field.noAssignments}</td></tr>}
            </ExpandableTableBody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead title={t.agency.checksDone} />
        <div className="overflow-x-auto">
          <table className="prona w-full">
            <thead>
              <tr>
                <th>{t.project.one}</th>
                <th>{t.field.stage}</th>
                <th>{t.milestone.verifiedAt}</th>
                <th>{t.milestone.outcome}</th>
                <th>{t.project.status}</th>
              </tr>
            </thead>
            <ExpandableTableBody total={done.length} colSpan={5} more={t.common.showMore} less={t.common.showLess}>
              {done.map((m) => (
                <tr key={m.id}>
                  <td className="font-semibold">{m.project.name}</td>
                  <td>{(t.milestone as any)[m.type]}</td>
                  <td className="tabular-nums">{dateShort(m.verifiedAt)}</td>
                  <td>{m.outcome ? (t.milestone as any)[m.outcome] : "—"}</td>
                  <td><Badge code={m.status} label={(t.milestone as any)[m.status]} /></td>
                </tr>
              ))}
              {done.length === 0 && <tr><td colSpan={5} className="text-slate-500">{t.common.empty}</td></tr>}
            </ExpandableTableBody>
          </table>
        </div>
      </Card>
    </div>
  );
}
