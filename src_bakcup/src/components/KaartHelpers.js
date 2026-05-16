import L from "leaflet";

export function berekenCentrum(polygoon) {
  const totaal = polygoon.reduce(
    (som, punt) => ({
      lat: som.lat + punt[0],
      lng: som.lng + punt[1],
    }),
    { lat: 0, lng: 0 }
  );

  return [totaal.lat / polygoon.length, totaal.lng / polygoon.length];
}

export function maakMiniTaartIcon(zone, telmomenten, krijgNummerplaten, grafiekKleuren) {
  const aantallen = telmomenten.map((telmoment) =>
    krijgNummerplaten(zone, telmoment.id).length
  );

  const totaal = aantallen.reduce((som, aantal) => som + aantal, 0);

  if (totaal === 0) {
    return L.divIcon({
      className: "mini-taart-marker",
      html: `<div class="mini-taart leeg">0</div>`,
      iconSize: [46, 46],
      iconAnchor: [23, 23],
    });
  }

  let start = 0;

  const segmenten = aantallen.map((aantal, index) => {
    const aandeel = (aantal / totaal) * 100;
    const einde = start + aandeel;
    const segment = `${
      grafiekKleuren[index % grafiekKleuren.length]
    } ${start}% ${einde}%`;
    start = einde;
    return segment;
  });

  return L.divIcon({
    className: "mini-taart-marker",
    html: `<div class="mini-taart" style="background: conic-gradient(${segmenten.join(
      ", "
    )})"><span>${totaal}</span></div>`,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
  });
}