"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type IdentityOption = { id: string; name: string; sub?: string };

function setCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; SameSite=Lax`;
}

/**
 * Chip dell'account nell'intestazione: nome e ruolo correnti, non piu' una
 * fila di pulsanti sempre visibile. Un clic apre un pannello con il cambio
 * rapido di soggetto (utile in demo) e il link alla schermata di accesso.
 */
export default function AccountMenu({
  roleLabel,
  roleDesc,
  identity,
  options,
  switchRoleLabel,
  accountLabel,
}: {
  roleLabel: string;
  roleDesc: string;
  identity: IdentityOption;
  options: IdentityOption[];
  switchRoleLabel: string;
  accountLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const initial = identity.name.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-sm hover:bg-petrol-700 transition-colors"
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white text-[0.85rem] font-bold shrink-0">
          {initial}
        </span>
        <span className="text-left hidden sm:block leading-tight">
          <span className="block text-[0.85rem] font-semibold text-white">{identity.name}</span>
          <span className="block text-[0.7rem] text-petrol-200">{roleLabel}</span>
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" className={`text-petrol-200 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M1 3l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white text-petrol-900 border border-[#dbe4e7] rounded-sm shadow-lg z-50 py-2">
          <div className="px-4 py-2.5 border-b border-[#eef2f4]">
            <div className="text-[0.66rem] uppercase tracking-[0.1em] text-slate-500 font-semibold">{roleDesc}</div>
            <div className="font-semibold text-[0.98rem] text-petrol-800 mt-0.5">{identity.name}</div>
            {identity.sub && <div className="text-[0.8rem] text-slate-500 font-mono mt-0.5">{identity.sub}</div>}
          </div>

          {options.length > 1 && (
            <div className="px-4 py-3 border-b border-[#eef2f4]">
              <label className="block">
                <span className="block text-[0.66rem] uppercase tracking-[0.1em] text-slate-500 font-semibold mb-1.5">{accountLabel}</span>
                <select
                  className={`field ${pending ? "opacity-70" : ""}`}
                  value={identity.id}
                  autoComplete="off"
                  onChange={(e) => {
                    setCookie("prona_identity", e.target.value);
                    start(() => router.refresh());
                  }}
                >
                  {options.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                      {o.sub ? ` — ${o.sub}` : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          <Link
            href="/hyrje"
            onClick={() => setOpen(false)}
            className="block px-4 py-2.5 text-[0.9rem] font-semibold text-petrol-700 hover:bg-petrol-50"
          >
            {switchRoleLabel}
          </Link>
        </div>
      )}
    </div>
  );
}
