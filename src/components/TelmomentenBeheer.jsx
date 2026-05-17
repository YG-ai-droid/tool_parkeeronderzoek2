function TelmomentenBeheer({
  telmomenten,
  nieuwTelmomentNaam,
  setNieuwTelmomentNaam,
  nieuwTelmomentDatum,
  setNieuwTelmomentDatum,
  nieuwTelmomentTijdstip,
  setNieuwTelmomentTijdstip,
  voegTelmomentToe,
  verwijderTelmoment,
}) {
  return (
    <div className="statusbalk beheer-zones-blok">
      <h2>Telmomenten beheren</h2>

      <div className="nieuwe-zone telmoment-formulier">
        <input
          type="text"
          placeholder="Naam, bv. Ronde 1"
          value={nieuwTelmomentNaam}
          onChange={(e) => setNieuwTelmomentNaam(e.target.value)}
        />

        <input
          type="date"
          value={nieuwTelmomentDatum}
          onChange={(e) => setNieuwTelmomentDatum(e.target.value)}
        />

        <input
          type="time"
          value={nieuwTelmomentTijdstip}
          onChange={(e) => setNieuwTelmomentTijdstip(e.target.value)}
        />

        <button onClick={voegTelmomentToe}>Voeg telmoment toe</button>
      </div>

      <div className="nummerplaatlijst">
        {telmomenten.map((telmoment) => (
          <li key={telmoment.id}>
            {telmoment.datum ? `${telmoment.datum} — ` : ""}
            {telmoment.naam} — {telmoment.tijdstip}
            <button
              className="verwijder-knop"
              onClick={() => verwijderTelmoment(telmoment.id)}
            >
              X
            </button>
          </li>
        ))}
      </div>
    </div>
  );
}

export default TelmomentenBeheer;
