import KleurcodeInstellingen from "./KleurcodeInstellingen";
import TelmomentenBeheer from "./TelmomentenBeheer";
import ZonesBeheer from "./ZonesBeheer";

function BeheerderDashboard({
  KLEUREN,
  kleurGrenzen,
  pasLichtgrijsGrensAan,
  pasGroenGrensAan,
  pasOranjeGrensAan,
  telmomenten,
  nieuwTelmomentNaam,
  setNieuwTelmomentNaam,
  nieuwTelmomentDatum,
  setNieuwTelmomentDatum,
  nieuwTelmomentTijdstip,
  setNieuwTelmomentTijdstip,
  voegTelmomentToe,
  verwijderTelmoment,
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
  bewerkmodusZoneId,
  wijzigInvoer,
  voegNummerplaatToe,
  verwijderNummerplaat,
}) {
  return (
    <>
      <KleurcodeInstellingen
        KLEUREN={KLEUREN}
        kleurGrenzen={kleurGrenzen}
        pasLichtgrijsGrensAan={pasLichtgrijsGrensAan}
        pasGroenGrensAan={pasGroenGrensAan}
        pasOranjeGrensAan={pasOranjeGrensAan}
      />

      <TelmomentenBeheer
        telmomenten={telmomenten}
        nieuwTelmomentNaam={nieuwTelmomentNaam}
        setNieuwTelmomentNaam={setNieuwTelmomentNaam}
        nieuwTelmomentDatum={nieuwTelmomentDatum}
        setNieuwTelmomentDatum={setNieuwTelmomentDatum}
        nieuwTelmomentTijdstip={nieuwTelmomentTijdstip}
        setNieuwTelmomentTijdstip={setNieuwTelmomentTijdstip}
        voegTelmomentToe={voegTelmomentToe}
        verwijderTelmoment={verwijderTelmoment}
      />

      <ZonesBeheer
        nieuweZoneNaam={nieuweZoneNaam}
        setNieuweZoneNaam={setNieuweZoneNaam}
        nieuweCapaciteit={nieuweCapaciteit}
        setNieuweCapaciteit={setNieuweCapaciteit}
        voegZoneToe={voegZoneToe}
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
        bewerkmodusZoneId={bewerkmodusZoneId}
        wijzigInvoer={wijzigInvoer}
        voegNummerplaatToe={voegNummerplaatToe}
        verwijderNummerplaat={verwijderNummerplaat}
      />
    </>
  );
}

export default BeheerderDashboard;