import { db } from "@/lib/db";
import { documentSvg } from "@/lib/docimage";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await db.attachment.findUnique({ where: { id }, include: { project: true } });
  if (!a) return new Response("not found", { status: 404 });

  // file caricato durante la demo: restituito cosi' com'e'
  if (a.data) {
    return new Response(Buffer.from(a.data), {
      headers: {
        "content-type": a.mime || "application/octet-stream",
        "content-disposition": `inline; filename="${encodeURIComponent(a.filename)}"`,
      },
    });
  }

  // documento del seed: anteprima generata al volo
  const svg = documentSvg({
    title: a.title,
    kind: a.kind,
    project: a.project?.name ?? "—",
    code: a.project?.publicCode ?? a.project?.permitNo ?? "—",
    issuer: a.uploadedByName,
    date: a.createdAt.toLocaleDateString("it-IT"),
    seed: a.hash,
  });
  return new Response(svg, { headers: { "content-type": "image/svg+xml; charset=utf-8" } });
}
