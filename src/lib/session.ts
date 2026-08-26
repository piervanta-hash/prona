import { cookies } from "next/headers";
import { LOCALES, ROLES, type Locale, type Role } from "./constants";
import { getDict, type Dict } from "@/i18n";
import { resolveIdentity, type Identity } from "./identity";

export async function getSession(): Promise<{ role: Role; locale: Locale; t: Dict; identity: Identity }> {
  const c = await cookies();
  const role = (c.get("prona_role")?.value ?? "AGENCY") as Role;
  const locale = (c.get("prona_locale")?.value ?? "sq") as Locale;
  const safeRole = ROLES.includes(role) ? role : "AGENCY";
  const safeLocale = LOCALES.includes(locale) ? locale : "sq";
  const identityId = c.get("prona_identity")?.value || null;
  const identity = await resolveIdentity(safeRole, identityId);
  return { role: safeRole, locale: safeLocale, t: getDict(safeLocale), identity };
}
