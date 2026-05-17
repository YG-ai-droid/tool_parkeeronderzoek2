function KleurcodeInstellingen({
  KLEUREN,
  kleurGrenzen,
  pasLichtgrijsGrensAan,
  pasGroenGrensAan,
  pasOranjeGrensAan,
}) {
  return (
    <div className="statusbalk kleurcode-kaart">
      <strong>Kleurcodes instellen</strong>

      <div className="kleur-slider-container">
        <div
          className="kleur-schaal"
          style={{
            background: `linear-gradient(
              to right,
              ${KLEUREN.lichtgrijs} 0%,
              ${KLEUREN.lichtgrijs} ${kleurGrenzen.lichtgrijsTot}%,
              ${KLEUREN.groen} ${kleurGrenzen.lichtgrijsTot}%,
              ${KLEUREN.groen} ${kleurGrenzen.groenTot}%,
              ${KLEUREN.oranje} ${kleurGrenzen.groenTot}%,
              ${KLEUREN.oranje} ${kleurGrenzen.oranjeTot}%,
              ${KLEUREN.rood} ${kleurGrenzen.oranjeTot}%,
              ${KLEUREN.rood} 100%
            )`,
          }}
        />

        <div
          className="kleur-label"
          style={{ left: `${kleurGrenzen.lichtgrijsTot}%` }}
        >
          {kleurGrenzen.lichtgrijsTot}%
        </div>

        <div
          className="kleur-label"
          style={{ left: `${kleurGrenzen.groenTot}%` }}
        >
          {kleurGrenzen.groenTot}%
        </div>

        <div
          className="kleur-label"
          style={{ left: `${kleurGrenzen.oranjeTot}%` }}
        >
          {kleurGrenzen.oranjeTot}%
        </div>

        <input
          className="kleur-range"
          type="range"
          min="0"
          max="98"
          value={kleurGrenzen.lichtgrijsTot}
          onChange={(e) => pasLichtgrijsGrensAan(e.target.value)}
        />

        <input
          className="kleur-range"
          type="range"
          min="1"
          max="99"
          value={kleurGrenzen.groenTot}
          onChange={(e) => pasGroenGrensAan(e.target.value)}
        />

        <input
          className="kleur-range"
          type="range"
          min="2"
          max="100"
          value={kleurGrenzen.oranjeTot}
          onChange={(e) => pasOranjeGrensAan(e.target.value)}
        />
      </div>

      <div className="kleurcode-uitleg compact">
        <span>Lichtgrijs: 0–{kleurGrenzen.lichtgrijsTot - 1}%</span>
        <span>
          Groen: {kleurGrenzen.lichtgrijsTot}–
          {kleurGrenzen.groenTot - 1}%
        </span>
        <span>
          Oranje: {kleurGrenzen.groenTot}–
          {kleurGrenzen.oranjeTot - 1}%
        </span>
        <span>Rood: {kleurGrenzen.oranjeTot}%+</span>
      </div>
    </div>
  );
}

export default KleurcodeInstellingen;
