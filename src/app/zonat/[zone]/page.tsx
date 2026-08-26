import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { can } from "@/lib/access";
import { getZoneDetail } from "@/lib/zones";
import { projectCoords } from "@/lib/geo";
import { Badge, Card, CardHead, Kpi, Progress, SectionTitle } from "@/components/ui";
import MultiPinMap, { type MapPin } from "@/components/MultiPinMap";
import { eur, dateShort } from "@/lib/format";
import { ExpandableTableBody } from "@/components/Expandable";

export const dynamic = "force-dynamic";

export default async function ZoneDetail({ params }: { params: Promise<{ zone: string }> }) {
  const { zone: zoneParam } = await params;
  const zone = decodeURIComponent(zoneParam);
  const { role, t } = await getSession();
  const { projects, priceStats, transactions, dominantTypology, delayedShare } = await getZoneDetail(zone);
  if (projects.length === 0) notFound();

  const municipality = projects[0].municipality;
  const activeEscrow = projects.filter((p) => p.status !== "DRAFT" && p.status !== "REJECTED").length;

  const priceMin = Math.min(...priceStats.map((s) => s.avgPricePerSqm));
  const priceMax = Math.max(...priceStats.map((s) => s.avgPricePerSqm));
  const chartW = 640, chartH = 160, pad = 8;
  const points = priceStats.map((s, i) => {
    const x = pad + (i / Math.max(1, priceStats.length - 1)) * (chartW - pad * 2);
    const y = priceMax === priceMin ? chartH / 2 : chartH - pad - ((s.avgPricePerSqm - priceMin) / (priceMax - priceMin)) * (chartH - pad * 2);
    return { x, y, s };
  });
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1]?.x.toFixed(1)} ${chartH} L${points[0]?.x.toFixed(1)} ${chartH} Z`;

  const pins: MapPin[] = projects.map((p) => {
    const c = projectCoords(p.id, p.municipality);
    return { id: p.id, lat: c.lat, lng: c.lng, label: p.name, href: `/projekte/${p.id}` };
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/zonat" className="text-[0.9rem] text-slate-500 hover:text-petrol-700">← {t.zones.title}</Link>
        <SectionTitle sub={`${municipality} · ${t.zones.zoneSub}`}>{zone}</SectionTitle>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label={t.zones.projects} value={String(projects.length)} sub={`${activeEscrow} ${t.zones.withEscrow}`} />
        <Kpi label={t.zones.transactions} value={String(transactions)} />
        <Kpi label={t.zones.dominantTypology} value={dominantTypology} />
        <Kpi label={t.zones.delayedShare} value={`${delayedShare}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHead title={t.zones.priceTrend} sub={t.zones.priceTrendSub} />
          <div className="px-6 py-5">
            {priceStats.length > 0 ? (
              <>
                <svg viewBox={`0 0 ${chartW} ${chartH}`} width="100%" height={chartH} className="overflow-visible">
                  <path d={areaPath} fill="#0E2A33" opacity="0.08" />
                  <path d={linePath} fill="none" stroke="#0E2A33" strokeWidth="2" />
                  {points.map((p) => (
                    <circle key={p.s.quarter} cx={p.x} cy={p.y} r="3" fill="#0E2A33" />
                  ))}
                </svg>
                <div className="flex justify-between mt-2 text-[0.72rem] text-slate-500 tabular-nums">
                  {priceStats.map((s) => (
                    <span key={s.quarter}>{s.quarter}</span>
                  ))}
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#e9eff1]">
                  <span className="text-[0.85rem] text-slate-600">{priceStats[0].quarter}: {eur(priceStats[0].avgPricePerSqm)}/m²</span>
                  <span className="text-[1.1rem] font-serif font-bold text-petrol-800">{priceStats[priceStats.length - 1].quarter}: {eur(priceStats[priceStats.length - 1].avgPricePerSqm)}/m²</span>
                </div>
              </>
            ) : (
              <p className="text-slate-500">{t.common.empty}</p>
            )}
          </div>
        </Card>

        <Card>
          <CardHead title={t.location.title} />
          <div className="px-6 py-5 flex justify-center">
            <MultiPinMap municipality={municipality} pins={pins} size={380} />
          </div>
        </Card>
      </div>

      <Card>
        <CardHead title={t.zones.projectsInZone} />
        <div className="overflow-x-auto">
          <table className="prona w-full">
            <thead>
              <tr>
                <th>{t.project.code}</th>
                <th>{t.project.name}</th>
                <th>{t.project.developer}</th>
                <th>{t.project.status}</th>
                <th className="w-52">{t.project.progress}</th>
                <th>{t.project.delivery}</th>
                {can(role, "project.escrow.totals") && <th>{t.escrow.title}</th>}
              </tr>
            </thead>
            <ExpandableTableBody total={projects.length} colSpan={can(role, "project.escrow.totals") ? 7 : 6} more={t.common.showMore} less={t.common.showLess}>
              {projects.map((p) => (
                <tr key={p.id} className="relative cursor-pointer">
                  <td className="font-mono text-[0.8rem] font-semibold text-petrol-700 whitespace-nowrap">
                    {p.publicCode ?? <span className="text-slate-500 font-sans italic">{t.project.notRegistered}</span>}
                  </td>
                  <td className="font-semibold">
                    <Link href={`/projekte/${p.id}`} className="hover:underline text-petrol-800 after:absolute after:inset-0">{p.name}</Link>
                  </td>
                  <td className="text-[0.9rem]">{p.developer.name}</td>
                  <td><Badge code={p.status} label={(t.status as any)[p.status]} /></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Progress value={p.progressPct} />
                      <span className="tabular-nums font-semibold text-sm w-10 text-right">{p.progressPct}%</span>
                    </div>
                  </td>
                  <td className="tabular-nums">{dateShort(p.expectedDelivery)}</td>
                  {can(role, "project.escrow.totals") && (
                    <td><Badge code={p.status !== "DRAFT" && p.status !== "REJECTED" ? "ACTIVE" : "DRAFT"} label={p.status !== "DRAFT" && p.status !== "REJECTED" ? t.escrow.active : t.escrow.inactive} /></td>
                  )}
                </tr>
              ))}
            </ExpandableTableBody>
          </table>
        </div>
      </Card>
    </div>
  );
}
