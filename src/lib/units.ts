export type Units = "kg" | "lb";

const LB_PER_KG = 2.20462;

export function toDisplay(kg: number | null | undefined, units: Units) {
  if (kg == null) return null;
  const v = units === "lb" ? kg * LB_PER_KG : kg;
  return Math.round(v * 10) / 10;
}

export function fromDisplay(value: number, units: Units) {
  return units === "lb" ? value / LB_PER_KG : value;
}
