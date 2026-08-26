import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { can } from "@/lib/access";
import { Badge, Card, CardHead, Field, Money, Note, Progress, Restricted } from "@/components/ui";
import PhotoStrip from "@/components/PhotoStrip";
import Attachments from "@/components/Attachments";
import ProjectMap from "@/components/ProjectMap";
import ShareButton from "@/components/ShareButton";
import DeliveryTimeline from "@/components/DeliveryTimeline";
import { dateShort, eur } from "@/lib/format";
import { RETENTION_PCT } from "@/lib/constants";
import { qrSvg } from "@/lib/qr";
import { getProjectHistory } from "@/lib/timeline";
import { parsePhotos, photoUrl } from "@/lib/photoUrl";
import { fingerprint } from "@/lib/sitephoto";
import { ExpandableTableBody, ExpandableList } from "@/components/Expandable";

export const dynamic = "force-dynamic";

const GALLERY_TYPES = ["RENDER", "ELEVATION", "PLAN", "SECTION", "SITE"] as const;

export default async function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { role, t } = await getSession();

  const p = await db.project.findUnique({
    where: { id },
    include: {
      developer: true,
      escrow: { include: { bank: true, releases: { include: { milestone: true }, orderBy: { requestedAt: "desc" } } } },
      milestones: { include: { certifier: true }, orderBy: { orderIndex: "asc" } },
      inspections: { include: { certifier: true }, orderBy: { performedAt: "desc" } },
      units: { orderBy: { label: "asc" }, include: { contract: { include: { buyer: true } } } },
    },
  });
  if (!p) notFound();

  const collected = p.escrow?.collectedEur ?? 0;
  const released = p.escrow?.releasedEur ?? 0;
  const locked = collected - released;
  const retention = Math.round((collected * RETENTION_PCT) / 100);
  const certified = p.milestones.filter((m) => m.status === "CERTIFIED");
  const escrowDenial = (t.denied.escrow as any)[role] as string;
  const unitsDenial = (t.denied.units as any)[role] as string;

  const h = await headers();
  const host = h.get("host") ?? "localhost:3100";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const publicUrl = `${proto}://${host}/projekte/${p.id}`;
  const qr = await qrSvg(publicUrl, 108);

  const unitsPerFloor = Math.max(2, Math.min(4, Math.round(p.unitsCount / Math.max(1, Math.round(p.unitsCount / 3)))));
  const floors = Math.max(2, Math.round(p.unitsCount / Math.max(1, unitsPerFloor)));
  const dominantTypology = p.units[Math.floor(p.units.length / 2)]?.typology ?? "2+1";

  const prices = p.units.map((u) => Math.round(u.priceEur / u.areaSqm));
  const priceMin = prices.length ? Math.min(...prices) : 0;
  const priceMax = prices.length ? Math.max(...prices) : 0;

  const similar = await db.project.findMany({
    where: { municipality: p.municipality, id: { not: p.id } },
    include: { developer: true },
    orderBy: { name: "asc" },
    take: 4,
  });

  const history = await getProjectHistory(p.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <Link href="/projekte" className="text-[0.9rem] text-slate-500 hover:text-petrol-700">
            ← {t.project.many}
          </Link>
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
        <div className="flex items-start gap-4">
          <div className="text-right">
            <div className="text-[0.7rem] uppercase tracking-[0.1em] text-slate-500 font-semibold">{t.project.progress}</div>
            <div className="text-[1.9rem] font-serif font-bold tabular-nums text-petrol-800 leading-none mt-0.5">{p.progressPct}%</div>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="bg-white border border-[#dbe4e7] p-1.5" dangerouslySetInnerHTML={{ __html: qr }} />
            <ShareButton url={publicUrl} title={p.name} label={t.share.button} copiedLabel={t.share.copied} />
          </div>
        </div>
      </div>

      {p.rejectionReason && (
        <Note tone="bad">
          <div className="text-[0.72rem] uppercase font-bold text-accent-700 tracking-[0.1em]">{t.project.rejection}</div>
          <p className="text-[1.05rem] text-petrol-900 mt-1">{p.rejectionReason}</p>
        </Note>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="lg:col-span-2">
          <CardHead title={t.project.one} />
          <div className="px-6 py-5 grid grid-cols-2 md:grid-cols-3 gap-5">
            <Field label={t.project.developer}>
              <Link href={`/ndertues/${p.developer.id}`} className="hover:underline text-petrol-800">{p.developer.name}</Link>
              <div className="text-[0.85rem] text-slate-500 mt-0.5">
                {can(role, "developer.financials")
                  ? `${t.tier.label} ${p.developer.tier} · ${(t.license as any)[p.developer.licenseState]} · ${eur(p.developer.netWorthEur)}`
                  : `${t.tier.label} ${p.developer.tier} · ${(t.license as any)[p.developer.licenseState]}`}
              </div>
            </Field>
            <Field label={t.project.municipality}>{p.municipality}</Field>
            <Field label={t.project.address}>{p.address}</Field>
            <Field label={t.project.permit}>{p.permitNo}</Field>
            <Field label={t.project.units}>{p.unitsCount}</Field>
            <Field label={t.project.landCadastreRef}>{p.landCadastreRef ?? "—"}</Field>
            <Field label={t.project.registeredAt}>{dateShort(p.registeredAt)}</Field>
            <Field label={t.project.delivery}>{dateShort(p.expectedDelivery)}</Field>
            <Field label={t.project.lastActivity}>{dateShort(p.lastSiteActivity)}</Field>
          </div>
          <div className="px-6 pb-6">
            <Progress value={p.progressPct} big />
          </div>
        </Card>

        <Card>
          <CardHead
            title={t.escrow.title}
            right={
              can(role, "project.escrow.totals") ? (
                <Badge
                  code={p.escrow?.frozen ? "FROZEN" : p.escrow?.active ? "ACTIVE" : "DRAFT"}
                  label={p.escrow?.frozen ? t.escrow.frozen : p.escrow?.active ? t.escrow.active : t.escrow.inactive}
                />
              ) : undefined
            }
          />
          {can(role, "project.escrow.totals") ? (
            <div className="px-6 py-5 space-y-4">
              <Field label={t.escrow.bank}>{p.escrow?.bank.name ?? "—"}</Field>
              {can(role, "project.escrow.iban") && (
                <Field label={t.escrow.iban}>
                  <span className="font-mono text-[0.9rem]">{p.escrow?.active ? p.escrow.iban : "—"}</span>
                </Field>
              )}
              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#e9eff1]">
                <Field label={t.escrow.collected}><Money value={collected} /></Field>
                <Field label={t.escrow.released}><Money value={released} /></Field>
                <Field label={t.escrow.locked}>
                  <span className="text-petrol-800 font-bold"><Money value={locked} /></span>
                </Field>
                <Field label={t.escrow.retention}><Money value={retention} /></Field>
              </div>
            </div>
          ) : (
            <div className="px-6 py-5">
              <Restricted title={t.denied.title} reason={escrowDenial} compact />
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <Card>
          <CardHead title={t.location.title} sub={t.location.sub} />
          <div className="px-6 py-5 flex justify-center">
            <ProjectMap projectId={p.id} municipality={p.municipality} size={440} />
          </div>
        </Card>

        <Card>
          <CardHead title={t.gallery.title} sub={t.gallery.sub} />
          <div className="px-6 py-5 grid grid-cols-2 gap-4">
            {GALLERY_TYPES.map((gt) => {
              const src = `/api/nakshe?s=${encodeURIComponent(p.id)}&c=${encodeURIComponent(p.publicCode ?? p.permitNo)}&n=${encodeURIComponent(p.name)}&f=${floors}&u=${unitsPerFloor}&ty=${encodeURIComponent(dominantTypology)}&t=${gt}&l=${encodeURIComponent((t.gallery as any)[gt])}`;
              return (
                <a key={gt} href={src} target="_blank" rel="noreferrer" className={`block border border-[#dbe4e7] hover:border-petrol-700 ${gt === "RENDER" ? "col-span-2" : ""}`}>
                  <img src={src} alt={(t.gallery as any)[gt]} className="w-full block" />
                  <div className="px-2.5 py-1.5 text-[0.78rem] font-semibold text-petrol-800 border-t border-[#e9eff1]">
                    {(t.gallery as any)[gt]}
                  </div>
                </a>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <DeliveryTimeline
          permitDate={p.permitDate}
          registeredAt={p.registeredAt}
          originalDelivery={p.originalDelivery}
          expectedDelivery={p.expectedDelivery}
          labels={t.delivery as any}
        />
      </Card>

      <Card>
        <CardHead title={t.milestone.title} sub={t.citizen.progressNote} />
        <div className="overflow-x-auto">
          <table className="prona w-full">
            <thead>
              <tr>
                <th>{t.milestone.type}</th>
                <th className="text-right">{t.milestone.cumulative}</th>
                <th>{t.project.status}</th>
                <th>{t.milestone.certifier}</th>
                <th>{t.milestone.verifiedAt}</th>
                <th>{t.milestone.outcome}</th>
              </tr>
            </thead>
            <tbody>
              {p.milestones.map((m) => (
                <tr key={m.id}>
                  <td className="font-semibold">{(t.milestone as any)[m.type]}</td>
                  <td className="text-right tabular-nums font-semibold">{m.cumulativePct}%</td>
                  <td><Badge code={m.status} label={(t.milestone as any)[m.status]} /></td>
                  <td>{m.certifier?.name ?? "—"}</td>
                  <td className="tabular-nums">{dateShort(m.verifiedAt)}</td>
                  <td>{m.outcome ? (t.milestone as any)[m.outcome] : "—"}</td>
                </tr>
              ))}
              {p.milestones.length === 0 && <tr><td colSpan={6} className="text-slate-500">{t.common.empty}</td></tr>}
            </tbody>
          </table>
        </div>
      </Card>

      {certified.length > 0 && can(role, "milestone.photos") && (
        <Card>
          <CardHead title={t.photos.title} sub={t.photos.meta} />
          <div className="px-6 pt-4 pb-2 space-y-2">
            {[...certified].reverse().map((m, idx) => (
              <details key={m.id} open={idx === 0} className="border border-[#e2e9eb] rounded-sm">
                <summary className="cursor-pointer px-4 py-3 font-semibold text-petrol-800 flex items-center gap-3">
                  {(t.milestone as any)[m.type]}
                  <span className="text-[0.85rem] font-normal text-slate-500">
                    {dateShort(m.verifiedAt)} · {m.certifier?.name}
                  </span>
                </summary>
                <div className="border-t border-[#e9eff1]">
                  <PhotoStrip
                    json={m.photosJson}
                    stage={m.type}
                    code={p.publicCode ?? p.permitNo}
                    registry={m.certifier?.registryNo ?? "—"}
                    labels={t.photos as any}
                  />
                  {can(role, "milestone.checklist") && m.checklistJson && (
                    <div className="px-6 pb-5">
                      <div className="text-[0.7rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-2">Checklist</div>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                        {(JSON.parse(m.checklistJson) as { label: string; ok: boolean }[]).map((c) => (
                          <li key={c.label} className="text-[0.95rem] flex items-start gap-2">
                            <span className={`mt-0.5 inline-block w-4 text-center font-bold ${c.ok ? "text-[#2C5F3A]" : "text-accent"}`}>
                              {c.ok ? "✓" : "✕"}
                            </span>
                            {c.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </details>
            ))}
          </div>
        </Card>
      )}

      {can(role, "milestone.photos") && (
        <Card>
          <CardHead title={t.compare.title} sub={t.compare.sub} />
          {certified.length >= 2 ? (
            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-5">
              {certified.slice(-2).map((m) => {
                const first = parsePhotos(m.photosJson)[0];
                if (!first) return null;
                return (
                  <figure key={m.id} className="border border-[#dbe4e7]">
                    <img
                      src={photoUrl(first, { stage: m.type, code: p.publicCode ?? p.permitNo, registry: m.certifier?.registryNo ?? "—" }, { w: 640, h: 420 }, (t.milestone as any)[m.type])}
                      alt={(t.milestone as any)[m.type]}
                      className="w-full block"
                    />
                    <figcaption className="px-3 py-2.5 text-[0.85rem] text-slate-600">
                      <span className="block font-semibold text-petrol-800">{(t.milestone as any)[m.type]} · {m.cumulativePct}%</span>
                      {dateShort(m.verifiedAt)} — {m.certifier?.name}
                      <span className="block font-mono text-[0.72rem] text-slate-500 mt-0.5">{fingerprint(first.seed)}</span>
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          ) : (
            <p className="px-6 py-5 text-slate-500">{t.compare.none}</p>
          )}
        </Card>
      )}

      {can(role, "project.releases") && p.escrow && p.escrow.releases.length > 0 && (
        <Card>
          <CardHead title={t.bank.orders} />
          <div className="overflow-x-auto">
            <table className="prona w-full">
              <thead>
                <tr>
                  <th>{t.milestone.type}</th>
                  <th className="text-right">{t.release.amount}</th>
                  <th>{t.project.status}</th>
                  <th>{t.milestone.verifiedAt}</th>
                  <th>{t.inspect.inspector}</th>
                </tr>
              </thead>
              <ExpandableTableBody total={p.escrow.releases.length} colSpan={5} more={t.common.showMore} less={t.common.showLess}>
                {p.escrow.releases.map((r) => (
                  <tr key={r.id}>
                    <td className="font-semibold">
                      {(t.milestone as any)[r.milestone.type]} <span className="font-mono text-[0.78rem] text-slate-500">{r.code}</span>
                    </td>
                    <td className="text-right"><Money value={r.amountEur} sub={false} /></td>
                    <td><Badge code={r.status} label={(t.release as any)[r.status] ?? r.status} /></td>
                    <td className="tabular-nums">{dateShort(r.executedAt ?? r.approvedAt ?? r.requestedAt)}</td>
                    <td className="text-[0.88rem]">{r.approvedBy ?? "—"}</td>
                  </tr>
                ))}
              </ExpandableTableBody>
            </table>
          </div>
        </Card>
      )}

      {can(role, "inspections") && (
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
      )}

      <Attachments projectId={p.id} />

      <Card>
        <CardHead title={t.priceRange.title} sub={t.priceRange.note} />
        <div className="px-6 py-5">
          <div className="text-[2rem] font-serif font-bold text-petrol-800 tabular-nums">
            {priceMin.toLocaleString("de-DE")} – {priceMax.toLocaleString("de-DE")} €
            <span className="text-[1rem] font-sans font-normal text-slate-500 ml-2">/ m²</span>
          </div>
        </div>
      </Card>

      {can(role, "project.units.prices") ? (
        <Card>
          <CardHead title={t.units.title} sub={`${p.units.filter((u) => u.status !== "FREE").length} / ${p.units.length}`} />
          <div className="overflow-x-auto">
            <table className="prona w-full">
              <thead>
                <tr>
                  <th>{t.units.label}</th>
                  <th>{t.units.typology}</th>
                  <th className="text-right">{t.units.floor}</th>
                  <th className="text-right">{t.units.area}</th>
                  <th className="text-right">{t.units.price}</th>
                  <th>{t.project.status}</th>
                  {can(role, "project.contracts") && <th>{t.roles.CITIZEN}</th>}
                </tr>
              </thead>
              <ExpandableTableBody total={p.units.length} colSpan={can(role, "project.contracts") ? 7 : 6} more={t.common.showMore} less={t.common.showLess}>
                {p.units.map((u) => (
                  <tr key={u.id}>
                    <td className="font-mono font-semibold">{u.label}</td>
                    <td>{u.typology}</td>
                    <td className="text-right tabular-nums">{u.floor}</td>
                    <td className="text-right tabular-nums">{u.areaSqm} m²</td>
                    <td className="text-right tabular-nums font-semibold">{eur(u.priceEur)}</td>
                    <td><Badge code={u.status} label={(t.unitStatus as any)[u.status]} /></td>
                    {can(role, "project.contracts") && <td>{u.contract?.buyer.name ?? "—"}</td>}
                  </tr>
                ))}
              </ExpandableTableBody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <CardHead title={t.units.title} sub={`${p.units.filter((u) => u.status !== "FREE").length} / ${p.units.length} ${t.common.units}`} />
          <div className="px-6 py-5">
            <Restricted title={t.denied.title} reason={unitsDenial} compact />
          </div>
        </Card>
      )}

      <Card>
        <CardHead title={t.history.title} sub={t.history.sub} />
        <div className="px-6 py-5">
          {history.length === 0 ? (
            <p className="text-slate-500">{t.history.none}</p>
          ) : (
            <ExpandableList total={history.length} more={t.common.showMore} less={t.common.showLess} tag="ol" className="space-y-0 list-none m-0 p-0">
              {history.map((ev, i) => {
                const detail =
                  ev.kind === "CERTIFIED" && ev.meta
                    ? `${(t.milestone as any)[ev.meta.type as string]} — ${ev.meta.pct}%`
                    : ev.kind === "INSPECTION" && ev.meta
                    ? `${(t.inspect as any)[ev.meta.type as string]} — ${(t.inspect as any)[ev.meta.outcome as string]}`
                    : ev.title;
                return (
                  <li key={i} className="flex gap-4 py-2.5 border-b border-[#eef2f4] last:border-b-0">
                    <div className="w-24 shrink-0 text-[0.82rem] text-slate-500 tabular-nums pt-0.5">{dateShort(ev.at)}</div>
                    <div className="w-2 h-2 rounded-full bg-petrol-700 mt-1.5 shrink-0" />
                    <div className="flex-1 -mt-0.5">
                      <span className="font-semibold text-petrol-800">{(t.history as any)[ev.kind] ?? ev.kind}</span>
                      <span className="text-slate-600"> — {detail}</span>
                      {ev.who && <span className="block text-[0.85rem] text-slate-500">{ev.who}</span>}
                    </div>
                  </li>
                );
              })}
            </ExpandableList>
          )}
        </div>
      </Card>

      <Card>
        <CardHead title={t.similar.title} sub={t.similar.sub} />
        {similar.length === 0 ? (
          <p className="px-6 py-5 text-slate-500">{t.similar.none}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="prona w-full">
              <thead>
                <tr>
                  <th>{t.project.code}</th>
                  <th>{t.project.name}</th>
                  <th>{t.project.developer}</th>
                  <th>{t.project.status}</th>
                  <th className="w-52">{t.project.progress}</th>
                </tr>
              </thead>
              <tbody>
                {similar.map((sp) => (
                  <tr key={sp.id} className="relative cursor-pointer">
                    <td className="font-mono text-[0.8rem] font-semibold text-petrol-700 whitespace-nowrap">
                      {sp.publicCode ?? <span className="text-slate-500 font-sans italic">{t.project.notRegistered}</span>}
                    </td>
                    <td className="font-semibold">
                      <Link href={`/projekte/${sp.id}`} className="hover:underline text-petrol-800 after:absolute after:inset-0">{sp.name}</Link>
                    </td>
                    <td className="text-[0.9rem]">{sp.developer.name}</td>
                    <td><Badge code={sp.status} label={(t.status as any)[sp.status]} /></td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Progress value={sp.progressPct} />
                        <span className="tabular-nums font-semibold text-sm w-10 text-right">{sp.progressPct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
