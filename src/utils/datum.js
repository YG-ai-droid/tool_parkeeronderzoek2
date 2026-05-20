export function formatBelgischeDatum(datum) {
  if (!datum) return "geen datum";

  const datumObject =
    datum instanceof Date ? datum : new Date(`${datum}T00:00:00`);

  if (Number.isNaN(datumObject.getTime())) return datum;

  const dag = String(datumObject.getDate()).padStart(2, "0");
  const maand = String(datumObject.getMonth() + 1).padStart(2, "0");
  const jaar = datumObject.getFullYear();

  return `${dag}/${maand}/${jaar}`;
}

export function formatBelgischeDatumOptioneel(datum) {
  return datum ? formatBelgischeDatum(datum) : "";
}
