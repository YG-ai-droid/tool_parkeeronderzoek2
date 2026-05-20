import { useState } from "react";

const spraakTokenMap = {
  nul: "0",
  zero: "0",
  een: "1",
  twee: "2",
  drie: "3",
  vier: "4",
  vijf: "5",
  zes: "6",
  zeven: "7",
  acht: "8",
  negen: "9",
  a: "A",
  aa: "A",
  be: "B",
  bee: "B",
  b: "B",
  cee: "C",
  see: "C",
  c: "C",
  de: "D",
  dee: "D",
  d: "D",
  e: "E",
  ee: "E",
  ef: "F",
  f: "F",
  gee: "G",
  ge: "G",
  g: "G",
  ha: "H",
  h: "H",
  ie: "I",
  i: "I",
  jee: "J",
  j: "J",
  ka: "K",
  k: "K",
  el: "L",
  l: "L",
  em: "M",
  m: "M",
  en: "N",
  n: "N",
  o: "O",
  oo: "O",
  pee: "P",
  pe: "P",
  p: "P",
  ku: "Q",
  q: "Q",
  er: "R",
  r: "R",
  es: "S",
  s: "S",
  tee: "T",
  t: "T",
  u: "U",
  uu: "U",
  vee: "V",
  v: "V",
  wee: "W",
  w: "W",
  iks: "X",
  x: "X",
  y: "Y",
  ij: "Y",
  zet: "Z",
  z: "Z",
};

function normaliseerGedikteerdeNummerplaat(tekst) {
  return tekst
    .toLowerCase()
    .split(/\s+/)
    .map((token) => {
      const schoonToken = token.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      return (
        spraakTokenMap[schoonToken] ||
        schoonToken.replace(/[^a-z0-9]/g, "").toUpperCase()
      );
    })
    .join("")
    .replace(/[^A-Z0-9]/g, "");
}

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
  wijzigZoneCapaciteit,
  parkeerRegimes = [],
  regimesMetMaxDuur = [],
  bewerkmodusZoneId,
  wijzigInvoer,
  voegNummerplaatToe,
  verwijderNummerplaat,
}) {
  const [luisterendeZoneId, setLuisterendeZoneId] = useState(null);
  const [spraakMelding, setSpraakMelding] = useState("");

  function dicteerNummerplaat(zoneId) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Dicteren wordt niet ondersteund door deze browser. Probeer Chrome of Edge."
      );
      return;
    }

    const herkenning = new SpeechRecognition();
    herkenning.lang = "nl-BE";
    herkenning.interimResults = false;
    herkenning.maxAlternatives = 1;

    setLuisterendeZoneId(zoneId);
    setSpraakMelding("Luisteren...");

    herkenning.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      const nummerplaat = normaliseerGedikteerdeNummerplaat(transcript);

      if (nummerplaat) {
        wijzigInvoer(zoneId, nummerplaat);
        setSpraakMelding(`Herkend: ${nummerplaat}`);
      } else {
        setSpraakMelding("Geen nummerplaat herkend.");
      }
    };

    herkenning.onerror = () => {
      setSpraakMelding("Dicteren is niet gelukt.");
    };

    herkenning.onend = () => {
      setLuisterendeZoneId(null);
    };

    herkenning.start();
  }

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
                        Parkeerplaatsen
                        <input
                          type="number"
                          min="0"
                          value={zone.capaciteit}
                          onChange={(e) =>
                            wijzigZoneCapaciteit(zone.id, e.target.value)
                          }
                        />
                      </label>

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

                      <button
                        type="button"
                        className="dicteer-knop"
                        onClick={() => dicteerNummerplaat(zone.id)}
                        disabled={luisterendeZoneId === zone.id}
                      >
                        {luisterendeZoneId === zone.id
                          ? "Luisteren..."
                          : "Dicteer"}
                      </button>
                    </div>

                    {spraakMelding && isOpen && (
                      <p className="spraak-melding">{spraakMelding}</p>
                    )}

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
