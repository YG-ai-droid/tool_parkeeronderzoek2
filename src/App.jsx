import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

import BeheerderDashboard from "./components/BeheerderDashboard";
import AnalistDashboard from "./components/AnalistDashboard";
import InvullerDashboard from "./components/InvullerDashboard";
import ParkeerKaart from "./components/ParkeerKaart";
import KleurcodeInstellingen from "./components/KleurcodeInstellingen";
import {
  formatBelgischeDatum,
  formatBelgischeDatumOptioneel,
} from "./utils/datum";

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

const parkeerRegimes = [
  "vrij parkeren",
  "blauwe zone",
  "bewonerskaart",
  "betalend parkeren",
  "laadpaal",
  "gehandicapten",
  "laad- en loszone",
  "kiss&ride",
  "carpoolparking",
  "vracht",
];

const regimesMetMaxDuur = ["blauwe zone", "betalend parkeren", "laadpaal"];

const standaardKleurGrenzen = {
  lichtgrijsTot: 40,
  groenTot: 70,
  oranjeTot: 85,
};

const standaardTelmomenten = [
  {
    id: 1,
    naam: "Telmoment 1",
    datum: "",
    tijdstip: "09:00",
  },
];

const standaardZones = [
  {
    id: 1,
    naam: "Kerkstraat",
    capaciteit: 20,
    invoer: "",
    polygoon: [],
    parkeerRegime: "vrij parkeren",
    maxParkeerduur: "",
    tellingen: {
      1: [],
    },
  },
];

const MAX_BACKUP_GROOTTE_BYTES = 10 * 1024 * 1024;
const MAX_ZONES = 1000;
const MAX_TELMOMENTEN = 500;
const MAX_NUMMERPLATEN_PER_TELLING = 5000;
const MAX_TEKST_LENGTE = 120;
const MAX_NUMMERPLAAT_LENGTE = 20;
const MAX_EXCEL_GROOTTE_BYTES = 5 * 1024 * 1024;
const EXCEL_TEMPLATE_KOLOMMEN = 9;

function beperkTekst(waarde, fallback = "") {
  return String(waarde ?? fallback).trim().slice(0, MAX_TEKST_LENGTE);
}

function normaliseerNummerplaat(waarde) {
  return String(waarde ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, MAX_NUMMERPLAAT_LENGTE);
}

function isVersleuteldeNummerplaat(waarde) {
  return /^ENC[A-F0-9]{16}$/.test(normaliseerNummerplaat(waarde));
}

function escapeXml(waarde) {
  return String(waarde ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function maakExcelCel(waarde, type = "String") {
  return `<Cell><Data ss:Type="${type}">${escapeXml(waarde)}</Data></Cell>`;
}

function maakExcelRij(waarden, type = "String") {
  return `<Row>${waarden.map((waarde) => maakExcelCel(waarde, type)).join("")}</Row>`;
}

function normaliseerExcelSleutel(waarde) {
  return String(waarde ?? "").trim().toLowerCase();
}

function maakTelmomentExcelSleutel(telmoment) {
  return [
    normaliseerExcelSleutel(telmoment.naam),
    normaliseerExcelSleutel(formatBelgischeDatumOptioneel(telmoment.datum)),
    normaliseerExcelSleutel(telmoment.tijdstip),
  ].join("::");
}

function maakZoneExcelSleutel(zone) {
  return [
    normaliseerExcelSleutel(zone.naam),
    normaliseerExcelSleutel(zone.capaciteit),
    normaliseerExcelSleutel(zone.parkeerRegime || "vrij parkeren"),
  ].join("::");
}

function maakExcelTemplateXml({ projectNaam, telmomenten, zones }) {
  const rijen = [
    maakExcelRij([
      "Project",
      "Telmoment",
      "Datum",
      "Tijdstip",
      "Tellocatie",
      "Capaciteit",
      "Parkeerregime",
      "Parkeervak",
      "Nummerplaat",
    ]),
  ];

  telmomenten.forEach((telmoment) => {
    zones.forEach((zone) => {
      const aantalVakjes = Math.min(
        MAX_NUMMERPLATEN_PER_TELLING,
        Math.max(10, Math.ceil(Number(zone.capaciteit || 0) * 1.15), Number(zone.capaciteit || 0) + 5)
      );

      for (let index = 1; index <= aantalVakjes; index += 1) {
        rijen.push(
          maakExcelRij([
            projectNaam,
            telmoment.naam,
            formatBelgischeDatumOptioneel(telmoment.datum),
            telmoment.tijdstip,
            zone.naam,
            zone.capaciteit,
            zone.parkeerRegime || "vrij parkeren",
            index,
            "",
          ])
        );
      }
    });
  });

  return `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="kop">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#D9EAF7" ss:Pattern="Solid"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="Nummerplaten">
    <Table ss:ExpandedColumnCount="${EXCEL_TEMPLATE_KOLOMMEN}" ss:ExpandedRowCount="${rijen.length}">
      ${rijen.join("\n      ")}
    </Table>
  </Worksheet>
</Workbook>`;
}

function sanitiseerBestandsnaam(waarde) {
  return String(waarde ?? "project")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "project";
}

function maakEncryptieSalt() {
  const waarden = new Uint8Array(16);
  crypto.getRandomValues(waarden);
  return Array.from(waarden, (waarde) => waarde.toString(16).padStart(2, "0")).join("");
}

function normaliseerId(waarde, fallback) {
  if (waarde === null || waarde === undefined || waarde === "") return fallback;

  const id = Number(waarde);
  return Number.isFinite(id) ? id : fallback;
}

function isGeldigeDatumWaarde(datum) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(datum || "")) return false;

  const [jaar, maand, dag] = datum.split("-").map(Number);
  const datumObject = new Date(`${datum}T00:00:00`);
  return (
    !Number.isNaN(datumObject.getTime()) &&
    datumObject.getFullYear() === jaar &&
    datumObject.getMonth() + 1 === maand &&
    datumObject.getDate() === dag
  );
}

function isGeldigeTijdWaarde(tijdstip) {
  if (!/^\d{2}:\d{2}$/.test(tijdstip || "")) return false;

  const [uren, minuten] = tijdstip.split(":").map(Number);
  return uren >= 0 && uren <= 23 && minuten >= 0 && minuten <= 59;
}

function normaliseerCapaciteit(waarde) {
  const capaciteit = Number(waarde);
  if (!Number.isFinite(capaciteit)) return 0;
  return Math.max(0, Math.min(100000, Math.round(capaciteit)));
}

function normaliseerPolygoon(polygoon) {
  if (!Array.isArray(polygoon)) return [];

  return polygoon
    .map((punt) => {
      if (!Array.isArray(punt) || punt.length < 2) return null;

      const lat = Number(punt[0]);
      const lng = Number(punt[1]);
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        return null;
      }

      return [lat, lng];
    })
    .filter(Boolean)
    .slice(0, 500);
}

function normaliseerTellingen(tellingen, geldigeTelmomentIds = null) {
  if (!tellingen || typeof tellingen !== "object") return {};

  return Object.fromEntries(
    Object.entries(tellingen)
      .filter(
        ([telmomentId]) =>
          !geldigeTelmomentIds || geldigeTelmomentIds.has(String(telmomentId))
      )
      .map(([telmomentId, platen]) => [
        telmomentId,
        Array.isArray(platen)
          ? [
              ...new Set(
                platen
                  .map(normaliseerNummerplaat)
                  .filter(Boolean)
                  .slice(0, MAX_NUMMERPLATEN_PER_TELLING)
              ),
            ]
          : [],
      ])
  );
}

