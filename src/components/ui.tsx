import Link from "next/link";
import { eur, lek } from "@/lib/format";

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white border border-[#dbe4e7] rounded-sm ${className}`}>{children}</div>;
}

export function CardHead({ title, sub, right }: { title: string; sub?: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-[#e9eff1]">
      <div>
        <h2 className="text-[1.15rem] font-serif font-bold text-petrol-800">{title}</h2>
        {sub && <p className="text-[0.92rem] text-slate-600 mt-1 max-w-3xl leading-snug">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

const OK = "bg-[#EDF4EE] text-[#2C5F3A] border-[#CADDCE]";
const WARN = "bg-[#FBF3E7] text-[#7C5312] border-[#E6D5B8]";
const INFO = "bg-[#EDF2F6] text-[#2F4A66] border-[#D0DCE7]";
const NEUTRAL = "bg-[#F2F5F6] text-[#4F6C76] border-[#DDE5E8]";
const BAD = "bg-[#FAEDEF] text-[#8E1226] border-[#E5CBD1]";

const STATUS_STYLE: Record<string, string> = {
  DRAFT: NEUTRAL,
  REGISTERED: INFO,
  SELLING: INFO,
  BUILDING: OK,
  STALLED: WARN,
  DELIVERED: INFO,
  REJECTED: BAD,
  FROZEN: BAD,
  FREE: OK,
  RESERVED: WARN,
  SOLD: INFO,
  CERTIFIED: OK,
  PENDING: NEUTRAL,
  READY: WARN,
  UNDER_REVIEW: WARN,
  REVOKED: BAD,
  ACTIVE: OK,
  SUSPENDED: BAD,
  EXECUTED: OK,
  AGENCY_APPROVED: INFO,
  REQUESTED: WARN,
  BLOCKED: BAD,
  PASS: OK,
  FAIL: BAD,
  DEVIATION: BAD,
};

export function Badge({ code, label }: { code: string; label: string }) {
  const cls = STATUS_STYLE[code] ?? NEUTRAL;
  return (
    <span className={`inline-block border px-2.5 py-[0.2rem] rounded-sm text-[0.8rem] font-semibold whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
}

export function Progress({ value, big = false }: { value: number; big?: boolean }) {
  return (
    <div className={`w-full bg-[#e4ebee] rounded-sm overflow-hidden ${big ? "h-5" : "h-2.5"}`}>
      <div
        className="progress-fill h-full bg-petrol-700"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function Money({ value, sub = true }: { value: number; sub?: boolean }) {
  return (
    <span className="whitespace-nowrap">
      <span className="font-semibold tabular-nums">{eur(value)}</span>
      {sub && <span className="block text-xs text-petrol-600 tabular-nums">{lek(value)}</span>}
    </span>
  );
}

export function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-[#dbe4e7] rounded-sm px-6 py-5">
      <div className="text-[0.7rem] uppercase tracking-[0.1em] text-slate-500 font-semibold">{label}</div>
      <div className="text-[2.1rem] font-serif font-bold text-petrol-800 mt-1.5 tabular-nums leading-none">{value}</div>
      {sub && <div className="text-[0.85rem] text-slate-500 tabular-nums mt-1.5">{sub}</div>}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[0.7rem] uppercase tracking-[0.1em] text-slate-500 font-semibold">{label}</div>
      <div className="text-[1.05rem] text-petrol-900 mt-1">{children}</div>
    </div>
  );
}

export function LinkButton({ href, children, variant = "primary" }: { href: string; children: React.ReactNode; variant?: "primary" | "ghost" }) {
  const cls =
    variant === "primary"
      ? "bg-petrol-800 text-white hover:bg-petrol-700"
      : "bg-white text-petrol-800 border border-petrol-200 hover:bg-petrol-50";
  return (
    <Link href={href} className={`inline-block px-4 py-2 rounded-sm font-semibold text-sm ${cls}`}>
      {children}
    </Link>
  );
}

/** Mostra al posto del dato la ragione per cui quel ruolo non lo vede. */
export function Restricted({ title, reason, compact = false }: { title: string; reason: string; compact?: boolean }) {
  return (
    <div className={`border border-dashed border-[#c9d7dc] bg-[#f7fafb] rounded-sm ${compact ? "px-4 py-3" : "px-5 py-4"}`}>
      <div className="text-[0.7rem] uppercase tracking-[0.1em] text-slate-500 font-semibold">{title}</div>
      <p className="text-[0.95rem] text-slate-600 mt-1 leading-snug max-w-2xl">{reason}</p>
    </div>
  );
}

export function Note({ children, tone = "info" }: { children: React.ReactNode; tone?: "info" | "warn" | "bad" | "ok" }) {
  const map = {
    info: "border-petrol-700 bg-[#eef3f5]",
    ok: "border-[#2C5F3A] bg-[#EDF4EE]",
    warn: "border-[#B07D22] bg-[#FBF3E7]",
    bad: "border-accent bg-[#FAEDEF]",
  } as const;
  return <div className={`border-l-4 ${map[tone]} px-5 py-4 rounded-sm`}>{children}</div>;
}

export function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-4">
      <h1 className="text-[1.85rem] font-serif font-bold text-petrol-800 leading-tight">{children}</h1>
      {sub && <p className="text-[1rem] text-slate-600 mt-1.5 max-w-4xl">{sub}</p>}
    </div>
  );
}
