import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

function csvCell(v: string | number) {
  const s = String(v);
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Regjistri publik, i eksportueshem: vetem projektet e regjistruara, vetem te dhena tashme publike.
export async function GET() {
  const { t } = await getSession();
  const projects = await db.project.findMany({
    where: { publicCode: { not: null } },
    include: { developer: true },
    orderBy: [{ municipality: "asc" }, { name: "asc" }],
  });

  const header = [
    t.project.code, t.project.name, t.project.municipality, "Zona",
    t.project.developer, t.project.units, t.project.status,
    t.project.progress, t.project.delivery, t.project.registeredAt,
  ];
  const rows = projects.map((p) => [
    p.publicCode ?? "", p.name, p.municipality, p.zone ?? "",
    p.developer.name, p.unitsCount, (t.status as any)[p.status] ?? p.status,
    `${p.progressPct}%`, p.expectedDelivery.toISOString().slice(0, 10), p.registeredAt?.toISOString().slice(0, 10) ?? "",
  ]);

  const csv = [header, ...rows].map((r) => r.map(csvCell).join(";")).join("\n");
  return new Response("﻿" + csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="prona-regjistri-projekteve.csv"`,
      "cache-control": "no-store",
    },
  });
}
