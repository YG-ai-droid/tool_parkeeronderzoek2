function VerdelingTaartdiagram({ titel, data, grafiekKleuren }) {
  const totaal = data.reduce((som, item) => som + item.waarde, 0);
  const toonWaarde = (waarde) =>
    Number.isInteger(waarde) ? waarde : waarde.toFixed(1);

  if (totaal === 0) {
    return (
      <div className="taartkaart">
        <h3>{titel}</h3>
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
      <h3>{titel}</h3>

      <div
        className="taartdiagram"
        style={{
          background: `conic-gradient(${segmenten.join(", ")})`,
        }}
      >
        <div className="taart-midden">
          <strong>{toonWaarde(totaal)}</strong>
          <span>plaatsen</span>
        </div>
      </div>

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
