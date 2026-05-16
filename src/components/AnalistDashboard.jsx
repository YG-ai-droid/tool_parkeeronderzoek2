import Taartdiagram from "./Taartdiagram";
import VerdelingTaartdiagram from "./VerdelingTaartdiagram";
import Lijngrafiek from "./Lijngrafiek";
import RotatieAnalyse from "./RotatieAnalyse";

function AnalistDashboard({
  zones,
  telmomenten,
  actiefTelmomentId,
  setActiefTelmomentId,
  telmomentLabel,
  krijgNummerplaten,
  totaalVoertuigenActiefTelmoment,
  totaleCapaciteit,
  totaleBezettingsgraad,
  verdelingPerZone,
  bepaalKaartKleur,
  grafiekKleuren,
  geselecteerdeAnalistZones,
  toggleAnalistZone,
  toonKaartTaarten,
  setToonKaartTaarten,
  kleurGrenzen,
}) {
  return (
    <>
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
          grafiekKleuren={grafiekKleuren}
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
        grafiekKleuren={grafiekKleuren}
      />

      <RotatieAnalyse
        zones={zones}
        telmomenten={telmomenten}
        krijgNummerplaten={krijgNummerplaten}
        kleurGrenzen={kleurGrenzen}
      />
    </>
  );
}

export default AnalistDashboard;
