export function parseCsvRows(csv: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < csv.length; index += 1) {
    const char = csv[index];
    const next = csv[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      field += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some((value) => value.trim() !== "")) {
        rows.push(row);
      }
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  row.push(field);
  if (row.some((value) => value.trim() !== "")) {
    rows.push(row);
  }

  return rows;
}

export function normalizeCsvHeader(value: string) {
  const trimmed = value.trim().toLowerCase();

  if (trimmed === "#") {
    return "number";
  }

  if (trimmed === "+/-") {
    return "plus_minus";
  }

  return trimmed.replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

export function csvRowsToObjects(csv: string) {
  const rows = parseCsvRows(csv);
  const [headerRow, ...dataRows] = rows;

  if (!headerRow) {
    return {
      headers: [],
      rows: [] as Array<Record<string, string>>
    };
  }

  const headerCounts = new Map<string, number>();
  const headers = headerRow.map((header, index) => {
    const baseHeader = normalizeCsvHeader(header) || `column_${index + 1}`;
    const count = headerCounts.get(baseHeader) ?? 0;
    headerCounts.set(baseHeader, count + 1);
    return count === 0 ? baseHeader : `${baseHeader}_${count + 1}`;
  });

  return {
    headers,
    rows: dataRows.map((values) =>
      Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex]?.trim() ?? ""]))
    )
  };
}
