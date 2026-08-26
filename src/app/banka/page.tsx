import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Badge, Card, CardHead, Kpi, Money, Note, SectionTitle } from "@/components/ui";
import { dateShort, eur } from "@/lib/format";
import ReleaseButton from "@/components/ReleaseButton";
import { ExpandableTableBody } from "@/components/Expandable";

export const dynamic = "force-dynamic";

export default async function BankArea() {
  const { role, t, identity } = await getSession();
  if (role !== "BANK") return <Note tone="warn">{t.common.noAccess}</Note>;

  const accounts = await db.escrowAccount.findMany({
    where: { bankId: identity.id, active: true },
    include: { project: { include: { developer: true } } },
    orderBy: { openedAt: "desc" },
  });

  const orders = await db.releaseRequest.findMany({
    where: { escrow: { bankId: identity.id }, status: { in: ["AGENCY_APPROVED", "EXECUTED"] } },
    include: { milestone: { include: { project: true } }, escrow: true },
    orderBy: [{ status: "asc" }, { approvedAt: "desc" }],
    take: 25,
  });

  const pending = orders.filter((o) => o.status === "AGENCY_APPROVED");
  const history = orders.filter((o) => o.status === "EXECUTED");

  const collected = accounts.reduce((s, a) => s + a.collectedEur, 0);
  const released = accounts.reduce((s, a) => s + a.releasedEur, 0);

  return (
    <div className="space-y-6">
      <SectionTitle sub={t.bank.subtitle}>{t.bank.title}</SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label={t.bank.accounts} value={String(accounts.length)} />
        <Kpi label={t.bank.totalHeld} value={eur(collected - released)} sub={((collected - released) * 98).toLocaleString("de-DE") + " L"} />
        <Kpi label={t.escrow.released} value={eur(released)} />
        <Kpi label={t.bank.pending} value={String(pending.length)} />
      </div>

      <Card>
        <CardHead title={`${t.bank.orders} — ${t.bank.pending}`} />
        <div className="overflow-x-auto">
          <table className="prona w-full">
            <thead>
              <tr>
                <th>{t.release.code}</th>
                <th>{t.project.one}</th>
                <th>{t.field.stage}</th>
                <th className="text-right">{t.release.amount}</th>
                <th>{t.inspect.inspector}</th>
                <th>{t.project.status}</th>
                <th></th>
              </tr>
            </thead>
            <ExpandableTableBody total={pending.length} colSpan={7} more={t.common.showMore} less={t.common.showLess}>
              {pending.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono font-semibold text-[0.88rem]">{o.code}</td>
                  <td className="font-semibold">{o.milestone.project.name}</td>
                  <td>{(t.milestone as any)[o.milestone.type]}</td>
                  <td className="text-right"><Money value={o.amountEur} sub={false} /></td>
                  <td className="text-[0.88rem]">{o.approvedBy ?? "—"}</td>
                  <td><Badge code={o.status} label={(t.release as any)[o.status]} /></td>
                  <td>
                    <ReleaseButton id={o.id} label={t.bank.execute} busy={t.bank.executing} blockLabels={t.block as any} />
                  </td>
                </tr>
              ))}
              {pending.length === 0 && <tr><td colSpan={7} className="text-slate-500">{t.bank.noPending}</td></tr>}
            </ExpandableTableBody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead title={t.bank.accounts} />
        <div className="overflow-x-auto">
          <table className="prona w-full">
            <thead>
              <tr>
                <th>{t.escrow.iban}</th>
                <th>{t.project.one}</th>
                <th>{t.project.developer}</th>
                <th className="text-right">{t.escrow.collected}</th>
                <th className="text-right">{t.escrow.released}</th>
                <th className="text-right">{t.escrow.locked}</th>
                <th>{t.project.status}</th>
              </tr>
            </thead>
            <ExpandableTableBody total={accounts.length} colSpan={7} more={t.common.showMore} less={t.common.showLess}>
              {accounts.map((a) => (
                <tr key={a.id}>
                  <td className="font-mono text-[0.82rem]">{a.iban}</td>
                  <td className="font-semibold">
                    <Link href={`/projekte/${a.projectId}`} className="text-petrol-800 hover:underline">{a.project.name}</Link>
                  </td>
                  <td className="text-[0.9rem]">{a.project.developer.name}</td>
                  <td className="text-right tabular-nums">{eur(a.collectedEur)}</td>
                  <td className="text-right tabular-nums">{eur(a.releasedEur)}</td>
                  <td className="text-right tabular-nums font-semibold">{eur(a.collectedEur - a.releasedEur)}</td>
                  <td>
                    <Badge code={a.frozen ? "FROZEN" : "ACTIVE"} label={a.frozen ? t.escrow.frozen : t.escrow.active} />
                  </td>
                </tr>
              ))}
            </ExpandableTableBody>
          </table>
        </div>
      </Card>

      <Card>
        <CardHead title={`${t.bank.orders} — ${t.bank.history}`} />
        <div className="overflow-x-auto">
          <table className="prona w-full">
            <thead>
              <tr>
                <th>{t.release.code}</th>
                <th>{t.project.one}</th>
                <th>{t.field.stage}</th>
                <th className="text-right">{t.release.amount}</th>
                <th>{t.common.date}</th>
              </tr>
            </thead>
            <ExpandableTableBody total={history.length} colSpan={5} more={t.common.showMore} less={t.common.showLess}>
              {history.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono text-[0.85rem]">{o.code}</td>
                  <td>{o.milestone.project.name}</td>
                  <td>{(t.milestone as any)[o.milestone.type]}</td>
                  <td className="text-right tabular-nums font-semibold">{eur(o.amountEur)}</td>
                  <td className="tabular-nums">{dateShort(o.executedAt)}</td>
                </tr>
              ))}
            </ExpandableTableBody>
          </table>
        </div>
      </Card>
    </div>
  );
}
