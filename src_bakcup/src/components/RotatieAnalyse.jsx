function bepaalKleurNaam(bezettingsgraad, kleurGrenzen) {
  if (bezettingsgraad < kleurGrenzen.lichtgrijsTot) return "lichtgrijs";
  if (bezettingsgraad < kleurGrenzen.groenTot) return "groen";
  if (bezettingsgraad < kleurGrenzen.oranjeTot) return "oranje";
  return "rood";
}

function RotatieAnalyse({
  zones,
  telmomenten,
  krijgNummerplaten,
  kleurGrenzen,
}) {
  function analyseerZone(zone) {
    const nummerplaatMap = {};

    telmomenten.forEach((telmoment, index) => {
      krijgNummerplaten(zone, telmoment.id).forEach((plaat) => {
        if (!nummerplaatMap[plaat]) {
          nummerplaatMap[plaat] = {
            eersteIndex: index,
            laatsteIndex: index,
          };
        } else {
          nummerplaatMap[plaat].laatsteIndex = index;
        }
      });
    });

    const groepen = {};

    Object.values(nummerplaatMap).forEach((voertuig) => {
      const sleutel = `${voertuig.eersteIndex}-${voertuig.laatsteIndex}`;

      if (!groepen[sleutel]) {
        groepen[sleutel] = {
          eersteIndex: voertuig.eersteIndex,
          laatsteIndex: voertuig.laatsteIndex,
          aantal: 0,
        };
      }

      groepen[sleutel].aantal += 1;
    });

    return Object.values(groepen).sort((a, b) => {
      if (a.eersteIndex !== b.eersteIndex) return a.eersteIndex - b.eersteIndex;
      return a.laatsteIndex - b.laatsteIndex;
    });
  }

  function bepaalSomKlasse(bezettingsgraad) {
    return `som-${bepaalKleurNaam(bezettingsgraad, kleurGrenzen)}`;
  }

  return (
    <div className="rotatieblok">
      <h2>Rotatieanalyse: verblijfsduur per zone</h2>

      {zones.map((zone) => {
        const groepen = analyseerZone(zone);

        return (
          <div className="rotatiekaart" key={zone.id}>
            <h3>
              {zone.naam} — capaciteit: {zone.capaciteit}
            </h3>

            {groepen.length === 0 ? (
              <p className="lege-lijst">
                Geen nummerplaten geregistreerd in deze zone.
              </p>
            ) : (
              <div className="verblijfsduur-wrapper">
                <div
                  className="verblijfsduur-grid"
                  style={{
                    gridTemplateColumns: `repeat(${telmomenten.length}, minmax(90px, 1fr))`,
                  }}
                >
                  {telmomenten.map((telmoment) => (
                    <div className="verblijfsduur-kop" key={telmoment.id}>
                      <span>{telmoment.datum || "geen datum"}</span>
                      <strong>{telmoment.tijdstip}</strong>
                    </div>
                  ))}

                  {groepen.map((groep, index) => (
                    <div
                      className="verblijfsduur-balkzone"
                      key={index}
                      style={{
                        gridColumn: `1 / span ${telmomenten.length}`,
                        "--aantal-telmomenten": telmomenten.length,
                      }}
                    >
                      <div
                        className="verblijfsduur-balk"
                        style={{
                          left: `${
                            (groep.eersteIndex / telmomenten.length) * 100
                          }%`,
                          width: `${
                            ((groep.laatsteIndex -
                              groep.eersteIndex +
                              1) /
                              telmomenten.length) *
                            100
                          }%`,
                        }}
                      >
                        {groep.aantal}
                      </div>
                    </div>
                  ))}

                  {telmomenten.map((telmoment) => {
                    const aantal = krijgNummerplaten(zone, telmoment.id).length;
                    const bezettingsgraad =
                      zone.capaciteit > 0
                        ? Math.round((aantal / zone.capaciteit) * 100)
                        : 0;

                    return (
                      <div
                        className={`verblijfsduur-som ${bepaalSomKlasse(
                          bezettingsgraad
                        )}`}
                        key={`som-${telmoment.id}`}
                      >
                        <strong>{aantal}</strong>
                        <span>{bezettingsgraad}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default RotatieAnalyse;