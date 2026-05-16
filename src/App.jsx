import { useEffect, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

import BeheerderDashboard from "./components/BeheerderDashboard";
import AnalistDashboard from "./components/AnalistDashboard";
import InvullerDashboard from "./components/InvullerDashboard";
import ParkeerKaart from "./components/ParkeerKaart";

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

      return bewaardeSelectie ? JSON.parse(bewaardeSelectie) : zones.map((zone) => zone.id);
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

  const actieveZone = zones.find((zone) => zone.id === actieveZoneId);

  const actiefTelmoment = telmomenten.find(
    (telmoment) => telmoment.id === actiefTelmomentId
  );

  const isBeheerder = rol === "beheerder";
  const isInvuller = rol === "invuller";
  const isAnalist = rol === "analist";

  function wijzigRol(nieuweRol) {
    setRol(nieuweRol);

    if (nieuweRol !== "beheerder") {
      setTekenmodus(false);
      setBewerkmodusZoneId(null);
    }
  }

  function krijgNummerplaten(zone, telmomentId = actiefTelmomentId) {
    return zone.tellingen?.[telmomentId] || [];
  }

  function krijgVoorgesteldeNummerplaten(zone) {
    const actiefIndex = telmomenten.findIndex(
      (telmoment) => telmoment.id === actiefTelmomentId
    );

    if (actiefIndex <= 0) return [];

    const huidigeNummerplaten = new Set(krijgNummerplaten(zone));
    const suggesties = [];
    const gezien = new Set();

    telmomenten
      .slice(0, actiefIndex)
      .reverse()
      .forEach((telmoment) => {
        krijgNummerplaten(zone, telmoment.id).forEach((plaat) => {
          if (!huidigeNummerplaten.has(plaat) && !gezien.has(plaat)) {
            suggesties.push(plaat);
            gezien.add(plaat);
          }
        });
      });

    return suggesties;
  }

  function telmomentLabel(telmoment) {
    if (!telmoment) return "geen telmoment";

    const datumDeel = telmoment.datum ? `${telmoment.datum} — ` : "";

    return `${datumDeel}${telmoment.naam} (${telmoment.tijdstip})`;
  }

  function bepaalKleurNaam(bezettingsgraad) {
    if (bezettingsgraad < kleurGrenzen.lichtgrijsTot) return "lichtgrijs";
    if (bezettingsgraad < kleurGrenzen.groenTot) return "groen";
    if (bezettingsgraad < kleurGrenzen.oranjeTot) return "oranje";
    return "rood";
  }

  function bepaalKleur(bezettingsgraad) {
    return bepaalKleurNaam(bezettingsgraad);
  }

  function bepaalKaartKleur(bezettingsgraad) {
    return KLEUREN[bepaalKleurNaam(bezettingsgraad)];
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

  function voegNummerplaatToe(zoneId, voorgesteldePlaat = null) {
    if (!isInvuller) return;

    if (!actiefTelmomentId) {
      alert("Selecteer eerst een telmoment.");
      return;
    }

    setZones(
      zones.map((zone) => {
        if (zone.id !== zoneId) return zone;

        const plaat = (voorgesteldePlaat || zone.invoer).trim().toUpperCase();
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
          invoer: voorgesteldePlaat ? zone.invoer : "",
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
      } catch {
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
          onClick={() => wijzigRol("beheerder")}
        >
          Beheerder
        </button>

        <button
          className={rol === "invuller" ? "rol-actief" : ""}
          onClick={() => wijzigRol("invuller")}
        >
          Invuller
        </button>

        <button
          className={rol === "analist" ? "rol-actief" : ""}
          onClick={() => wijzigRol("analist")}
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
            <BeheerderDashboard
              KLEUREN={KLEUREN}
              kleurGrenzen={kleurGrenzen}
              pasLichtgrijsGrensAan={pasLichtgrijsGrensAan}
              pasGroenGrensAan={pasGroenGrensAan}
              pasOranjeGrensAan={pasOranjeGrensAan}
              telmomenten={telmomenten}
              nieuwTelmomentNaam={nieuwTelmomentNaam}
              setNieuwTelmomentNaam={setNieuwTelmomentNaam}
              nieuwTelmomentDatum={nieuwTelmomentDatum}
              setNieuwTelmomentDatum={setNieuwTelmomentDatum}
              nieuwTelmomentTijdstip={nieuwTelmomentTijdstip}
              setNieuwTelmomentTijdstip={setNieuwTelmomentTijdstip}
              voegTelmomentToe={voegTelmomentToe}
              verwijderTelmoment={verwijderTelmoment}
              nieuweZoneNaam={nieuweZoneNaam}
              setNieuweZoneNaam={setNieuweZoneNaam}
              nieuweCapaciteit={nieuweCapaciteit}
              setNieuweCapaciteit={setNieuweCapaciteit}
              voegZoneToe={voegZoneToe}
              zones={zones}
              actieveZoneId={actieveZoneId}
              actiefTelmoment={actiefTelmoment}
              krijgNummerplaten={krijgNummerplaten}
              krijgVoorgesteldeNummerplaten={krijgVoorgesteldeNummerplaten}
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

          {isInvuller && (
            <InvullerDashboard
              telmomenten={telmomenten}
              actiefTelmomentId={actiefTelmomentId}
              setActiefTelmomentId={setActiefTelmomentId}
              telmomentLabel={telmomentLabel}
              zones={zones}
              actieveZoneId={actieveZoneId}
              actiefTelmoment={actiefTelmoment}
              krijgNummerplaten={krijgNummerplaten}
              krijgVoorgesteldeNummerplaten={krijgVoorgesteldeNummerplaten}
              bepaalKleur={bepaalKleur}
              selecteerZone={selecteerZone}
              toggleZoneOpen={toggleZoneOpen}
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

          {isAnalist && (
            <AnalistDashboard
              zones={zones}
              telmomenten={telmomenten}
              actiefTelmomentId={actiefTelmomentId}
              setActiefTelmomentId={setActiefTelmomentId}
              telmomentLabel={telmomentLabel}
              krijgNummerplaten={krijgNummerplaten}
              totaalVoertuigenActiefTelmoment={totaalVoertuigenActiefTelmoment}
              totaleCapaciteit={totaleCapaciteit}
              totaleBezettingsgraad={totaleBezettingsgraad}
              verdelingPerZone={verdelingPerZone}
              bepaalKaartKleur={bepaalKaartKleur}
              grafiekKleuren={grafiekKleuren}
              geselecteerdeAnalistZones={geselecteerdeAnalistZones}
              toggleAnalistZone={toggleAnalistZone}
              toonKaartTaarten={toonKaartTaarten}
              setToonKaartTaarten={setToonKaartTaarten}
              kleurGrenzen={kleurGrenzen}
            />
          )}
        </section>

        <ParkeerKaart
          zones={zones}
          telmomenten={telmomenten}
          actiefTelmoment={actiefTelmoment}
          actieveZoneId={actieveZoneId}
          bewerkmodusZoneId={bewerkmodusZoneId}
          isBeheerder={isBeheerder}
          isAnalist={isAnalist}
          toonKaartTaarten={toonKaartTaarten}
          tekenmodus={tekenmodus}
          puntIcon={puntIcon}
          grafiekKleuren={grafiekKleuren}
          krijgNummerplaten={krijgNummerplaten}
          telmomentLabel={telmomentLabel}
          bepaalKaartKleur={bepaalKaartKleur}
          selecteerZone={selecteerZone}
          voegPuntToe={voegPuntToe}
          voegPuntToeOpDichtsteZijde={voegPuntToeOpDichtsteZijde}
          verplaatsPunt={verplaatsPunt}
        />
      </div>
    </div>
  );
}

export default App;
