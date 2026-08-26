import { getSession } from "@/lib/session";
import { Card, CardHead, Note, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function LegalBasis() {
  const { t } = await getSession();
  const articles = t.legal.articles as { title: string; desc: string }[];

  return (
    <div className="space-y-6 max-w-4xl">
      <SectionTitle sub={t.legal.subtitle}>{t.legal.title}</SectionTitle>

      <Note tone="info">{t.legal.demoNote}</Note>

      <Card>
        <CardHead title={t.legal.lawTitle} sub={t.legal.lawRef} />
        <div className="px-6 py-5 space-y-5">
          {articles.map((a) => (
            <div key={a.title}>
              <div className="font-semibold text-petrol-800">{a.title}</div>
              <p className="text-[0.92rem] text-slate-600 mt-1 leading-snug">{a.desc}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
