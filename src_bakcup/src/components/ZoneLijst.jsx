function ZoneLijst({
  zones,
  actieveZoneId,
  actiefTelmoment,
  krijgNummerplaten,
  telmomentLabel,
  bepaalKleur,
  selecteerZone,
  toggleZoneOpen,
  isBeheerder,
  isInvuller,
  tekenmodus,
  setTekenmodus,
  setBewerkmodusZoneId,
  setActieveZoneId,
  verwijderLaatstePunt,
  toggleBewerkmodus,
  wisPolygoon,
  verwijderZone,
  bewerkmodusZoneId,
  wijzigInvoer,
  voegNummerplaatToe,
  verwijderNummerplaat,
}) {
  return (
    <div className="zone-grid">
      {zones.map((zone) => {
        const isOpen = actieveZoneId === zone.id;
        const nummerplaten = krijgNummerplaten(zone);
        const aantal = nummerplaten.length;

        const bezettingsgraad =
          zone.capaciteit > 0
            ? Math.round((aantal / zone.capaciteit) * 100)
            : 0;

        return (
          <div
            className={`zone-card ${bepaalKleur(bezettingsgraad)} ${
              isOpen ? "actief open" : "gesloten"
            }`}
            key={zone.id}
          >
            <button
              className="zone-header"
              onClick={() => selecteerZone(zone.id)}
              onDoubleClick={() => toggleZoneOpen(zone.id)}
            >
              <span>
                <strong>{zone.naam}</strong>
                <small>
                  {aantal}/{zone.capaciteit} voertuigen — {bezettingsgraad}%
                  bezet
                </small>
              </span>

              <span className="zone-status">
                {zone.polygoon.length >= 3 ? "polygoon ok" : "geen polygoon"}
              </span>
            </button>

            {isOpen && (
              <div className="zone-inhoud">
                <p>
                  Telmoment: <strong>{telmomentLabel(actiefTelmoment)}</strong>
                </p>

                <p>
                  Capaciteit: <strong>{zone.capaciteit}</strong>
                </p>

                <p>
                  Voertuigen: <strong>{aantal}</strong>
                </p>

                <p>
                  Bezettingsgraad: <strong>{bezettingsgraad}%</strong>
                </p>

                <p>
                  Polygoon:{" "}
                  <strong>
                    {zone.polygoon.length >= 3
                      ? `${zone.polygoon.length} punten`
                      : "nog niet geldig"}
                  </strong>
                </p>

                {aantal > zone.capaciteit && (
                  <p className="waarschuwing">Overcapaciteit!</p>
                )}

                {isBeheerder && (
                  <div className="knoppenrij">
                    <button
                      onClick={() => {
                        setBewerkmodusZoneId(null);
                        setTekenmodus(!tekenmodus);
                        setActieveZoneId(zone.id);
                      }}
                    >
                      {tekenmodus && actieveZoneId === zone.id
                        ? "Stop tekenen"
                        : "Start tekenen"}
                    </button>

                    <button
                      disabled={zone.polygoon.length === 0}
                      onClick={() => verwijderLaatstePunt(zone.id)}
                    >
                      Laatste punt weg
                    </button>

                    <button
                      disabled={zone.polygoon.length < 3}
                      onClick={() => toggleBewerkmodus(zone.id)}
                    >
                      {bewerkmodusZoneId === zone.id
                        ? "Stop bewerken"
                        : "Bewerk polygoon"}
                    </button>

                    <button
                      disabled={zone.polygoon.length === 0}
                      onClick={() => wisPolygoon(zone.id)}
                    >
                      Wis polygoon
                    </button>

                    <button
                      className="verwijder-zone-knop"
                      onClick={() => verwijderZone(zone.id)}
                    >
                      Verwijder zone
                    </button>
                  </div>
                )}

                {isInvuller && (
                  <>
                    <div className="invoer-row">
                      <input
                        type="text"
                        placeholder="Nummerplaat"
                        value={zone.invoer}
                        onChange={(e) => wijzigInvoer(zone.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            voegNummerplaatToe(zone.id);
                          }
                        }}
                      />

                      <button onClick={() => voegNummerplaatToe(zone.id)}>
                        Voeg toe
                      </button>
                    </div>

                    <div className="nummerplaatlijst">
                      {nummerplaten.length === 0 ? (
                        <p className="lege-lijst">
                          Nog geen nummerplaten voor dit telmoment.
                        </p>
                      ) : (
                        <ul>
                          {nummerplaten.map((plaat) => (
                            <li key={plaat}>
                              {plaat}
                              <button
                                className="verwijder-knop"
                                onClick={() =>
                                  verwijderNummerplaat(zone.id, plaat)
                                }
                              >
                                X
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ZoneLijst;