import { useState } from "react";
import Taartdiagram from "./taartdiagram";
import VerdelingTaartdiagram from "./VerdelingTaartdiagram";
import Lijngrafiek from "./Lijngrafiek";
import RotatieAnalyse from "./RotatieAnalyse";
import { formatBelgischeDatum } from "../utils/datum";

const leegProfiel = {
  naam: "",
  vensterStart: "",
  vensterEinde: "",
  minDuur: "1",
  maxDuur: "",
};

const GEMIDDELDE_TELMOMENT_ID = "gemiddelde";
const HERHALING_MIN_LAATSTE_CATEGORIE = 2;
const HERHALING_MAX_LAATSTE_CATEGORIE = 10;
const HERHALING_LABEL_STRAAL_PERCENTAGE = 34;
const herhalingKleuren = [
  "#94a3b8",
  "#38bdf8",
  "#f59e0b",
  "#7c3aed",
  "#10b981",
  "#ef4444",
  "#6366f1",
  "#14b8a6",
  "#f97316",
  "#be185d",
];

function begrensHerhalingLaatsteCategorie(waarde) {
  return Math.min(
    HERHALING_MAX_LAATSTE_CATEGORIE,
    Math.max(HERHALING_MIN_LAATSTE_CATEGORIE, Math.round(Number(waarde) || 4))
  );
}

function maakHerhalingCategorieen(vanafAantal) {
  const laatsteVanaf = begrensHerhalingLaatsteCategorie(vanafAantal);
  const categorieen = [];

  for (let aantal = 1; aantal < laatsteVanaf; aantal += 1) {
    categorieen.push({
      key: `exact-${aantal}`,
      label: `${aantal} keer`,
      kleur: herhalingKleuren[(aantal - 1) % herhalingKleuren.length],
    });
  }

  categorieen.push({
    key: `vanaf-${laatsteVanaf}`,
    label: `${laatsteVanaf} of meer keer`,
    kleur: herhalingKleuren[(laatsteVanaf - 1) % herhalingKleuren.length],
  });

  return categorieen;
}

