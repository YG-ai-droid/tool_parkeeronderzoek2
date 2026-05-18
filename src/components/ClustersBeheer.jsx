function ClustersBeheer({
  clusters,
  zones,
  actiefClusterId,
  openClusterId,
  nieuweClusterNaam,
  setNieuweClusterNaam,
  voegClusterToe,
  selecteerCluster,
  toggleClusterOpen,
  toggleClusterZone,
  verwijderCluster,
  wijzigClusterNaam,
}) {
  return (
    <div className="beheer-zones-blok">
      <h2>Clusters beheren</h2>

      <div className="nieuwe-cluster">
        <input
          type="text"
          placeholder="Naam van cluster"
          value={nieuweClusterNaam}
          onChange={(e) => setNieuweClusterNaam(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              voegClusterToe();
            }
          }}
        />

        <button onClick={voegClusterToe}>Voeg cluster toe</button>
      </div>

      {clusters.length === 0 ? (
        <p className="lege-lijst">Nog geen clusters aangemaakt.</p>
      ) : (
        <div className="cluster-lijst">
          {clusters.map((cluster) => (
            <div
              className={`cluster-card ${
                actiefClusterId === cluster.id ? "actief" : ""
              }`}
              key={cluster.id}
              onDoubleClick={(e) => {
                if (
                  e.target.closest(".cluster-zones") ||
                  e.target.closest(".cluster-acties")
                ) {
                  return;
                }

                toggleClusterOpen(cluster.id);
              }}
            >
              <button
                type="button"
                className="cluster-header"
                onClick={() => selecteerCluster(cluster.id)}
              >
                <span>
                  <strong>{cluster.naam}</strong>
                  <small>{cluster.zoneIds.length} zones geselecteerd</small>
                </span>

                <span className="zone-status">
                  {actiefClusterId === cluster.id
                    ? "zichtbaar op kaart"
                    : "toon op kaart"}
                </span>
              </button>

              {openClusterId === cluster.id && (
                <>
                  <div className="cluster-zones">
                    {zones.map((zone) => (
                      <label key={zone.id}>
                        <input
                          type="checkbox"
                          checked={cluster.zoneIds.includes(zone.id)}
                          onChange={() =>
                            toggleClusterZone(cluster.id, zone.id)
                          }
                        />
                        {zone.naam}
                      </label>
                    ))}
                  </div>

                  <div className="knoppenrij cluster-acties">
                    <button
                      type="button"
                      onClick={() => wijzigClusterNaam(cluster.id)}
                    >
                      Hernoem cluster
                    </button>

                    <button
                      type="button"
                      className="verwijder-zone-knop"
                      onClick={() => verwijderCluster(cluster.id)}
                    >
                      Verwijder cluster
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClustersBeheer;
