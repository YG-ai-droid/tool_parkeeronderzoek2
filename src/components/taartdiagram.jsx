function Taartdiagram({
  titel,
  subtitel,
  percentage,
  kleur,
  middenTekst,
  tooltipRegels = [],
  onClick,
}) {
  const veiligPercentage = Math.min(Math.max(percentage, 0), 100);
  const detailRegels =
    tooltipRegels.length > 0
      ? tooltipRegels
      : [
          `Bezettingsgraad: ${percentage}%`,
          middenTekst ? `Registraties/capaciteit: ${middenTekst}` : "",
        ].filter(Boolean);

  return (
    <div
      className={`taartkaart ${onClick ? "klikbaar" : ""}`}
      onClick={onClick}
    >
      <div className="taartkop">
        <h3>{titel}</h3>
        {subtitel && <p className="taart-subtitel">{subtitel}</p>}
      </div>

      <div
        className="taartdiagram"
        title={detailRegels.join("\n")}
        style={{
          background: `conic-gradient(${kleur} ${veiligPercentage}%, #e5e7eb ${veiligPercentage}% 100%)`,
        }}
      >
        <div className="taart-tooltip">
          {detailRegels.map((regel) => (
            <span key={regel}>{regel}</span>
          ))}
        </div>
        <div className="taart-midden">
          <strong>{percentage}%</strong>
          <span>{middenTekst}</span>
        </div>
      </div>
    </div>
  );
}

export default Taartdiagram;
