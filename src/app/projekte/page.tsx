import { db } from "@/lib/db";
import ProjectTable from "@/components/ProjectTable";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await db.project.findMany({
    include: { developer: true, escrow: { include: { bank: true } } },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
  return <ProjectTable projects={projects as any} />;
}