function normaliseerZones(zones, geldigeTelmomentIds = null) {
  if (!Array.isArray(zones)) return standaardZones;

  return zones.slice(0, MAX_ZONES).map((zone, index) => {
    const id = normaliseerId(zone?.id, Date.now() + index);
    const parkeerRegime = parkeerRegimes.includes(zone?.parkeerRegime)
      ? zone.parkeerRegime
      : "vrij parkeren";

    if (zone?.tellingen) {
      return {
        ...zone,
        id,
        naam: beperkTekst(zone.naam, `Zone ${index + 1}`),
        capaciteit: normaliseerCapaciteit(zone.capaciteit),
        invoer: normaliseerNummerplaat(zone.invoer),
        polygoon: normaliseerPolygoon(zone.polygoon),
        parkeerRegime,
        maxParkeerduur: beperkTekst(zone.maxParkeerduur),
        tellingen: normaliseerTellingen(zone.tellingen, geldigeTelmomentIds),
      };
    }

    return {
      ...zone,
      id,
      naam: beperkTekst(zone.naam, `Zone ${index + 1}`),
      capaciteit: normaliseerCapaciteit(zone.capaciteit),
      invoer: "",
      polygoon: normaliseerPolygoon(zone.polygoon),
      parkeerRegime,
      maxParkeerduur: beperkTekst(zone.maxParkeerduur),
      tellingen: {
        1: Array.isArray(zone.nummerplaten)
          ? zone.nummerplaten.map(normaliseerNummerplaat).filter(Boolean)
          : [],
      },
    };
  });
}

function normaliseerTelmomenten(telmomenten) {
  if (!Array.isArray(telmomenten)) return standaardTelmomenten;

  return telmomenten.slice(0, MAX_TELMOMENTEN).map((telmoment, index) => ({
    ...telmoment,
    id: normaliseerId(telmoment?.id, Date.now() + index),
    naam: beperkTekst(telmoment?.naam, `Telmoment ${index + 1}`),
    datum: isGeldigeDatumWaarde(telmoment?.datum)
      ? telmoment.datum
      : "",
    tijdstip: isGeldigeTijdWaarde(telmoment?.tijdstip)
      ? telmoment.tijdstip
      : "09:00",
  }));
}

function leesJsonSleutel(sleutel, standaardWaarde) {
  const waarde = localStorage.getItem(sleutel);
  if (!waarde) return standaardWaarde;

  try {
    return JSON.parse(waarde);
  } catch {
    return standaardWaarde;
  }
}

function maakLeegProjectData() {
  return {
    kleurGrenzen: standaardKleurGrenzen,
    telmomenten: standaardTelmomenten,
    actiefTelmomentId: 1,
    zones: standaardZones,
    actieveZoneId: 1,
    clusters: [],
    actiefClusterId: null,
    openClusterId: null,
    geselecteerdeAnalistZones: standaardZones.map((zone) => zone.id),
    geselecteerdeAnalistClusters: [],
    parkeerProfielen: [],
    analyseModus: "telmoment",
    analyseObjectType: "zone",
    analyseObjectId: standaardZones[0].id,
    actiefProfielId: null,
    analistRegimeFilter: "",
    nummerplaatEncryptieSalt: "",
  };
}

function normaliseerKleurGrenzen(kleurGrenzen) {
  const lichtgrijsTot = Math.min(
    Math.max(Number(kleurGrenzen?.lichtgrijsTot) || 40, 0),
    98
  );
  const groenTot = Math.min(
    Math.max(Number(kleurGrenzen?.groenTot) || 70, lichtgrijsTot + 1),
    99
  );
  const oranjeTot = Math.min(
    Math.max(Number(kleurGrenzen?.oranjeTot) || 85, groenTot + 1),
    100
  );

  return {
    lichtgrijsTot,
    groenTot,
    oranjeTot,
  };
}

function normaliseerClusters(clusters, zones) {
  if (!Array.isArray(clusters)) return [];

  const zoneIds = new Set(zones.map((zone) => zone.id));

  return clusters.slice(0, MAX_ZONES).map((cluster, index) => ({
    ...cluster,
    id: normaliseerId(cluster?.id, Date.now() + index),
    naam: beperkTekst(cluster?.naam, `Cluster ${index + 1}`),
    zoneIds: Array.isArray(cluster?.zoneIds)
      ? cluster.zoneIds.map(Number).filter((zoneId) => zoneIds.has(zoneId))
      : [],
  }));
}

function normaliseerParkeerProfielen(parkeerProfielen) {
  if (!Array.isArray(parkeerProfielen)) return [];

  return parkeerProfielen.slice(0, 200).map((profiel, index) => ({
    ...profiel,
    id: normaliseerId(profiel?.id, Date.now() + index),
    naam: beperkTekst(profiel?.naam, `Profiel ${index + 1}`),
    vensterStart: isGeldigeTijdWaarde(profiel?.vensterStart)
      ? profiel.vensterStart
      : "",
    vensterEinde: isGeldigeTijdWaarde(profiel?.vensterEinde)
      ? profiel.vensterEinde
      : "",
    minDuur: Math.max(1, Math.round(Number(profiel?.minDuur) || 1)),
    maxDuur: profiel?.maxDuur
      ? Math.max(1, Math.round(Number(profiel.maxDuur) || 1))
      : "",
  }));
}

function normaliseerEncryptieSalt(waarde) {
  return /^[a-f0-9]{32}$/i.test(String(waarde || "")) ? String(waarde) : "";
}

function normaliseerProjectData(data) {
  const telmomenten = normaliseerTelmomenten(
    data?.telmomenten || standaardTelmomenten
  );
  const geldigeTelmomentIds = new Set(
    telmomenten.map((telmoment) => String(telmoment.id))
  );
  const zones = normaliseerZones(data?.zones || standaardZones, geldigeTelmomentIds);
  const clusters = normaliseerClusters(data?.clusters || [], zones);
  const parkeerProfielen = normaliseerParkeerProfielen(data?.parkeerProfielen);
  const analyseObjectType =
    data?.analyseObjectType === "cluster" ? "cluster" : "zone";
  const analyseObjecten = analyseObjectType === "cluster" ? clusters : zones;
  const actieveZoneId = normaliseerId(data?.actieveZoneId, zones[0]?.id || null);
  const actiefClusterId = normaliseerId(data?.actiefClusterId, null);
  const openClusterId = normaliseerId(data?.openClusterId, null);
  const actiefTelmomentId =
    data?.actiefTelmomentId === "gemiddelde"
      ? "gemiddelde"
      : normaliseerId(data?.actiefTelmomentId, telmomenten[0]?.id || null);
  const analyseObjectId = normaliseerId(
    data?.analyseObjectId,
    analyseObjecten[0]?.id || null
  );
  const actiefProfielId = normaliseerId(data?.actiefProfielId, null);
  const geselecteerdeAnalistZones = Array.isArray(data?.geselecteerdeAnalistZones)
    ? data.geselecteerdeAnalistZones.map(Number).filter((zoneId) =>
        zones.some((zone) => zone.id === zoneId)
      )
    : zones.map((zone) => zone.id);

  return {
    kleurGrenzen: normaliseerKleurGrenzen(data?.kleurGrenzen),
    telmomenten,
    actiefTelmomentId:
      actiefTelmomentId === "gemiddelde" ||
      telmomenten.some((telmoment) => telmoment.id === actiefTelmomentId)
        ? actiefTelmomentId
        : telmomenten[0]?.id || null,
    zones,
    actieveZoneId: zones.some((zone) => zone.id === actieveZoneId)
      ? actieveZoneId
      : zones[0]?.id || null,
    clusters,
    actiefClusterId: clusters.some((cluster) => cluster.id === actiefClusterId)
      ? actiefClusterId
      : null,
    openClusterId: clusters.some((cluster) => cluster.id === openClusterId)
      ? openClusterId
      : null,
    geselecteerdeAnalistZones,
    geselecteerdeAnalistClusters:
      Array.isArray(data?.geselecteerdeAnalistClusters)
        ? data.geselecteerdeAnalistClusters
            .map(Number)
            .filter((clusterId) =>
              clusters.some((cluster) => cluster.id === clusterId)
            )
        : clusters.map((cluster) => cluster.id),
    parkeerProfielen,
    analyseModus: ["telmoment", "object", "profiel", "herhaling"].includes(
      data?.analyseModus
    )
      ? data.analyseModus
      : "telmoment",
    analyseObjectType,
    analyseObjectId: analyseObjecten.some((object) => object.id === analyseObjectId)
      ? analyseObjectId
      : analyseObjecten[0]?.id || null,
    actiefProfielId: parkeerProfielen.some(
      (profiel) => profiel.id === actiefProfielId
    )
      ? actiefProfielId
      : null,
    analistRegimeFilter: parkeerRegimes.includes(data?.analistRegimeFilter)
      ? data.analistRegimeFilter
      : "",
    nummerplaatEncryptieSalt: normaliseerEncryptieSalt(
      data?.nummerplaatEncryptieSalt
    ),
  };
}

