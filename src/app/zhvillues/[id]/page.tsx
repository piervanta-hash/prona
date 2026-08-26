import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { conformityChecks } from "@/app/actions";
import { Badge, Card, CardHead, Field, Money, Note, Progress, SectionTitle } from "@/components/ui";
import Attachments from "@/components/Attachments";
import RegisterPanel from "@/components/RegisterPanel";
import SaleForm from "@/components/SaleForm";
import PaymentForm from "@/components/PaymentForm";
import HandoverButton from "@/components/HandoverButton";
import { ExpandableTableBody } from "@/components/Expandable";
import { dateShort, eur } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DeveloperProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { role, t, identity } = await getSession();
  if (role !== "DEVELOPER") return <Note tone="warn">{t.common.noAccess}</Note>;

  const p = await db.project.findUnique({
    where: { id },
    include: {
      escrow: { include: { bank: true } },
      units: { orderBy: { label: "asc" }, include: { contract: { include: { buyer: true, payments: true } } } },
      milestones: { include: { certifier: true }, orderBy: { orderIndex: "asc" } },
    },
  });
  if (!p) notFound();
  // Uno sviluppatore vede e gestisce solo i propri progetti, non quelli altrui.
  if (p.developerId !== identity.id) return <Note tone="warn">{t.common.noAccess}</Note>;

  const checks = await conformityChecks(p.id);
  const registered = !!p.publicCode && p.status !== "DRAFT" && p.status !== "REJECTED";
  const free = p.units.filter((u) => u.status === "FREE");
  const sold = p.units.filter((u) => u.contract);
  const collected = p.escrow?.collectedEur ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/zhvillues" className="text-[0.9rem] text-slate-500 hover:text-petrol-700">← {t.dev.myProjects}</Link>
        <div className="flex flex-wrap items-center gap-4 mt-2">
          <h1 className="text-[2rem] font-serif font-bold text-petrol-800 leading-tight">{p.name}</h1>
          <Badge code={p.status} label={(t.status as any)[p.status]} />
          {p.publicCode && (
            <span className="font-mono text-[0.85rem] font-semibold text-petrol-700 border border-[#dbe4e7] bg-white px-2.5 py-1">
              {p.publicCode}
            </span>
          )}
        </div>
      </div>

      <RegisterPanel
        projectId={p.id}
        registered={registered}
        checks={checks}
        labels={t.checks as any}
        devLabels={t.dev as any}
        iban={p.escrow?.iban ?? ""}
        bank={p.escrow?.bank.name ?? ""}
        escrowLabels={t.escrow as any}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-2">
          <CardHead title={t.project.one} />
          <div className="px-6 py-5 grid grid-cols-2 md:grid-cols-3 gap-5">
            <Field label={t.project.municipality}>{p.municipality}</Field>
            <Field label={t.project.address}>{p.address}</Field>
            <Field label={t.project.permit}>{p.permitNo}</Field>
            <Field label={t.project.units}>{p.units.length}</Field>
            <Field label={t.dev.freeUnits}>{free.length}</Field>
            <Field label={t.project.delivery}>{dateShort(p.expectedDelivery)}</Field>
          </div>
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[0.7rem] uppercase tracking-[0.1em] text-slate-500 font-semibold">{t.project.progress}</span>
              <span className="text-[1.7rem] font-serif font-bold tabular-nums text-petrol-800 leading-none">{p.progressPct}%</span>
            </div>
            <Progress value={p.progressPct} big />
          </div>
        </Card>

        <Card>
          <CardHead title={t.escrow.title} right={<Badge code={p.escrow?.active ? "ACTIVE" : "DRAFT"} label={p.escrow?.active ? t.escrow.active : t.escrow.inactive} />} />
          <div className="px-6 py-5 space-y-4">
            <Field label={t.escrow.bank}>{p.escrow?.bank.name ?? "—"}</Field>
            <Field label={t.escrow.iban}><span className="font-mono text-[0.9rem]">{p.escrow?.active ? p.escrow.iban : "—"}</span></Field>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#e9eff1]">
              <Field label={t.escrow.collected}><Money value={collected} /></Field>
              <Field label={t.escrow.released}><Money value={p.escrow?.releasedEur ?? 0} /></Field>
            </div>
          </div>
        </Card>
      </div>

      {registered && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SaleForm
            units={free.map((u) => ({ id: u.id, label: u.label, typology: u.typology, areaSqm: u.areaSqm, priceEur: u.priceEur }))}
            soldUnits={sold.map((u) => ({ id: u.id, label: u.label, typology: u.typology, areaSqm: u.areaSqm, priceEur: u.priceEur }))}
            labels={t.dev as any}
            blockLabels={t.block as any}
            formLabels={t.form as any}
          />
          <PaymentForm
            contracts={sold.map((u) => ({
              id: u.contract!.id,
              label: `${u.label} · ${u.contract!.buyer.name} · ${u.contract!.code}`,
              suggested: Math.round((u.contract!.priceEur * u.contract!.depositPct) / 100),
              paid: u.contract!.payments.reduce((s, x) => s + x.amountEur, 0),
            }))}
            labels={t.dev as any}
            blockLabels={t.block as any}
            formLabels={t.form as any}
          />
        </div>
      )}

      <Attachments projectId={p.id} />

      <Card>
        <CardHead title={t.units.title} sub={`${sold.length} / ${p.units.length}`} />
        <div className="overflow-x-auto">
          <table className="prona w-full">
            <thead>
              <tr>
                <th>{t.units.label}</th>
                <th>{t.units.typology}</th>
                <th className="text-right">{t.units.area}</th>
                <th className="text-right">{t.units.price}</th>
                <th>{t.project.status}</th>
                <th>{t.roles.CITIZEN}</th>
                <th className="text-right">{t.citizen.paid}</th>
                <th>{t.dev.handoverCol}</th>
              </tr>
            </thead>
            <ExpandableTableBody total={p.units.length} colSpan={8} more={t.common.showMore} less={t.common.showLess}>
              {p.units.map((u) => {
                const paid = u.contract?.payments.reduce((s, x) => s + x.amountEur, 0) ?? 0;
                const eligible = u.status === "SOLD" && p.status === "DELIVERED" && u.contract?.status !== "COMPLETED";
                return (
                  <tr key={u.id}>
                    <td className="font-mono font-semibold">{u.label}</td>
                    <td>{u.typology}</td>
                    <td className="text-right tabular-nums">{u.areaSqm} m²</td>
                    <td className="text-right tabular-nums font-semibold">{eur(u.priceEur)}</td>
                    <td><Badge code={u.status} label={(t.unitStatus as any)[u.status]} /></td>
                    <td>{u.contract?.buyer.name ?? "—"}</td>
                    <td className="text-right tabular-nums">{paid > 0 ? eur(paid) : "—"}</td>
                    <td>
                      {u.contract?.status === "COMPLETED" ? (
                        <span className="text-[0.8rem] font-semibold text-[#2C5F3A]">{t.dev.handedOver}</span>
                      ) : eligible ? (
                        <HandoverButton unitId={u.id} label={t.dev.handover} busy={t.dev.handoverBusy} blockLabels={t.block as any} />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </ExpandableTableBody>
          </table>
        </div>
      </Card>
    </div>
  );
}
