import Link from "next/link";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { can } from "@/lib/access";
import { getZoneSummaries } from "@/lib/zones";
import { projectCoords } from "@/lib/geo";
import { Badge, Card, CardHead, Note, Progress, SectionTitle } from "@/components/ui";
import MultiPinMap, { type MapPin } from "@/components/MultiPinMap";
import { eur, dateShort } from "@/lib/format";
import { CITY_CENTERS } from "@/lib/geo";
import { ExpandableTableBody } from "@/components/Expandable";

export const dynamic = "force-dynamic";

const TYPOLOGIES = ["1+1", "2+1", "3+1", "Dyqan"];
const STATUSES = ["REGISTERED", "BUILDING", "STALLED", "DELIVERED"];

type SP = Record<string, string | undefined>;

export default async function SearchPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { role, t } = await getSession();

  const developers = await db.developer.findMany({ orderBy: { name: "asc" } });
  const zones = await getZoneSummaries();
  const municipalities = Object.keys(CITY_CENTERS);

  const onlyActiveEscrow = sp.escrow === "1";

  const units = await db.unit.findMany({
    where: {
      typology: sp.tipologia ? sp.tipologia : undefined,
      areaSqm: { gte: sp.minArea ? Number(sp.minArea) : undefined, lte: sp.maxArea ? Number(sp.maxArea) : undefined },
      project: {
        municipality: sp.comune ? sp.comune : undefined,
        zone: sp.zona ? sp.zona : undefined,
        developerId: sp.dev ? sp.dev : undefined,
        status: sp.stato ? sp.stato : undefined,
        progressPct: sp.minProgress ? { gte: Number(sp.minProgress) } : undefined,
        expectedDelivery: sp.deliveryBy ? { lte: new Date(sp.deliveryBy) } : undefined,
        escrow: onlyActiveEscrow ? { active: true, frozen: false } : undefined,
      },
    },
    include: { project: { include: { developer: true, escrow: true } } },
  });

  let filtered = units.filter((u) => {
    const perSqm = Math.round(u.priceEur / u.areaSqm);
    if (sp.minPrice && perSqm < Number(sp.minPrice)) return false;
    if (sp.maxPrice && perSqm > Number(sp.maxPrice)) return false;
    return true;
  });

  const sort = sp.sort ?? "";
  const cmp: Record<string, (a: (typeof filtered)[number], b: (typeof filtered)[number]) => number> = {
    price_asc: (a, b) => a.priceEur / a.areaSqm - b.priceEur / b.areaSqm,
    price_desc: (a, b) => b.priceEur / b.areaSqm - a.priceEur / a.areaSqm,
    area_asc: (a, b) => a.areaSqm - b.areaSqm,
    area_desc: (a, b) => b.areaSqm - a.areaSqm,
    progress_asc: (a, b) => a.project.progressPct - b.project.progressPct,
    progress_desc: (a, b) => b.project.progressPct - a.project.progressPct,
    delivery_asc: (a, b) => a.project.expectedDelivery.getTime() - b.project.expectedDelivery.getTime(),
    delivery_desc: (a, b) => b.project.expectedDelivery.getTime() - a.project.expectedDelivery.getTime(),
  };
  if (cmp[sort]) filtered = [...filtered].sort(cmp[sort]);

  const byProject = new Map<string, (typeof filtered)[number]["project"]>();
  for (const u of filtered) byProject.set(u.project.id, u.project);
  const matchingProjects = [...byProject.values()];

  const byCity = new Map<string, typeof matchingProjects>();
  for (const p of matchingProjects) {
    if (!byCity.has(p.municipality)) byCity.set(p.municipality, []);
    byCity.get(p.municipality)!.push(p);
  }

  const qs = (extra: Record<string, string>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(sp)) if (v && k !== "sort") params.set(k, v);
    for (const [k, v] of Object.entries(extra)) params.set(k, v);
    return `/kerko?${params.toString()}`;
  };
  const sortLink = (key: string, label: string) => (
    <Link href={qs({ sort: key })} className="hover:underline">
      {label}
    </Link>
  );

  return (
    <div className="space-y-6">
      <SectionTitle sub={t.search.subtitle}>{t.search.title}</SectionTitle>

      <Card>
        <form method="get" className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <label className="block">
            <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{t.project.municipality}</span>
            <select name="comune" className="field" defaultValue={sp.comune ?? ""}>
              <option value="">{t.common.all}</option>
              {municipalities.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{t.search.zone}</span>
            <select name="zona" className="field" defaultValue={sp.zona ?? ""}>
              <option value="">{t.common.all}</option>
              {zones.map((z) => <option key={z.zone} value={z.zone}>{z.zone} — {z.municipality}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{t.units.typology}</span>
            <select name="tipologia" className="field" defaultValue={sp.tipologia ?? ""}>
              <option value="">{t.common.all}</option>
              {TYPOLOGIES.map((ty) => <option key={ty} value={ty}>{ty}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{t.project.status}</span>
            <select name="stato" className="field" defaultValue={sp.stato ?? ""}>
              <option value="">{t.common.all}</option>
              {STATUSES.map((s) => <option key={s} value={s}>{(t.status as any)[s]}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{t.search.areaMin}</span>
            <input type="number" name="minArea" className="field" defaultValue={sp.minArea ?? ""} placeholder="m²" />
          </label>
          <label className="block">
            <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{t.search.areaMax}</span>
            <input type="number" name="maxArea" className="field" defaultValue={sp.maxArea ?? ""} placeholder="m²" />
          </label>
          <label className="block">
            <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{t.search.priceMin}</span>
            <input type="number" name="minPrice" className="field" defaultValue={sp.minPrice ?? ""} placeholder="€/m²" />
          </label>
          <label className="block">
            <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{t.search.priceMax}</span>
            <input type="number" name="maxPrice" className="field" defaultValue={sp.maxPrice ?? ""} placeholder="€/m²" />
          </label>
          <label className="block">
            <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{t.search.deliveryBy}</span>
            <input type="date" name="deliveryBy" className="field" defaultValue={sp.deliveryBy ?? ""} />
          </label>
          <label className="block">
            <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{t.search.minProgress}</span>
            <input type="number" name="minProgress" min={0} max={100} className="field" defaultValue={sp.minProgress ?? ""} placeholder="%" />
          </label>
          <label className="block">
            <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{t.project.developer}</span>
            <select name="dev" className="field" defaultValue={sp.dev ?? ""}>
              <option value="">{t.common.all}</option>
              {developers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label className="sm:col-span-2 lg:col-span-4 flex items-center gap-3 rounded-sm border-2 border-accent bg-accent-50 px-4 py-3">
            <input type="checkbox" name="escrow" value="1" defaultChecked={onlyActiveEscrow} className="h-5 w-5 accent-accent" />
            <span className="text-[0.95rem] font-bold text-accent-700">{t.search.onlyActiveEscrow}</span>
          </label>
          <div className="sm:col-span-2 lg:col-span-4 flex gap-3 pt-2">
            <button className="bg-petrol-800 text-white px-6 py-2.5 rounded-sm font-semibold hover:bg-petrol-700">{t.common.search}</button>
            <Link href="/kerko" className="border border-petrol-200 bg-white px-6 py-2.5 rounded-sm font-semibold">{t.search.reset}</Link>
          </div>
        </form>
      </Card>

      <Note tone="info">
        <p className="text-[0.95rem] text-petrol-900">
          <span className="font-semibold">{t.search.resultsCount.replace("{n}", String(filtered.length))}</span>
          {" · "}{t.search.projectsCount.replace("{n}", String(matchingProjects.length))}
        </p>
      </Note>

      {[...byCity.entries()].map(([city, projs]) => {
        const pins: MapPin[] = projs.map((p) => {
          const c = projectCoords(p.id, p.municipality);
          return { id: p.id, lat: c.lat, lng: c.lng, label: p.name, href: `/projekte/${p.id}` };
        });
        return (
          <Card key={city}>
            <CardHead title={city} sub={`${projs.length} ${t.zones.projects.toLowerCase()}`} />
            <div className="px-6 py-5">
              <MultiPinMap municipality={city} pins={pins} size={340} />
            </div>
          </Card>
        );
      })}

      {matchingProjects.length > 0 && (
        <Card>
          <CardHead title={t.search.matchingProjects} sub={t.search.compareHint} />
          <form method="get" action="/krahaso">
            <div className="overflow-x-auto">
              <table className="prona w-full">
                <thead>
                  <tr>
                    <th></th>
                    <th>{t.project.code}</th>
                    <th>{t.project.name}</th>
                    <th>{t.project.developer}</th>
                    <th>{t.project.status}</th>
                    <th className="w-48">{t.project.progress}</th>
                    <th>{t.project.delivery}</th>
                  </tr>
                </thead>
                <ExpandableTableBody total={matchingProjects.length} colSpan={7} more={t.common.showMore} less={t.common.showLess}>
                  {matchingProjects.map((p) => (
                    <tr key={p.id}>
                      <td><input type="checkbox" name="p" value={p.id} className="h-4 w-4 accent-petrol-800" /></td>
                      <td className="font-mono text-[0.8rem] font-semibold text-petrol-700 whitespace-nowrap">{p.publicCode ?? "—"}</td>
                      <td className="font-semibold"><Link href={`/projekte/${p.id}`} className="hover:underline text-petrol-800">{p.name}</Link></td>
                      <td className="text-[0.9rem]">{p.developer.name}</td>
                      <td><Badge code={p.status} label={(t.status as any)[p.status]} /></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Progress value={p.progressPct} />
                          <span className="tabular-nums font-semibold text-sm w-10 text-right">{p.progressPct}%</span>
                        </div>
                      </td>
                      <td className="tabular-nums">{dateShort(p.expectedDelivery)}</td>
                    </tr>
                  ))}
                </ExpandableTableBody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-[#e9eff1]">
              <button className="bg-petrol-800 text-white px-5 py-2.5 rounded-sm text-sm font-semibold hover:bg-petrol-700">{t.search.compare}</button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <CardHead title={t.search.matchingUnits} />
        <div className="overflow-x-auto">
          <table className="prona w-full">
            <thead>
              <tr>
                <th>{t.project.name}</th>
                <th>{t.units.label}</th>
                <th>{t.units.typology}</th>
                <th className="text-right">{sortLink(sort === "area_asc" ? "area_desc" : "area_asc", t.units.area)}</th>
                <th className="text-right">{sortLink(sort === "price_asc" ? "price_desc" : "price_asc", t.priceRange.perSqm)}</th>
                <th className="text-right">{sortLink(sort === "progress_asc" ? "progress_desc" : "progress_asc", t.project.progress)}</th>
                <th>{sortLink(sort === "delivery_asc" ? "delivery_desc" : "delivery_asc", t.project.delivery)}</th>
                <th>{t.units.title}</th>
                {can(role, "project.escrow.totals") && <th>{t.escrow.title}</th>}
              </tr>
            </thead>
            <ExpandableTableBody total={Math.min(filtered.length, 200)} colSpan={can(role, "project.escrow.totals") ? 9 : 8} more={t.common.showMore} less={t.common.showLess}>
              {filtered.slice(0, 200).map((u) => (
                <tr key={u.id} className="relative cursor-pointer">
                  <td className="font-semibold">
                    <Link href={`/projekte/${u.project.id}`} className="hover:underline text-petrol-800 after:absolute after:inset-0">{u.project.name}</Link>
                    <span className="block text-[0.78rem] text-slate-500 font-normal">{u.project.municipality}{u.project.zone ? ` · ${u.project.zone}` : ""}</span>
                  </td>
                  <td className="font-mono">{u.label}</td>
                  <td>{u.typology}</td>
                  <td className="text-right tabular-nums">{u.areaSqm} m²</td>
                  <td className="text-right tabular-nums">{eur(Math.round(u.priceEur / u.areaSqm))}</td>
                  <td className="text-right tabular-nums">{u.project.progressPct}%</td>
                  <td className="tabular-nums">{dateShort(u.project.expectedDelivery)}</td>
                  <td><Badge code={u.status} label={(t.unitStatus as any)[u.status]} /></td>
                  {can(role, "project.escrow.totals") && (
                    <td><Badge code={u.project.escrow?.active ? "ACTIVE" : "DRAFT"} label={u.project.escrow?.active ? t.escrow.active : t.escrow.inactive} /></td>
                  )}
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={9} className="text-slate-500">{t.common.empty}</td></tr>}
            </ExpandableTableBody>
          </table>
        </div>
      </Card>
    </div>
  );
}
