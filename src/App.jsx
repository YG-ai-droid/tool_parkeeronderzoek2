import { useCallback, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";

import BeheerderDashboard from "./components/BeheerderDashboard";
import AnalistDashboard from "./components/AnalistDashboard";
import InvullerDashboard from "./components/InvullerDashboard";
import ParkeerKaart from "./components/ParkeerKaart";
import KleurcodeInstellingen from "./components/KleurcodeInstellingen";

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

function normaliseerZones(zones) {
  return zones.map((zone) => {
    if (zone.tellingen) {
      return {
        ...zone,
        invoer: zone.invoer || "",
        parkeerRegime: zone.parkeerRegime || "vrij parkeren",
        maxParkeerduur: zone.maxParkeerduur || "",
      };
    }

    return {
      ...zone,
      parkeerRegime: zone.parkeerRegime || "vrij parkeren",
      maxParkeerduur: zone.maxParkeerduur || "",
      tellingen: {
        1: zone.nummerplaten || [],
      },
      invoer: "",
    };
  });
}

function normaliseerTelmomenten(telmomenten) {
  return telmomenten.map((telmoment) => ({
    ...telmoment,
    datum: telmoment.datum || "",
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
  };
}

function normaliseerProjectData(data) {
  const zones = normaliseerZones(data?.zones || standaardZones);
  const clusters = data?.clusters || [];
  const telmomenten = normaliseerTelmomenten(
    data?.telmomenten || standaardTelmomenten
  );

  return {
    kleurGrenzen: data?.kleurGrenzen || standaardKleurGrenzen,
    telmomenten,
    actiefTelmomentId: data?.actiefTelmomentId || telmomenten[0]?.id || null,
    zones,
    actieveZoneId: data?.actieveZoneId || zones[0]?.id || null,
    clusters,
    actiefClusterId: data?.actiefClusterId || null,
    openClusterId: data?.openClusterId || null,
    geselecteerdeAnalistZones:
      data?.geselecteerdeAnalistZones || zones.map((zone) => zone.id),
    geselecteerdeAnalistClusters:
      data?.geselecteerdeAnalistClusters ||
      clusters.map((cluster) => cluster.id),
    parkeerProfielen: data?.parkeerProfielen || [],
    analyseModus: data?.analyseModus || "telmoment",
    analyseObjectType: data?.analyseObjectType || "zone",
    analyseObjectId: data?.analyseObjectId || zones[0]?.id || null,
    actiefProfielId: data?.actiefProfielId || null,
    analistRegimeFilter: data?.analistRegimeFilter || "",
  };
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

  function downloadBackup() {
    if (!isBeheerder) return;

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
      kleurGrenzen,
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `parkeeronderzoek-${actiefProject.naam
      .toLowerCase()
      .replaceAll(" ", "-")}-backup.json`;
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

        laadProjectData(backup);

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
        "Parkeerregime",
        "Max parkeerduur",
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
    link.download = "parkeeronderzoek-resultaten.csv";
    link.click();

    URL.revokeObjectURL(url);
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

              <KleurcodeInstellingen
                KLEUREN={KLEUREN}
                kleurGrenzen={kleurGrenzen}
                pasLichtgrijsGrensAan={pasLichtgrijsGrensAan}
                pasGroenGrensAan={pasGroenGrensAan}
                pasOranjeGrensAan={pasOranjeGrensAan}
              />
            </>
          )}

          {isInvuller && telmomentSelectie}

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

      <div className="layout">
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

        <ParkeerKaart
          zones={zones}
          clusters={clusters}
          telmomenten={telmomenten}
          actiefProjectId={actiefProjectId}
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
