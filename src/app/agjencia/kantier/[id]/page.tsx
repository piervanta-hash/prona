import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Badge, Card, CardHead, Field, Kpi, Money, Note, SectionTitle } from "@/components/ui";
import FreezePanel from "@/components/FreezePanel";
import { dateShort, eur } from "@/lib/format";
import { ExpandableTableBody } from "@/components/Expandable";

export const dynamic = "force-dynamic";

export default async function StalledDossier({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { role, t } = await getSession();
  if (role !== "AGENCY") return <Note tone="warn">{t.common.noAccess}</Note>;

  const p = await db.project.findUnique({
    where: { id },
    include: {
      developer: true,
      escrow: { include: { bank: true } },
      inspections: { orderBy: { performedAt: "desc" } },
      units: { include: { contract: { include: { buyer: true, payments: true } } } },
    },
  });
  if (!p) notFound();

  const collected = p.escrow?.collectedEur ?? 0;
  const released = p.escrow?.releasedEur ?? 0;
  const locked = collected - released;

  // Quota di ciascun acquirente sul residuo: proporzionale a quanto ha versato.
  const buyers = p.units
    .filter((u) => u.contract)
    .map((u) => {
      const paid = u.contract!.payments.reduce((s, x) => s + x.amountEur, 0);
      return {
        id: u.contract!.id,
        name: u.contract!.buyer.name,
        unit: u.label,
        typology: u.typology,
        paid,
        quota: collected > 0 ? Math.round((locked * paid) / collected) : 0,
      };
    })
    .sort((a, b) => b.paid - a.paid);

  const totalPaid = buyers.reduce((s, b) => s + b.paid, 0);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/agjencia" className="text-[0.9rem] text-slate-500 hover:text-petrol-700">← {t.agency.title}</Link>
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <h1 className="text-[2rem] font-serif font-bold text-petrol-800 leading-tight">{p.name}</h1>
          <Badge code={p.status} label={(t.status as any)[p.status]} />
          {p.escrow?.frozen && <Badge code="FROZEN" label={t.escrow.frozen} />}
        </div>
        <p className="text-slate-600 mt-1">{t.frozen.dossier}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label={t.frozen.protected} value={eur(locked)} sub={(locked * 98).toLocaleString("de-DE") + " L"} />
        <Kpi label={t.frozen.exposed} value={String(buyers.length)} />
        <Kpi label={t.project.progress} value={`${p.progressPct}%`} />
        <Kpi label={t.frozen.stalledSince} value={dateShort(p.lastSiteActivity)} />
      </div>

      <FreezePanel
        projectId={p.id}
        frozen={!!p.escrow?.frozen}
        reason={p.frozenReason ?? ""}
        labels={t.frozen as any}
        formLabels={t.form as any}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-2">
          <CardHead title={t.frozen.exposed} sub={t.frozen.note} />
          <div className="overflow-x-auto">
            <table className="prona w-full">
              <thead>
                <tr>
                  <th>{t.frozen.buyer}</th>
                  <th>{t.frozen.unit}</th>
                  <th className="text-right">{t.frozen.paid}</th>
                  <th className="text-right">{t.frozen.proQuota}</th>
                </tr>
              </thead>
              <ExpandableTableBody
                total={buyers.length}
                colSpan={4}
                more={t.common.showMore}
                less={t.common.showLess}
                summaryRow={
                  <tr className="bg-[#f5f8f9]">
                    <td className="font-bold" colSpan={2}>{t.common.total}</td>
                    <td className="text-right tabular-nums font-bold">{eur(totalPaid)}</td>
                    <td className="text-right tabular-nums font-bold text-petrol-800">{eur(locked)}</td>
                  </tr>
                }
              >
                {buyers.map((b) => (
                  <tr key={b.id}>
                    <td className="font-semibold">{b.name}</td>
                    <td className="font-mono text-[0.9rem]">{b.unit} · {b.typology}</td>
                    <td className="text-right tabular-nums">{eur(b.paid)}</td>
                    <td className="text-right tabular-nums font-bold text-petrol-800">{eur(b.quota)}</td>
                  </tr>
                ))}
              </ExpandableTableBody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHead title={t.escrow.title} />
          <div className="px-6 py-5 space-y-4">
            <Field label={t.escrow.bank}>{p.escrow?.bank.name ?? "—"}</Field>
            <Field label={t.project.developer}>
              {p.developer.name}
              <span className="block text-[0.85rem] text-slate-500">{t.tier.label} {p.developer.tier}</span>
            </Field>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#e9eff1]">
              <Field label={t.escrow.collected}><Money value={collected} sub={false} /></Field>
              <Field label={t.escrow.released}><Money value={released} sub={false} /></Field>
            </div>
            <Field label={t.escrow.locked}>
              <span className="text-[1.4rem] font-serif font-bold text-petrol-800 tabular-nums">{eur(locked)}</span>
            </Field>
          </div>
        </Card>
      </div>

      <Card>
        <CardHead title={t.inspect.title} />
        <div className="overflow-x-auto">
          <table className="prona w-full">
            <thead>
              <tr>
                <th>{t.inspect.type}</th>
                <th>{t.inspect.outcome}</th>
                <th>{t.inspect.inspector}</th>
                <th>{t.inspect.performedAt}</th>
                <th>{t.inspect.notes}</th>
              </tr>
            </thead>
            <ExpandableTableBody total={p.inspections.length} colSpan={5} more={t.common.showMore} less={t.common.showLess}>
              {p.inspections.map((i) => (
                <tr key={i.id}>
                  <td className="font-semibold">{(t.inspect as any)[i.type]}</td>
                  <td><Badge code={i.outcome} label={(t.inspect as any)[i.outcome]} /></td>
                  <td>{i.inspector}</td>
                  <td className="tabular-nums">{dateShort(i.performedAt)}</td>
                  <td className="text-[0.9rem] text-slate-600 max-w-xl">{i.notes}</td>
                </tr>
              ))}
              {p.inspections.length === 0 && <tr><td colSpan={5} className="text-slate-500">{t.inspect.none}</td></tr>}
            </ExpandableTableBody>
          </table>
        </div>
      </Card>
    </div>
  );
}
