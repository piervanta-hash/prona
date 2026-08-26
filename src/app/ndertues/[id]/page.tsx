import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { can } from "@/lib/access";
import { Badge, Card, CardHead, Field, Kpi, Progress, Restricted, SectionTitle } from "@/components/ui";
import { dateShort, eur } from "@/lib/format";
import { ExpandableTableBody } from "@/components/Expandable";

export const dynamic = "force-dynamic";

export default async function DeveloperProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { role, t } = await getSession();

  const dev = await db.developer.findUnique({
    where: { id },
    include: { projects: { orderBy: [{ status: "asc" }, { name: "asc" }] } },
  });
  if (!dev) notFound();

  const delivered = dev.projects.filter((p) => p.status === "DELIVERED").length;
  const active = dev.projects.filter((p) => p.status === "BUILDING" || p.status === "REGISTERED").length;
  const seesFinancials = can(role, "developer.financials");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/projekte" className="text-[0.9rem] text-slate-500 hover:text-petrol-700">← {t.project.many}</Link>
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <h1 className="text-[2rem] font-serif font-bold text-petrol-800 leading-tight">{dev.name}</h1>
          <Badge code={dev.licenseState} label={(t.license as any)[dev.licenseState]} />
        </div>
        <p className="text-slate-600 mt-1">{t.developerProfile.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label={t.tier.label} value={dev.tier} sub={`${dev.yearsActive} ${t.developerProfile.years}`} />
        <Kpi label={t.developerProfile.delivered} value={String(dev.deliveredUnits)} sub={`${delivered} ${t.developerProfile.projectsDelivered}`} />
        <Kpi label={t.developerProfile.active} value={String(active)} />
        <Kpi label={t.developerProfile.disputes} value={String(dev.disputesCount)} />
      </div>

      {seesFinancials ? (
        <Card>
          <CardHead title={t.developerProfile.financials} />
          <div className="px-6 py-5 grid grid-cols-2 sm:grid-cols-3 gap-5">
            <Field label={t.developerProfile.netWorth}>{eur(dev.netWorthEur)}</Field>
            <Field label={t.developerProfile.nipt}><span className="font-mono">{dev.nipt}</span></Field>
            <Field label={t.developerProfile.city}>{dev.city}</Field>
          </div>
        </Card>
      ) : (
        <Restricted title={t.denied.title} reason={(t.denied.developerFinancials as any)[role] ?? ""} compact />
      )}

      <Card>
        <CardHead title={t.developerProfile.projects} />
        <div className="overflow-x-auto">
          <table className="prona w-full">
            <thead>
              <tr>
                <th className="w-44">{t.project.code}</th>
                <th className="w-64">{t.project.name}</th>
                <th>{t.project.municipality}</th>
                <th>{t.project.status}</th>
                <th className="w-52">{t.project.progress}</th>
                <th>{t.project.delivery}</th>
              </tr>
            </thead>
            <ExpandableTableBody total={dev.projects.length} colSpan={6} more={t.common.showMore} less={t.common.showLess}>
              {dev.projects.map((p) => (
                <tr key={p.id} className="relative cursor-pointer">
                  <td className="font-mono text-[0.8rem] font-semibold text-petrol-700 whitespace-nowrap">
                    {p.publicCode ?? <span className="text-petrol-600 font-sans italic">{t.project.notRegistered}</span>}
                  </td>
                  <td className="font-semibold text-[1.02rem]">
                    <Link href={`/projekte/${p.id}`} className="hover:underline text-petrol-800 after:absolute after:inset-0">{p.name}</Link>
                  </td>
                  <td>{p.municipality}</td>
                  <td><Badge code={p.status} label={(t.status as any)[p.status]} /></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Progress value={p.progressPct} />
                      <span className="tabular-nums font-semibold text-sm w-10 text-right">{p.progressPct}%</span>
                    </div>
                  </td>
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
