"use client";

import dynamic from "next/dynamic";
import type { PropertyMap3DProps } from "../PropertyMap3D";

const PropertyMap3D = dynamic(() => import("../PropertyMap3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[350px] w-full items-center justify-center border border-[#222] bg-[#0a0a0a] md:h-[500px]">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-vacayza-muted">Loading map...</p>
    </div>
  ),
});

export default function PropertyMapSection(props: PropertyMap3DProps) {
  return <PropertyMap3D {...props} />;
}
