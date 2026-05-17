import Taartdiagram from "./Taartdiagram";
import VerdelingTaartdiagram from "./VerdelingTaartdiagram";
import Lijngrafiek from "./Lijngrafiek";
import RotatieAnalyse from "./RotatieAnalyse";

function AnalistDashboard({
  zones,
  telmomenten,
  krijgNummerplaten,
  totaalVoertuigenActiefTelmoment,
  totaleCapaciteit,
  totaleBezettingsgraad,
  verdelingPerZone,
  clusters,
  verdelingPerCluster,
  krijgClusterNummerplaten,
  bepaalKaartKleur,
  grafiekKleuren,
  geselecteerdeAnalistZones,
  toggleAnalistZone,
  geselecteerdeAnalistClusters,
  toggleAnalistCluster,
  selecteerCluster,
  kleurGrenzen,
}) {
  return (
    <>
      <section className="analyse-kader">
        <h2 className="analyse-kader-titel">Zoneanalyse</h2>

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
      </section>

      {clusters.length > 0 && (
        <section className="analyse-kader analyse-kader-clusters">
          <h2 className="analyse-kader-titel">Clusteranalyse</h2>

          <div className="statusbalk">
            <strong>Clusteranalyse huidig telmoment</strong>
            <br />
            Aantal clusters: {clusters.length}
          </div>

          <div className="taart-grid taart-grid-overzicht">
            <VerdelingTaartdiagram
              titel="Verdeling gebruikte plaatsen per cluster"
              data={verdelingPerCluster}
              grafiekKleuren={grafiekKleuren}
            />
          </div>

          <div className="taart-grid taart-grid-zones">
            {clusters.map((cluster) => (
              <Taartdiagram
                key={cluster.id}
                titel={cluster.naam}
                subtitel={`${cluster.zones.length} zones — capaciteit: ${cluster.capaciteit}`}
                percentage={cluster.bezettingsgraad}
                kleur={bepaalKaartKleur(cluster.bezettingsgraad)}
                middenTekst={`${cluster.aantal}/${cluster.capaciteit}`}
                onClick={() => selecteerCluster(cluster.id)}
              />
            ))}
          </div>

          <div className="statusbalk">
            <strong>Clusters in lijngrafiek</strong>

            <div className="zone-checkboxes">
              {clusters.map((cluster) => (
                <label key={cluster.id}>
                  <input
                    type="checkbox"
                    checked={geselecteerdeAnalistClusters.includes(cluster.id)}
                    onChange={() => toggleAnalistCluster(cluster.id)}
                  />
                  {cluster.naam}
                </label>
              ))}
            </div>
          </div>

          <Lijngrafiek
            titel="Evolutie getelde aantallen per cluster"
            zones={clusters}
            telmomenten={telmomenten}
            geselecteerdeZoneIds={geselecteerdeAnalistClusters}
            krijgNummerplaten={krijgClusterNummerplaten}
            grafiekKleuren={grafiekKleuren}
          />

          <RotatieAnalyse
            zones={clusters}
            telmomenten={telmomenten}
            krijgNummerplaten={krijgClusterNummerplaten}
            kleurGrenzen={kleurGrenzen}
            titel="Rotatieanalyse: verblijfsduur per cluster"
            leegLabel="deze cluster"
            onSelectItem={selecteerCluster}
          />
        </section>
      )}
    </>
  );
}

export default AnalistDashboard;
