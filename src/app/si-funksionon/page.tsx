import Link from "next/link";
import { getSession } from "@/lib/session";
import { Card, CardHead, SectionTitle } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function HowItWorks() {
  const { t } = await getSession();
  const steps = t.howItWorks.steps as { title: string; desc: string }[];
  const faq = t.howItWorks.faq as { q: string; a: string }[];

  return (
    <div className="space-y-6 max-w-4xl">
      <SectionTitle sub={t.howItWorks.subtitle}>{t.howItWorks.title}</SectionTitle>

      <Card>
        <div className="px-6 py-6 space-y-5">
          {steps.map((s, i) => (
            <div key={s.title} className="flex gap-4">
              <div className="shrink-0 w-9 h-9 rounded-full bg-petrol-800 text-white flex items-center justify-center font-serif font-bold">
                {i + 1}
              </div>
              <div>
                <div className="font-serif font-bold text-petrol-800 text-[1.05rem]">{s.title}</div>
                <p className="text-[0.92rem] text-slate-600 mt-1 leading-snug">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHead title={t.howItWorks.faqTitle} />
        <div className="px-6 py-5 space-y-5">
          {faq.map((f) => (
            <div key={f.q}>
              <div className="font-semibold text-petrol-800">{f.q}</div>
              <p className="text-[0.92rem] text-slate-600 mt-1 leading-snug">{f.a}</p>
            </div>
          ))}
        </div>
      </Card>

      <p className="text-[0.85rem] text-slate-500">
        {t.howItWorks.moreInfo}{" "}
        <Link href="/sherbime" className="text-petrol-700 hover:underline font-semibold">{t.services.title}</Link>
        {" · "}
        <Link href="/kush-sheh-cfare" className="text-petrol-700 hover:underline font-semibold">{t.matrix.title}</Link>
      </p>
    </div>
  );
}