function valideerBackupVoorImport(backup) {
  if (!backup || typeof backup !== "object") {
    throw new Error("De back-up heeft geen geldige structuur.");
  }

  if (!Array.isArray(backup.zones) || !Array.isArray(backup.telmomenten)) {
    throw new Error("De back-up mist zones of telmomenten.");
  }

  if (backup.zones.length === 0 || backup.telmomenten.length === 0) {
    throw new Error("De back-up bevat geen zones of telmomenten.");
  }

  if (backup.zones.length > MAX_ZONES) {
    throw new Error(`De back-up bevat meer dan ${MAX_ZONES} zones.`);
  }

  if (backup.telmomenten.length > MAX_TELMOMENTEN) {
    throw new Error(
      `De back-up bevat meer dan ${MAX_TELMOMENTEN} telmomenten.`
    );
  }

  const zoneIds = backup.zones
    .map((zone) => normaliseerId(zone?.id, null))
    .filter((id) => id !== null);
  const telmomentIds = backup.telmomenten
    .map((telmoment) => normaliseerId(telmoment?.id, null))
    .filter((id) => id !== null);

  if (new Set(zoneIds).size !== zoneIds.length) {
    throw new Error("De back-up bevat dubbele zone-ID's.");
  }

  if (new Set(telmomentIds).size !== telmomentIds.length) {
    throw new Error("De back-up bevat dubbele telmoment-ID's.");
  }

  return normaliseerProjectData(backup);
}

function leesLegacyProjectData() {
  const data = {
    kleurGrenzen: leesJsonSleutel("kleurGrenzen", standaardKleurGrenzen),
    telmomenten: leesJsonSleutel("telmomenten", standaardTelmomenten),
    actiefTelmomentId: Number(localStorage.getItem("actiefTelmomentId")) || 1,
    zones: leesJsonSleutel("parkeerZones", standaardZones),
    actieveZoneId: Number(localStorage.getItem("actieveZoneId")) || 1,
    clusters: leesJsonSleutel("parkeerClusters", []),
    actiefClusterId: Number(localStorage.getItem("actiefClusterId")) || null,
    openClusterId: Number(localStorage.getItem("openClusterId")) || null,
    geselecteerdeAnalistZones: leesJsonSleutel(
      "geselecteerdeAnalistZones",
      null
    ),
    geselecteerdeAnalistClusters: leesJsonSleutel(
      "geselecteerdeAnalistClusters",
      null
    ),
  };

  return normaliseerProjectData(data);
}

function maakNieuwProject(naam, data = maakLeegProjectData()) {
  return {
    id: Date.now(),
    naam,
    aangemaaktOp: new Date().toISOString(),
    data: normaliseerProjectData(data),
  };
}

function leesProjecten() {
  const bewaardeProjecten = leesJsonSleutel("parkeerProjecten", null);
  if (bewaardeProjecten?.length > 0) {
    return bewaardeProjecten.map((project) => ({
      ...project,
      data: normaliseerProjectData(project.data),
    }));
  }

  return [
    {
      id: 1,
      naam: "Project 1",
      aangemaaktOp: new Date().toISOString(),
      data: leesLegacyProjectData(),
    },
  ];
}

