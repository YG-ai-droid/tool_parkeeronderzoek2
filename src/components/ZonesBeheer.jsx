import ZoneLijst from "./ZoneLijst";

function ZonesBeheer({
  nieuweZoneNaam,
  setNieuweZoneNaam,
  nieuweCapaciteit,
  setNieuweCapaciteit,
  voegZoneToe,
  zones,
  actieveZoneId,
  actiefTelmoment,
  krijgNummerplaten,
  telmomentLabel,
  bepaalKleur,
  selecteerZone,
  toggleZoneOpen,
  isBeheerder,
  isInvuller,
  tekenmodus,
  setTekenmodus,
  setBewerkmodusZoneId,
  setActieveZoneId,
  verwijderLaatstePunt,
  toggleBewerkmodus,
  wisPolygoon,
  verwijderZone,
  wijzigZoneNaam,
  bewerkmodusZoneId,
  wijzigInvoer,
  voegNummerplaatToe,
  verwijderNummerplaat,
}) {
  return (
    <div className="beheer-zones-blok">
      <h2>Zones beheren</h2>

      <div className="nieuwe-zone">
        <input
          type="text"
          placeholder="Naam van zone"
          value={nieuweZoneNaam}
          onChange={(e) => setNieuweZoneNaam(e.target.value)}
        />

        <input
          type="number"
          placeholder="Capaciteit"
          value={nieuweCapaciteit}
          onChange={(e) => setNieuweCapaciteit(e.target.value)}
        />

        <button onClick={voegZoneToe}>Voeg zone toe</button>
      </div>

      <ZoneLijst
        zones={zones}
        actieveZoneId={actieveZoneId}
        actiefTelmoment={actiefTelmoment}
        krijgNummerplaten={krijgNummerplaten}
        telmomentLabel={telmomentLabel}
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
        bewerkmodusZoneId={bewerkmodusZoneId}
        wijzigInvoer={wijzigInvoer}
        voegNummerplaatToe={voegNummerplaatToe}
        verwijderNummerplaat={verwijderNummerplaat}
      />
    </div>
  );
}

export default ZonesBeheer;
