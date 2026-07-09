function VerdelingTaartdiagram({ titel, data, grafiekKleuren }) {
  const totaal = data.reduce((som, item) => som + item.waarde, 0);
  const toonWaarde = (waarde) =>
    Number.isInteger(waarde) ? waarde : waarde.toFixed(1);
  const detailRegels = data.map((item) => {
    const aandeel = totaal > 0 ? Math.round((item.waarde / totaal) * 100) : 0;
    return `${item.label}: ${toonWaarde(item.waarde)} (${aandeel}%)`;
  });

  if (totaal === 0) {
    return (
      <div className="taartkaart">
        <div className="taartkop">
          <h3>{titel}</h3>
        </div>
        <p className="lege-lijst">Nog geen gegevens.</p>
      </div>
    );
  }

  const segmenten = data.reduce(
    (resultaat, item, index) => {
      const aandeel = (item.waarde / totaal) * 100;
      const start = resultaat.huidigeStart;
      const einde = start + aandeel;

      return {
        huidigeStart: einde,
        waarden: [
          ...resultaat.waarden,
          `${
            grafiekKleuren[index % grafiekKleuren.length]
          } ${start}% ${einde}%`,
        ],
      };
    },
    { huidigeStart: 0, waarden: [] }
  ).waarden;

  return (
    <div className="taartkaart">
      <div className="taartkop">
        <h3>{titel}</h3>
      </div>

      <div
        className="taartdiagram"
        title={detailRegels.join("\n")}
        style={{
          background: `conic-gradient(${segmenten.join(", ")})`,
        }}
      >
        <div className="taart-tooltip">
          {detailRegels.map((regel) => (
            <span key={regel}>{regel}</span>
          ))}
        </div>
        <div className="taart-midden">
          <strong>{toonWaarde(totaal)}</strong>
          <span>plaatsen</span>
        </div>
      </div>

      <strong className="taart-legende-titel">Legende</strong>
      <div className="taart-legende compacte-taart-legende">
        {data.map((item, index) => (
          <span key={item.label}>
            <span
              className="legende-kleur"
              style={{
                background: grafiekKleuren[index % grafiekKleuren.length],
              }}
            />
            {item.label}: {toonWaarde(item.waarde)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default VerdelingTaartdiagram;
