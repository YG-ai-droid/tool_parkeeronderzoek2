import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  LayersControl,
  Polygon,
  Popup,
  Marker,
  Tooltip,
  useMap,
} from "react-leaflet";
import KlikbareKaart from "./KlikbareKaart";
import { berekenCentrum, maakMiniTaartIcon } from "./KaartHelpers";

function ZoomNaarProjectZones({ zones, actiefProjectId }) {
  const map = useMap();
  const vorigProjectIdRef = useRef(null);

  useEffect(() => {
    if (vorigProjectIdRef.current === actiefProjectId) return;

    vorigProjectIdRef.current = actiefProjectId;

    const punten = zones
      .filter((zone) => zone.polygoon.length >= 3)
      .flatMap((zone) => zone.polygoon);

    if (punten.length === 0) return;

    map.fitBounds(punten, {
      padding: [30, 30],
      maxZoom: 17,
      animate: true,
    });
  }, [actiefProjectId, map, zones]);

  return null;
}

function MijnLocatieKnop({ isInvuller }) {
  const map = useMap();
  const [positie, setPositie] = useState(null);
  const [bezig, setBezig] = useState(false);

  if (!isInvuller) return null;

  function centreerOpLocatie() {
    if (!navigator.geolocation) {
      alert("Locatiebepaling wordt niet ondersteund door deze browser.");
      return;
    }

    setBezig(true);

    navigator.geolocation.getCurrentPosition(
      (positieInfo) => {
        const nieuwePositie = [
          positieInfo.coords.latitude,
          positieInfo.coords.longitude,
        ];

        setPositie(nieuwePositie);
        map.setView(nieuwePositie, Math.max(map.getZoom(), 17), {
          animate: true,
        });
        setBezig(false);
      },
      (fout) => {
        setBezig(false);
        const melding =
          fout.code === fout.PERMISSION_DENIED
            ? "Geef de browser toestemming om je locatie te gebruiken."
            : "Je locatie kon niet bepaald worden.";
        alert(melding);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <>
      <div className="locatie-control">
        <button type="button" onClick={centreerOpLocatie} disabled={bezig}>
          {bezig
            ? "Locatie zoeken..."
            : "Centreer kaart op mijn locatie"}
        </button>
      </div>
      {positie && (
        <Marker position={positie}>
          <Popup>Je huidige positie</Popup>
        </Marker>
      )}
    </>
  );
}

function ParkeerKaart({
  zones,
  clusters,
  telmomenten,
  actiefProjectId,
  actiefTelmoment,
  actieveZoneId,
  actiefClusterId,
  analyseModus,
  analyseObjectType,
  analyseObjectId,
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
  const toonClusterKaartElementen =
    isAnalist && analyseModus === "object" && analyseObjectType === "cluster";
  const kaartClusterId = toonClusterKaartElementen
    ? Number(analyseObjectId) || actiefClusterId
    : actiefClusterId;
  const actiefCluster = clusters.find((cluster) => cluster.id === kaartClusterId);
  const toonClusterMarkering = isBeheerder || toonClusterKaartElementen;
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

  function krijgTaartData(item, dataFunctie) {
    const aantallen = telmomenten.map((telmoment) =>
      dataFunctie(item, telmoment.id).length
    );
    const totaal = aantallen.reduce((som, aantal) => som + aantal, 0);

    if (totaal === 0) {
      return {
        aantallen,
        totaal,
        achtergrond: "#e5e7eb",
      };
    }

    let start = 0;
    const segmenten = aantallen.map((aantal, index) => {
      const aandeel = (aantal / totaal) * 100;
      const einde = start + aandeel;
      const segment = `${
        grafiekKleuren[index % grafiekKleuren.length]
      } ${start}% ${einde}%`;
      start = einde;
      return segment;
    });

    return {
      aantallen,
      totaal,
      achtergrond: `conic-gradient(${segmenten.join(", ")})`,
    };
  }

  const zichtbareZoneTaartIds =
    isAnalist && analyseModus === "object" && analyseObjectType === "zone"
      ? new Set([Number(analyseObjectId)])
      : null;

  return (
    <section className="kaartkolom">
      <MapContainer
        center={[51.2686, 4.7123]}
        zoom={15}
        className="kaart"
        doubleClickZoom={false}
      >
        <ZoomNaarProjectZones
          zones={zones}
          actiefProjectId={actiefProjectId}
        />
        <MijnLocatieKnop isInvuller={isInvuller} />

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
          const kaartKleur = bepaalKaartKleur(bezettingsgraad);
          const isGrijzeZone = kaartKleur.toLowerCase() === "#9ca3af";
          const vulKleur = isBeheerder ? "#9ca3af" : kaartKleur;
          const randKleur = isBeheerder || isGrijzeZone ? "#111827" : kaartKleur;
          const toonClusterHighlight = isInActieveCluster && !isBeheerder;

          return (
            <Polygon
              key={zone.id}
              positions={zone.polygoon}
              pathOptions={{
                color: toonClusterHighlight
                  ? "#7c3aed"
                  : randKleur,
                fillColor: toonClusterHighlight
                  ? "#a855f7"
                  : vulKleur,
                fillOpacity:
                  actieveZoneId === zone.id || toonClusterHighlight ? 0.45 : 0.25,
                weight:
                  actieveZoneId === zone.id || toonClusterHighlight ? 5 : 2,
                dashArray: toonClusterHighlight ? "8 6" : null,
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
                Regime: {zone.parkeerRegime || "vrij parkeren"}
                <br />
                {zone.maxParkeerduur && (
                  <>
                    Max. parkeerduur: {zone.maxParkeerduur}
                    <br />
                  </>
                )}
                Voertuigen: {aantal}
                <br />
                Bezettingsgraad: {bezettingsgraad}%
              </Popup>
            </Polygon>
          );
        })}

        {isAnalist &&
          toonKaartTaarten &&
          toonClusterKaartElementen &&
          clusters
            .filter((cluster) => cluster.id === kaartClusterId)
            .map((cluster) => {
            const positie = berekenClusterCentrum(cluster);
            if (!positie) return null;

            const taartData = krijgTaartData(
              cluster,
              (huidigCluster, telmomentId) =>
                Array.from({
                  length: krijgClusterAantal(huidigCluster, telmomentId),
                })
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
                    <div
                      className="mini-taart-tooltip-groot"
                      style={{ background: taartData.achtergrond }}
                    >
                      <span>{taartData.totaal}</span>
                    </div>
                    <br />
                    Clustergebruik over alle telmomenten:{" "}
                    <strong>{taartData.totaal}</strong>
                    <br />
                    Capaciteit: <strong>{krijgClusterCapaciteit(cluster)}</strong>
                  </div>
                </Tooltip>
              </Marker>
            );
          })}

        {isAnalist &&
          toonKaartTaarten &&
          !toonClusterKaartElementen &&
          zones.map((zone) => {
            if (zone.polygoon.length < 3) return null;
            if (zichtbareZoneTaartIds && !zichtbareZoneTaartIds.has(zone.id)) {
              return null;
            }

            const taartData = krijgTaartData(zone, krijgNummerplaten);

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
                    <div
                      className="mini-taart-tooltip-groot"
                      style={{ background: taartData.achtergrond }}
                    >
                      <span>{taartData.totaal}</span>
                    </div>
                    <br />
                    Totaal gebruik over alle telmomenten:{" "}
                    <strong>{taartData.totaal}</strong>

                    <div className="mini-taart-legende">
                      {telmomenten.map((telmoment, index) => {
                        const aantal = taartData.aantallen[index];
                        const aandeel =
                          taartData.totaal > 0
                            ? Math.round((aantal / taartData.totaal) * 100)
                            : 0;

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