function AnalistDashboard({
  zones,
  telmomenten,
  krijgNummerplaten,
  clusters,
  bepaalKaartKleur,
  grafiekKleuren,
  geselecteerdeAnalistZones,
  toggleAnalistZone,
  selecteerCluster,
  kleurGrenzen,
  parkeerProfielen,
  actiefProfielId,
  setActiefProfielId,
  voegParkeerProfielToe,
  wijzigParkeerProfiel,
  verwijderParkeerProfiel,
  analyseModus,
  analyseObjectType,
  setAnalyseObjectType,
  analyseObjectId,
  setAnalyseObjectId,
  actiefTelmomentId,
  setActiefTelmomentId,
  telmomentLabel,
  analistRegimeFilter,
}) {
  const [profielFormulier, setProfielFormulier] = useState(leegProfiel);
  const [bewerkProfielId, setBewerkProfielId] = useState(null);
  const [herhalingLaatsteCategorieVanaf, setHerhalingLaatsteCategorieVanaf] =
    useState(4);
  const herhalingCategorieen = maakHerhalingCategorieen(
    herhalingLaatsteCategorieVanaf
  );
  const heeftRegimeFilter =
    analistRegimeFilter && analistRegimeFilter !== "alle";
  const analyseZones = heeftRegimeFilter
    ? zones.filter((zone) => zone.parkeerRegime === analistRegimeFilter)
    : zones;
  const analyseClusters = clusters
    .map((cluster) => {
      const clusterZones = (cluster.zones || []).filter((zone) =>
        analyseZones.some((analyseZone) => analyseZone.id === zone.id)
      );
      const aantal = clusterZones.reduce(
        (totaal, zone) => totaal + krijgNummerplaten(zone).length,
        0
      );
      const capaciteit = clusterZones.reduce(
        (totaal, zone) => totaal + zone.capaciteit,
        0
      );

      return {
        ...cluster,
        zones: clusterZones,
        zoneIds: clusterZones.map((zone) => zone.id),
        aantal,
        capaciteit,
        bezettingsgraad:
          capaciteit > 0 ? Math.round((aantal / capaciteit) * 100) : 0,
      };
    })
    .filter((cluster) => cluster.zones.length > 0);
  const toontGemiddelde = actiefTelmomentId === GEMIDDELDE_TELMOMENT_ID;
  const analyseCapaciteit = analyseZones.reduce(
    (totaal, zone) => totaal + zone.capaciteit,
    0
  );
  const analyseTotaalVoertuigenActiefTelmoment = analyseZones.reduce(
    (totaal, zone) => totaal + krijgNummerplaten(zone).length,
    0
  );
  const analyseTotaleBezettingsgraad =
    analyseCapaciteit > 0
      ? Math.round(
          (analyseTotaalVoertuigenActiefTelmoment / analyseCapaciteit) * 100
        )
      : 0;

  function krijgAantalVoorAnalyse(zone) {
    if (!toontGemiddelde) return krijgNummerplaten(zone).length;
    if (telmomenten.length === 0) return 0;

    const totaal = telmomenten.reduce(
      (som, telmoment) => som + krijgNummerplaten(zone, telmoment.id).length,
      0
    );

    return totaal / telmomenten.length;
  }

  function rondGetal(waarde) {
    return Number.isInteger(waarde) ? waarde : Number(waarde.toFixed(1));
  }

  function krijgTotaalVoorAnalyse() {
    return analyseZones.reduce(
      (totaal, zone) => totaal + krijgAantalVoorAnalyse(zone),
      0
    );
  }

  function krijgDruksteTelmomentId() {
    if (telmomenten.length === 0) return null;

    return telmomenten.reduce((drukste, telmoment) => {
      const aantal = analyseZones.reduce(
        (som, zone) => som + krijgNummerplaten(zone, telmoment.id).length,
        0
      );
      const druksteAantal = analyseZones.reduce(
        (som, zone) => som + krijgNummerplaten(zone, drukste.id).length,
        0
      );

      return aantal > druksteAantal ? telmoment : drukste;
    }, telmomenten[0]).id;
  }

  function krijgGefilterdeClusterNummerplaten(
    cluster,
    telmomentId = actiefTelmomentId
  ) {
    return (cluster.zones || []).flatMap((zone) =>
      krijgNummerplaten(zone, telmomentId).map((plaat) => ({
        id: `${zone.id}-${plaat}`,
        plaat,
        zoneId: zone.id,
        telmomentId,
        label: zone.naam,
        capaciteit: zone.capaciteit,
      }))
    );
  }

  function categoriseerHerhaling(aantal) {
    const laatsteVanaf = begrensHerhalingLaatsteCategorie(
      herhalingLaatsteCategorieVanaf
    );

    return aantal >= laatsteVanaf
      ? `vanaf-${laatsteVanaf}`
      : `exact-${Math.max(1, aantal)}`;
  }

  function maakLegeHerhalingTellingen() {
    return Object.fromEntries(
      herhalingCategorieen.map((categorie) => [categorie.key, 0])
    );
  }

  function berekenHerhalingPerZone(zone) {
    const telmomentenPerPlaat = {};

    telmomenten.forEach((telmoment) => {
      krijgNummerplaten(zone, telmoment.id).forEach((plaat) => {
        if (!telmomentenPerPlaat[plaat]) telmomentenPerPlaat[plaat] = new Set();
        telmomentenPerPlaat[plaat].add(telmoment.id);
      });
    });

    const categorieTellingen = maakLegeHerhalingTellingen();

    Object.values(telmomentenPerPlaat).forEach((telmomentIds) => {
      categorieTellingen[categoriseerHerhaling(telmomentIds.size)] += 1;
    });

    return categorieTellingen;
  }

  function telHerhalingInPlatenLijst(platen) {
    const registratiesPerPlaat = {};

    platen.forEach((plaat, index) => {
      const sleutel =
        typeof plaat === "object" ? plaat.plaat || plaat.id : plaat;
      const registratieSleutel =
        typeof plaat === "object" && plaat.telmomentId !== undefined
          ? plaat.telmomentId
          : index;

      if (!registratiesPerPlaat[sleutel]) {
        registratiesPerPlaat[sleutel] = new Set();
      }

      registratiesPerPlaat[sleutel].add(registratieSleutel);
    });

    const categorieTellingen = maakLegeHerhalingTellingen();

    Object.values(registratiesPerPlaat).forEach((registraties) => {
      categorieTellingen[categoriseerHerhaling(registraties.size)] += 1;
    });

    return categorieTellingen;
  }

  function maakHerhalingGradient(categorieTellingen) {
    const totaal = Object.values(categorieTellingen).reduce(
      (som, aantal) => som + aantal,
      0
    );

    if (totaal === 0) return "#e5e7eb";

    let start = 0;
    const segmenten = herhalingCategorieen
      .filter((categorie) => (categorieTellingen[categorie.key] || 0) > 0)
      .map((categorie) => {
        const aandeel = ((categorieTellingen[categorie.key] || 0) / totaal) * 100;
        const einde = start + aandeel;
        const segment = `${categorie.kleur} ${start}% ${einde}%`;
        start = einde;
        return segment;
      });

    return `conic-gradient(${segmenten.join(", ")})`;
  }

  function krijgSegmentLabelPosities(categorieTellingen) {
    const totaal = Object.values(categorieTellingen).reduce(
      (som, aantal) => som + aantal,
      0
    );

    if (totaal === 0) return [];

    let start = 0;

    return herhalingCategorieen
      .filter((categorie) => (categorieTellingen[categorie.key] || 0) > 0)
      .map((categorie) => {
        const aantal = categorieTellingen[categorie.key] || 0;
        const aandeel = aantal / totaal;
        const midden = start + aandeel / 2;
        start += aandeel;

        const hoek = midden * 2 * Math.PI - Math.PI / 2;
        return {
          key: categorie.key,
          aantal,
          x: 50 + Math.cos(hoek) * HERHALING_LABEL_STRAAL_PERCENTAGE,
          y: 50 + Math.sin(hoek) * HERHALING_LABEL_STRAAL_PERCENTAGE,
        };
      });
  }

  function berekenParkeerSessies() {
    const sessies = [];

    analyseZones.forEach((zone) => {
      const perPlaat = {};

      [...telmomenten].sort(vergelijkTelmomenten).forEach((telmoment, index) => {
        krijgNummerplaten(zone, telmoment.id).forEach((plaat) => {
          if (!perPlaat[plaat]) perPlaat[plaat] = [];
          perPlaat[plaat].push({ telmoment, index });
        });
      });

      Object.entries(perPlaat).forEach(([plaat, registraties]) => {
        let sessie = null;

        function sluitSessie() {
          if (!sessie) return;
          sessies.push({
            ...sessie,
            duurTelrondes: sessie.eindIndex - sessie.startIndex + 1,
          });
        }

        registraties
          .sort((a, b) => a.index - b.index)
          .forEach((registratie) => {
            if (!sessie) {
              sessie = {
                plaat,
                zoneId: zone.id,
                zoneNaam: zone.naam,
                regime: zone.parkeerRegime || "vrij parkeren",
                maxParkeerduur: zone.maxParkeerduur || "",
                startIndex: registratie.index,
                eindIndex: registratie.index,
                eersteTelmoment: registratie.telmoment,
                laatsteTelmoment: registratie.telmoment,
                telmomentIds: [registratie.telmoment.id],
              };
              return;
            }

            if (registratie.index === sessie.eindIndex + 1) {
              sessie.eindIndex = registratie.index;
              sessie.laatsteTelmoment = registratie.telmoment;
              sessie.telmomentIds.push(registratie.telmoment.id);
              return;
            }

            sluitSessie();
            sessie = {
              plaat,
              zoneId: zone.id,
              zoneNaam: zone.naam,
              regime: zone.parkeerRegime || "vrij parkeren",
              maxParkeerduur: zone.maxParkeerduur || "",
              startIndex: registratie.index,
              eindIndex: registratie.index,
              eersteTelmoment: registratie.telmoment,
              laatsteTelmoment: registratie.telmoment,
              telmomentIds: [registratie.telmoment.id],
            };
          });

        sluitSessie();
      });
    });

    return sessies;
  }

  function matchtProfiel(sessie, profiel) {
    const minDuur = Number(profiel.minDuur) || 1;
    const maxDuur = Number(profiel.maxDuur) || Infinity;
    const vensterGroepen = krijgTelmomentGroepenInVenster(
      profiel.vensterStart,
      profiel.vensterEinde
    );

    return (
      sessie.duurTelrondes >= minDuur &&
      sessie.duurTelrondes <= maxDuur &&
      (vensterGroepen.length === 0 ||
        vensterGroepen.some((groepIds) =>
          groepIds.every((id) => sessie.telmomentIds.includes(id))
        ))
    );
  }

  function tijdNaarMinuten(tijdstip) {
    if (!tijdstip) return null;

    const [uren, minuten] = tijdstip.split(":").map(Number);
    if (Number.isNaN(uren) || Number.isNaN(minuten)) return null;

    return uren * 60 + minuten;
  }

  function ligtInVenster(tijdstip, start, einde) {
    const minuut = tijdNaarMinuten(tijdstip);
    const startMinuut = tijdNaarMinuten(start);
    const eindMinuut = tijdNaarMinuten(einde);

    if (minuut === null || startMinuut === null || eindMinuut === null) {
      return false;
    }

    if (startMinuut <= eindMinuut) {
      return minuut >= startMinuut && minuut <= eindMinuut;
    }

    return minuut >= startMinuut || minuut <= eindMinuut;
  }

  function vergelijkTelmomenten(a, b) {
    return `${a.datum || ""}T${a.tijdstip || "00:00"}`.localeCompare(
      `${b.datum || ""}T${b.tijdstip || "00:00"}`
    );
  }

  function verschuifDatum(datum, dagen) {
    if (!datum) return "zonder datum";

    const datumObject = new Date(`${datum}T00:00:00`);
    if (Number.isNaN(datumObject.getTime())) return datum;

    datumObject.setDate(datumObject.getDate() + dagen);

    const jaar = datumObject.getFullYear();
    const maand = String(datumObject.getMonth() + 1).padStart(2, "0");
    const dag = String(datumObject.getDate()).padStart(2, "0");

    return `${jaar}-${maand}-${dag}`;
  }

  function krijgTelmomentGroepenInVenster(start, einde) {
    if (!start || !einde) return [];

    const startMinuut = tijdNaarMinuten(start);
    const eindMinuut = tijdNaarMinuten(einde);
    const looptOverMiddernacht =
      startMinuut !== null && eindMinuut !== null && startMinuut > eindMinuut;
    const groepen = {};

    [...telmomenten]
      .sort(vergelijkTelmomenten)
      .filter((telmoment) => ligtInVenster(telmoment.tijdstip, start, einde))
      .forEach((telmoment) => {
        const minuut = tijdNaarMinuten(telmoment.tijdstip);
        let sleutel = telmoment.datum || "zonder datum";

        if (looptOverMiddernacht && minuut !== null && minuut <= eindMinuut) {
          sleutel = verschuifDatum(telmoment.datum, -1);
        }

        groepen[sleutel] = [...(groepen[sleutel] || []), telmoment.id];
      });

    return Object.values(groepen).filter((groep) => groep.length > 0);
  }

  function renderHerhalingInstelling() {
    return (
      <label className="herhaling-instelling">
        Laatste categorie vanaf
        <input
          type="number"
          min={HERHALING_MIN_LAATSTE_CATEGORIE}
          max={HERHALING_MAX_LAATSTE_CATEGORIE}
          value={herhalingLaatsteCategorieVanaf}
          onChange={(e) =>
            setHerhalingLaatsteCategorieVanaf(
              begrensHerhalingLaatsteCategorie(e.target.value)
            )
          }
        />
        keer
      </label>
    );
  }

  function startProfielBewerken(profiel) {
    setBewerkProfielId(profiel.id);
    setProfielFormulier({
      naam: profiel.naam,
      vensterStart: profiel.vensterStart || "",
      vensterEinde: profiel.vensterEinde || "",
      minDuur: String(profiel.minDuur || 1),
      maxDuur: profiel.maxDuur ? String(profiel.maxDuur) : "",
    });
    setActiefProfielId(profiel.id);
  }

  function bewaarProfiel() {
    if (profielFormulier.naam.trim() === "") return;

    const profiel = {
      naam: profielFormulier.naam.trim(),
      vensterStart: profielFormulier.vensterStart,
      vensterEinde: profielFormulier.vensterEinde,
      minDuur: Number(profielFormulier.minDuur) || 1,
      maxDuur: profielFormulier.maxDuur
        ? Number(profielFormulier.maxDuur)
        : "",
    };

    if (bewerkProfielId) {
      wijzigParkeerProfiel(bewerkProfielId, profiel);
    } else {
      voegParkeerProfielToe(profiel);
    }

    setBewerkProfielId(null);
    setProfielFormulier(leegProfiel);
  }

  function renderTelmomentAnalyse() {
    const druksteTelmomentId = krijgDruksteTelmomentId();
    const totaalVoorAnalyse = krijgTotaalVoorAnalyse();
    const bezettingVoorAnalyse =
      analyseCapaciteit > 0
        ? Math.round((totaalVoorAnalyse / analyseCapaciteit) * 100)
        : 0;
    const verdelingVoorAnalyse = analyseZones.map((zone) => ({
      label: zone.naam,
      waarde: rondGetal(krijgAantalVoorAnalyse(zone)),
    }));
    const verdelingPerAnalyseZone = analyseZones.map((zone) => ({
      label: zone.naam,
      waarde: krijgNummerplaten(zone).length,
    }));

    return (
      <section className="analyse-kader">
        <h2 className="analyse-kader-titel">Zoneanalyse</h2>

        <div className="statusbalk object-analyse-keuze">
          <label>
            Telmoment selecteren
            <select
              value={actiefTelmomentId || ""}
              onChange={(e) => {
                const waarde = e.target.value;
                setActiefTelmomentId(
                  waarde === GEMIDDELDE_TELMOMENT_ID
                    ? GEMIDDELDE_TELMOMENT_ID
                    : Number(waarde)
                );
              }}
            >
              <option value={GEMIDDELDE_TELMOMENT_ID}>
                Gemiddelde over alle telmomenten
              </option>
              {telmomenten.map((telmoment) => (
                <option value={telmoment.id} key={telmoment.id}>
                  {telmomentLabel(telmoment)}
                  {telmoment.id === druksteTelmomentId
                    ? " - drukste moment"
                    : ""}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="statusbalk analyse-overzicht-rij">
          <strong>Analyse-overzicht gekozen telmoment</strong>
          <span>Aantal zones: {analyseZones.length}</span>
          <span>
            Voertuigen:{" "}
            {toontGemiddelde
              ? rondGetal(totaalVoorAnalyse)
              : analyseTotaalVoertuigenActiefTelmoment}
          </span>
          <span>Capaciteit: {analyseCapaciteit}</span>
          <span>
            Bezetting:{" "}
            {toontGemiddelde ? bezettingVoorAnalyse : analyseTotaleBezettingsgraad}%
          </span>
        </div>

        <div className="taart-grid taart-grid-overzicht">
          <Taartdiagram
            titel="Totale bezettingsgraad"
            subtitel={
              toontGemiddelde
                ? "Gemiddelde over alle telmomenten"
                : "Alle zones samen"
            }
            percentage={
              toontGemiddelde ? bezettingVoorAnalyse : analyseTotaleBezettingsgraad
            }
            kleur={bepaalKaartKleur(
              toontGemiddelde ? bezettingVoorAnalyse : analyseTotaleBezettingsgraad
            )}
            middenTekst={`${
              toontGemiddelde
                ? rondGetal(totaalVoorAnalyse)
                : analyseTotaalVoertuigenActiefTelmoment
            }/${analyseCapaciteit}`}
          />

          <VerdelingTaartdiagram
            titel={
              toontGemiddelde
                ? "Gemiddelde verdeling gebruikte plaatsen per zone"
                : "Verdeling gebruikte plaatsen per zone"
            }
            data={toontGemiddelde ? verdelingVoorAnalyse : verdelingPerAnalyseZone}
            grafiekKleuren={grafiekKleuren}
          />
        </div>

        <div className="taart-grid taart-grid-zones">
          {analyseZones.map((zone) => {
            const aantal = krijgAantalVoorAnalyse(zone);
            const bezettingsgraad =
              zone.capaciteit > 0
                ? Math.round((aantal / zone.capaciteit) * 100)
                : 0;

            return (
              <Taartdiagram
                key={zone.id}
                titel={zone.naam}
                subtitel={`${zone.parkeerRegime || "vrij parkeren"} - ${
                  toontGemiddelde ? "gemiddelde - " : ""
                }capaciteit: ${zone.capaciteit}`}
                percentage={bezettingsgraad}
                kleur={bepaalKaartKleur(bezettingsgraad)}
                middenTekst={`${rondGetal(aantal)}/${zone.capaciteit}`}
              />
            );
          })}
        </div>

        <Lijngrafiek
          zones={analyseZones}
          telmomenten={telmomenten}
          geselecteerdeZoneIds={geselecteerdeAnalistZones}
          krijgNummerplaten={krijgNummerplaten}
          grafiekKleuren={grafiekKleuren}
        />

        <div className="statusbalk">
          <strong>Zones in lijngrafiek</strong>

          <div className="zone-checkboxes">
            {analyseZones.map((zone) => (
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

      </section>
    );
  }

  function renderObjectAnalyse() {
    const objecten = analyseObjectType === "cluster" ? analyseClusters : analyseZones;
    const geselecteerdObject =
      objecten.find((object) => object.id === Number(analyseObjectId)) ||
      objecten[0];

    if (!geselecteerdObject) {
      return (
        <section className="analyse-kader">
          <h2 className="analyse-kader-titel">Analyse doorheen de tijd</h2>
          <p className="lege-lijst">Geen zone of cluster beschikbaar.</p>
        </section>
      );
    }

    const krijgData =
      analyseObjectType === "cluster"
        ? krijgGefilterdeClusterNummerplaten
        : krijgNummerplaten;
    const datumGroepen = telmomenten.reduce((groepen, telmoment) => {
      const datum = telmoment.datum || "geen datum";
      return {
        ...groepen,
        [datum]: [...(groepen[datum] || []), telmoment],
      };
    }, {});

    return (
      <section className="analyse-kader">
        <h2 className="analyse-kader-titel">Analyse doorheen de tijd</h2>

        <div className="statusbalk object-analyse-keuze">
          <label>
            Niveau
            <select
              value={analyseObjectType}
              onChange={(e) => {
                const nieuwType = e.target.value;
                const nieuweObjecten =
                  nieuwType === "cluster" ? analyseClusters : analyseZones;
                setAnalyseObjectType(nieuwType);
                setAnalyseObjectId(nieuweObjecten[0]?.id || "");
              }}
            >
              <option value="zone">Zone</option>
              <option value="cluster">Cluster</option>
            </select>
          </label>

          <label>
            Keuze
            <select
              value={geselecteerdObject.id}
              onChange={(e) => setAnalyseObjectId(Number(e.target.value))}
            >
              {objecten.map((object) => (
                <option value={object.id} key={object.id}>
                  {object.naam}
                </option>
              ))}
            </select>
          </label>
        </div>

        <Lijngrafiek
          titel={`Evolutie voor ${geselecteerdObject.naam}`}
          zones={[geselecteerdObject]}
          telmomenten={telmomenten}
          geselecteerdeZoneIds={[geselecteerdObject.id]}
          krijgNummerplaten={krijgData}
          grafiekKleuren={grafiekKleuren}
        />

        <RotatieAnalyse
          zones={[geselecteerdObject]}
          telmomenten={telmomenten}
          krijgNummerplaten={krijgData}
          kleurGrenzen={kleurGrenzen}
          titel={`Rotatieanalyse: ${geselecteerdObject.naam}`}
          leegLabel={analyseObjectType === "cluster" ? "deze cluster" : "deze zone"}
          onSelectItem={analyseObjectType === "cluster" ? selecteerCluster : undefined}
        />

        <div className="statusbalk herhaling-legende">
          <strong>Registratie dezelfde voertuigen per teldag</strong>
          {renderHerhalingInstelling()}
          {herhalingCategorieen.map((categorie) => (
            <span key={categorie.key}>
              <span
                className="legende-kleur"
                style={{ background: categorie.kleur }}
              />
              {categorie.label}
            </span>
          ))}
        </div>

        <div className="taart-grid taart-grid-zones">
          {Object.entries(datumGroepen).map(([datum, momenten]) => {
            const platen = momenten.flatMap((telmoment) =>
              krijgData(geselecteerdObject, telmoment.id)
            );
            const categorieTellingen = telHerhalingInPlatenLijst(platen);
            const totaal = Object.values(categorieTellingen).reduce(
              (som, aantal) => som + aantal,
              0
            );

            return (
              <div className="taartkaart" key={datum}>
                <h3>{formatBelgischeDatum(datum)}</h3>
                <p className="taart-subtitel">
                  {totaal} unieke nummerplaten
                </p>
                <div
                  className="taartdiagram herhaling-taartdiagram"
                  style={{
                    background: maakHerhalingGradient(categorieTellingen),
                  }}
                >
                  {krijgSegmentLabelPosities(categorieTellingen).map(
                    (label) => (
                      <span
                        className="herhaling-segment-label"
                        style={{
                          left: `${label.x}%`,
                          top: `${label.y}%`,
                        }}
                        key={label.key}
                      >
                        {label.aantal}
                      </span>
                    )
                  )}
                  <div className="taart-midden">
                    <strong>{totaal}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  function renderProfielAnalyse() {
    const actiefProfiel =
      parkeerProfielen.find((profiel) => profiel.id === actiefProfielId) ||
      parkeerProfielen[0];
    const sessies = berekenParkeerSessies();
    const profielSessies = actiefProfiel
      ? sessies.filter((sessie) => matchtProfiel(sessie, actiefProfiel))
      : [];
    const profielResultatenPerZone = analyseZones
      .map((zone) => {
        const nummerplaten = new Set(
          profielSessies
            .filter((sessie) => sessie.zoneId === zone.id)
            .map((sessie) => sessie.plaat)
        );

        return {
          zoneId: zone.id,
          zoneNaam: zone.naam,
          aantal: nummerplaten.size,
        };
      })
      .filter((resultaat) => resultaat.aantal > 0)
      .sort((a, b) => b.aantal - a.aantal);
    const maxProfielAantal = Math.max(
      1,
      ...profielResultatenPerZone.map((resultaat) => resultaat.aantal)
    );
    const totaalProfielNummerplaten = new Set(
      profielSessies.map((sessie) => sessie.plaat)
    ).size;

    return (
      <section className="analyse-kader analyse-kader-profielen">
        <h2 className="analyse-kader-titel">Parkeerprofielen</h2>

        <div className="statusbalk parkeerprofiel-form">
          <label>
            Naam profiel
            <input
              value={profielFormulier.naam}
              onChange={(e) =>
                setProfielFormulier({
                  ...profielFormulier,
                  naam: e.target.value,
                })
              }
              placeholder="bv. Kortparkeren horeca"
            />
          </label>

          <label>
            Venster vanaf
            <input
              type="time"
              value={profielFormulier.vensterStart}
              onChange={(e) =>
                setProfielFormulier({
                  ...profielFormulier,
                  vensterStart: e.target.value,
                })
              }
            />
          </label>

          <label>
            Venster tot
            <input
              type="time"
              value={profielFormulier.vensterEinde}
              onChange={(e) =>
                setProfielFormulier({
                  ...profielFormulier,
                  vensterEinde: e.target.value,
                })
              }
            />
          </label>

          <label>
            Min. duur
            <input
              type="number"
              min="1"
              value={profielFormulier.minDuur}
              onChange={(e) =>
                setProfielFormulier({
                  ...profielFormulier,
                  minDuur: e.target.value,
                })
              }
            />
          </label>

          <label>
            Max. duur
            <input
              type="number"
              min="1"
              value={profielFormulier.maxDuur}
              onChange={(e) =>
                setProfielFormulier({
                  ...profielFormulier,
                  maxDuur: e.target.value,
                })
              }
              placeholder="geen"
            />
          </label>

          <button onClick={bewaarProfiel}>
            {bewerkProfielId ? "Profiel bijwerken" : "Profiel toevoegen"}
          </button>
        </div>

        {parkeerProfielen.length > 0 && (
          <div className="statusbalk parkeerprofiel-lijst">
            <label>
              Actief profiel
              <select
                value={actiefProfiel?.id || ""}
                onChange={(e) => setActiefProfielId(Number(e.target.value))}
              >
                {parkeerProfielen.map((profiel) => (
                  <option value={profiel.id} key={profiel.id}>
                    {profiel.naam}
                  </option>
                ))}
              </select>
            </label>

            <div className="knoppenrij">
              {parkeerProfielen.map((profiel) => (
                <div className="profiel-chip" key={profiel.id}>
                  <span>{profiel.naam}</span>
                  <button onClick={() => startProfielBewerken(profiel)}>
                    Aanpassen
                  </button>
                  <button onClick={() => verwijderParkeerProfiel(profiel.id)}>
                    Verwijderen
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="statusbalk">
          <strong>Resultaat gekozen profiel</strong>
          <br />
          {actiefProfiel
            ? `${totaalProfielNummerplaten} unieke nummerplaten gevonden${
                actiefProfiel.vensterStart && actiefProfiel.vensterEinde
                  ? ` binnen ${actiefProfiel.vensterStart}-${actiefProfiel.vensterEinde}`
                  : ""
              }.`
            : "Maak eerst een parkeerprofiel aan."}
        </div>

        {actiefProfiel && (
          <div className="profiel-resultaten">
            {profielResultatenPerZone.length === 0 ? (
              <p className="lege-lijst">Geen nummerplaten voor dit profiel.</p>
            ) : (
              <div className="profiel-zonegrafiek">
                {profielResultatenPerZone.map((resultaat, index) => (
                  <div className="profiel-zonebalk-rij" key={resultaat.zoneId}>
                    <span className="profiel-zone-naam">
                      {resultaat.zoneNaam}
                    </span>
                    <div className="profiel-zonebalk-spoor">
                      <div
                        className="profiel-zonebalk"
                        style={{
                          width: `${Math.max(
                            8,
                            (resultaat.aantal / maxProfielAantal) * 100
                          )}%`,
                          background:
                            grafiekKleuren[index % grafiekKleuren.length],
                        }}
                      />
                    </div>
                    <strong>{resultaat.aantal}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    );
  }

  function renderHerhalingsAnalyse() {
    return (
      <section className="analyse-kader analyse-kader-herhaling">
        <h2 className="analyse-kader-titel">
          Registratie zelfde voertuigen over tellingen heen
        </h2>

        <div className="statusbalk herhaling-legende">
          <strong>Kleurcode</strong>
          {renderHerhalingInstelling()}
          {herhalingCategorieen.map((categorie) => (
            <span key={categorie.key}>
              <span
                className="legende-kleur"
                style={{ background: categorie.kleur }}
              />
              {categorie.label}
            </span>
          ))}
        </div>

        <div className="taart-grid taart-grid-zones">
          {analyseZones.map((zone) => {
            const categorieTellingen = berekenHerhalingPerZone(zone);
            const totaal = Object.values(categorieTellingen).reduce(
              (som, aantal) => som + aantal,
              0
            );

            return (
              <div className="taartkaart" key={zone.id}>
                <h3>{zone.naam}</h3>
                <p className="taart-subtitel">
                  {totaal} unieke nummerplaten
                </p>
                <div
                  className="taartdiagram herhaling-taartdiagram"
                  style={{
                    background: maakHerhalingGradient(categorieTellingen),
                  }}
                >
                  {krijgSegmentLabelPosities(categorieTellingen).map(
                    (label) => (
                      <span
                        className="herhaling-segment-label"
                        style={{
                          left: `${label.x}%`,
                          top: `${label.y}%`,
                        }}
                        key={label.key}
                      >
                        {label.aantal}
                      </span>
                    )
                  )}
                  <div className="taart-midden">
                    <strong>{totaal}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  if (analyseModus === "object") return renderObjectAnalyse();
  if (analyseModus === "profiel") return renderProfielAnalyse();
  if (analyseModus === "herhaling") return renderHerhalingsAnalyse();
  return renderTelmomentAnalyse();
}

export default AnalistDashboard;
