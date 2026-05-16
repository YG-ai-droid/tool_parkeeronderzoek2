import ZoneLijst from "./ZoneLijst";

function InvullerDashboard({
  telmomenten,
  actiefTelmomentId,
  setActiefTelmomentId,
  telmomentLabel,
  zones,
  actieveZoneId,
  actiefTelmoment,
  krijgNummerplaten,
  bepaalKleur,
  selecteerZone,
  toggleZoneOpen,
  tekenmodus,
  setTekenmodus,
  setBewerkmodusZoneId,
  setActieveZoneId,
  verwijderLaatstePunt,
  toggleBewerkmodus,
  wisPolygoon,
  verwijderZone,
  bewerkmodusZoneId,
  wijzigInvoer,
  voegNummerplaatToe,
  verwijderNummerplaat,
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

      <ZoneLijst
        zones={zones}
        actieveZoneId={actieveZoneId}
        actiefTelmoment={actiefTelmoment}
        krijgNummerplaten={krijgNummerplaten}
        telmomentLabel={telmomentLabel}
        bepaalKleur={bepaalKleur}
        selecteerZone={selecteerZone}
        toggleZoneOpen={toggleZoneOpen}
        isBeheerder={false}
        isInvuller={true}
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
    </>
  );
}

export default InvullerDashboard;