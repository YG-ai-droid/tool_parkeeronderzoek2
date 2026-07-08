import { formatBelgischeDatum } from "../utils/datum";

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
  const hoogte = 560;
  const margeLinks = 44;
  const margeRechts = 20;
  const margeBoven = 24;
  const margeOnder = 300;

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
              y={hoogte - margeOnder + 10}
              textAnchor="start"
              className="aslabel"
              transform={`rotate(90 ${xPos(index)} ${hoogte - margeOnder + 10})`}
            >
              {formatBelgischeDatum(telmoment.datum)} {telmoment.tijdstip}
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
                  const x = xPos(index);
                  const y = yPos(waarde);
                  const tooltipBreedte = 154;
                  const tooltipHoogte = 46;
                  const tooltipX = Math.min(
                    Math.max(x - tooltipBreedte / 2, margeLinks),
                    breedte - margeRechts - tooltipBreedte
                  );
                  const tooltipY = Math.max(y - tooltipHoogte - 12, margeBoven);

                  return (
                    <g
                      className="lijngrafiek-puntgroep"
                      key={telmoment.id}
                      tabIndex={0}
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r="4"
                        fill={kleur}
                        className="lijngrafiek-punt"
                      />
                      <g className="lijngrafiek-tooltip">
                        <rect
                          x={tooltipX}
                          y={tooltipY}
                          width={tooltipBreedte}
                          height={tooltipHoogte}
                          rx="8"
                        />
                        <text x={tooltipX + 10} y={tooltipY + 18}>
                          {zone.naam}
                        </text>
                        <text x={tooltipX + 10} y={tooltipY + 35}>
                          {formatBelgischeDatum(telmoment.datum)}{" "}
                          {telmoment.tijdstip}: {waarde}
                        </text>
                      </g>
                    </g>
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
