import { useMapEvents } from "react-leaflet";

function KlikbareKaart({ tekenmodus, voegPuntToe }) {
  useMapEvents({
    click(e) {
      if (tekenmodus) voegPuntToe([e.latlng.lat, e.latlng.lng]);
    },
  });

  return null;
}

export default KlikbareKaart;