import type { Role } from "./constants";

export type ServiceCategory = "REGISTRY" | "DEVELOPER" | "BUYER" | "TECHNICAL" | "FINANCE" | "OVERSIGHT";

export type ServiceItem = {
  id: string;
  category: ServiceCategory;
  href: string;
  roles: Role[] | "PUBLIC";
};

export const CATEGORY_ORDER: ServiceCategory[] = ["REGISTRY", "DEVELOPER", "BUYER", "TECHNICAL", "FINANCE", "OVERSIGHT"];

export const SERVICES: ServiceItem[] = [
  { id: "searchProperties", category: "REGISTRY", href: "/kerko", roles: "PUBLIC" },
  { id: "projectRegistry", category: "REGISTRY", href: "/projekte", roles: "PUBLIC" },
  { id: "zones", category: "REGISTRY", href: "/zonat", roles: "PUBLIC" },
  { id: "compare", category: "REGISTRY", href: "/krahaso", roles: "PUBLIC" },
  { id: "newProject", category: "DEVELOPER", href: "/zhvillues/projekt-i-ri", roles: ["DEVELOPER"] },
  { id: "developerDashboard", category: "DEVELOPER", href: "/zhvillues", roles: ["DEVELOPER"] },
  { id: "citizenDossiers", category: "BUYER", href: "/qytetari", roles: ["CITIZEN"] },
  { id: "certifierAssignments", category: "TECHNICAL", href: "/certifikues", roles: ["CERTIFIER"] },
  { id: "bankAccounts", category: "FINANCE", href: "/banka", roles: ["BANK"] },
  { id: "agencyOversight", category: "OVERSIGHT", href: "/agjencia", roles: ["AGENCY"] },
  { id: "auditLog", category: "OVERSIGHT", href: "/regjistri", roles: ["AGENCY"] },
  { id: "transparencyMatrix", category: "OVERSIGHT", href: "/kush-sheh-cfare", roles: "PUBLIC" },
];
