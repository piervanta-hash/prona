import Link from "next/link";
import { getSession } from "@/lib/session";
import { listIdentities } from "@/lib/identity";
import { chooseIdentity } from "@/app/actions";
import { ROLES, type Role } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AccessScreen({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; error?: string }>;
}) {
  const { role: sessionRole, t } = await getSession();
  const { role: roleParam, error } = await searchParams;
  const role = (ROLES.includes(roleParam as Role) ? roleParam : sessionRole) as Role;

  const options = await listIdentities(role);
  const single = options.length === 1;

  return (
    <div className="min-h-[72vh] flex items-center justify-center py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <span className="inline-flex h-14 w-14 items-center justify-center border-2 border-petrol-800 text-petrol-800 font-serif font-bold text-2xl mb-3">
            P
          </span>
          <h1 className="text-[1.7rem] font-serif font-bold text-petrol-800 leading-tight">{t.app.name}</h1>
          <p className="text-slate-600 text-[0.92rem] mt-1">{t.identity.title}</p>
        </div>

        <div className="bg-white border border-[#dbe4e7] rounded-sm shadow-sm overflow-hidden">
          <div className="grid grid-cols-5 divide-x divide-[#dbe4e7]">
            {ROLES.map((r) => (
              <Link
                key={r}
                href={`/hyrje?role=${r}`}
                className={`flex items-center justify-center text-center min-h-[52px] px-1 py-2 text-[0.64rem] font-semibold uppercase tracking-wide leading-tight transition-colors ${
                  r === role ? "bg-petrol-800 text-white" : "bg-[#f2f5f6] text-petrol-700 hover:bg-petrol-50"
                }`}
              >
                {(t.roles as any)[r]}
              </Link>
            ))}
          </div>

          <form action={chooseIdentity} className="px-7 py-7 space-y-5">
            <input type="hidden" name="role" value={role} />

            {single ? (
              <>
                <input type="hidden" name="id" value={options[0].id} />
                <div>
                  <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">
                    {t.identity.accountLabel}
                  </span>
                  <div className="field bg-[#f7fafb] text-petrol-800 font-semibold">{options[0].name}</div>
                </div>
              </>
            ) : (
              <label className="block">
                <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">
                  {t.identity.accountLabel}
                </span>
                <select name="id" className="field" defaultValue={options[0].id} autoComplete="off">
                  {options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                      {o.sub ? ` — ${o.sub}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="block">
              <span className="block text-[0.72rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">
                {t.identity.password}
              </span>
              <input type="password" name="password" className="field" placeholder="••••••••" autoComplete="off" />
            </label>

            <button className="w-full bg-petrol-800 text-white py-3 rounded-sm font-semibold hover:bg-petrol-700 transition-colors">
              {t.identity.submit}
            </button>
          </form>
        </div>

        <details className="mt-4 group">
          <summary className="cursor-pointer text-center text-[0.82rem] text-slate-500 hover:text-petrol-700 list-none">
            {t.identity.enterCode}
          </summary>
          <div className="mt-3 bg-white border border-[#dbe4e7] rounded-sm px-5 py-4">
            <p className="text-[0.78rem] text-slate-500 mb-3">{t.identity.codeHint}</p>
            <form action={chooseIdentity} className="flex flex-wrap gap-2">
              <input type="hidden" name="role" value={role} />
              <input name="code" className="field font-mono flex-1 min-w-[180px]" placeholder={t.identity.codePlaceholder} />
              <button className="border border-petrol-200 px-4 rounded-sm font-semibold text-petrol-700 hover:bg-petrol-50">
                {t.identity.codeSubmit}
              </button>
            </form>
            {error && <p className="text-accent-700 font-semibold text-[0.85rem] mt-2.5">{t.identity.notFound}</p>}
          </div>
        </details>

        <p className="text-center text-[0.72rem] text-slate-400 mt-6 leading-snug">{t.identity.demoNote}</p>
      </div>
    </div>
  );
}
