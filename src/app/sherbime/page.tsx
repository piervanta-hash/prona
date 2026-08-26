import Link from "next/link";
import { getSession } from "@/lib/session";
import { Card, CardHead, SectionTitle } from "@/components/ui";
import { CATEGORY_ORDER, SERVICES } from "@/lib/services";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
  const { t } = await getSession();

  return (
    <div className="space-y-6">
      <SectionTitle sub={t.services.subtitle}>{t.services.title}</SectionTitle>

      {CATEGORY_ORDER.map((cat) => {
        const items = SERVICES.filter((s) => s.category === cat);
        return (
          <Card key={cat}>
            <CardHead title={(t.services.categories as any)[cat]} />
            <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {items.map((svc) => {
                const info = (t.services.items as any)[svc.id];
                return (
                  <Link
                    key={svc.id}
                    href={svc.href}
                    className="block border border-[#dbe4e7] hover:border-petrol-700 px-5 py-4"
                  >
                    <div className="font-serif font-bold text-petrol-800 text-[1.02rem]">{info.title}</div>
                    <p className="text-[0.88rem] text-slate-600 mt-1.5 leading-snug">{info.desc}</p>
                    <div className="mt-3 text-[0.74rem] font-semibold uppercase tracking-[0.08em] text-slate-500">
                      {svc.roles === "PUBLIC" ? t.services.publicAccess : `${t.services.roleRequired} ${(t.roles as any)[svc.roles[0]]}`}
                    </div>
                  </Link>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
