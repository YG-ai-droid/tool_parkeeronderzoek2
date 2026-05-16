function Taartdiagram({ titel, subtitel, percentage, kleur, middenTekst }) {
  const veiligPercentage = Math.min(Math.max(percentage, 0), 100);

  return (
    <div className="taartkaart">
      <h3>{titel}</h3>
      {subtitel && <p className="taart-subtitel">{subtitel}</p>}

      <div
        className="taartdiagram"
        style={{
          background: `conic-gradient(${kleur} ${veiligPercentage}%, #e5e7eb ${veiligPercentage}% 100%)`,
        }}
      >
        <div className="taart-midden">
          <strong>{percentage}%</strong>
          <span>{middenTekst}</span>
        </div>
      </div>
    </div>
  );
}

export default Taartdiagram;