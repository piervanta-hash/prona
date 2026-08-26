import Link from "next/link";
import { getSession } from "@/lib/session";
import { can } from "@/lib/access";
import { Badge, Card, CardHead, Progress } from "./ui";
import { dateShort, eur } from "@/lib/format";
import { ExpandableTableBody } from "./Expandable";

const RANK: Record<string, number> = { BUILDING: 0, REGISTERED: 1, SELLING: 1, STALLED: 2, FROZEN: 2, DELIVERED: 3, DRAFT: 4, REJECTED: 5 };

export default async function ProjectTable({ projects }: { projects: any[] }) {
  const { role, t } = await getSession();
  const showMoney = can(role, "project.escrow.totals");
  const rows = [...projects].sort((a, b) => (RANK[a.status] ?? 9) - (RANK[b.status] ?? 9) || a.name.localeCompare(b.name));
  return (
    <Card>
      <CardHead
        title={t.project.listTitle}
        sub={t.project.listSubtitle}
        right={
          <a
            href="/api/eksport/projekte.csv"
            className="shrink-0 border border-petrol-200 bg-white px-3.5 py-2 rounded-sm text-[0.85rem] font-semibold text-petrol-700 hover:bg-petrol-50 whitespace-nowrap"
          >
            {t.project.exportCsv}
          </a>
        }
      />
      <div className="overflow-x-auto">
        <table className="prona w-full">
          <thead>
            <tr>
              <th className="w-44">{t.project.code}</th>
              <th className="w-64">{t.project.name}</th>
              <th>{t.project.municipality}</th>
              <th>{t.project.developer}</th>
              <th className="text-right">{t.project.units}</th>
              <th>{t.project.status}</th>
              <th className="w-56">{t.project.progress}</th>
              {showMoney && <th className="text-right">{t.escrow.locked}</th>}
              <th>{t.project.delivery}</th>
            </tr>
          </thead>
          <ExpandableTableBody total={rows.length} colSpan={showMoney ? 9 : 8} more={t.common.showMore} less={t.common.showLess}>
            {rows.map((p) => {
              const locked = (p.escrow?.collectedEur ?? 0) - (p.escrow?.releasedEur ?? 0);
              return (
                <tr key={p.id} className="relative cursor-pointer">
                  <td className="font-mono text-[0.8rem] font-semibold text-petrol-700 whitespace-nowrap">
                    {p.publicCode ?? <span className="text-petrol-600 font-sans italic">{t.project.notRegistered}</span>}
                  </td>
                  <td className="font-semibold text-[1.02rem]">
                    {/* Link "stretched": l'intera riga e' cliccabile, non solo il testo del nome. */}
                    <Link href={`/projekte/${p.id}`} className="hover:underline text-petrol-800 after:absolute after:inset-0">
                      {p.name}
                    </Link>
                  </td>
                  <td>{p.municipality}</td>
                  <td className="text-[0.9rem]">{p.developer.name}</td>
                  <td className="text-right tabular-nums">{p.unitsCount}</td>
                  <td>
                    <Badge code={p.status} label={(t.status as any)[p.status]} />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Progress value={p.progressPct} />
                      <span className="tabular-nums font-semibold text-sm w-10 text-right">{p.progressPct}%</span>
                    </div>
                  </td>
                  {showMoney && <td className="text-right tabular-nums font-semibold">{locked > 0 ? eur(locked) : "—"}</td>}
                  <td className="tabular-nums">{dateShort(p.expectedDelivery)}</td>
                </tr>
              );
            })}
          </ExpandableTableBody>
        </table>
      </div>
    </Card>
  );
}
