import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";

// ISO 3166-1 numeric ids in the atlas for the ten launch markets.
export const ATLAS_ID: Record<string, string> = {
  RW: "646",
  KE: "404",
  UG: "800",
  TZ: "834",
  GH: "288",
  NG: "566",
  SN: "686",
  ET: "231",
  ZM: "894",
  ZA: "710",
};

export const AFRICA = new Set(
  "012 024 204 072 854 108 120 140 148 178 180 384 262 818 226 232 748 231 266 270 288 324 624 404 426 430 434 450 454 466 478 504 508 516 562 566 646 686 694 706 710 728 729 834 768 788 800 894 716 732 -99".split(
    " ",
  ),
);

export type Feat = { id?: string | number; geometry: unknown; type: string };

const topology = world as unknown as Topology;
export const countries = (
  feature(topology, topology.objects["countries"] as GeometryCollection) as unknown as {
    features: Feat[];
  }
).features;
export const byId = new Map(countries.map((f) => [String(f.id), f]));
