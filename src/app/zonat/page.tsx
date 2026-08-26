import Link from "next/link";
import { getSession } from "@/lib/session";
import { getZoneSummaries } from "@/lib/zones";
import { Card, CardHead, SectionTitle } from "@/components/ui";
import MultiPinMap, { type MapPin } from "@/components/MultiPinMap";
import { eur, dateShort } from "@/lib/format";
import { CITY_CENTERS } from "@/lib/geo";

export const dynamic = "force-dynamic";

export default async function ZonesOverview() {
  const { t } = await getSession();
  const zones = await getZoneSummaries();

  const byCity = new Map<string, typeof zones>();
  for (const z of zones) {
    if (!byCity.has(z.municipality)) byCity.set(z.municipality, []);
    byCity.get(z.municipality)!.push(z);
  }
  const cityOrder = Object.keys(CITY_CENTERS).filter((c) => byCity.has(c));

  return (
    <div className="space-y-6">
      <SectionTitle sub={t.zones.subtitle}>{t.zones.title}</SectionTitle>

      {cityOrder.map((city) => {
        const list = byCity.get(city)!;
        const pins: MapPin[] = list.map((z) => ({
          id: z.zone,
          lat: z.lat,
          lng: z.lng,
          count: z.projectCount,
          label: z.zone,
          href: `/zonat/${encodeURIComponent(z.zone)}`,
        }));
        return (
          <Card key={city}>
            <CardHead title={city} sub={`${list.length} ${t.zones.zonesInCity}`} />
            <div className="px-6 py-5 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
              <MultiPinMap municipality={city} pins={pins} size={380} />
              <div className="overflow-x-auto">
                <table className="prona w-full">
                  <thead>
                    <tr>
                      <th>{t.zones.zone}</th>
                      <th className="text-right">{t.zones.projects}</th>
                      <th className="text-right">{t.zones.units}</th>
                      <th className="text-right">{t.zones.available}</th>
                      <th className="text-right">{t.zones.avgPrice}</th>
                      <th className="text-right">{t.zones.avgProgress}</th>
                      <th>{t.zones.avgDelivery}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((z) => (
                      <tr key={z.zone} className="relative cursor-pointer">
                        <td className="font-semibold text-[1.02rem]">
                          <Link href={`/zonat/${encodeURIComponent(z.zone)}`} className="hover:underline text-petrol-800 after:absolute after:inset-0">
                            {z.zone}
                          </Link>
                        </td>
                        <td className="text-right tabular-nums">{z.projectCount}</td>
                        <td className="text-right tabular-nums">{z.unitsTotal}</td>
                        <td className="text-right tabular-nums font-semibold">{z.unitsAvailable}</td>
                        <td className="text-right tabular-nums">{eur(z.avgPricePerSqm)}/m²</td>
                        <td className="text-right tabular-nums">{z.avgProgress}%</td>
                        <td className="tabular-nums">{dateShort(z.avgDelivery)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
