function Lijngrafiek({
  titel = "Evolutie getelde aantallen per zone",
  zones,
  telmomenten,
  geselecteerdeZoneIds,
  krijgNummerplaten,
  grafiekKleuren,
}) {
  const zichtbareZones = zones.filter((zone) =>
    geselecteerdeZoneIds.includes(zone.id)
  );

  const breedte = 760;
  const hoogte = 320;
  const margeLinks = 44;
  const margeRechts = 20;
  const margeBoven = 24;
  const margeOnder = 66;

  const maxWaarde = Math.max(
    1,
    ...zichtbareZones.flatMap((zone) =>
      telmomenten.map(
        (telmoment) => krijgNummerplaten(zone, telmoment.id).length
      )
    )
  );

  function xPos(index) {
    if (telmomenten.length <= 1) return margeLinks;

    return (
      margeLinks +
      (index * (breedte - margeLinks - margeRechts)) /
        (telmomenten.length - 1)
    );
  }

  function yPos(waarde) {
    return (
      hoogte -
      margeOnder -
      (waarde / maxWaarde) * (hoogte - margeBoven - margeOnder)
    );
  }

  function formatteerDatum(datum) {
    if (!datum) return "geen datum";

    const datumObject = new Date(`${datum}T00:00:00`);
    if (Number.isNaN(datumObject.getTime())) return datum;

    const dagen = ["zo", "ma", "di", "wo", "do", "vr", "za"];
    const dagNaam = dagen[datumObject.getDay()];
    const dag = String(datumObject.getDate()).padStart(2, "0");
    const maand = String(datumObject.getMonth() + 1).padStart(2, "0");
    const jaar = String(datumObject.getFullYear()).slice(-2);

    return `${dagNaam} ${dag}/${maand}/${jaar}`;
  }

  return (
    <div className="grafiekkaart">
      <h2>{titel}</h2>

      {zichtbareZones.length === 0 ? (
        <p className="lege-lijst">Vink minstens één zone aan.</p>
      ) : (
        <svg viewBox={`0 0 ${breedte} ${hoogte}`} className="lijngrafiek">
          <line
            x1={margeLinks}
            y1={margeBoven}
            x2={margeLinks}
            y2={hoogte - margeOnder}
            className="aslijn"
          />

          <line
            x1={margeLinks}
            y1={hoogte - margeOnder}
            x2={breedte - margeRechts}
            y2={hoogte - margeOnder}
            className="aslijn"
          />

          {[...new Set([0, Math.round(maxWaarde / 2), maxWaarde])].map(
            (waarde) => (
              <g key={waarde}>
                <text x={8} y={yPos(waarde) + 4} className="aslabel">
                  {waarde}
                </text>

                <line
                  x1={margeLinks}
                  y1={yPos(waarde)}
                  x2={breedte - margeRechts}
                  y2={yPos(waarde)}
                  className="hulplijn"
                />
              </g>
            )
          )}

          {telmomenten.map((telmoment, index) => (
            <text
              key={telmoment.id}
              x={xPos(index)}
              y={hoogte - 32}
              textAnchor="middle"
              className="aslabel"
            >
              <tspan x={xPos(index)}>
                {formatteerDatum(telmoment.datum)}
              </tspan>
              <tspan x={xPos(index)} dy="16">
                {telmoment.tijdstip}
              </tspan>
            </text>
          ))}

          {zichtbareZones.map((zone, zoneIndex) => {
            const kleur = grafiekKleuren[zoneIndex % grafiekKleuren.length];

            const punten = telmomenten
              .map((telmoment, index) => {
                const waarde = krijgNummerplaten(zone, telmoment.id).length;
                return `${xPos(index)},${yPos(waarde)}`;
              })
              .join(" ");

            return (
              <g key={zone.id}>
                <polyline
                  points={punten}
                  fill="none"
                  stroke={kleur}
                  strokeWidth="3"
                />

                {telmomenten.map((telmoment, index) => {
                  const waarde = krijgNummerplaten(zone, telmoment.id).length;

                  return (
                    <circle
                      key={telmoment.id}
                      cx={xPos(index)}
                      cy={yPos(waarde)}
                      r="4"
                      fill={kleur}
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      )}

      <div className="legende">
        {zichtbareZones.map((zone, index) => (
          <span key={zone.id}>
            <span
              className="legende-kleur"
              style={{
                background: grafiekKleuren[index % grafiekKleuren.length],
              }}
            />
            {zone.naam}
          </span>
        ))}
      </div>
    </div>
  );
}

export default Lijngrafiek;
