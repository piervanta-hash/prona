import Link from "next/link";
import { getSession } from "@/lib/session";

export default async function NotFound() {
  const { t } = await getSession();
  return (
    <div className="bg-white border border-petrol-200 rounded-sm px-8 py-10 max-w-2xl">
      <div className="text-5xl font-bold text-petrol-800">404</div>
      <p className="mt-3 text-lg text-petrol-700">{t.common.empty}</p>
      <Link href="/" className="inline-block mt-5 bg-petrol-800 text-white px-5 py-2.5 rounded-sm font-semibold">
        {t.nav.home}
      </Link>
    </div>
  );
}
