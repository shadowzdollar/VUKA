/** Static facts about the launch markets that the engine's public config does not carry. */

/** International dialling codes (no "+"). */
export const DIAL: Record<string, string> = {
  RW: "250",
  KE: "254",
  UG: "256",
  TZ: "255",
  GH: "233",
  NG: "234",
  SN: "221",
  ET: "251",
  ZM: "260",
  ZA: "27",
};

/** The engine's fee-tier groups (`region` in the public config). */
export const REGION_NAMES: Record<string, string> = {
  EAC: "East African Community",
  ECOWAS: "Economic Community of West African States",
  SADC: "Southern African Development Community",
  HORN: "Horn of Africa",
};

/** Corridor fee in basis points between two markets, mirroring the engine's rule (same group 0.80%, else 1.20%). */
export const corridorFeeBps = (regionA: string, regionB: string) =>
  regionA === regionB ? 80 : 120;

/** Each launch market's central bank, for factual context only — VUKA is not licensed, endorsed or
 * affiliated with any of these institutions. Named by their public, official titles. */
export const CENTRAL_BANKS: Record<string, string> = {
  RW: "National Bank of Rwanda",
  KE: "Central Bank of Kenya",
  UG: "Bank of Uganda",
  TZ: "Bank of Tanzania",
  GH: "Bank of Ghana",
  NG: "Central Bank of Nigeria",
  SN: "Central Bank of West African States",
  ET: "National Bank of Ethiopia",
  ZM: "Bank of Zambia",
  ZA: "South African Reserve Bank",
};
