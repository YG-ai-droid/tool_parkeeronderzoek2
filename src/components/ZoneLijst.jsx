function ZoneLijst({
  zones,
  actieveZoneId,
  actiefTelmoment,
  krijgNummerplaten,
  krijgVoorgesteldeNummerplaten = () => [],
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
  wijzigZoneNaam,
  wijzigZoneRegime,
  wijzigZoneMaxParkeerduur,
  parkeerRegimes = [],
  regimesMetMaxDuur = [],
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
        const voorgesteldeNummerplaten = isInvuller
          ? krijgVoorgesteldeNummerplaten(zone)
          : [];
        const aantal = nummerplaten.length;

        const bezettingsgraad =
          zone.capaciteit > 0
            ? Math.round((aantal / zone.capaciteit) * 100)
            : 0;

        return (
          <div
            className={`zone-card ${
              isBeheerder ? "beheer-zone-card" : bepaalKleur(bezettingsgraad)
            } ${isOpen ? "actief open" : "gesloten"}`}
            key={zone.id}
          >
            <button
              className="zone-header"
              onClick={() => selecteerZone(zone.id)}
              onDoubleClick={() => toggleZoneOpen(zone.id)}
            >
              <span>
                <strong>{zone.naam}</strong>
                {isBeheerder ? (
                  <small>
                    Capaciteit: {zone.capaciteit} -{" "}
                    {zone.parkeerRegime || "vrij parkeren"}
                  </small>
                ) : (
                  <small>
                    {aantal}/{zone.capaciteit} voertuigen - {bezettingsgraad}%
                    bezet
                  </small>
                )}
              </span>

              {!isBeheerder && !isInvuller && (
                <span className="zone-status">
                  {zone.polygoon.length >= 3 ? "polygoon ok" : "geen polygoon"}
                </span>
              )}
            </button>

            {isOpen && (
              <div className="zone-inhoud">
                {!isBeheerder && (
                  <p>
                    Telmoment:{" "}
                    <strong>{telmomentLabel(actiefTelmoment)}</strong>
                  </p>
                )}

                <p>
                  {isBeheerder ? "Parkeerplaatsen" : "Capaciteit"}:{" "}
                  <strong>{zone.capaciteit}</strong>
                </p>

                <p>
                  Parkeerregime:{" "}
                  <strong>{zone.parkeerRegime || "vrij parkeren"}</strong>
                  {zone.maxParkeerduur && ` (${zone.maxParkeerduur})`}
                </p>

                {!isBeheerder && (
                  <>
                    <p>
                      Voertuigen: <strong>{aantal}</strong>
                    </p>

                    <p>
                      Bezettingsgraad: <strong>{bezettingsgraad}%</strong>
                    </p>

                    {!isInvuller && (
                      <p>
                        Polygoon:{" "}
                        <strong>
                          {zone.polygoon.length >= 3
                            ? `${zone.polygoon.length} punten`
                            : "nog niet geldig"}
                        </strong>
                      </p>
                    )}
                  </>
                )}

                {aantal > zone.capaciteit && !isBeheerder && (
                  <p className="waarschuwing">Overcapaciteit!</p>
                )}

                {isBeheerder && (
                  <>
                    <div className="zone-regime-form">
                      <label>
                        Parkeerregime
                        <select
                          value={zone.parkeerRegime || "vrij parkeren"}
                          onChange={(e) =>
                            wijzigZoneRegime(zone.id, e.target.value)
                          }
                        >
                          {parkeerRegimes.map((regime) => (
                            <option value={regime} key={regime}>
                              {regime}
                            </option>
                          ))}
                        </select>
                      </label>

                      {regimesMetMaxDuur.includes(zone.parkeerRegime) && (
                        <label>
                          Maximum parkeerduur
                          <input
                            type="text"
                            placeholder="bv. 2 uur"
                            value={zone.maxParkeerduur || ""}
                            onChange={(e) =>
                              wijzigZoneMaxParkeerduur(
                                zone.id,
                                e.target.value
                              )
                            }
                          />
                        </label>
                      )}
                    </div>

                    <div className="knoppenrij beheer-zone-acties">
                      <button onClick={() => wijzigZoneNaam(zone.id)}>
                        Hernoem zone
                      </button>

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
                  </>
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

                    {voorgesteldeNummerplaten.length > 0 && (
                      <div className="nummerplaat-suggesties">
                        <strong>Eerder in deze zone</strong>

                        <div className="suggestie-knoppen">
                          {voorgesteldeNummerplaten.map((plaat) => (
                            <button
                              type="button"
                              key={plaat}
                              onClick={() =>
                                voegNummerplaatToe(zone.id, plaat)
                              }
                            >
                              {plaat}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

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
