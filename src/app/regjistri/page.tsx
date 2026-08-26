import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { can } from "@/lib/access";
import { Card, CardHead, Kpi, Note, SectionTitle } from "@/components/ui";
import { ROLES } from "@/lib/constants";
import { ExpandableTableBody } from "@/components/Expandable";

export const dynamic = "force-dynamic";

const ROLE_STYLE: Record<string, string> = {
  CITIZEN: "bg-[#EDF2F6] text-[#2F4A66] border-[#D0DCE7]",
  DEVELOPER: "bg-[#FBF3E7] text-[#7C5312] border-[#E6D5B8]",
  CERTIFIER: "bg-[#EDF4EE] text-[#2C5F3A] border-[#CADDCE]",
  BANK: "bg-[#F2F5F6] text-[#4F6C76] border-[#DDE5E8]",
  AGENCY: "bg-[#FAEDEF] text-[#8E1226] border-[#E5CBD1]",
  SYSTEM: "bg-[#F2F5F6] text-[#4F6C76] border-[#DDE5E8]",
};

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role: viewer, t } = await getSession();
  if (!can(viewer, "audit.log")) return <Note tone="warn">{t.common.noAccess}</Note>;

  const { role: filter } = await searchParams;
  const where = filter && ROLES.includes(filter as any) ? { actorRole: filter } : {};

  const rows = await db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 });
  const total = await db.auditLog.count();
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const today = await db.auditLog.count({ where: { createdAt: { gte: since } } });

  return (
    <div className="space-y-6">
      <SectionTitle sub={t.audit.subtitle}>{t.audit.title}</SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Kpi label={t.audit.total} value={String(total)} />
        <Kpi label={t.audit.today} value={String(today)} />
        <Kpi label={t.common.search} value={String(rows.length)} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Link
          href="/regjistri"
          className={`px-4 py-2 rounded-sm text-sm font-semibold border ${
            !filter ? "bg-petrol-800 text-white border-petrol-800" : "bg-white text-petrol-700 border-petrol-200 hover:bg-petrol-50"
          }`}
        >
          {t.audit.filterAll}
        </Link>
        {ROLES.map((r) => (
          <Link
            key={r}
            href={`/regjistri?role=${r}`}
            className={`px-4 py-2 rounded-sm text-sm font-semibold border ${
              filter === r ? "bg-petrol-800 text-white border-petrol-800" : "bg-white text-petrol-700 border-petrol-200 hover:bg-petrol-50"
            }`}
          >
            {(t.roles as any)[r]}
          </Link>
        ))}
      </div>

      <Card>
        <CardHead title={t.audit.title} />
        <div className="overflow-x-auto">
          <table className="prona w-full">
            <thead>
              <tr>
                <th className="w-40">{t.audit.when}</th>
                <th className="w-32">{t.roles.label}</th>
                <th>{t.audit.who}</th>
                <th>{t.audit.what}</th>
                <th>{t.audit.entity}</th>
                <th>{t.audit.detail}</th>
              </tr>
            </thead>
            <ExpandableTableBody total={rows.length} colSpan={6} more={t.common.showMore} less={t.common.showLess}>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="tabular-nums text-[0.88rem] whitespace-nowrap">
                    {a.createdAt.toLocaleDateString("it-IT")}
                    <span className="block text-slate-500 text-[0.8rem]">
                      {a.createdAt.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </td>
                  <td>
                    <span className={`inline-block border px-2.5 py-[0.2rem] rounded-sm text-[0.78rem] font-semibold ${ROLE_STYLE[a.actorRole] ?? ROLE_STYLE.SYSTEM}`}>
                      {(t.roles as any)[a.actorRole] ?? a.actorRole}
                    </span>
                  </td>
                  <td className="text-[0.92rem]">{a.actorName}</td>
                  <td className="font-semibold text-[0.95rem]">{(t.action as any)[a.action] ?? a.action}</td>
                  <td className="font-mono text-[0.85rem] text-petrol-700">{a.entityRef}</td>
                  <td className="text-[0.9rem] text-slate-600 max-w-xl">{a.detail}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={6} className="text-slate-500">{t.common.empty}</td></tr>}
            </ExpandableTableBody>
          </table>
        </div>
      </Card>
    </div>
  );
}
