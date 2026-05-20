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
  titel = "Rotatieanalyse: verblijfsduur per zone",
  leegLabel = "deze zone",
  onSelectItem,
}) {
  function krijgPlaatKey(plaat) {
    return typeof plaat === "object" ? plaat.id : plaat;
  }

  function krijgPlaatBron(plaat) {
    if (typeof plaat !== "object") return null;

    return {
      label: plaat.label,
      capaciteit: plaat.capaciteit,
    };
  }

  function analyseerZone(zone) {
    const nummerplaatMap = {};

    telmomenten.forEach((telmoment, index) => {
      krijgNummerplaten(zone, telmoment.id).forEach((plaat) => {
        const sleutel = krijgPlaatKey(plaat);
        const bron = krijgPlaatBron(plaat);

        if (!nummerplaatMap[sleutel]) nummerplaatMap[sleutel] = [];
        nummerplaatMap[sleutel].push({ index, bron });
      });
    });

    const groepen = {};

    Object.values(nummerplaatMap).forEach((registraties) => {
      const gesorteerdeRegistraties = registraties.sort(
        (a, b) => a.index - b.index
      );

      let reeks = null;

      function voegReeksToe() {
        if (!reeks) return;

        const sleutel = `${reeks.eersteIndex}-${reeks.laatsteIndex}`;

        if (!groepen[sleutel]) {
          groepen[sleutel] = {
            eersteIndex: reeks.eersteIndex,
            laatsteIndex: reeks.laatsteIndex,
            aantal: 0,
            bronnen: {},
          };
        }

        groepen[sleutel].aantal += 1;

        if (reeks.bron) {
          const bronSleutel = `${reeks.bron.label}-${reeks.bron.capaciteit}`;
          groepen[sleutel].bronnen[bronSleutel] = {
            label: reeks.bron.label,
            capaciteit: reeks.bron.capaciteit,
            aantal: (groepen[sleutel].bronnen[bronSleutel]?.aantal || 0) + 1,
          };
        }
      }

      gesorteerdeRegistraties.forEach((registratie) => {
        if (!reeks) {
          reeks = {
            eersteIndex: registratie.index,
            laatsteIndex: registratie.index,
            bron: registratie.bron,
          };
          return;
        }

        if (registratie.index === reeks.laatsteIndex + 1) {
          reeks.laatsteIndex = registratie.index;
          return;
        }

        voegReeksToe();
        reeks = {
          eersteIndex: registratie.index,
          laatsteIndex: registratie.index,
          bron: registratie.bron,
        };
      });

      voegReeksToe();
    });

    return Object.values(groepen).sort((a, b) => {
      if (a.eersteIndex !== b.eersteIndex) return a.eersteIndex - b.eersteIndex;
      return a.laatsteIndex - b.laatsteIndex;
    });
  }

  function bepaalSomKlasse(bezettingsgraad) {
    return `som-${bepaalKleurNaam(bezettingsgraad, kleurGrenzen)}`;
  }

  function groepTooltip(groep) {
    const bronnen = Object.values(groep.bronnen || {});
    if (bronnen.length === 0) return [];

    return bronnen;
  }

  function verdeelOverRijen(groepen) {
    const rijen = [];

    groepen.forEach((groep) => {
      const vrijeRij = rijen.find((rij) =>
        rij.every(
          (bestaandeGroep) =>
            groep.laatsteIndex < bestaandeGroep.eersteIndex ||
            groep.eersteIndex > bestaandeGroep.laatsteIndex
        )
      );

      if (vrijeRij) {
        vrijeRij.push(groep);
      } else {
        rijen.push([groep]);
      }
    });

    return rijen;
  }

  return (
    <div className="rotatieblok">
      <h2>{titel}</h2>

      {zones.map((zone) => {
        const groepen = analyseerZone(zone);
        const rijen = verdeelOverRijen(groepen);

        return (
          <div
            className="rotatiekaart"
            key={zone.id}
            onClick={() => onSelectItem?.(zone.id)}
          >
            <h3>
              {zone.naam} — capaciteit: {zone.capaciteit}
            </h3>

            {groepen.length === 0 ? (
              <p className="lege-lijst">
                Geen nummerplaten geregistreerd in {leegLabel}.
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

                  {rijen.map((rij, rijIndex) => (
                    <div
                      className="verblijfsduur-balkzone"
                      key={rijIndex}
                      style={{
                        gridColumn: `1 / span ${telmomenten.length}`,
                        "--aantal-telmomenten": telmomenten.length,
                      }}
                    >
                      {rij.map((groep) => (
                        <div
                          className="verblijfsduur-balk"
                          key={`${groep.eersteIndex}-${groep.laatsteIndex}`}
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
                          {groepTooltip(groep).length > 0 && (
                            <div className="rotatie-popup">
                              {groepTooltip(groep).map((bron) => (
                                <div
                                  className="rotatie-popup-regel"
                                  key={bron.label}
                                >
                                  <strong>{bron.label}</strong>
                                  <span>Capaciteit: {bron.capaciteit}</span>
                                  <span>Aantal: {bron.aantal}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
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
