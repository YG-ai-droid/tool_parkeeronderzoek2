function VerdelingTaartdiagram({ titel, data, grafiekKleuren }) {
  const totaal = data.reduce((som, item) => som + item.waarde, 0);

  if (totaal === 0) {
    return (
      <div className="taartkaart">
        <h3>{titel}</h3>
        <p className="lege-lijst">Nog geen gegevens.</p>
      </div>
    );
  }

  let huidigeStart = 0;

  const segmenten = data.map((item, index) => {
    const aandeel = (item.waarde / totaal) * 100;
    const start = huidigeStart;
    const einde = huidigeStart + aandeel;
    huidigeStart = einde;

    return `${
      grafiekKleuren[index % grafiekKleuren.length]
    } ${start}% ${einde}%`;
  });

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
          <strong>{totaal}</strong>
          <span>plaatsen</span>
        </div>
      </div>

      <div className="taart-legende">
        {data.map((item, index) => (
          <span key={item.label}>
            <span
              className="legende-kleur"
              style={{
                background: grafiekKleuren[index % grafiekKleuren.length],
              }}
            />
            {item.label}: {item.waarde}
          </span>
        ))}
      </div>
    </div>
  );
}

export default VerdelingTaartdiagram;