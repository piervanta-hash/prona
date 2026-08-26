import Link from "next/link";
import { getSession } from "@/lib/session";
import { LangSwitcher } from "./Switchers";
import NavLinks from "./NavLinks";
import AccountMenu from "./AccountMenu";
import { listIdentities } from "@/lib/identity";
import type { Role } from "@/lib/constants";

// `ready` viene attivato fase per fase: la barra non mostra mai un link che porta a una pagina vuota.
const LINKS: { id: string; href: string; roles: Role[]; ready: boolean }[] = [
  { id: "services", href: "/sherbime", roles: ["CITIZEN", "DEVELOPER", "CERTIFIER", "BANK", "AGENCY"], ready: true },
  { id: "projects", href: "/projekte", roles: ["CITIZEN", "DEVELOPER", "CERTIFIER", "BANK", "AGENCY"], ready: true },
  { id: "search", href: "/kerko", roles: ["CITIZEN", "DEVELOPER", "CERTIFIER", "BANK", "AGENCY"], ready: true },
  { id: "zones", href: "/zonat", roles: ["CITIZEN", "DEVELOPER", "CERTIFIER", "BANK", "AGENCY"], ready: true },
  { id: "developer", href: "/zhvillues", roles: ["DEVELOPER"], ready: true },
  { id: "certifier", href: "/certifikues", roles: ["CERTIFIER"], ready: true },
  { id: "bank", href: "/banka", roles: ["BANK"], ready: true },
  { id: "agency", href: "/agjencia", roles: ["AGENCY"], ready: true },
  { id: "citizen", href: "/qytetari", roles: ["CITIZEN"], ready: true },
  { id: "audit", href: "/regjistri", roles: ["AGENCY"], ready: true },
];

export default async function Header() {
  const { role, locale, t, identity } = await getSession();
  const links = LINKS.filter((l) => l.ready && l.roles.includes(role));
  const identityOptions = await listIdentities(role);

  return (
    <header>
      {/* fascia di Stato */}
      <div className="bg-petrol-900 text-petrol-200">
        <div className="mx-auto max-w-[1500px] px-6 h-9 flex flex-wrap items-center justify-between gap-x-6">
          <div className="flex items-center gap-5">
            <span className="text-[0.7rem] uppercase tracking-[0.18em]">{t.app.state}</span>
            <Link href="/kush-sheh-cfare" className="text-[0.72rem] text-petrol-200 hover:text-white underline underline-offset-2">
              {t.matrix.title}
            </Link>
          </div>
          <LangSwitcher locale={locale} labels={t.lang as any} />
        </div>
      </div>

      {/* intestazione + navigazione, un'unica fascia istituzionale */}
      <div className="bg-petrol-800 border-b-2 border-accent">
        <div className="mx-auto max-w-[1500px] px-6 flex flex-wrap items-center gap-x-6 gap-y-1.5 py-2">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <span className="inline-flex h-9 w-9 items-center justify-center border-2 border-white text-white font-serif font-bold text-lg shrink-0">
              P
            </span>
            <span className="hidden md:block leading-tight">
              <span className="block text-[1.05rem] font-serif font-bold text-white">{t.app.name}</span>
            </span>
          </Link>

          <NavLinks links={links} homeLabel={t.nav.home} labels={t.nav as any} />

          <div className="ml-auto">
            <AccountMenu
              roleLabel={(t.roles as any)[role]}
              roleDesc={(t.roles as any)[role + "_desc"]}
              identity={identity}
              options={identityOptions}
              switchRoleLabel={t.identity.switchLink}
              accountLabel={t.identity.accountLabel}
            />
          </div>
        </div>
      </div>
    </header>
  );
}
