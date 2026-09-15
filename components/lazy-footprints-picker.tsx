"use client";

import dynamic from "next/dynamic";
import type { FootprintItem } from "./footprints-picker";

const FootprintsPicker = dynamic(
  () => import("./footprints-picker").then((module) => module.FootprintsPicker),
  { ssr: false, loading: () => <div className="map-loading-skeleton" aria-label="地图加载中">地图加载中…</div> },
);

export function LazyFootprintsPicker(props: { initialItems: FootprintItem[]; preview?: boolean }) {
  return <FootprintsPicker {...props} />;
}