function App() {
  const [rol, setRol] = useState("beheerder");
  const [toonKaartTaarten, setToonKaartTaarten] = useState(true);
  const [linkerKolomBreedte, setLinkerKolomBreedte] = useState(() => {
    const bewaardeBreedte = Number(localStorage.getItem("linkerKolomBreedte"));
    return bewaardeBreedte || 42;
  });
  const [projecten, setProjecten] = useState(leesProjecten);
  const [actiefProjectId, setActiefProjectId] = useState(() => {
    const bewaardProjectId = Number(localStorage.getItem("actiefProjectId"));
    const beschikbareProjecten = leesProjecten();

    return (
      beschikbareProjecten.find((project) => project.id === bewaardProjectId)
        ?.id || beschikbareProjecten[0].id
    );
  });
  const [nieuweProjectNaam, setNieuweProjectNaam] = useState("");
  const projectLadenRef = useRef(false);
  const layoutRef = useRef(null);
  const actiefProject =
    projecten.find((project) => project.id === actiefProjectId) ||
    projecten[0];
  const eersteProjectData = actiefProject.data;

  const [kleurGrenzen, setKleurGrenzen] = useState(() => {
    return eersteProjectData.kleurGrenzen;
  });

  const [telmomenten, setTelmomenten] = useState(() => {
    return eersteProjectData.telmomenten;
  });

  const [actiefTelmomentId, setActiefTelmomentId] = useState(() => {
    return eersteProjectData.actiefTelmomentId;
  });

  const [nieuwTelmomentNaam, setNieuwTelmomentNaam] = useState("");
  const [nieuwTelmomentDatum, setNieuwTelmomentDatum] = useState("");
  const [nieuwTelmomentTijdstip, setNieuwTelmomentTijdstip] = useState("");

  const [zones, setZones] = useState(() => {
    return eersteProjectData.zones;
  });

  const [actieveZoneId, setActieveZoneId] = useState(() => {
    return eersteProjectData.actieveZoneId;
  });

  const [clusters, setClusters] = useState(() => {
    return eersteProjectData.clusters;
  });

  const [actiefClusterId, setActiefClusterId] = useState(() => {
    return eersteProjectData.actiefClusterId;
  });

  const [openClusterId, setOpenClusterId] = useState(() => {
    return eersteProjectData.openClusterId;
  });

  const [geselecteerdeAnalistZones, setGeselecteerdeAnalistZones] = useState(
    () => {
      return eersteProjectData.geselecteerdeAnalistZones;
    }
  );

  const [geselecteerdeAnalistClusters, setGeselecteerdeAnalistClusters] =
    useState(() => {
      return eersteProjectData.geselecteerdeAnalistClusters;
    });
  const [parkeerProfielen, setParkeerProfielen] = useState(() => {
    return eersteProjectData.parkeerProfielen;
  });
  const [analyseModus, setAnalyseModus] = useState(() => {
    return eersteProjectData.analyseModus;
  });
  const [analyseObjectType, setAnalyseObjectType] = useState(() => {
    return eersteProjectData.analyseObjectType;
  });
  const [analyseObjectId, setAnalyseObjectId] = useState(() => {
    return eersteProjectData.analyseObjectId;
  });
  const [actiefProfielId, setActiefProfielId] = useState(() => {
    return eersteProjectData.actiefProfielId;
  });
  const [analistRegimeFilter, setAnalistRegimeFilter] = useState(() => {
    return eersteProjectData.analistRegimeFilter;
  });
  const [nummerplaatEncryptieSalt, setNummerplaatEncryptieSalt] = useState(() => {
    return eersteProjectData.nummerplaatEncryptieSalt;
  });

  const [nieuweClusterNaam, setNieuweClusterNaam] = useState("");

  const [nieuweZoneNaam, setNieuweZoneNaam] = useState("");
  const [nieuweCapaciteit, setNieuweCapaciteit] = useState("");
  const [tekenmodus, setTekenmodus] = useState(false);
  const [bewerkmodusZoneId, setBewerkmodusZoneId] = useState(null);

  const maakActieveProjectData = useCallback(function maakActieveProjectData() {
    return normaliseerProjectData({
      kleurGrenzen,
      telmomenten,
      actiefTelmomentId,
      zones,
      actieveZoneId,
      clusters,
      actiefClusterId,
      openClusterId,
      geselecteerdeAnalistZones,
      geselecteerdeAnalistClusters,
      parkeerProfielen,
      analyseModus,
      analyseObjectType,
      analyseObjectId,
      actiefProfielId,
      analistRegimeFilter,
      nummerplaatEncryptieSalt,
    });
  }, [
    kleurGrenzen,
    telmomenten,
    actiefTelmomentId,
    zones,
    actieveZoneId,
    clusters,
    actiefClusterId,
    openClusterId,
    geselecteerdeAnalistZones,
    geselecteerdeAnalistClusters,
    parkeerProfielen,
    analyseModus,
    analyseObjectType,
    analyseObjectId,
    actiefProfielId,
    analistRegimeFilter,
    nummerplaatEncryptieSalt,
  ]);

  function laadProjectData(data) {
    const projectData = normaliseerProjectData(data);

    projectLadenRef.current = true;
    setKleurGrenzen(projectData.kleurGrenzen);
    setTelmomenten(projectData.telmomenten);
    setActiefTelmomentId(projectData.actiefTelmomentId);
    setZones(projectData.zones);
    setActieveZoneId(projectData.actieveZoneId);
    setClusters(projectData.clusters);
    setActiefClusterId(projectData.actiefClusterId);
    setOpenClusterId(projectData.openClusterId);
    setGeselecteerdeAnalistZones(projectData.geselecteerdeAnalistZones);
    setGeselecteerdeAnalistClusters(projectData.geselecteerdeAnalistClusters);
    setParkeerProfielen(projectData.parkeerProfielen);
    setAnalyseModus(projectData.analyseModus);
    setAnalyseObjectType(projectData.analyseObjectType);
    setAnalyseObjectId(projectData.analyseObjectId);
    setActiefProfielId(projectData.actiefProfielId);
    setAnalistRegimeFilter(projectData.analistRegimeFilter);
    setNummerplaatEncryptieSalt(projectData.nummerplaatEncryptieSalt);
    setNieuweZoneNaam("");
    setNieuweCapaciteit("");
    setNieuweClusterNaam("");
    setTekenmodus(false);
    setBewerkmodusZoneId(null);
  }

  function bewaarActiefProject(projectenLijst = projecten) {
    const data = maakActieveProjectData();

    return projectenLijst.map((project) =>
      project.id === actiefProjectId ? { ...project, data } : project
    );
  }

  useEffect(() => {
    localStorage.setItem("actiefProjectId", actiefProjectId);
  }, [actiefProjectId]);

  useEffect(() => {
    localStorage.setItem("linkerKolomBreedte", linkerKolomBreedte);
  }, [linkerKolomBreedte]);

  useEffect(() => {
    if (projectLadenRef.current) {
      projectLadenRef.current = false;
    }

    const bijgewerkteProjecten = projecten.map((project) =>
        project.id === actiefProjectId
          ? { ...project, data: maakActieveProjectData() }
          : project
    );

    localStorage.setItem(
      "parkeerProjecten",
      JSON.stringify(bijgewerkteProjecten)
    );
  }, [
    projecten,
    kleurGrenzen,
    telmomenten,
    actiefTelmomentId,
    zones,
    actieveZoneId,
    clusters,
    actiefClusterId,
    openClusterId,
    geselecteerdeAnalistZones,
    geselecteerdeAnalistClusters,
    parkeerProfielen,
    analyseModus,
    analyseObjectType,
    analyseObjectId,
    actiefProfielId,
    analistRegimeFilter,
    nummerplaatEncryptieSalt,
    actiefProjectId,
    maakActieveProjectData,
  ]);

  const actiefTelmoment = telmomenten.find(
    (telmoment) => telmoment.id === actiefTelmomentId
  );

  const isBeheerder = rol === "beheerder";
  const isInvuller = rol === "invuller";
  const isAnalist = rol === "analist";

  function wisselProject(projectId) {
    if (projectId === actiefProjectId) return;

    const volgendProject = projecten.find((project) => project.id === projectId);
    if (!volgendProject) return;

    setProjecten(bewaarActiefProject());
    setActiefProjectId(projectId);
    laadProjectData(volgendProject.data);
  }

  function voegProjectToe() {
    const naam =
      nieuweProjectNaam.trim() || `Project ${projecten.length + 1}`;
    const nieuwProject = maakNieuwProject(naam);
    const bijgewerkteProjecten = [...bewaarActiefProject(), nieuwProject];

    setProjecten(bijgewerkteProjecten);
    setActiefProjectId(nieuwProject.id);
    laadProjectData(nieuwProject.data);
    setNieuweProjectNaam("");
  }

  function hernoemProject() {
    const naam = nieuweProjectNaam.trim();
    if (naam === "") return;

    setProjecten(
      projecten.map((project) =>
        project.id === actiefProjectId ? { ...project, naam } : project
      )
    );
    setNieuweProjectNaam("");
  }

  function verwijderProject() {
    if (projecten.length <= 1) {
      alert("Je hebt minstens één project nodig.");
      return;
    }

    const zeker = confirm(
      `Ben je zeker dat je project "${actiefProject.naam}" wil verwijderen?`
    );
    if (!zeker) return;

    const resterendeProjecten = projecten.filter(
      (project) => project.id !== actiefProjectId
    );
    const volgendProject = resterendeProjecten[0];

    setProjecten(resterendeProjecten);
    setActiefProjectId(volgendProject.id);
    laadProjectData(volgendProject.data);
  }

  function wijzigRol(nieuweRol) {
    setRol(nieuweRol);

    if (nieuweRol === "invuller" && actiefTelmomentId === "gemiddelde") {
      setActiefTelmomentId(telmomenten[0]?.id || null);
    }

    if (nieuweRol !== "beheerder") {
      setTekenmodus(false);
      setBewerkmodusZoneId(null);
    }
  }

  function krijgNummerplaten(zone, telmomentId = actiefTelmomentId) {
    return zone.tellingen?.[telmomentId] || [];
  }

  function krijgClusterZones(cluster) {
    return cluster.zoneIds
      .map((zoneId) => zones.find((zone) => zone.id === zoneId))
      .filter(Boolean);
  }

  function krijgClusterCapaciteit(cluster) {
    return krijgClusterZones(cluster).reduce(
      (totaal, zone) => totaal + zone.capaciteit,
      0
    );
  }

  function krijgClusterAantal(cluster, telmomentId = actiefTelmomentId) {
    return krijgClusterZones(cluster).reduce(
      (totaal, zone) => totaal + krijgNummerplaten(zone, telmomentId).length,
      0
    );
  }

  function krijgClusterBezettingsgraad(
    cluster,
    telmomentId = actiefTelmomentId
  ) {
    const capaciteit = krijgClusterCapaciteit(cluster);
    if (capaciteit === 0) return 0;

    return Math.round((krijgClusterAantal(cluster, telmomentId) / capaciteit) * 100);
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

    const datumDeel = telmoment.datum
      ? `${formatBelgischeDatum(telmoment.datum)} — `
      : "";

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
    const lichtgrijsTot = Math.min(Number(waarde), 98);

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
      const nieuweGroenTot = Math.min(
        Math.max(groenTot, vorige.lichtgrijsTot + 1),
        99
      );
      const oranjeTot = Math.max(vorige.oranjeTot, nieuweGroenTot + 1);

      return {
        ...vorige,
        groenTot: nieuweGroenTot,
        oranjeTot: Math.min(oranjeTot, 100),
      };
    });
  }

  function pasOranjeGrensAan(waarde) {
    const oranjeTot = Number(waarde);

    setKleurGrenzen((vorige) => ({
      ...vorige,
      oranjeTot: Math.min(Math.max(oranjeTot, vorige.groenTot + 1), 100),
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
      parkeerRegime: "vrij parkeren",
      maxParkeerduur: "",
      tellingen: {},
    };

    setZones([...zones, nieuweZone]);
    setActieveZoneId(nieuweZone.id);
    setTekenmodus(false);
    setBewerkmodusZoneId(null);
    setNieuweZoneNaam("");
    setNieuweCapaciteit("");
  }

  function voegClusterToe() {
    if (!isBeheerder) return;
    if (nieuweClusterNaam.trim() === "") return;

    const nieuwCluster = {
      id: Date.now(),
      naam: nieuweClusterNaam.trim(),
      zoneIds: [],
    };

    setClusters([...clusters, nieuwCluster]);
    setActiefClusterId(nieuwCluster.id);
    setOpenClusterId(nieuwCluster.id);
    setGeselecteerdeAnalistClusters([
      ...geselecteerdeAnalistClusters,
      nieuwCluster.id,
    ]);
    setNieuweClusterNaam("");
  }

  function selecteerCluster(clusterId) {
    setActiefClusterId(actiefClusterId === clusterId ? null : clusterId);
  }

  function toggleClusterOpen(clusterId) {
    setOpenClusterId(openClusterId === clusterId ? null : clusterId);
    setActiefClusterId(clusterId);
  }

  function toggleClusterZone(clusterId, zoneId) {
    if (!isBeheerder) return;

    setClusters(
      clusters.map((cluster) => {
        if (cluster.id !== clusterId) return cluster;

        const zoneIds = cluster.zoneIds.includes(zoneId)
          ? cluster.zoneIds.filter((id) => id !== zoneId)
          : [...cluster.zoneIds, zoneId];

        return { ...cluster, zoneIds };
      })
    );
  }

  function verwijderCluster(clusterId) {
    if (!isBeheerder) return;

    const zeker = confirm("Ben je zeker dat je deze cluster wil verwijderen?");
    if (!zeker) return;

    setClusters(clusters.filter((cluster) => cluster.id !== clusterId));
    setGeselecteerdeAnalistClusters(
      geselecteerdeAnalistClusters.filter((id) => id !== clusterId)
    );

    if (actiefClusterId === clusterId) setActiefClusterId(null);
    if (openClusterId === clusterId) setOpenClusterId(null);
  }

  function wijzigClusterNaam(clusterId) {
    if (!isBeheerder) return;

    const cluster = clusters.find((huidigeCluster) => huidigeCluster.id === clusterId);
    if (!cluster) return;

    const nieuweNaam = prompt("Nieuwe naam voor deze cluster:", cluster.naam);
    if (nieuweNaam === null || nieuweNaam.trim() === "") return;

    setClusters(
      clusters.map((huidigeCluster) =>
        huidigeCluster.id === clusterId
          ? { ...huidigeCluster, naam: nieuweNaam.trim() }
          : huidigeCluster
      )
    );
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
        zone.id === zoneId
          ? { ...zone, invoer: normaliseerNummerplaat(waarde) }
          : zone
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

        const plaat = normaliseerNummerplaat(voorgesteldePlaat || zone.invoer);
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
    setClusters(
      clusters.map((cluster) => ({
        ...cluster,
        zoneIds: cluster.zoneIds.filter((id) => id !== zoneId),
      }))
    );

    if (actieveZoneId === zoneId) setActieveZoneId(nieuweZones[0]?.id || null);
    if (bewerkmodusZoneId === zoneId) setBewerkmodusZoneId(null);
  }

  function wijzigZoneNaam(zoneId) {
    if (!isBeheerder) return;

    const zone = zones.find((huidigeZone) => huidigeZone.id === zoneId);
    if (!zone) return;

    const nieuweNaam = prompt("Nieuwe naam voor deze zone:", zone.naam);
    if (nieuweNaam === null || nieuweNaam.trim() === "") return;

    setZones(
      zones.map((huidigeZone) =>
        huidigeZone.id === zoneId
          ? { ...huidigeZone, naam: nieuweNaam.trim() }
          : huidigeZone
      )
    );
  }

  function wijzigZoneRegime(zoneId, parkeerRegime) {
    if (!isBeheerder) return;

    setZones(
      zones.map((zone) =>
        zone.id === zoneId
          ? {
              ...zone,
              parkeerRegime,
              maxParkeerduur: regimesMetMaxDuur.includes(parkeerRegime)
                ? zone.maxParkeerduur || ""
                : "",
            }
          : zone
      )
    );
  }

  function wijzigZoneMaxParkeerduur(zoneId, maxParkeerduur) {
    if (!isBeheerder) return;

    setZones(
      zones.map((zone) =>
        zone.id === zoneId ? { ...zone, maxParkeerduur } : zone
      )
    );
  }

  function wijzigZoneCapaciteit(zoneId, capaciteit) {
    if (!isBeheerder) return;

    const nieuweCapaciteit = Math.max(0, Number(capaciteit) || 0);

    setZones(
      zones.map((zone) =>
        zone.id === zoneId ? { ...zone, capaciteit: nieuweCapaciteit } : zone
      )
    );
  }

  function verplaatsZone(zoneId, richting) {
    if (!isBeheerder && !isInvuller) return;

    setZones((huidigeZones) => {
      const huidigeIndex = huidigeZones.findIndex((zone) => zone.id === zoneId);
      if (huidigeIndex === -1) return huidigeZones;

      const nieuweIndex = huidigeIndex + richting;
      if (nieuweIndex < 0 || nieuweIndex >= huidigeZones.length) {
        return huidigeZones;
      }

      const nieuweZones = [...huidigeZones];
      const [zone] = nieuweZones.splice(huidigeIndex, 1);
      nieuweZones.splice(nieuweIndex, 0, zone);
      return nieuweZones;
    });
  }

  function downloadBackup() {
    if (!isBeheerder) return;

    const zeker = confirm(
      "Een back-up bevat alle ingevoerde nummerplaten. Deel dit bestand alleen met personen die deze gegevens mogen zien. Wil je doorgaan?"
    );
    if (!zeker) return;

    const backup = {
      gemaaktOp: new Date().toISOString(),
      projectNaam: actiefProject.naam,
      telmomenten,
      zones,
      clusters,
      actiefTelmomentId,
      actieveZoneId,
      actiefClusterId,
      openClusterId,
      geselecteerdeAnalistZones,
      geselecteerdeAnalistClusters,
      parkeerProfielen,
      analyseModus,
      analyseObjectType,
      analyseObjectId,
      actiefProfielId,
      analistRegimeFilter,
      nummerplaatEncryptieSalt,
      kleurGrenzen,
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `parkeeronderzoek-${sanitiseerBestandsnaam(
      actiefProject.naam
    )}-backup.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  function importeerBackup(event) {
    if (!isBeheerder) return;

    const bestand = event.target.files[0];
    if (!bestand) return;

    if (bestand.size > MAX_BACKUP_GROOTTE_BYTES) {
      alert("Dit back-upbestand is te groot om veilig te importeren.");
      event.target.value = "";
      return;
    }

    const lezer = new FileReader();

    lezer.onload = function (e) {
      try {
        const backup = JSON.parse(e.target.result);
        const projectData = valideerBackupVoorImport(backup);

        const zeker = confirm(
          "Ben je zeker dat je deze back-up wil importeren? De huidige gegevens worden overschreven."
        );

        if (!zeker) return;

        laadProjectData(projectData);

        alert("Back-up succesvol geïmporteerd.");
      } catch (fout) {
        alert(
          fout instanceof Error
            ? fout.message
            : "Het bestand kon niet gelezen worden als geldige JSON-back-up."
        );
      }
    };

    lezer.readAsText(bestand);
    event.target.value = "";
  }

  function exporteerCSV({ anoniem = false } = {}) {
    if (!isBeheerder && !isAnalist) return;

    if (!anoniem) {
      const zeker = confirm(
        "Deze CSV bevat de ingevoerde nummerplaten. Gebruik liever de geanonimiseerde export als je het bestand wil delen. Wil je toch doorgaan?"
      );
      if (!zeker) return;
    }

    const anoniemePlaten = new Map();
    function krijgExportPlaat(plaat) {
      if (!anoniem) return plaat;
      if (!anoniemePlaten.has(plaat)) {
        anoniemePlaten.set(plaat, `ANON${anoniemePlaten.size + 1}`);
      }
      return anoniemePlaten.get(plaat);
    }

    const rijen = [
      [
        "Telmoment",
        "Datum",
        "Tijdstip",
        "Zone",
        "Capaciteit",
        "Parkeerregime",
        "Max parkeerduur",
        "Aantal voertuigen",
        "Bezettingsgraad",
        "Nummerplaten",
      ],
    ];

    telmomenten.forEach((telmoment) => {
      zones.forEach((zone) => {
        const nummerplaten = krijgNummerplaten(zone, telmoment.id).map(
          krijgExportPlaat
        );
        const aantal = nummerplaten.length;

        const bezettingsgraad =
          zone.capaciteit > 0
            ? Math.round((aantal / zone.capaciteit) * 100)
            : 0;

        rijen.push([
          telmoment.naam,
          formatBelgischeDatumOptioneel(telmoment.datum),
          telmoment.tijdstip,
          zone.naam,
          zone.capaciteit,
          zone.parkeerRegime || "vrij parkeren",
          zone.maxParkeerduur || "",
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
    link.download = anoniem
      ? "parkeeronderzoek-resultaten-geanonimiseerd.csv"
      : "parkeeronderzoek-resultaten.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  function downloadExcelInvulblad() {
    if (!isBeheerder && !isInvuller) return;

    if (telmomenten.length === 0 || zones.length === 0) {
      alert("Maak eerst minstens een telmoment en een zone aan.");
      return;
    }

    const xml = maakExcelTemplateXml({
      projectNaam: actiefProject.naam,
      telmomenten,
      zones,
    });
    const blob = new Blob([xml], {
      type: "application/vnd.ms-excel;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `nummerplaten-${sanitiseerBestandsnaam(
      actiefProject.naam
    )}-invulblad.xls`;
    link.click();

    URL.revokeObjectURL(url);
  }

  function leesExcelWerkbladRijen(xmlTekst) {
    const documentXml = new DOMParser().parseFromString(xmlTekst, "text/xml");
    const parserFout = documentXml.querySelector("parsererror");

    if (parserFout) {
      throw new Error(
        "Dit bestand kan niet gelezen worden. Gebruik het Excel-invulblad dat door de tool werd aangemaakt en sla het opnieuw op als .xls."
      );
    }

    const worksheets = Array.from(documentXml.getElementsByTagName("*")).filter(
      (element) => element.localName === "Worksheet"
    );
    const nummerplatenSheet =
      worksheets.find(
        (sheet) =>
          sheet.getAttribute("ss:Name") === "Nummerplaten" ||
          sheet.getAttribute("Name") === "Nummerplaten"
      ) || worksheets[0];

    if (!nummerplatenSheet) {
      throw new Error("Het Excel-bestand bevat geen leesbaar werkblad.");
    }

    const rows = Array.from(nummerplatenSheet.getElementsByTagName("*")).filter(
      (element) => element.localName === "Row"
    );

    return rows.map((row) => {
      const waarden = [];
      let celIndex = 0;
      const cells = Array.from(row.children).filter(
        (element) => element.localName === "Cell"
      );

      cells.forEach((cell) => {
        const explicieteIndex =
          Number(cell.getAttribute("ss:Index") || cell.getAttribute("Index")) - 1;
        if (Number.isInteger(explicieteIndex) && explicieteIndex >= 0) {
          celIndex = explicieteIndex;
        }

        const dataElement = Array.from(cell.getElementsByTagName("*")).find(
          (element) => element.localName === "Data"
        );
        waarden[celIndex] = dataElement?.textContent?.trim() || "";
        celIndex += 1;
      });

      return waarden;
    });
  }

  function importeerExcelNummerplaten(event) {
    if (!isBeheerder && !isInvuller) return;

    const bestand = event.target.files[0];
    if (!bestand) return;

    if (bestand.size > MAX_EXCEL_GROOTTE_BYTES) {
      alert("Dit Excel-bestand is te groot om veilig te importeren.");
      event.target.value = "";
      return;
    }

    const lezer = new FileReader();

    lezer.onload = function (e) {
      try {
        const rijen = leesExcelWerkbladRijen(String(e.target.result || ""));
        const headers = (rijen[0] || []).map((waarde) =>
          normaliseerExcelSleutel(waarde)
        );
        const gebruiktOudIdFormaat =
          headers.includes("telmoment id") && headers.includes("zone id");
        const telmomentenPerSleutel = new Map(
          telmomenten.map((telmoment) => [
            maakTelmomentExcelSleutel(telmoment),
            telmoment,
          ])
        );
        const zonesPerSleutel = new Map(
          zones.map((zone) => [maakZoneExcelSleutel(zone), zone])
        );
        const zonesPerNaam = new Map(
          zones.map((zone) => [normaliseerExcelSleutel(zone.naam), zone])
        );
        const imports = new Map();
        let gelezenNummerplaten = 0;

        rijen.slice(1).forEach((rij) => {
          const nummerplaat = normaliseerNummerplaat(
            gebruiktOudIdFormaat ? rij[9] : rij[8]
          );

          if (!nummerplaat) return;

          const telmoment = gebruiktOudIdFormaat
            ? telmomenten.find(
                (huidigTelmoment) =>
                  huidigTelmoment.id === normaliseerId(rij[1], null)
              )
            : telmomentenPerSleutel.get(
                [
                  normaliseerExcelSleutel(rij[1]),
                  normaliseerExcelSleutel(rij[2]),
                  normaliseerExcelSleutel(rij[3]),
                ].join("::")
              );
          const zone = gebruiktOudIdFormaat
            ? zones.find(
                (huidigeZone) => huidigeZone.id === normaliseerId(rij[5], null)
              )
            : zonesPerSleutel.get(
                [
                  normaliseerExcelSleutel(rij[4]),
                  normaliseerExcelSleutel(rij[5]),
                  normaliseerExcelSleutel(rij[6]),
                ].join("::")
              ) || zonesPerNaam.get(normaliseerExcelSleutel(rij[4]));

          if (!telmoment || !zone) return;

          const sleutel = `${zone.id}::${telmoment.id}`;
          if (!imports.has(sleutel)) imports.set(sleutel, new Set());
          imports.get(sleutel).add(nummerplaat);
          gelezenNummerplaten += 1;
        });

        if (imports.size === 0) {
          alert(
            "Er werden geen geldige nummerplaten gevonden. Vul de kolom 'Nummerplaat' in het door de tool aangemaakte Excel-bestand in."
          );
          return;
        }

        let toegevoegd = 0;

        setZones(
          zones.map((zone) => {
            const nieuweTellingen = { ...(zone.tellingen || {}) };

            telmomenten.forEach((telmoment) => {
              const sleutel = `${zone.id}::${telmoment.id}`;
              const nieuwePlaten = imports.get(sleutel);
              if (!nieuwePlaten) return;

              const bestaandePlaten = new Set(
                nieuweTellingen[telmoment.id] || []
              );

              nieuwePlaten.forEach((plaat) => {
                if (!bestaandePlaten.has(plaat)) {
                  bestaandePlaten.add(plaat);
                  toegevoegd += 1;
                }
              });

              nieuweTellingen[telmoment.id] = Array.from(bestaandePlaten).slice(
                0,
                MAX_NUMMERPLATEN_PER_TELLING
              );
            });

            return { ...zone, tellingen: nieuweTellingen };
          })
        );

        alert(
          `${toegevoegd} nummerplaten toegevoegd. ${Math.max(
            gelezenNummerplaten - toegevoegd,
            0
          )} dubbele of reeds aanwezige registraties werden overgeslagen.`
        );
      } catch (fout) {
        alert(
          fout instanceof Error
            ? fout.message
            : "Het Excel-bestand kon niet worden ingelezen."
        );
      }
    };

    lezer.readAsText(bestand);
    event.target.value = "";
  }

  async function versleutelPlaat(plaat, salt) {
    const data = new TextEncoder().encode(`${salt}:${normaliseerNummerplaat(plaat)}`);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray
      .map((waarde) => waarde.toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase();

    return `ENC${hash.slice(0, 16)}`;
  }

  async function versleutelNummerplaten() {
    if (!isInvuller) return;

    if (!crypto.subtle) {
      alert("Versleutelen wordt niet ondersteund door deze browser.");
      return;
    }

    const uniekePlaten = new Set();
    zones.forEach((zone) => {
      Object.values(zone.tellingen || {}).forEach((platen) => {
        if (!Array.isArray(platen)) return;
        platen.forEach((plaat) => {
          const normalePlaat = normaliseerNummerplaat(plaat);
          if (normalePlaat && !isVersleuteldeNummerplaat(normalePlaat)) {
            uniekePlaten.add(normalePlaat);
          }
        });
      });
    });

    if (uniekePlaten.size === 0) {
      alert("Er zijn geen niet-versleutelde nummerplaten gevonden.");
      return;
    }

    const zeker = confirm(
      "Dit vervangt de leesbare nummerplaten in dit project door versleutelde codes. Dezelfde nummerplaat krijgt telkens dezelfde code. Doorgaan?"
    );
    if (!zeker) return;

    const salt = nummerplaatEncryptieSalt || maakEncryptieSalt();
    const versleuteldePlaten = new Map();

    for (const plaat of uniekePlaten) {
      versleuteldePlaten.set(plaat, await versleutelPlaat(plaat, salt));
    }

    setNummerplaatEncryptieSalt(salt);
    setZones(
      zones.map((zone) => {
        const nieuweTellingen = Object.fromEntries(
          Object.entries(zone.tellingen || {}).map(([telmomentId, platen]) => [
            telmomentId,
            Array.isArray(platen)
              ? [
                  ...new Set(
                    platen.map((plaat) => {
                      const normalePlaat = normaliseerNummerplaat(plaat);
                      return (
                        versleuteldePlaten.get(normalePlaat) ||
                        normalePlaat
                      );
                    })
                  ),
                ]
              : [],
          ])
        );

        return { ...zone, tellingen: nieuweTellingen, invoer: "" };
      })
    );

    alert(`${uniekePlaten.size} unieke nummerplaten versleuteld.`);
  }

  function wisAlleGegevens() {
    if (!isBeheerder) return;

    const zeker = confirm(
      `Ben je zeker dat je alle gegevens van project "${actiefProject.naam}" wil wissen?`
    );

    if (zeker) {
      laadProjectData(maakLeegProjectData());
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

  function voegParkeerProfielToe(profiel) {
    const nieuwProfiel = {
      ...profiel,
      id: Date.now(),
    };

    setParkeerProfielen([...parkeerProfielen, nieuwProfiel]);
    setActiefProfielId(nieuwProfiel.id);
  }

  function wijzigParkeerProfiel(profielId, profiel) {
    setParkeerProfielen(
      parkeerProfielen.map((bestaandProfiel) =>
        bestaandProfiel.id === profielId
          ? { ...bestaandProfiel, ...profiel }
          : bestaandProfiel
      )
    );
  }

  function verwijderParkeerProfiel(profielId) {
    const zeker = confirm("Ben je zeker dat je dit parkeerprofiel wil verwijderen?");
    if (!zeker) return;

    const nieuweProfielen = parkeerProfielen.filter(
      (profiel) => profiel.id !== profielId
    );

    setParkeerProfielen(nieuweProfielen);
    if (actiefProfielId === profielId) {
      setActiefProfielId(nieuweProfielen[0]?.id || null);
    }
  }

  function beperkKolomBreedte(waarde) {
    return Math.min(Math.max(waarde, 28), 68);
  }

  function verplaatsKolomScheiding(event) {
    const layout = layoutRef.current;
    if (!layout) return;

    event.preventDefault();
    const rect = layout.getBoundingClientRect();
    document.body.classList.add("kolom-resize-actief");

    function verwerkPointer(pointerEvent) {
      const breedtePercentage =
        ((pointerEvent.clientX - rect.left) / rect.width) * 100;
      setLinkerKolomBreedte(beperkKolomBreedte(breedtePercentage));
      window.dispatchEvent(new Event("resize"));
    }

    function stopResize() {
      document.body.classList.remove("kolom-resize-actief");
      window.removeEventListener("pointermove", verwerkPointer);
      window.removeEventListener("pointerup", stopResize);
      window.dispatchEvent(new Event("resize"));
    }

    window.addEventListener("pointermove", verwerkPointer);
    window.addEventListener("pointerup", stopResize);
    verwerkPointer(event);
  }

  function verplaatsKolomScheidingMetToets(event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    const stap = event.shiftKey ? 5 : 2;
    setLinkerKolomBreedte((huidigeBreedte) =>
      beperkKolomBreedte(
        huidigeBreedte + (event.key === "ArrowRight" ? stap : -stap)
      )
    );
    window.dispatchEvent(new Event("resize"));
  }

  const clusterAnalyses = clusters.map((cluster) => {
    const aantal = krijgClusterAantal(cluster);
    const capaciteit = krijgClusterCapaciteit(cluster);

    return {
      ...cluster,
      aantal,
      capaciteit,
      bezettingsgraad: krijgClusterBezettingsgraad(cluster),
      zones: krijgClusterZones(cluster),
    };
  });

  const telmomentSelectie = (
    <div className="statusbalk banner-kaart">
      <strong>Telmoment selecteren</strong>
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
  );

  return (
    <div className="app">
      <div className="vaste-banner">
        <div className="banner-hoofd">
          <div className="banner-titelblok">
            <h1>Parkeeronderzoek Tool</h1>
            <p className="banner-roltekst">
              Actieve rol: <strong>{rol}</strong>.{" "}
              {isBeheerder &&
                "Je kunt zones, capaciteit, polygonen, telmomenten en kleurcodes beheren."}
              {isInvuller &&
                "Kies eerst een telmoment en registreer daarna nummerplaten per zone."}
              {isAnalist &&
                "Je bekijkt de resultaten per telmoment zonder data aan te passen."}
            </p>
          </div>

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
        </div>

        <div className="banner-inhoud">
          <div
            className={`statusbalk project-kaart ${
              isBeheerder ? "" : "project-kaart-compact"
            }`}
          >
            <strong>Project</strong>
            <select
              value={actiefProjectId}
              onChange={(e) => wisselProject(Number(e.target.value))}
            >
              {projecten.map((project) => (
                <option value={project.id} key={project.id}>
                  {project.naam}
                </option>
              ))}
            </select>

            {isBeheerder && (
              <>
                <input
                  value={nieuweProjectNaam}
                  onChange={(e) => setNieuweProjectNaam(e.target.value)}
                  placeholder="Nieuwe of aangepaste projectnaam"
                />
                <button onClick={voegProjectToe}>Nieuw project</button>
                <button onClick={hernoemProject}>Hernoem</button>
                <button onClick={verwijderProject}>Verwijder</button>
              </>
            )}
          </div>

          {isBeheerder && (
            <>
              <div className="beheer-knoppen">
                <div className="beheer-knopgroep">
                  <button className="reset-knop" onClick={wisAlleGegevens}>
                    Wis alle gegevens
                  </button>
                </div>

                <div className="beheer-knopgroep">
                  <button onClick={downloadBackup}>Download back-up</button>

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

                <div className="beheer-knopgroep">
                  <button onClick={exporteerCSV}>Exporteer CSV</button>

                  <button onClick={() => exporteerCSV({ anoniem: true })}>
                    CSV anoniem
                  </button>
                </div>

                <div className="beheer-knopgroep">
                  <button onClick={downloadExcelInvulblad}>
                    Excel invulblad
                  </button>

                  <label className="import-knop">
                    Excel importeren
                    <input
                      type="file"
                      accept=".xls,.xml,application/vnd.ms-excel,text/xml"
                      onChange={importeerExcelNummerplaten}
                      hidden
                    />
                  </label>
                </div>
              </div>

              <KleurcodeInstellingen
                KLEUREN={KLEUREN}
                kleurGrenzen={kleurGrenzen}
                pasLichtgrijsGrensAan={pasLichtgrijsGrensAan}
                pasGroenGrensAan={pasGroenGrensAan}
                pasOranjeGrensAan={pasOranjeGrensAan}
              />
            </>
          )}

          {isInvuller && (
            <>
              {telmomentSelectie}
              <div className="beheer-knoppen excel-knoppen">
                <button onClick={downloadExcelInvulblad}>
                  Excel invulblad
                </button>

                <label className="import-knop">
                  Excel importeren
                  <input
                    type="file"
                    accept=".xls,.xml,application/vnd.ms-excel,text/xml"
                    onChange={importeerExcelNummerplaten}
                    hidden
                  />
                </label>

                <button onClick={versleutelNummerplaten}>
                  Nummerplaten versleutelen
                </button>
              </div>
            </>
          )}

          {isAnalist && (
            <>
              <div className="statusbalk banner-kaart">
                <strong>Analyse kiezen</strong>
                <select
                  value={analyseModus}
                  onChange={(e) => setAnalyseModus(e.target.value)}
                >
                  <option value="telmoment">Alle zones op gekozen telmoment</option>
                  <option value="object">
                    Alle telmomenten voor zone of cluster
                  </option>
                  <option value="profiel">Parkeerprofiel</option>
                  <option value="herhaling">
                    Registratie zelfde voertuigen over tellingen heen
                  </option>
                </select>
              </div>
              <div className="statusbalk banner-kaart">
                <strong>Parkeerregime filter</strong>
                <select
                  value={analistRegimeFilter}
                  onChange={(e) => setAnalistRegimeFilter(e.target.value)}
                >
                  <option value="">Alle parkeerregimes</option>
                  {parkeerRegimes.map((regime) => (
                    <option value={regime} key={regime}>
                      {regime}
                    </option>
                  ))}
                </select>
              </div>
              <div className="statusbalk banner-kaart banner-toggle-kaart">
                <label className="kaarttaart-toggle">
                  <input
                    type="checkbox"
                    checked={toonKaartTaarten}
                    onChange={(e) => setToonKaartTaarten(e.target.checked)}
                  />
                  Toon taartdiagrammen op kaart
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      <div
        className="layout"
        ref={layoutRef}
        style={{ "--linker-kolom-breedte": `${linkerKolomBreedte}%` }}
      >
        <section className="linkerkolom">
          {isBeheerder && (
            <BeheerderDashboard
              telmomenten={telmomenten}
              nieuwTelmomentNaam={nieuwTelmomentNaam}
              setNieuwTelmomentNaam={setNieuwTelmomentNaam}
              nieuwTelmomentDatum={nieuwTelmomentDatum}
              setNieuwTelmomentDatum={setNieuwTelmomentDatum}
              nieuwTelmomentTijdstip={nieuwTelmomentTijdstip}
              setNieuwTelmomentTijdstip={setNieuwTelmomentTijdstip}
              voegTelmomentToe={voegTelmomentToe}
              verwijderTelmoment={verwijderTelmoment}
              clusters={clusters}
              actiefClusterId={actiefClusterId}
              openClusterId={openClusterId}
              nieuweClusterNaam={nieuweClusterNaam}
              setNieuweClusterNaam={setNieuweClusterNaam}
              voegClusterToe={voegClusterToe}
              selecteerCluster={selecteerCluster}
              toggleClusterOpen={toggleClusterOpen}
              toggleClusterZone={toggleClusterZone}
              verwijderCluster={verwijderCluster}
              wijzigClusterNaam={wijzigClusterNaam}
              nieuweZoneNaam={nieuweZoneNaam}
              setNieuweZoneNaam={setNieuweZoneNaam}
              nieuweCapaciteit={nieuweCapaciteit}
              setNieuweCapaciteit={setNieuweCapaciteit}
              voegZoneToe={voegZoneToe}
              zones={zones}
              actieveZoneId={actieveZoneId}
              actiefTelmoment={actiefTelmoment}
              telmomentLabel={telmomentLabel}
              krijgNummerplaten={krijgNummerplaten}
              krijgVoorgesteldeNummerplaten={krijgVoorgesteldeNummerplaten}
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
              wijzigZoneNaam={wijzigZoneNaam}
              wijzigZoneRegime={wijzigZoneRegime}
              wijzigZoneMaxParkeerduur={wijzigZoneMaxParkeerduur}
              wijzigZoneCapaciteit={wijzigZoneCapaciteit}
              verplaatsZone={verplaatsZone}
              parkeerRegimes={parkeerRegimes}
              regimesMetMaxDuur={regimesMetMaxDuur}
              bewerkmodusZoneId={bewerkmodusZoneId}
              wijzigInvoer={wijzigInvoer}
              voegNummerplaatToe={voegNummerplaatToe}
              verwijderNummerplaat={verwijderNummerplaat}
            />
          )}

          {isInvuller && (
            <InvullerDashboard
              zones={zones}
              actieveZoneId={actieveZoneId}
              actiefTelmoment={actiefTelmoment}
              telmomentLabel={telmomentLabel}
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
              verplaatsZone={verplaatsZone}
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
              krijgNummerplaten={krijgNummerplaten}
              clusters={clusterAnalyses}
              bepaalKaartKleur={bepaalKaartKleur}
              grafiekKleuren={grafiekKleuren}
              geselecteerdeAnalistZones={geselecteerdeAnalistZones}
              toggleAnalistZone={toggleAnalistZone}
              selecteerCluster={selecteerCluster}
              kleurGrenzen={kleurGrenzen}
              parkeerProfielen={parkeerProfielen}
              actiefProfielId={actiefProfielId}
              setActiefProfielId={setActiefProfielId}
              voegParkeerProfielToe={voegParkeerProfielToe}
              wijzigParkeerProfiel={wijzigParkeerProfiel}
              verwijderParkeerProfiel={verwijderParkeerProfiel}
              analyseModus={analyseModus}
              analyseObjectType={analyseObjectType}
              setAnalyseObjectType={setAnalyseObjectType}
              analyseObjectId={analyseObjectId}
              setAnalyseObjectId={setAnalyseObjectId}
              actiefTelmomentId={actiefTelmomentId}
              setActiefTelmomentId={setActiefTelmomentId}
              telmomentLabel={telmomentLabel}
              analistRegimeFilter={analistRegimeFilter}
            />
          )}
        </section>

        <div
          className="kolom-scheiding"
          role="separator"
          aria-label="Breedte van de kolommen aanpassen"
          aria-orientation="vertical"
          aria-valuemin={28}
          aria-valuemax={68}
          aria-valuenow={Math.round(linkerKolomBreedte)}
          tabIndex={0}
          onPointerDown={verplaatsKolomScheiding}
          onKeyDown={verplaatsKolomScheidingMetToets}
        />

        <ParkeerKaart
          zones={zones}
          clusters={clusters}
          telmomenten={telmomenten}
          actiefProjectId={actiefProjectId}
          actiefTelmomentId={actiefTelmomentId}
          actiefTelmoment={actiefTelmoment}
          actieveZoneId={actieveZoneId}
          actiefClusterId={actiefClusterId}
          analyseModus={analyseModus}
          analyseObjectType={analyseObjectType}
          analyseObjectId={analyseObjectId}
          bewerkmodusZoneId={bewerkmodusZoneId}
          isBeheerder={isBeheerder}
          isInvuller={isInvuller}
          isAnalist={isAnalist}
          toonKaartTaarten={toonKaartTaarten}
          tekenmodus={tekenmodus}
          puntIcon={puntIcon}
          grafiekKleuren={grafiekKleuren}
          krijgNummerplaten={krijgNummerplaten}
          telmomentLabel={telmomentLabel}
          bepaalKaartKleur={bepaalKaartKleur}
          krijgClusterZones={krijgClusterZones}
          krijgClusterAantal={krijgClusterAantal}
          krijgClusterCapaciteit={krijgClusterCapaciteit}
          selecteerZone={selecteerZone}
          selecteerCluster={selecteerCluster}
          voegPuntToe={voegPuntToe}
          voegPuntToeOpDichtsteZijde={voegPuntToeOpDichtsteZijde}
          verplaatsPunt={verplaatsPunt}
        />
      </div>
    </div>
  );
}

export default App;
