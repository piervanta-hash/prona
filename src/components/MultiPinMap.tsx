"use client";

import dynamic from "next/dynamic";
import type { MapPin } from "./PronaMap";

export type { MapPin };

const PronaMap = dynamic(() => import("./PronaMap"), {
  ssr: false,
  loading: () => <div className="border border-[#dbe4e7] bg-[#e7ecee] animate-pulse" style={{ width: 480, height: 480 }} />,
});

export default function MultiPinMap({
  municipality,
  pins,
  size = 480,
}: {
  municipality: string;
  pins: MapPin[];
  size?: number;
}) {
  return <PronaMap municipality={municipality} pins={pins} size={size} />;
}
