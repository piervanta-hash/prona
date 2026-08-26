import sq, { type Dict } from "./sq";
import en from "./en";
import it from "./it";
import type { Locale } from "@/lib/constants";

export const dictionaries: Record<Locale, Dict> = { sq, en, it };

export function getDict(locale: Locale): Dict {
  return dictionaries[locale] ?? sq;
}

export type { Dict };
