function KleurcodeInstellingen({
  KLEUREN,
  kleurGrenzen,
  pasLichtgrijsGrensAan,
  pasGroenGrensAan,
  pasOranjeGrensAan,
}) {
  function bereikLabel(van, totEnMet) {
    if (van > totEnMet) return "geen bereik";
    return `${van} t/m ${totEnMet}%`;
  }

  function grensPositie(waarde) {
    return `calc(9px + (${waarde} * (100% - 18px) / 100))`;
  }

  return (
    <div className="statusbalk kleurcode-kaart">
      <strong>Kleurcodes instellen</strong>

      <div className="kleurcode-grenzen">
        <span>
          <i style={{ background: KLEUREN.lichtgrijs }} />
          Lichtgrijs: {bereikLabel(0, kleurGrenzen.lichtgrijsTot - 1)}
        </span>
        <span>
          <i style={{ background: KLEUREN.groen }} />
          Groen:{" "}
          {bereikLabel(
            kleurGrenzen.lichtgrijsTot,
            kleurGrenzen.groenTot - 1
          )}
        </span>
        <span>
          <i style={{ background: KLEUREN.oranje }} />
          Oranje:{" "}
          {bereikLabel(kleurGrenzen.groenTot, kleurGrenzen.oranjeTot - 1)}
        </span>
        <span>
          <i style={{ background: KLEUREN.rood }} />
          Rood: {kleurGrenzen.oranjeTot} t/m 100%
        </span>
      </div>

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
          style={{ left: grensPositie(kleurGrenzen.lichtgrijsTot) }}
        >
          {kleurGrenzen.lichtgrijsTot}%
        </div>

        <div
          className="kleur-label"
          style={{ left: grensPositie(kleurGrenzen.groenTot) }}
        >
          {kleurGrenzen.groenTot}%
        </div>

        <div
          className="kleur-label"
          style={{ left: grensPositie(kleurGrenzen.oranjeTot) }}
        >
          {kleurGrenzen.oranjeTot}%
        </div>

        <input
          className="kleur-range"
          type="range"
          min="0"
          max="100"
          value={kleurGrenzen.lichtgrijsTot}
          onChange={(e) => pasLichtgrijsGrensAan(e.target.value)}
        />

        <input
          className="kleur-range"
          type="range"
          min="0"
          max="100"
          value={kleurGrenzen.groenTot}
          onChange={(e) => pasGroenGrensAan(e.target.value)}
        />

        <input
          className="kleur-range"
          type="range"
          min="0"
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
