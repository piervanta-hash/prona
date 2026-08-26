import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { can } from "@/lib/access";
import { Badge, Card, CardHead, Note, Progress, SectionTitle } from "@/components/ui";
import { eur, dateShort } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ p?: string | string[] }> }) {
  const sp = await searchParams;
  const { role, t } = await getSession();
  const idsRaw = sp.p ? (Array.isArray(sp.p) ? sp.p : [sp.p]) : [];
  const ids = idsRaw.slice(0, 3);

  if (ids.length < 2) {
    return (
      <div className="space-y-6">
        <SectionTitle sub={t.compare2.subtitle}>{t.compare2.title}</SectionTitle>
        <Note tone="warn">{t.compare2.needTwo}</Note>
        <Link href="/kerko" className="inline-block bg-petrol-800 text-white px-5 py-2.5 rounded-sm font-semibold">{t.search.title}</Link>
      </div>
    );
  }

  const projects = await db.project.findMany({
    where: { id: { in: ids } },
    include: { developer: true, escrow: true, units: true },
  });
  const ordered = ids.map((id) => projects.find((p) => p.id === id)).filter(Boolean) as typeof projects;

  const seesEscrow = can(role, "project.escrow.totals");
  const seesFinancials = can(role, "developer.financials");

  const rows: { label: string; render: (p: (typeof ordered)[number]) => React.ReactNode }[] = [
    { label: t.project.municipality, render: (p) => `${p.municipality}${p.zone ? ` · ${p.zone}` : ""}` },
    { label: t.project.developer, render: (p) => <Link href={`/ndertues/${p.developer.id}`} className="hover:underline text-petrol-800">{p.developer.name}</Link> },
    { label: t.developerProfile.disputes, render: (p) => (seesFinancials ? String(p.developer.disputesCount) : "—") },
    { label: t.tier.label, render: (p) => `${p.developer.tier} · ${(t.license as any)[p.developer.licenseState]}` },
    { label: t.project.status, render: (p) => <Badge code={p.status} label={(t.status as any)[p.status]} /> },
    { label: t.project.progress, render: (p) => (
      <div className="flex items-center gap-2"><Progress value={p.progressPct} /><span className="tabular-nums font-semibold text-sm w-10 text-right">{p.progressPct}%</span></div>
    ) },
    { label: t.project.delivery, render: (p) => dateShort(p.expectedDelivery) },
    { label: t.priceRange.title, render: (p) => {
      const prices = p.units.map((u) => Math.round(u.priceEur / u.areaSqm));
      if (!prices.length) return "—";
      return `${eur(Math.min(...prices))} – ${eur(Math.max(...prices))} /m²`;
    } },
    { label: t.units.title, render: (p) => `${p.units.filter((u) => u.status !== "FREE").length} / ${p.units.length}` },
    ...(seesEscrow ? [{ label: t.escrow.locked, render: (p: (typeof ordered)[number]) => eur((p.escrow?.collectedEur ?? 0) - (p.escrow?.releasedEur ?? 0)) }] : []),
    { label: t.escrow.title, render: (p) => (
      <Badge code={p.escrow?.active ? "ACTIVE" : "DRAFT"} label={p.escrow?.active ? t.escrow.active : t.escrow.inactive} />
    ) },
  ];

  return (
    <div className="space-y-6">
      <SectionTitle sub={t.compare2.subtitle}>{t.compare2.title}</SectionTitle>

      <Card>
        <div className="overflow-x-auto">
          <table className="prona w-full">
            <thead>
              <tr>
                <th className="w-56">{t.compare2.criterion}</th>
                {ordered.map((p) => (
                  <th key={p.id}>
                    <Link href={`/projekte/${p.id}`} className="text-petrol-800 hover:underline font-semibold normal-case tracking-normal text-[0.95rem]">
                      {p.name}
                    </Link>
                    <span className="block font-mono text-[0.75rem] text-slate-500 normal-case font-normal">{p.publicCode ?? t.project.notRegistered}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <td className="font-semibold text-slate-600">{row.label}</td>
                  {ordered.map((p) => (
                    <td key={p.id}>{row.render(p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
