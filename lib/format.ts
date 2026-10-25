const eur = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const num = new Intl.NumberFormat("de-DE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function euro(v: number): string {
  return eur.format(Number.isFinite(v) ? v : 0);
}

export function zahl(v: number, suffix = ""): string {
  return num.format(Number.isFinite(v) ? v : 0) + suffix;
}

export function datum(iso?: string | null): string {
  if (!iso) return "–";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export const SCHLUESSEL_LABEL: Record<string, string> = {
  WOHNFLAECHE: "nach Wohnfläche (m²)",
  EINHEIT: "nach Wohneinheit",
  PERSONEN: "nach Personen",
  VERBRAUCH: "nach Verbrauch",
};

export const ZAEHLERART_LABEL: Record<string, string> = {
  HEIZUNG: "Heizung",
  WARMWASSER: "Warmwasser",
  KALTWASSER: "Kaltwasser",
  STROM: "Strom",
  GAS: "Gas",
};

export const ZAEHLERARTEN = ["HEIZUNG", "WARMWASSER", "KALTWASSER", "STROM", "GAS"];
