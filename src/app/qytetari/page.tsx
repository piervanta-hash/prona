import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { can } from "@/lib/access";
import { Badge, Card, CardHead, Note, Progress, SectionTitle } from "@/components/ui";
import { eur } from "@/lib/format";
import { ExpandableList } from "@/components/Expandable";

export const dynamic = "force-dynamic";

export default async function CitizenPortal() {
  const { role, t, identity } = await getSession();
  if (!can(role, "own.position")) return <Note tone="warn">{t.common.noAccess}</Note>;

  // L'Agenzia, in veste di vigilanza, puo' scorrere le pratiche di ogni cittadino;
  // il cittadino vede solo le proprie.
  const contracts = await db.contract.findMany({
    where: role === "AGENCY" ? {} : { buyerId: identity.id },
    include: {
      buyer: true,
      payments: true,
      unit: { include: { project: true } },
    },
    orderBy: { signedAt: "desc" },
    take: role === "AGENCY" ? 100 : undefined,
  });

  if (contracts.length === 0) return <Note tone="warn">{t.citizen.noContract}</Note>;

  // Con una sola pratica non ha senso far cliccare due volte: si va dritti al dettaglio.
  if (role !== "AGENCY" && contracts.length === 1) {
    redirect(`/qytetari/${contracts[0].id}`);
  }

  return (
    <div className="space-y-6">
      <SectionTitle sub={t.citizen.listSubtitle}>
        {role === "AGENCY" ? t.citizen.allDossiers : t.citizen.title}
      </SectionTitle>

      {role !== "AGENCY" && (
        <div className="bg-petrol-800 text-white rounded-sm px-8 py-5 flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="text-[0.7rem] uppercase tracking-[0.16em] text-petrol-200">{t.roles.CITIZEN}</div>
            <h1 className="text-[1.7rem] font-serif font-bold leading-tight mt-0.5">{identity.name}</h1>
          </div>
          <div className="text-right">
            <div className="text-[0.7rem] uppercase tracking-[0.16em] text-petrol-200">{t.citizen.myProperties}</div>
            <div className="text-[1.7rem] font-serif font-bold tabular-nums">{contracts.length}</div>
          </div>
        </div>
      )}

      <ExpandableList total={contracts.length} more={t.common.showMore} less={t.common.showLess} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {contracts.map((c) => {
          const paid = c.payments.reduce((s, p) => s + p.amountEur, 0);
          const releasedShare = Math.round((paid * c.unit.project.progressPct) / 100);
          const lockedShare = paid - releasedShare;
          return (
            <Card key={c.id} className="relative">
              <CardHead
                title={c.unit.project.name}
                sub={`${c.unit.label} · ${c.unit.typology} · ${c.unit.areaSqm} m²`}
                right={<Badge code={c.unit.project.status} label={(t.status as any)[c.unit.project.status]} />}
              />
              <div className="px-6 py-5 space-y-4">
                {role === "AGENCY" && (
                  <div className="text-[0.9rem] text-slate-600">{t.roles.CITIZEN}: <span className="font-semibold text-petrol-800">{c.buyer.name}</span></div>
                )}
                <div>
                  <div className="flex items-center justify-between text-[0.85rem] text-slate-600 mb-1">
                    <span>{t.project.progress}</span>
                    <span className="font-semibold tabular-nums">{c.unit.project.progressPct}%</span>
                  </div>
                  <Progress value={c.unit.project.progressPct} />
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-[#e9eff1]">
                  <div>
                    <div className="text-[0.7rem] uppercase tracking-[0.08em] text-slate-500 font-semibold">{t.citizen.protectedBig}</div>
                    <div className="text-[1.3rem] font-serif font-bold text-petrol-800 tabular-nums mt-0.5">{eur(lockedShare)}</div>
                  </div>
                  <Link
                    href={`/qytetari/${c.id}`}
                    className="bg-petrol-800 text-white px-4 py-2.5 rounded-sm text-sm font-semibold hover:bg-petrol-700 after:absolute after:inset-0"
                  >
                    {t.citizen.openDossier}
                  </Link>
                </div>
              </div>
            </Card>
          );
        })}
      </ExpandableList>
    </div>
  );
}
