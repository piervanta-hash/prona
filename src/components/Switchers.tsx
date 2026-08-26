"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LOCALES, type Locale } from "@/lib/constants";

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

export function LangSwitcher({ locale, labels }: { locale: Locale; labels: Record<string, string> }) {
  const router = useRouter();
  const [, start] = useTransition();
  return (
    <div className="flex items-center gap-1.5">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => {
            setCookie("prona_locale", l);
            start(() => router.refresh());
          }}
          className={`px-2 py-0.5 text-[0.72rem] font-semibold uppercase tracking-wider rounded-sm ${
            l === locale ? "text-white bg-petrol-700" : "text-petrol-200 hover:text-white"
          }`}
          title={labels[l]}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
