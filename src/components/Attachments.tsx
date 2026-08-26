import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { can } from "@/lib/access";
import { Card, CardHead, Restricted } from "./ui";
import { dateShort } from "@/lib/format";
import UploadForm from "./UploadForm";
import { ExpandableTableBody } from "./Expandable";

export default async function Attachments({
  projectId,
  milestoneId,
  title,
}: {
  projectId?: string;
  milestoneId?: string;
  title?: string;
}) {
  const { role, t } = await getSession();

  if (!can(role, "attachments.technical")) {
    return (
      <Card>
        <CardHead title={title ?? t.attach.title} />
        <div className="px-6 py-5">
          <Restricted title={t.denied.title} reason={(t.denied.attachments as any)[role]} compact />
        </div>
      </Card>
    );
  }

  const rows = await db.attachment.findMany({
    where: milestoneId ? { milestoneId } : { projectId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <Card>
      <CardHead
        title={title ?? t.attach.title}
        right={can(role, "attachments.upload") ? <UploadForm projectId={projectId} milestoneId={milestoneId} labels={t.attach as any} formLabels={t.form as any} /> : undefined}
      />
      <div className="overflow-x-auto">
        <table className="prona w-full">
          <thead>
            <tr>
              <th>{t.attach.docTitle}</th>
              <th>{t.attach.kind}</th>
              <th>{t.attach.file}</th>
              <th className="text-right">{t.attach.size}</th>
              <th>{t.attach.by}</th>
              <th>{t.common.date}</th>
              <th>{t.attach.hash}</th>
              <th></th>
            </tr>
          </thead>
          <ExpandableTableBody total={rows.length} colSpan={8} more={t.common.showMore} less={t.common.showLess}>
            {rows.map((a) => (
              <tr key={a.id}>
                <td className="font-semibold">{a.title}</td>
                <td>{(t.attach as any)[a.kind] ?? a.kind}</td>
                <td className="text-[0.88rem] text-slate-600">{a.filename}</td>
                <td className="text-right tabular-nums">{a.sizeKb} KB</td>
                <td className="text-[0.88rem]">{a.uploadedByName}</td>
                <td className="tabular-nums">{dateShort(a.createdAt)}</td>
                <td className="font-mono text-[0.78rem] text-slate-500">{a.hash}</td>
                <td>
                  <a href={`/api/dokument/${a.id}`} target="_blank" rel="noreferrer" className="text-petrol-700 font-semibold hover:underline">
                    {t.attach.open}
                  </a>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={8} className="text-slate-500">{t.attach.none}</td></tr>
            )}
          </ExpandableTableBody>
        </table>
      </div>
    </Card>
  );
}
