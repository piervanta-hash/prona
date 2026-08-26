import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { can } from "@/lib/access";
import { Badge, Card, CardHead, Field, Note, Progress } from "@/components/ui";
import { ExpandableTableBody } from "@/components/Expandable";
import PhotoStrip from "@/components/PhotoStrip";
import { dateShort, eur } from "@/lib/format";
import { fingerprint } from "@/lib/sitephoto";
import { qrSvg } from "@/lib/qr";

export const dynamic = "force-dynamic";

export default async function CitizenDossier({ params }: { params: Promise<{ contractId: string }> }) {
  const { contractId } = await params;
  const { role, t, identity } = await getSession();
  if (!can(role, "own.position")) return <Note tone="warn">{t.common.noAccess}</Note>;

  const contract = await db.contract.findUnique({
    where: { id: contractId },
    include: {
      buyer: true,
      payments: { orderBy: { paidAt: "asc" } },
      unit: { include: { project: { include: { developer: true, milestones: { include: { certifier: true }, orderBy: { orderIndex: "asc" } } } } } },
    },
  });

  if (!contract) return <Note tone="warn">{t.citizen.noContract}</Note>;
  // Ogni cittadino vede solo le proprie pratiche; l'Agenzia le vede tutte per vigilanza.
  if (role === "CITIZEN" && contract.buyerId !== identity.id) return <Note tone="warn">{t.citizen.notYours}</Note>;

  const project = contract.unit.project;
  const paid = contract.payments.reduce((s, p) => s + p.amountEur, 0);
  const releasedShare = Math.round((paid * project.progressPct) / 100);
  const lockedShare = paid - releasedShare;
  const remaining = contract.priceEur - paid;
  const plan = JSON.parse(contract.planJson) as { key: string; pct: number; due: string }[];
  const paidPct = (paid / contract.priceEur) * 100;

  const certified = project.milestones.filter((m) => m.status === "CERTIFIED");
  const last = certified[certified.length - 1];
  const next = project.milestones.find((m) => m.status !== "CERTIFIED");

  const docs = await db.attachment.findMany({ where: { contractId: contract.id }, orderBy: { createdAt: "asc" } });

  let cum = 0;
  const planRows = plan.map((row) => {
    cum += row.pct;
    return { ...row, cum, paid: cum <= paidPct + 0.5 };
  });

  const completed = contract.status === "COMPLETED";
  const handoverLog = completed
    ? await db.auditLog.findFirst({ where: { action: "UNIT_HANDED_OVER", entityRef: contract.code }, orderBy: { createdAt: "desc" } })
    : null;
  const certQr = completed ? await qrSvg(`${contract.code}·${fingerprint(contract.code)}`, 96) : null;

  return (
    <div className="space-y-6">
      <Link href="/qytetari" className="text-[0.9rem] text-slate-500 hover:text-petrol-700">
        ← {t.citizen.backToList}
      </Link>

      {/* intestazione della pratica, in stile atto */}
      <div className="bg-petrol-800 text-white rounded-sm">
        <div className="px-8 py-6 flex flex-wrap items-start justify-between gap-6">
          <div>
            <div className="text-[0.7rem] uppercase tracking-[0.16em] text-petrol-200">{t.citizen.dossierTitle}</div>
            <h1 className="text-[2rem] font-serif font-bold leading-tight mt-1">{contract.buyer.name}</h1>
            <p className="text-petrol-100 mt-1 text-[1.05rem]">{t.citizen.subtitle}</p>
          </div>
          <div className="text-right">
            <div className="text-[0.7rem] uppercase tracking-[0.16em] text-petrol-200">{t.citizen.verify}</div>
            <div className="font-mono text-[1.05rem] mt-1 border border-petrol-600 px-3 py-2 rounded-sm">
              {fingerprint(contract.code)}
            </div>
            <div className="text-[0.75rem] text-petrol-200 mt-1.5 max-w-[240px]">{t.citizen.verifyNote}</div>
          </div>
        </div>
        <div className="border-t border-petrol-700 px-8 py-4 grid grid-cols-2 md:grid-cols-4 gap-5">
          <div>
            <div className="text-[0.68rem] uppercase tracking-[0.12em] text-petrol-200">{t.citizen.myUnit}</div>
            <div className="text-[1.15rem] font-semibold mt-0.5">
              {contract.unit.label} · {contract.unit.typology} · {contract.unit.areaSqm} m²
            </div>
          </div>
          <div>
            <div className="text-[0.68rem] uppercase tracking-[0.12em] text-petrol-200">{t.project.one}</div>
            <div className="text-[1.15rem] font-semibold mt-0.5">
              <Link href={`/projekte/${project.id}`} className="hover:underline">{project.name}</Link>
            </div>
            <div className="text-[0.8rem] text-petrol-200 font-mono">{project.publicCode}</div>
          </div>
          <div>
            <div className="text-[0.68rem] uppercase tracking-[0.12em] text-petrol-200">{t.project.developer}</div>
            <div className="text-[1.05rem] font-semibold mt-0.5">{project.developer.name}</div>
          </div>
          <div>
            <div className="text-[0.68rem] uppercase tracking-[0.12em] text-petrol-200">{t.citizen.cadastre}</div>
            <div className="text-[0.95rem] font-mono mt-0.5">{contract.cadastreRef}</div>
            <div className="text-[0.8rem] text-petrol-200">{dateShort(contract.cadastreDate)}</div>
          </div>
        </div>
      </div>

      {completed && certQr && (
        <div className="bg-[#EDF4EE] border border-[#CADDCE] rounded-sm px-8 py-6 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="text-[0.7rem] uppercase tracking-[0.16em] text-[#2C5F3A] font-semibold">{t.citizen.certificate}</div>
            <h2 className="text-[1.6rem] font-serif font-bold text-[#1E4028] leading-tight mt-1">{t.citizen.completedTitle}</h2>
            <p className="text-[#2C5F3A] mt-1.5 max-w-xl leading-snug">{t.citizen.completedNote}</p>
            <p className="text-[0.85rem] text-[#2C5F3A] mt-2">
              <span className="font-semibold">{t.citizen.completedAt}:</span> {dateShort(handoverLog?.createdAt ?? contract.cadastreDate)}
            </p>
            <p className="text-[0.78rem] text-[#4B7157] mt-2 max-w-xl leading-snug">{t.citizen.certificateNote}</p>
          </div>
          <div className="bg-white border border-[#CADDCE] p-1.5" dangerouslySetInnerHTML={{ __html: certQr }} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* avanzamento */}
        <Card className="lg:col-span-2">
          <CardHead title={t.citizen.progressTitle} sub={t.citizen.progressNote} />
          <div className="px-6 py-6">
            <div className="flex items-end justify-between mb-2">
              <span className="text-[3.4rem] font-serif font-bold text-petrol-800 leading-none tabular-nums">
                {project.progressPct}%
              </span>
              <div className="text-right">
                <div className="text-[0.7rem] uppercase tracking-[0.1em] text-slate-500 font-semibold">{t.citizen.lastCheck}</div>
                <div className="text-[1.05rem] text-petrol-800 font-semibold">{dateShort(last?.verifiedAt)}</div>
                <div className="text-[0.88rem] text-slate-600">{last?.certifier?.name}</div>
              </div>
            </div>
            <Progress value={project.progressPct} big />
            {next && (
              <p className="mt-4 text-[1rem] text-slate-600">
                <span className="font-semibold text-petrol-800">{t.citizen.next}:</span>{" "}
                {(t.milestone as any)[next.type]} — {t.citizen.unlocks} {next.cumulativePct}%.
              </p>
            )}
            <div className="mt-5 grid grid-cols-3 sm:grid-cols-6 gap-2">
              {project.milestones.map((m) => (
                <div
                  key={m.id}
                  className={`border rounded-sm px-2.5 py-2 text-center ${
                    m.status === "CERTIFIED" ? "border-[#CADDCE] bg-[#EDF4EE]" : "border-[#e2e9eb] bg-white"
                  }`}
                >
                  <div className="text-[0.78rem] font-semibold text-petrol-800 leading-tight">{(t.milestone as any)[m.type]}</div>
                  <div className="text-[0.75rem] text-slate-500 tabular-nums mt-0.5">{m.cumulativePct}%</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* denaro — la protezione viene prima del rendiconto: e' il messaggio, non un dettaglio */}
        <Card>
          <CardHead title={t.citizen.protection} />
          <div className="px-6 py-6">
            <div className="text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold">{t.citizen.protectedBig}</div>
            <div className="text-[2.6rem] font-serif font-bold text-petrol-800 leading-none tabular-nums mt-1.5">
              {eur(lockedShare)}
            </div>
            <div className="text-[0.95rem] text-slate-500 tabular-nums mt-1">{(lockedShare * 98).toLocaleString("de-DE")} L</div>
            <p className="text-[0.9rem] text-slate-600 leading-snug mt-3">{t.citizen.protectedBigNote}</p>

            <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-6 pt-5 border-t border-[#e9eff1]">
              <div>
                <div className="text-[0.68rem] uppercase tracking-[0.08em] text-slate-500 font-semibold leading-tight">{t.citizen.price}</div>
                <div className="text-[0.98rem] tabular-nums text-slate-700 mt-0.5">{eur(contract.priceEur)}</div>
              </div>
              <div>
                <div className="text-[0.68rem] uppercase tracking-[0.08em] text-slate-500 font-semibold leading-tight">{t.citizen.paid}</div>
                <div className="text-[0.98rem] tabular-nums text-slate-700 mt-0.5">{eur(paid)}</div>
              </div>
              <div>
                <div className="text-[0.68rem] uppercase tracking-[0.08em] text-slate-500 font-semibold leading-tight">{t.citizen.releasedShare}</div>
                <div className="text-[0.98rem] tabular-nums text-slate-700 mt-0.5">{eur(releasedShare)}</div>
              </div>
              <div>
                <div className="text-[0.68rem] uppercase tracking-[0.08em] text-slate-500 font-semibold leading-tight">{t.citizen.remaining}</div>
                <div className="text-[0.98rem] tabular-nums text-slate-700 mt-0.5">{eur(remaining)}</div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* foto dell'ultima verifica */}
      {last && (
        <Card>
          <CardHead title={`${t.photos.title} — ${(t.milestone as any)[last.type]}`} sub={t.photos.meta} />
          <PhotoStrip
            json={last.photosJson}
            stage={last.type}
            code={project.publicCode ?? project.permitNo}
            registry={last.certifier?.registryNo ?? "—"}
            labels={t.photos as any}
          />
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHead title={t.citizen.plan} />
          <table className="prona w-full">
            <thead>
              <tr>
                <th>{t.citizen.instalment}</th>
                <th>{t.citizen.due}</th>
                <th className="text-right">%</th>
                <th className="text-right">{t.citizen.amount}</th>
                <th>{t.citizen.state}</th>
              </tr>
            </thead>
            <tbody>
              {planRows.map((r) => (
                <tr key={r.key}>
                  <td className="font-semibold">{(t.plan as any)[r.key]}</td>
                  <td className="text-slate-600">{(t.plan as any)["due_" + r.due]}</td>
                  <td className="text-right tabular-nums">{r.pct}%</td>
                  <td className="text-right tabular-nums font-semibold">{eur(Math.round((contract.priceEur * r.pct) / 100))}</td>
                  <td>
                    <Badge code={r.paid ? "CERTIFIED" : "PENDING"} label={r.paid ? t.citizen.PAID : t.citizen.UPCOMING} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card>
          <CardHead title={t.citizen.docs} />
          <table className="prona w-full">
            <thead>
              <tr>
                <th>{t.attach.docTitle}</th>
                <th>{t.attach.by}</th>
                <th>{t.common.date}</th>
                <th></th>
              </tr>
            </thead>
            <ExpandableTableBody total={docs.length} colSpan={4} more={t.common.showMore} less={t.common.showLess}>
              {docs.map((d) => (
                <tr key={d.id}>
                  <td className="font-semibold">{d.title}</td>
                  <td className="text-[0.88rem] text-slate-600">{d.uploadedByName}</td>
                  <td className="tabular-nums">{dateShort(d.createdAt)}</td>
                  <td>
                    <a href={`/api/dokument/${d.id}`} target="_blank" rel="noreferrer" className="text-petrol-700 font-semibold hover:underline">
                      {t.attach.open}
                    </a>
                  </td>
                </tr>
              ))}
              {docs.length === 0 && <tr><td colSpan={4} className="text-slate-500">{t.attach.none}</td></tr>}
            </ExpandableTableBody>
          </table>
          <div className="px-6 py-4 border-t border-[#e9eff1]">
            <Field label={t.citizen.contract}>
              <span className="font-mono">{contract.code}</span>
              <span className="text-slate-500 text-[0.9rem]"> · {t.citizen.signedAt} {dateShort(contract.signedAt)}</span>
            </Field>
          </div>
        </Card>
      </div>
    </div>
  );
}
