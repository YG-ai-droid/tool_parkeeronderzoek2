import {
  MapContainer,
  TileLayer,
  LayersControl,
  Polygon,
  Popup,
  Marker,
  Tooltip,
} from "react-leaflet";
import KlikbareKaart from "./KlikbareKaart";
import { berekenCentrum, maakMiniTaartIcon } from "./KaartHelpers";

function ParkeerKaart({
  zones,
  clusters,
  telmomenten,
  actiefTelmoment,
  actieveZoneId,
  actiefClusterId,
  bewerkmodusZoneId,
  isBeheerder,
  isInvuller,
  isAnalist,
  toonKaartTaarten,
  tekenmodus,
  puntIcon,
  grafiekKleuren,
  krijgNummerplaten,
  telmomentLabel,
  bepaalKaartKleur,
  krijgClusterZones,
  krijgClusterAantal,
  krijgClusterCapaciteit,
  selecteerZone,
  selecteerCluster,
  voegPuntToe,
  voegPuntToeOpDichtsteZijde,
  verplaatsPunt,
}) {
  const actiefCluster = clusters.find((cluster) => cluster.id === actiefClusterId);
  const toonClusterMarkering = !isInvuller;
  const actieveClusterZoneIds = new Set(
    toonClusterMarkering ? actiefCluster?.zoneIds || [] : []
  );

  function berekenClusterCentrum(cluster) {
    const zoneCentra = krijgClusterZones(cluster)
      .filter((zone) => zone.polygoon.length >= 3)
      .map((zone) => berekenCentrum(zone.polygoon));

    if (zoneCentra.length === 0) return null;

    const totaal = zoneCentra.reduce(
      (som, punt) => ({
        lat: som.lat + punt[0],
        lng: som.lng + punt[1],
      }),
      { lat: 0, lng: 0 }
    );

    return [totaal.lat / zoneCentra.length, totaal.lng / zoneCentra.length];
  }

  return (
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
          <KlikbareKaart tekenmodus={tekenmodus} voegPuntToe={voegPuntToe} />
        )}

        {zones.map((zone) => {
          if (zone.polygoon.length < 3) return null;

          const isInActieveCluster = actieveClusterZoneIds.has(zone.id);
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
                color: isInActieveCluster
                  ? "#7c3aed"
                  : bepaalKaartKleur(bezettingsgraad),
                fillColor: isInActieveCluster
                  ? "#a855f7"
                  : bepaalKaartKleur(bezettingsgraad),
                fillOpacity:
                  actieveZoneId === zone.id || isInActieveCluster ? 0.45 : 0.2,
                weight:
                  actieveZoneId === zone.id || isInActieveCluster ? 5 : 2,
                dashArray: isInActieveCluster ? "8 6" : null,
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
          clusters.map((cluster) => {
            const positie = berekenClusterCentrum(cluster);
            if (!positie) return null;

            const totaal = telmomenten.reduce(
              (som, telmoment) =>
                som + krijgClusterAantal(cluster, telmoment.id),
              0
            );

            return (
              <Marker
                key={`cluster-taart-${cluster.id}`}
                position={positie}
                icon={maakMiniTaartIcon(
                  cluster,
                  telmomenten,
                  (huidigCluster, telmomentId) =>
                    Array.from({
                      length: krijgClusterAantal(huidigCluster, telmomentId),
                    }),
                  grafiekKleuren
                )}
                eventHandlers={{
                  click: () => selecteerCluster(cluster.id),
                }}
              >
                <Tooltip direction="top" offset={[0, -12]} opacity={1}>
                  <div className="mini-taart-tooltip">
                    <strong>{cluster.naam}</strong>
                    <br />
                    Clustergebruik over alle telmomenten:{" "}
                    <strong>{totaal}</strong>
                    <br />
                    Capaciteit: <strong>{krijgClusterCapaciteit(cluster)}</strong>
                  </div>
                </Tooltip>
              </Marker>
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
                icon={maakMiniTaartIcon(
                  zone,
                  telmomenten,
                  krijgNummerplaten,
                  grafiekKleuren
                )}
              >
                <Tooltip direction="top" offset={[0, -12]} opacity={1}>
                  <div className="mini-taart-tooltip">
                    <strong>{zone.naam}</strong>
                    <br />
                    Totaal gebruik over alle telmomenten:{" "}
                    <strong>{totaal}</strong>

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
                                  grafiekKleuren[
                                    index % grafiekKleuren.length
                                  ],
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
  );
}

export default ParkeerKaart;
