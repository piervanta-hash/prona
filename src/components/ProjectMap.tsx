"use client";

import dynamic from "next/dynamic";
import { projectCoords } from "@/lib/geo";

const PronaMap = dynamic(() => import("./PronaMap"), {
  ssr: false,
  loading: () => <div className="border border-[#dbe4e7] bg-[#e7ecee] animate-pulse" style={{ width: 420, height: 420 }} />,
});

export default function ProjectMap({
  projectId,
  municipality,
  size = 420,
}: {
  projectId: string;
  municipality: string;
  size?: number;
}) {
  const { lat, lng } = projectCoords(projectId, municipality);
  return <PronaMap municipality={municipality} pins={[{ id: projectId, lat, lng }]} size={size} />;
}
