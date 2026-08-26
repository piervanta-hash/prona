"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { id: string; href: string };

export default function NavLinks({
  links,
  homeLabel,
  labels,
}: {
  links: NavLink[];
  homeLabel: string;
  labels: Record<string, string>;
}) {
  const pathname = usePathname();

  const cls = (active: boolean) =>
    `px-3.5 py-2 text-[0.88rem] font-medium border-b-2 transition-colors whitespace-nowrap ${
      active ? "border-accent text-white font-semibold" : "border-transparent text-petrol-100 hover:text-white hover:border-petrol-500"
    }`;

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));

  return (
    <nav className="flex flex-wrap items-center gap-x-0.5">
      <Link href="/" className={cls(pathname === "/")}>{homeLabel}</Link>
      {links.map((l) => (
        <Link key={l.id} href={l.href} className={cls(isActive(l.href))}>
          {labels[l.id]}
        </Link>
      ))}
    </nav>
  );
}
