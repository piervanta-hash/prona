import "./globals.css";
import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import { getSession } from "@/lib/session";
import ResetButton from "@/components/ResetButton";

export const metadata: Metadata = {
  title: "PRONA — Agjencia Kombëtare",
  description: "Demo istituzionale PRONA",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { locale, t } = await getSession();
  return (
    <html lang={locale}>
      <body className="min-h-screen flex flex-col">
        <Header />
        <main className="mx-auto w-full max-w-[1500px] px-6 py-7 flex-1">{children}</main>
        <footer className="bg-petrol-800 text-petrol-200 text-sm">
          <div className="mx-auto max-w-[1500px] px-6 py-3 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-5">
              <span>{t.footer.demo}</span>
              <Link href="/si-funksionon" className="hover:text-white hover:underline">{t.howItWorks.title}</Link>
              <Link href="/baza-ligjore" className="hover:text-white hover:underline">{t.legal.title}</Link>
            </div>
            <div className="flex items-center gap-6">
              <ResetButton labels={t.reset as any} />
              <span>{t.footer.rate}</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
