import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { Card, Kpi } from "@/components/ui";
import ProjectTable from "@/components/ProjectTable";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { role, t, identity } = await getSession();

  const projects = await db.project.findMany({
    include: { developer: true, escrow: { include: { bank: true } } },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  const registered = projects.filter((p) => !!p.publicCode).length;
  const collected = projects.reduce((s, p) => s + (p.escrow?.collectedEur ?? 0), 0);
  const released = projects.reduce((s, p) => s + (p.escrow?.releasedEur ?? 0), 0);
  const buyers = await db.contract.count();
  const certifiedStages = await db.milestone.count({ where: { status: "CERTIFIED" } });
  const activeCertifiers = await db.certifier.count({ where: { state: "ACTIVE" } });
  // Il certificatore non vede importi da nessuna parte, nemmeno gli aggregati nazionali.
  const showMoney = role !== "CERTIFIER" && role !== "CITIZEN";

  // Il cittadino non vede i totali nazionali (sono il cruscotto dell'Agenzia):
  // vede la somma delle proprie pratiche, quante che siano.
  let mine: { protected: number; dossiers: number } | null = null;
  if (role === "CITIZEN") {
    const contracts = await db.contract.findMany({
      where: { buyerId: identity.id },
      include: { payments: true, unit: { include: { project: true } } },
    });
    const protectedTotal = contracts.reduce((sum, c) => {
      const paid = c.payments.reduce((s, p) => s + p.amountEur, 0);
      const releasedShare = Math.round((paid * c.unit.project.progressPct) / 100);
      return sum + (paid - releasedShare);
    }, 0);
    mine = { protected: protectedTotal, dossiers: contracts.length };
  }

  return (
    <div className="space-y-7">
      <section className="bg-white border border-[#dbe4e7] border-l-[5px] border-l-petrol-800 rounded-sm px-8 py-7">
        <h1 className="text-[2.1rem] font-serif font-bold leading-tight text-petrol-800">{t.app.tagline}</h1>
        <p className="mt-2.5 text-[1.15rem] text-slate-600 max-w-4xl leading-snug">{t.app.motto}</p>
      </section>

      {role === "CITIZEN" && (
        <Link href="/qytetari" className="block">
          <Card className="hover:border-petrol-700 transition-colors">
            <div className="px-8 py-6 flex items-center justify-between gap-6">
              <div>
                <h2 className="text-[1.4rem] font-serif font-bold text-petrol-800">{t.citizen.title}</h2>
                <p className="text-slate-600 mt-1">{t.citizen.listSubtitle}</p>
              </div>
              <span className="text-petrol-700 font-semibold whitespace-nowrap">{t.common.open} →</span>
            </div>
          </Card>
        </Link>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Kpi label={t.kpi.projects} value={String(registered)} sub={`${projects.length} ${t.project.many.toLowerCase()}`} />
        {role === "CITIZEN" && mine ? (
          <>
            <Kpi label={t.kpi.myProtected} value={mine.protected.toLocaleString("de-DE") + " €"} sub={(mine.protected * 98).toLocaleString("de-DE") + " L"} />
            <Kpi label={t.kpi.myDossiers} value={String(mine.dossiers)} />
          </>
        ) : showMoney ? (
          <>
            <Kpi label={t.kpi.escrowLocked} value={(collected - released).toLocaleString("de-DE") + " €"} sub={((collected - released) * 98).toLocaleString("de-DE") + " L"} />
            <Kpi label={t.kpi.released} value={released.toLocaleString("de-DE") + " €"} sub={(released * 98).toLocaleString("de-DE") + " L"} />
            <Kpi label={t.kpi.buyersProtected} value={String(buyers)} />
          </>
        ) : (
          <>
            <Kpi label={t.kpi.certifiedStages} value={String(certifiedStages)} />
            <Kpi label={t.kpi.activeCertifiers} value={String(activeCertifiers)} />
            <Kpi label={t.kpi.buyersProtected} value={String(buyers)} />
          </>
        )}
      </section>

      <ProjectTable projects={projects as any} />
    </div>
  );
}
