export const grafiekKleuren = [
  "#2563eb",
  "#a21caf",
  "#0891b2",
  "#7c2d12",
  "#4338ca",
  "#0f766e",
  "#6b7280",
  "#be185d",
  "#1d4ed8",
  "#854d0e",
];

export function bepaalKleurNaam(bezettingsgraad, kleurGrenzen) {
  if (bezettingsgraad < kleurGrenzen.lichtgrijsTot) {
    return "lichtgrijs";
  }

  if (bezettingsgraad < kleurGrenzen.groenTot) {
    return "groen";
  }

  if (bezettingsgraad < kleurGrenzen.oranjeTot) {
    return "oranje";
  }

  return "rood";
}

export function bepaalKaartKleur(bezettingsgraad, kleurGrenzen) {
  const kleur = bepaalKleurNaam(bezettingsgraad, kleurGrenzen);

  if (kleur === "lichtgrijs") return "#9ca3af";
  if (kleur === "groen") return "#22c55e";
  if (kleur === "oranje") return "#f97316";

  return "#ef4444";
}