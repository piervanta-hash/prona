import { getSession } from "@/lib/session";
import { can, SCOPES } from "@/lib/access";
import { Card, CardHead, SectionTitle } from "@/components/ui";
import { ROLES } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function VisibilityMatrix() {
  const { t } = await getSession();

  return (
    <div className="space-y-6">
      <SectionTitle sub={t.matrix.subtitle}>{t.matrix.title}</SectionTitle>

      <Card>
        <CardHead title={t.matrix.title} />
        <div className="overflow-x-auto">
          <table className="prona w-full">
            <thead>
              <tr>
                <th className="w-72">{t.matrix.data}</th>
                {ROLES.map((r) => (
                  <th key={r} className="text-center">{(t.roles as any)[r]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SCOPES.map((scope) => (
                <tr key={scope}>
                  <td className="font-semibold">{(t.matrix.scopes as any)[scope]}</td>
                  {ROLES.map((r) => {
                    const visible = can(r, scope);
                    return (
                      <td key={r} className="text-center">
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-sm font-bold ${
                          visible ? "bg-[#EDF4EE] text-[#2C5F3A]" : "bg-[#FAEDEF] text-accent-700"
                        }`}>
                          {visible ? "✓" : "✕"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
