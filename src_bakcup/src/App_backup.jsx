import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  Polygon,
  Popup,
  useMapEvents,
  Marker,
  Tooltip,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

const puntIcon = L.divIcon({
  className: "polygoon-punt",
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const KLEUREN = {
  lichtgrijs: "#9ca3af",
  groen: "#22c55e",
  oranje: "#f97316",
  rood: "#ef4444",
};

const grafiekKleuren = [
  "#2563eb", // blauw
  "#a21caf", // magenta
  "#0891b2", // cyaan
  "#7c2d12", // bruin
  "#4338ca", // indigo
  "#0f766e", // teal
  "#6b7280", // grijs
  "#be185d", // roze
  "#1d4ed8", // felblauw
  "#854d0e", // oker
];

function KlikbareKaart({ tekenmodus, voegPuntToe }) {
  useMapEvents({
    click(e) {
      if (tekenmodus) voegPuntToe([e.latlng.lat, e.latlng.lng]);
    },
  });

  return null;
}

function bepaalKleurNaam(bezettingsgraad, kleurGrenzen) {
  if (bezettingsgraad < kleurGrenzen.lichtgrijsTot) return "lichtgrijs";
  if (bezettingsgraad < kleurGrenzen.groenTot) return "groen";
  if (bezettingsgraad < kleurGrenzen.oranjeTot) return "oranje";
  return "rood";
}

function bepaalKleurHex(bezettingsgraad, kleurGrenzen) {
  return KLEUREN[bepaalKleurNaam(bezettingsgraad, kleurGrenzen)];
}

function Taartdiagram({ titel, subtitel, percentage, kleur, middenTekst }) {
  const veiligPercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className="taartkaart">
      <h3>{titel}</h3>
      {subtitel && <p className="taart-subtitel">{subtitel}</p>}

      <div
        className="taartdiagram"
        style={{
          background: `conic-gradient(${kleur} ${veiligPercentage}%, #e5e7eb ${veiligPercentage}% 100%)`,
        }}
      >
        <div className="taart-midden">
          <strong>{percentage}%</strong>
          <span>{middenTekst}</span>
        </div>
      </div>
    </div>
  );
}

function VerdelingTaartdiagram({ titel, data }) {
  const totaal = data.reduce((som, item) => som + item.waarde, 0);

  if (totaal === 0) {
    return (
      <div className="taartkaart">
        <h3>{titel}</h3>
        <p className="lege-lijst">Nog geen gegevens.</p>
      </div>
    );
  }

  let huidigeStart = 0;

  const segmenten = data.map((item, index) => {
    const aandeel = (item.waarde / totaal) * 100;
    const start = huidigeStart;
    const einde = huidigeStart + aandeel;
    huidigeStart = einde;

    return `${grafiekKleuren[index % grafiekKleuren.length]} ${start}% ${einde}%`;
  });

  return (
    <div className="taartkaart">
      <h3>{titel}</h3>

      <div
        className="taartdiagram"
        style={{
          background: `conic-gradient(${segmenten.join(", ")})`,
        }}
      >
        <div className="taart-midden">
          <strong>{totaal}</strong>
          <span>plaatsen</span>
        </div>
      </div>

      <div className="taart-legende">
        {data.map((item, index) => (
          <span key={item.label}>
            <span
              className="legende-kleur"
              style={{
                background: grafiekKleuren[index % grafiekKleuren.length],
              }}
            />
            {item.label}: {item.waarde}
          </span>
        ))}
      </div>
    </div>
  );
}

function Lijngrafiek({
  zones,
  telmomenten,
  geselecteerdeZoneIds,
  krijgNummerplaten,
}) {
  const zichtbareZones = zones.filter((zone) =>
    geselecteerdeZoneIds.includes(zone.id)
  );

  const breedte = 760;
  const hoogte = 320;
  const margeLinks = 44;
  const margeRechts = 20;
  const margeBoven = 24;
  const margeOnder = 52;

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
      <h2>Evolutie getelde aantallen per zone</h2>

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

          {[0, Math.round(maxWaarde / 2), maxWaarde].map((waarde) => (
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
          ))}

          {telmomenten.map((telmoment, index) => (
            <text
              key={telmoment.id}
              x={xPos(index)}
              y={hoogte - 18}
              textAnchor="middle"
              className="aslabel"
            >
              {telmoment.tijdstip}
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

function App() {
  const [rol, setRol] = useState("beheerder");
  const [toonKaartTaarten, setToonKaartTaarten] = useState(true);

  const [kleurGrenzen, setKleurGrenzen] = useState(() => {
    const bewaardeGrenzen = localStorage.getItem("kleurGrenzen");

    if (bewaardeGrenzen) return JSON.parse(bewaardeGrenzen);

    return {
      lichtgrijsTot: 40,
      groenTot: 70,
      oranjeTot: 85,
    };
  });

  const [telmomenten, setTelmomenten] = useState(() => {
    const bewaardeTelmomenten = localStorage.getItem("telmomenten");

    if (bewaardeTelmomenten) {
      return JSON.parse(bewaardeTelmomenten).map((telmoment) => ({
        ...telmoment,
        datum: telmoment.datum || "",
      }));
    }

    return [
      {
        id: 1,
        naam: "Telmoment 1",
        datum: "",
        tijdstip: "09:00",
      },
    ];
  });

  const [actiefTelmomentId, setActiefTelmomentId] = useState(() => {
    const bewaardTelmoment = localStorage.getItem("actiefTelmomentId");
    return bewaardTelmoment ? Number(bewaardTelmoment) : 1;
  });

  const [nieuwTelmomentNaam, setNieuwTelmomentNaam] = useState("");
  const [nieuwTelmomentDatum, setNieuwTelmomentDatum] = useState("");
  const [nieuwTelmomentTijdstip, setNieuwTelmomentTijdstip] = useState("");

  const [zones, setZones] = useState(() => {
    const bewaardeZones = localStorage.getItem("parkeerZones");

    if (bewaardeZones) {
      const parsedZones = JSON.parse(bewaardeZones);

      return parsedZones.map((zone) => {
        if (zone.tellingen) return zone;

        return {
          ...zone,
          tellingen: {
            1: zone.nummerplaten || [],
          },
          invoer: "",
        };
      });
    }

    return [
      {
        id: 1,
        naam: "Kerkstraat",
        capaciteit: 20,
        invoer: "",
        polygoon: [],
        tellingen: {
          1: [],
        },
      },
    ];
  });

  const [actieveZoneId, setActieveZoneId] = useState(() => {
    const bewaardeActieveZone = localStorage.getItem("actieveZoneId");
    return bewaardeActieveZone ? Number(bewaardeActieveZone) : 1;
  });

  const [geselecteerdeAnalistZones, setGeselecteerdeAnalistZones] = useState(
    () => {
      const bewaardeSelectie = localStorage.getItem(
        "geselecteerdeAnalistZones"
      );

      return bewaardeSelectie ? JSON.parse(bewaardeSelectie) : [];
    }
  );

  const [nieuweZoneNaam, setNieuweZoneNaam] = useState("");
  const [nieuweCapaciteit, setNieuweCapaciteit] = useState("");
  const [tekenmodus, setTekenmodus] = useState(false);
  const [bewerkmodusZoneId, setBewerkmodusZoneId] = useState(null);

  useEffect(() => {
    localStorage.setItem("parkeerZones", JSON.stringify(zones));
  }, [zones]);

  useEffect(() => {
    localStorage.setItem("telmomenten", JSON.stringify(telmomenten));
  }, [telmomenten]);

  useEffect(() => {
    localStorage.setItem("kleurGrenzen", JSON.stringify(kleurGrenzen));
  }, [kleurGrenzen]);

  useEffect(() => {
    localStorage.setItem(
      "geselecteerdeAnalistZones",
      JSON.stringify(geselecteerdeAnalistZones)
    );
  }, [geselecteerdeAnalistZones]);

  useEffect(() => {
    if (actieveZoneId !== null) {
      localStorage.setItem("actieveZoneId", actieveZoneId);
    }
  }, [actieveZoneId]);

  useEffect(() => {
    if (actiefTelmomentId !== null) {
      localStorage.setItem("actiefTelmomentId", actiefTelmomentId);
    }
  }, [actiefTelmomentId]);

  useEffect(() => {
    if (rol !== "beheerder") {
      setTekenmodus(false);
      setBewerkmodusZoneId(null);
    }
  }, [rol]);

  useEffect(() => {
    if (geselecteerdeAnalistZones.length === 0 && zones.length > 0) {
      setGeselecteerdeAnalistZones(zones.map((zone) => zone.id));
    }
  }, [zones, geselecteerdeAnalistZones.length]);

  const actieveZone = zones.find((zone) => zone.id === actieveZoneId);
  const actiefTelmoment = telmomenten.find(
    (telmoment) => telmoment.id === actiefTelmomentId
  );

  const isBeheerder = rol === "beheerder";
  const isInvuller = rol === "invuller";
  const isAnalist = rol === "analist";

  function krijgNummerplaten(zone, telmomentId = actiefTelmomentId) {
    return zone.tellingen?.[telmomentId] || [];
  }

  function telmomentLabel(telmoment) {
    if (!telmoment) return "geen telmoment";
    const datumDeel = telmoment.datum ? `${telmoment.datum} — ` : "";
    return `${datumDeel}${telmoment.naam} (${telmoment.tijdstip})`;
  }

  function bepaalKleur(bezettingsgraad) {
    return bepaalKleurNaam(bezettingsgraad, kleurGrenzen);
  }

  function bepaalKaartKleur(bezettingsgraad) {
    return bepaalKleurHex(bezettingsgraad, kleurGrenzen);
  }

  function pasLichtgrijsGrensAan(waarde) {
    const lichtgrijsTot = Number(waarde);

    setKleurGrenzen((vorige) => {
      const groenTot = Math.max(vorige.groenTot, lichtgrijsTot + 1);
      const oranjeTot = Math.max(vorige.oranjeTot, groenTot + 1);

      return {
        lichtgrijsTot,
        groenTot: Math.min(groenTot, 99),
        oranjeTot: Math.min(oranjeTot, 100),
      };
    });
  }

  function pasGroenGrensAan(waarde) {
    const groenTot = Number(waarde);

    setKleurGrenzen((vorige) => {
      const nieuweGroenTot = Math.max(groenTot, vorige.lichtgrijsTot + 1);
      const oranjeTot = Math.max(vorige.oranjeTot, nieuweGroenTot + 1);

      return {
        ...vorige,
        groenTot: Math.min(nieuweGroenTot, 99),
        oranjeTot: Math.min(oranjeTot, 100),
      };
    });
  }

  function pasOranjeGrensAan(waarde) {
    const oranjeTot = Number(waarde);

    setKleurGrenzen((vorige) => ({
      ...vorige,
      oranjeTot: Math.max(oranjeTot, vorige.groenTot + 1),
    }));
  }

  function voegTelmomentToe() {
    if (!isBeheerder) return;

    if (
      nieuwTelmomentNaam.trim() === "" ||
      nieuwTelmomentDatum === "" ||
      nieuwTelmomentTijdstip === ""
    ) {
      return;
    }

    const nieuwTelmoment = {
      id: Date.now(),
      naam: nieuwTelmomentNaam,
      datum: nieuwTelmomentDatum,
      tijdstip: nieuwTelmomentTijdstip,
    };

    setTelmomenten([...telmomenten, nieuwTelmoment]);
    setActiefTelmomentId(nieuwTelmoment.id);
    setNieuwTelmomentNaam("");
    setNieuwTelmomentDatum("");
    setNieuwTelmomentTijdstip("");
  }

  function verwijderTelmoment(telmomentId) {
    if (!isBeheerder) return;

    const zeker = confirm("Ben je zeker dat je dit telmoment wil verwijderen?");
    if (!zeker) return;

    const nieuweTelmomenten = telmomenten.filter(
      (telmoment) => telmoment.id !== telmomentId
    );

    setTelmomenten(nieuweTelmomenten);

    setZones(
      zones.map((zone) => {
        const nieuweTellingen = { ...(zone.tellingen || {}) };
        delete nieuweTellingen[telmomentId];

        return {
          ...zone,
          tellingen: nieuweTellingen,
        };
      })
    );

    if (actiefTelmomentId === telmomentId) {
      setActiefTelmomentId(nieuweTelmomenten[0]?.id || null);
    }
  }

  function voegZoneToe() {
    if (!isBeheerder) return;
    if (nieuweZoneNaam.trim() === "" || nieuweCapaciteit === "") return;

    const nieuweZone = {
      id: Date.now(),
      naam: nieuweZoneNaam,
      capaciteit: Number(nieuweCapaciteit),
      invoer: "",
      polygoon: [],
      tellingen: {},
    };

    setZones([...zones, nieuweZone]);
    setActieveZoneId(nieuweZone.id);
    setTekenmodus(false);
    setBewerkmodusZoneId(null);
    setNieuweZoneNaam("");
    setNieuweCapaciteit("");
  }

  function selecteerZone(zoneId) {
    setActieveZoneId(zoneId);
  }

  function toggleZoneOpen(zoneId) {
    if (actieveZoneId === zoneId) {
      setActieveZoneId(null);
      setTekenmodus(false);
      setBewerkmodusZoneId(null);
    } else {
      setActieveZoneId(zoneId);
    }
  }

  function voegPuntToe(punt) {
    if (!isBeheerder) return;

    setZones(
      zones.map((zone) =>
        zone.id === actieveZoneId
          ? { ...zone, polygoon: [...zone.polygoon, punt] }
          : zone
      )
    );
  }

  function verplaatsPunt(zoneId, puntIndex, nieuwPunt) {
    if (!isBeheerder) return;

    setZones(
      zones.map((zone) => {
        if (zone.id !== zoneId) return zone;

        const nieuwePolygoon = zone.polygoon.map((punt, index) =>
          index === puntIndex ? nieuwPunt : punt
        );

        return { ...zone, polygoon: nieuwePolygoon };
      })
    );
  }

  function afstandTotSegment(punt, start, einde) {
    const px = punt[1];
    const py = punt[0];
    const x1 = start[1];
    const y1 = start[0];
    const x2 = einde[1];
    const y2 = einde[0];

    const dx = x2 - x1;
    const dy = y2 - y1;

    if (dx === 0 && dy === 0) {
      return Math.sqrt((px - x1) ** 2 + (py - y1) ** 2);
    }

    let t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));

    const projectieX = x1 + t * dx;
    const projectieY = y1 + t * dy;

    return Math.sqrt((px - projectieX) ** 2 + (py - projectieY) ** 2);
  }

  function voegPuntToeOpDichtsteZijde(zoneId, klikPunt) {
    if (!isBeheerder) return;

    setZones(
      zones.map((zone) => {
        if (zone.id !== zoneId || zone.polygoon.length < 3) return zone;

        let besteIndex = 0;
        let kleinsteAfstand = Infinity;

        for (let i = 0; i < zone.polygoon.length; i++) {
          const start = zone.polygoon[i];
          const einde = zone.polygoon[(i + 1) % zone.polygoon.length];
          const afstand = afstandTotSegment(klikPunt, start, einde);

          if (afstand < kleinsteAfstand) {
            kleinsteAfstand = afstand;
            besteIndex = i;
          }
        }

        const nieuwePolygoon = [...zone.polygoon];
        nieuwePolygoon.splice(besteIndex + 1, 0, klikPunt);

        return { ...zone, polygoon: nieuwePolygoon };
      })
    );
  }

  function verwijderLaatstePunt(zoneId) {
    if (!isBeheerder) return;

    setZones(
      zones.map((zone) =>
        zone.id === zoneId
          ? { ...zone, polygoon: zone.polygoon.slice(0, -1) }
          : zone
      )
    );
  }

  function wisPolygoon(zoneId) {
    if (!isBeheerder) return;

    const zeker = confirm("Ben je zeker dat je deze polygoon wil wissen?");
    if (!zeker) return;

    setZones(
      zones.map((zone) =>
        zone.id === zoneId ? { ...zone, polygoon: [] } : zone
      )
    );

    if (bewerkmodusZoneId === zoneId) setBewerkmodusZoneId(null);
  }

  function toggleBewerkmodus(zoneId) {
    if (!isBeheerder) return;

    setTekenmodus(false);
    setActieveZoneId(zoneId);
    setBewerkmodusZoneId(bewerkmodusZoneId === zoneId ? null : zoneId);
  }

  function wijzigInvoer(zoneId, waarde) {
    if (!isInvuller) return;

    setZones(
      zones.map((zone) =>
        zone.id === zoneId ? { ...zone, invoer: waarde.toUpperCase() } : zone
      )
    );
  }

  function voegNummerplaatToe(zoneId) {
    if (!isInvuller) return;

    if (!actiefTelmomentId) {
      alert("Selecteer eerst een telmoment.");
      return;
    }

    setZones(
      zones.map((zone) => {
        if (zone.id !== zoneId) return zone;

        const plaat = zone.invoer.trim();
        if (plaat === "") return zone;

        const bestaandePlaten = krijgNummerplaten(zone, actiefTelmomentId);

        if (bestaandePlaten.includes(plaat)) {
          alert("Deze nummerplaat bestaat al in deze zone voor dit telmoment.");
          return zone;
        }

        return {
          ...zone,
          tellingen: {
            ...(zone.tellingen || {}),
            [actiefTelmomentId]: [...bestaandePlaten, plaat],
          },
          invoer: "",
        };
      })
    );
  }

  function verwijderNummerplaat(zoneId, plaat) {
    if (!isInvuller) return;

    setZones(
      zones.map((zone) => {
        if (zone.id !== zoneId) return zone;

        const bestaandePlaten = krijgNummerplaten(zone, actiefTelmomentId);

        return {
          ...zone,
          tellingen: {
            ...(zone.tellingen || {}),
            [actiefTelmomentId]: bestaandePlaten.filter((p) => p !== plaat),
          },
        };
      })
    );
  }

  function verwijderZone(zoneId) {
    if (!isBeheerder) return;

    const zeker = confirm("Ben je zeker dat je deze zone wil verwijderen?");
    if (!zeker) return;

    const nieuweZones = zones.filter((zone) => zone.id !== zoneId);
    setZones(nieuweZones);

    if (actieveZoneId === zoneId) setActieveZoneId(nieuweZones[0]?.id || null);
    if (bewerkmodusZoneId === zoneId) setBewerkmodusZoneId(null);
  }

  function downloadBackup() {
    if (!isBeheerder) return;

    const backup = {
      gemaaktOp: new Date().toISOString(),
      telmomenten,
      zones,
      actiefTelmomentId,
      actieveZoneId,
      kleurGrenzen,
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "parkeeronderzoek-backup.json";
    link.click();

    URL.revokeObjectURL(url);
  }

  function importeerBackup(event) {
    if (!isBeheerder) return;

    const bestand = event.target.files[0];
    if (!bestand) return;

    const lezer = new FileReader();

    lezer.onload = function (e) {
      try {
        const backup = JSON.parse(e.target.result);

        if (!backup.zones || !backup.telmomenten) {
          alert("Dit bestand lijkt geen geldige back-up te zijn.");
          return;
        }

        const zeker = confirm(
          "Ben je zeker dat je deze back-up wil importeren? De huidige gegevens worden overschreven."
        );

        if (!zeker) return;

        setZones(backup.zones);
        setTelmomenten(backup.telmomenten);
        setActiefTelmomentId(
          backup.actiefTelmomentId || backup.telmomenten[0]?.id || null
        );
        setActieveZoneId(backup.actieveZoneId || backup.zones[0]?.id || null);

        if (backup.kleurGrenzen) {
          setKleurGrenzen(backup.kleurGrenzen);
          localStorage.setItem(
            "kleurGrenzen",
            JSON.stringify(backup.kleurGrenzen)
          );
        }

        localStorage.setItem("parkeerZones", JSON.stringify(backup.zones));
        localStorage.setItem("telmomenten", JSON.stringify(backup.telmomenten));

        if (backup.actiefTelmomentId) {
          localStorage.setItem("actiefTelmomentId", backup.actiefTelmomentId);
        }

        if (backup.actieveZoneId) {
          localStorage.setItem("actieveZoneId", backup.actieveZoneId);
        }

        alert("Back-up succesvol geïmporteerd.");
      } catch (fout) {
        alert("Het bestand kon niet gelezen worden als geldige JSON-back-up.");
      }
    };

    lezer.readAsText(bestand);
    event.target.value = "";
  }

  function exporteerCSV() {
    if (!isBeheerder && !isAnalist) return;

    const rijen = [
      [
        "Telmoment",
        "Datum",
        "Tijdstip",
        "Zone",
        "Capaciteit",
        "Aantal voertuigen",
        "Bezettingsgraad",
        "Nummerplaten",
      ],
    ];

    telmomenten.forEach((telmoment) => {
      zones.forEach((zone) => {
        const nummerplaten = krijgNummerplaten(zone, telmoment.id);
        const aantal = nummerplaten.length;

        const bezettingsgraad =
          zone.capaciteit > 0
            ? Math.round((aantal / zone.capaciteit) * 100)
            : 0;

        rijen.push([
          telmoment.naam,
          telmoment.datum || "",
          telmoment.tijdstip,
          zone.naam,
          zone.capaciteit,
          aantal,
          `${bezettingsgraad}%`,
          nummerplaten.join(", "),
        ]);
      });
    });

    const csv = rijen
      .map((rij) =>
        rij
          .map((waarde) => `"${String(waarde).replaceAll('"', '""')}"`)
          .join(";")
      )
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "parkeeronderzoek-resultaten.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  function wisAlleGegevens() {
    if (!isBeheerder) return;

    const zeker = confirm("Ben je zeker dat je alle gegevens wil wissen?");

    if (zeker) {
      localStorage.removeItem("parkeerZones");
      localStorage.removeItem("actieveZoneId");
      localStorage.removeItem("telmomenten");
      localStorage.removeItem("actiefTelmomentId");
      localStorage.removeItem("geselecteerdeAnalistZones");
      localStorage.removeItem("kleurGrenzen");
      window.location.reload();
    }
  }

  function toggleAnalistZone(zoneId) {
    if (geselecteerdeAnalistZones.includes(zoneId)) {
      setGeselecteerdeAnalistZones(
        geselecteerdeAnalistZones.filter((id) => id !== zoneId)
      );
    } else {
      setGeselecteerdeAnalistZones([...geselecteerdeAnalistZones, zoneId]);
    }
  }

  function berekenCentrum(polygoon) {
    const totaal = polygoon.reduce(
      (som, punt) => ({
        lat: som.lat + punt[0],
        lng: som.lng + punt[1],
      }),
      { lat: 0, lng: 0 }
    );

    return [totaal.lat / polygoon.length, totaal.lng / polygoon.length];
  }

  function maakMiniTaartIcon(zone) {
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
      const segment = `${grafiekKleuren[index % grafiekKleuren.length]} ${start}% ${einde}%`;
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

  const totaalVoertuigenActiefTelmoment = zones.reduce(
    (totaal, zone) => totaal + krijgNummerplaten(zone).length,
    0
  );

  const totaleCapaciteit = zones.reduce(
    (totaal, zone) => totaal + zone.capaciteit,
    0
  );

  const totaleBezettingsgraad =
    totaleCapaciteit > 0
      ? Math.round((totaalVoertuigenActiefTelmoment / totaleCapaciteit) * 100)
      : 0;

  const verdelingPerZone = zones.map((zone) => ({
    label: zone.naam,
    waarde: krijgNummerplaten(zone).length,
  }));

  return (
    <div className="app">
      <h1>Parkeeronderzoek Tool</h1>

      <div className="rolkeuze">
        <button
          className={rol === "beheerder" ? "rol-actief" : ""}
          onClick={() => setRol("beheerder")}
        >
          Beheerder
        </button>

        <button
          className={rol === "invuller" ? "rol-actief" : ""}
          onClick={() => setRol("invuller")}
        >
          Invuller
        </button>

        <button
          className={rol === "analist" ? "rol-actief" : ""}
          onClick={() => setRol("analist")}
        >
          Analist
        </button>
      </div>

      <p>
        Actieve rol: <strong>{rol}</strong>.{" "}
        {isBeheerder &&
          "Je kunt zones, capaciteit, polygonen, telmomenten en kleurcodes beheren."}
        {isInvuller &&
          "Kies eerst een telmoment en registreer daarna nummerplaten per zone."}
        {isAnalist &&
          "Je bekijkt de resultaten per telmoment zonder data aan te passen."}
      </p>

      {isBeheerder && (
        <div className="beheer-knoppen">
          <button className="reset-knop" onClick={wisAlleGegevens}>
            Wis alle gegevens
          </button>

          <button onClick={downloadBackup}>Download back-up</button>

          <button onClick={exporteerCSV}>Exporteer CSV</button>

          <label className="import-knop">
            Back-up importeren
            <input
              type="file"
              accept=".json,application/json"
              onChange={importeerBackup}
              hidden
            />
          </label>
        </div>
      )}

      {!isBeheerder && (
        <div className="statusbalk">
          <strong>Status:</strong>{" "}
          {actieveZone ? (
            <>
              actieve zone: <strong>{actieveZone.naam}</strong> — telmoment:{" "}
              <strong>{telmomentLabel(actiefTelmoment)}</strong> — punten:{" "}
              <strong>{actieveZone.polygoon.length}</strong>
            </>
          ) : (
            <>
              geen actieve zone — telmoment:{" "}
              <strong>{telmomentLabel(actiefTelmoment)}</strong>
            </>
          )}
        </div>
      )}

      <div className="layout">
        <section className="linkerkolom">
          {isBeheerder && (
            <>
              <div className="statusbalk">
                <strong>Kleurcodes instellen</strong>

                <div className="kleur-slider-container">
                  <div
                    className="kleur-schaal"
                    style={{
                      background: `linear-gradient(
                        to right,
                        ${KLEUREN.lichtgrijs} 0%,
                        ${KLEUREN.lichtgrijs} ${kleurGrenzen.lichtgrijsTot}%,
                        ${KLEUREN.groen} ${kleurGrenzen.lichtgrijsTot}%,
                        ${KLEUREN.groen} ${kleurGrenzen.groenTot}%,
                        ${KLEUREN.oranje} ${kleurGrenzen.groenTot}%,
                        ${KLEUREN.oranje} ${kleurGrenzen.oranjeTot}%,
                        ${KLEUREN.rood} ${kleurGrenzen.oranjeTot}%,
                        ${KLEUREN.rood} 100%
                      )`,
                    }}
                  />

                  <div
                    className="kleur-label"
                    style={{ left: `${kleurGrenzen.lichtgrijsTot}%` }}
                  >
                    {kleurGrenzen.lichtgrijsTot}%
                  </div>

                  <div
                    className="kleur-label"
                    style={{ left: `${kleurGrenzen.groenTot}%` }}
                  >
                    {kleurGrenzen.groenTot}%
                  </div>

                  <div
                    className="kleur-label"
                    style={{ left: `${kleurGrenzen.oranjeTot}%` }}
                  >
                    {kleurGrenzen.oranjeTot}%
                  </div>

                  <input
                    className="kleur-range"
                    type="range"
                    min="0"
                    max="98"
                    value={kleurGrenzen.lichtgrijsTot}
                    onChange={(e) => pasLichtgrijsGrensAan(e.target.value)}
                  />

                  <input
                    className="kleur-range"
                    type="range"
                    min="1"
                    max="99"
                    value={kleurGrenzen.groenTot}
                    onChange={(e) => pasGroenGrensAan(e.target.value)}
                  />

                  <input
                    className="kleur-range"
                    type="range"
                    min="2"
                    max="100"
                    value={kleurGrenzen.oranjeTot}
                    onChange={(e) => pasOranjeGrensAan(e.target.value)}
                  />
                </div>

                <div className="kleurcode-uitleg compact">
                  <span>Lichtgrijs: 0–{kleurGrenzen.lichtgrijsTot - 1}%</span>
                  <span>
                    Groen: {kleurGrenzen.lichtgrijsTot}–
                    {kleurGrenzen.groenTot - 1}%
                  </span>
                  <span>
                    Oranje: {kleurGrenzen.groenTot}–
                    {kleurGrenzen.oranjeTot - 1}%
                  </span>
                  <span>Rood: {kleurGrenzen.oranjeTot}%+</span>
                </div>
              </div>

              <div className="statusbalk">
                <strong>Telmomenten beheren</strong>

                <div className="nieuwe-zone telmoment-formulier">
                  <input
                    type="text"
                    placeholder="Naam, bv. Ronde 1"
                    value={nieuwTelmomentNaam}
                    onChange={(e) => setNieuwTelmomentNaam(e.target.value)}
                  />

                  <input
                    type="date"
                    value={nieuwTelmomentDatum}
                    onChange={(e) => setNieuwTelmomentDatum(e.target.value)}
                  />

                  <input
                    type="time"
                    value={nieuwTelmomentTijdstip}
                    onChange={(e) => setNieuwTelmomentTijdstip(e.target.value)}
                  />

                  <button onClick={voegTelmomentToe}>
                    Voeg telmoment toe
                  </button>
                </div>

                <div className="nummerplaatlijst">
                  {telmomenten.map((telmoment) => (
                    <li key={telmoment.id}>
                      {telmoment.datum ? `${telmoment.datum} — ` : ""}
                      {telmoment.naam} — {telmoment.tijdstip}
                      <button
                        className="verwijder-knop"
                        onClick={() => verwijderTelmoment(telmoment.id)}
                      >
                        X
                      </button>
                    </li>
                  ))}
                </div>
              </div>

              <div className="beheer-zones-blok">
                <h2>Zones beheren</h2>

                <div className="nieuwe-zone">
                  <input
                    type="text"
                    placeholder="Naam van zone"
                    value={nieuweZoneNaam}
                    onChange={(e) => setNieuweZoneNaam(e.target.value)}
                  />

                  <input
                    type="number"
                    placeholder="Capaciteit"
                    value={nieuweCapaciteit}
                    onChange={(e) => setNieuweCapaciteit(e.target.value)}
                  />

                  <button onClick={voegZoneToe}>Voeg zone toe</button>
                </div>

                <ZoneLijst
                  zones={zones}
                  actieveZoneId={actieveZoneId}
                  actiefTelmoment={actiefTelmoment}
                  krijgNummerplaten={krijgNummerplaten}
                  telmomentLabel={telmomentLabel}
                  bepaalKleur={bepaalKleur}
                  selecteerZone={selecteerZone}
                  toggleZoneOpen={toggleZoneOpen}
                  isBeheerder={isBeheerder}
                  isInvuller={isInvuller}
                  tekenmodus={tekenmodus}
                  setTekenmodus={setTekenmodus}
                  setBewerkmodusZoneId={setBewerkmodusZoneId}
                  setActieveZoneId={setActieveZoneId}
                  verwijderLaatstePunt={verwijderLaatstePunt}
                  toggleBewerkmodus={toggleBewerkmodus}
                  wisPolygoon={wisPolygoon}
                  verwijderZone={verwijderZone}
                  bewerkmodusZoneId={bewerkmodusZoneId}
                  wijzigInvoer={wijzigInvoer}
                  voegNummerplaatToe={voegNummerplaatToe}
                  verwijderNummerplaat={verwijderNummerplaat}
                />
              </div>
            </>
          )}

          {(isInvuller || isAnalist) && (
            <div className="statusbalk">
              <strong>Telmoment selecteren</strong>
              <br />
              <select
                value={actiefTelmomentId || ""}
                onChange={(e) => setActiefTelmomentId(Number(e.target.value))}
              >
                {telmomenten.map((telmoment) => (
                  <option value={telmoment.id} key={telmoment.id}>
                    {telmomentLabel(telmoment)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isAnalist && (
            <>
              <div className="statusbalk">
                <strong>Analyse-overzicht huidig telmoment</strong>
                <br />
                Aantal zones: {zones.length}
                <br />
                Totaal aantal geregistreerde voertuigen:{" "}
                {totaalVoertuigenActiefTelmoment}
                <br />
                Totale capaciteit: {totaleCapaciteit}
                <br />
                Totale bezettingsgraad: {totaleBezettingsgraad}%
              </div>

              <div className="taart-grid taart-grid-overzicht">
                <Taartdiagram
                  titel="Totale bezettingsgraad"
                  subtitel="Alle zones samen"
                  percentage={totaleBezettingsgraad}
                  kleur={bepaalKaartKleur(totaleBezettingsgraad)}
                  middenTekst={`${totaalVoertuigenActiefTelmoment}/${totaleCapaciteit}`}
                />

                <VerdelingTaartdiagram
                  titel="Verdeling gebruikte plaatsen per zone"
                  data={verdelingPerZone}
                />
              </div>

<div className="taart-grid taart-grid-zones">
  {zones.map((zone) => {
    const aantal = krijgNummerplaten(zone).length;
    const bezettingsgraad =
      zone.capaciteit > 0
        ? Math.round((aantal / zone.capaciteit) * 100)
        : 0;

    return (
      <Taartdiagram
        key={zone.id}
        titel={zone.naam}
        subtitel={`Capaciteit: ${zone.capaciteit}`}
        percentage={bezettingsgraad}
        kleur={bepaalKaartKleur(bezettingsgraad)}
        middenTekst={`${aantal}/${zone.capaciteit}`}
      />
    );
  })}
</div>

<div className="statusbalk">
  <label className="kaarttaart-toggle">
    <input
      type="checkbox"
      checked={toonKaartTaarten}
      onChange={(e) => setToonKaartTaarten(e.target.checked)}
    />
    Toon taartdiagrammen op kaart
  </label>
</div>

              <div className="statusbalk">
                <strong>Zones in lijngrafiek</strong>

                <div className="zone-checkboxes">
                  {zones.map((zone) => (
                    <label key={zone.id}>
                      <input
                        type="checkbox"
                        checked={geselecteerdeAnalistZones.includes(zone.id)}
                        onChange={() => toggleAnalistZone(zone.id)}
                      />
                      {zone.naam}
                    </label>
                  ))}
                </div>
              </div>

              <Lijngrafiek
                zones={zones}
                telmomenten={telmomenten}
                geselecteerdeZoneIds={geselecteerdeAnalistZones}
                krijgNummerplaten={krijgNummerplaten}
              />

              <RotatieAnalyse
                zones={zones}
                telmomenten={telmomenten}
                krijgNummerplaten={krijgNummerplaten}
                kleurGrenzen={kleurGrenzen}
              />
            </>
          )}

          {isInvuller && (
            <ZoneLijst
              zones={zones}
              actieveZoneId={actieveZoneId}
              actiefTelmoment={actiefTelmoment}
              krijgNummerplaten={krijgNummerplaten}
              telmomentLabel={telmomentLabel}
              bepaalKleur={bepaalKleur}
              selecteerZone={selecteerZone}
              toggleZoneOpen={toggleZoneOpen}
              isBeheerder={isBeheerder}
              isInvuller={isInvuller}
              tekenmodus={tekenmodus}
              setTekenmodus={setTekenmodus}
              setBewerkmodusZoneId={setBewerkmodusZoneId}
              setActieveZoneId={setActieveZoneId}
              verwijderLaatstePunt={verwijderLaatstePunt}
              toggleBewerkmodus={toggleBewerkmodus}
              wisPolygoon={wisPolygoon}
              verwijderZone={verwijderZone}
              bewerkmodusZoneId={bewerkmodusZoneId}
              wijzigInvoer={wijzigInvoer}
              voegNummerplaatToe={voegNummerplaatToe}
              verwijderNummerplaat={verwijderNummerplaat}
            />
          )}
        </section>

        <section className="kaartkolom">
          <MapContainer
            center={[51.2686, 4.7123]}
            zoom={15}
            className="kaart"
            doubleClickZoom={false}
          >
            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Standaardkaart">
                <TileLayer
                  attribution="&copy; OpenStreetMap contributors"
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>

              <LayersControl.BaseLayer name="Grijstinten">
                <TileLayer
                  attribution="&copy; CartoDB &copy; OpenStreetMap contributors"
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                />
              </LayersControl.BaseLayer>

              <LayersControl.BaseLayer name="Luchtfoto">
                <TileLayer
                  attribution="Tiles &copy; Esri"
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            {isBeheerder && (
              <KlikbareKaart
                tekenmodus={tekenmodus}
                voegPuntToe={voegPuntToe}
              />
            )}

            {zones.map((zone) => {
              if (zone.polygoon.length < 3) return null;

              const aantal = krijgNummerplaten(zone).length;
              const bezettingsgraad =
                zone.capaciteit > 0
                  ? Math.round((aantal / zone.capaciteit) * 100)
                  : 0;

              return (
                <Polygon
                  key={zone.id}
                  positions={zone.polygoon}
                  pathOptions={{
                    color: bepaalKaartKleur(bezettingsgraad),
                    fillOpacity: actieveZoneId === zone.id ? 0.45 : 0.2,
                    weight: actieveZoneId === zone.id ? 4 : 2,
                  }}
                  eventHandlers={{
                    click: () => selecteerZone(zone.id),
                    dblclick: (e) => {
                      if (isBeheerder && bewerkmodusZoneId === zone.id) {
                        voegPuntToeOpDichtsteZijde(zone.id, [
                          e.latlng.lat,
                          e.latlng.lng,
                        ]);
                      }
                    },
                  }}
                >
                  <Popup>
                    <strong>{zone.naam}</strong>
                    <br />
                    Telmoment: {telmomentLabel(actiefTelmoment)}
                    <br />
                    Capaciteit: {zone.capaciteit}
                    <br />
                    Voertuigen: {aantal}
                    <br />
                    Bezettingsgraad: {bezettingsgraad}%
                  </Popup>
                </Polygon>
              );
            })}

          {isAnalist &&
            toonKaartTaarten &&
            zones.map((zone) => {
              if (zone.polygoon.length < 3) return null;

              const aantallen = telmomenten.map((telmoment) =>
                krijgNummerplaten(zone, telmoment.id).length
              );

              const totaal = aantallen.reduce((som, aantal) => som + aantal, 0);

              return (
                <Marker
                  key={`mini-taart-${zone.id}`}
                  position={berekenCentrum(zone.polygoon)}
                  icon={maakMiniTaartIcon(zone)}
                >
                  <Tooltip direction="top" offset={[0, -12]} opacity={1}>
                    <div className="mini-taart-tooltip">
                      <strong>{zone.naam}</strong>
                      <br />
                      Totaal gebruik over alle telmomenten: <strong>{totaal}</strong>

                      <div className="mini-taart-legende">
                        {telmomenten.map((telmoment, index) => {
                          const aantal = aantallen[index];
                          const aandeel =
                            totaal > 0 ? Math.round((aantal / totaal) * 100) : 0;

                          return (
                            <div key={telmoment.id}>
                              <span
                                className="legende-kleur"
                                style={{
                                  background:
                                    grafiekKleuren[index % grafiekKleuren.length],
                                }}
                              />
                              {telmoment.datum ? `${telmoment.datum} — ` : ""}
                              {telmoment.tijdstip}: {aantal} ({aandeel}%)
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </Tooltip>
                </Marker>
              );
            })}

            {isBeheerder &&
              zones.map((zone) => {
                if (bewerkmodusZoneId !== zone.id) return null;

                return zone.polygoon.map((punt, index) => (
                  <Marker
                    key={`${zone.id}-${index}`}
                    position={punt}
                    icon={puntIcon}
                    draggable={true}
                    eventHandlers={{
                      dragend: (e) => {
                        const nieuwPunt = e.target.getLatLng();

                        verplaatsPunt(zone.id, index, [
                          nieuwPunt.lat,
                          nieuwPunt.lng,
                        ]);
                      },
                    }}
                  />
                ));
              })}
          </MapContainer>
        </section>
      </div>
    </div>
  );
}

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

export default App;