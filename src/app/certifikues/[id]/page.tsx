import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { checklistFor, CITY_COORDS } from "@/lib/checklist";
import { Note } from "@/components/ui";
import FieldApp from "@/components/FieldApp";

export const dynamic = "force-dynamic";

export default async function FieldInspection({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { role, t, identity } = await getSession();
  if (role !== "CERTIFIER") return <Note tone="warn">{t.common.noAccess}</Note>;

  const ms = await db.milestone.findUnique({
    where: { id },
    include: { project: { include: { developer: true } }, certifier: true },
  });
  if (!ms) notFound();
  if (ms.certifierId !== identity.id) return <Note tone="warn">{t.common.noAccess}</Note>;

  const coords = CITY_COORDS[ms.project.municipality] ?? CITY_COORDS["Tiranë"];

  return (
    <div className="max-w-5xl">
      <Link href="/certifikues" className="text-[0.9rem] text-slate-500 hover:text-petrol-700">
        ← {t.field.assigned}
      </Link>
      <FieldApp
        milestoneId={ms.id}
        projectName={ms.project.name}
        developer={ms.project.developer.name}
        publicCode={ms.project.publicCode ?? ms.project.permitNo}
        stage={ms.type}
        stageLabel={(t.milestone as any)[ms.type]}
        cumulativePct={ms.cumulativePct}
        certifierName={ms.certifier?.name ?? ""}
        registryNo={ms.certifier?.registryNo ?? ""}
        items={checklistFor(ms.type).map((c) => c.label)}
        lat={coords[0]}
        lng={coords[1]}
        alreadyDone={ms.status === "CERTIFIED" || ms.status === "REJECTED"}
        labels={t.field as any}
        photoLabels={t.photos as any}
        formLabels={t.form as any}
      />
    </div>
  );
}
