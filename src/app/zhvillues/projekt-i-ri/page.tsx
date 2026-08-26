import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Note, SectionTitle } from "@/components/ui";
import NewProjectForm from "@/components/NewProjectForm";

export const dynamic = "force-dynamic";

export default async function NewProject() {
  const { role, t } = await getSession();
  if (role !== "DEVELOPER") return <Note tone="warn">{t.common.noAccess}</Note>;
  const banks = await db.bank.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="max-w-4xl">
      <SectionTitle sub={t.dev.subtitle}>{t.dev.newProjectTitle}</SectionTitle>
      <NewProjectForm banks={banks.map((b) => ({ id: b.id, name: b.name }))} labels={t.dev as any} formLabels={t.form as any} attachLabels={t.attach as any} />
    </div>
  );
}
