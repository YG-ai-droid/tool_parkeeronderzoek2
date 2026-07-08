import ZoneLijst from "./ZoneLijst";

function InvullerDashboard({
  zones,
  actieveZoneId,
  actiefTelmoment,
  telmomentLabel,
  krijgNummerplaten,
  krijgVoorgesteldeNummerplaten,
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
  verplaatsZone,
  bewerkmodusZoneId,
  wijzigInvoer,
  voegNummerplaatToe,
  verwijderNummerplaat,
}) {
  return (
    <>
      <ZoneLijst
        zones={zones}
        actieveZoneId={actieveZoneId}
        actiefTelmoment={actiefTelmoment}
        krijgNummerplaten={krijgNummerplaten}
        krijgVoorgesteldeNummerplaten={krijgVoorgesteldeNummerplaten}
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
        verplaatsZone={verplaatsZone}
        bewerkmodusZoneId={bewerkmodusZoneId}
        wijzigInvoer={wijzigInvoer}
        voegNummerplaatToe={voegNummerplaatToe}
        verwijderNummerplaat={verwijderNummerplaat}
      />
    </>
  );
}

export default InvullerDashboard;
