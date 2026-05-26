import * as XLSX from "xlsx";

export type TGISegment = {
  label: string;
  thousands: number[];
  vertPct: number[];
  horzPct: number[];
  index: number[];
  unwgt: number[];
};

export type TGIParseResult = {
  sheetsDetected: string[];
  waveDate: string;
  fullText: string;
  charCount: number;
};

const METRIC_LABELS = new Set(["(000s)", "Vert%", "Horz%", "Index", "Unwgt"]);

function toNum(v: unknown): number {
  const n = parseFloat(String(v ?? ""));
  return isNaN(n) ? 0 : n;
}

function findMetricCol(rows: unknown[][]): { metricCol: number; firstDataRow: number } | null {
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    for (let j = 0; j < row.length; j++) {
      if (String(row[j] ?? "").trim() === "(000s)") {
        return { metricCol: j, firstDataRow: i };
      }
    }
  }
  return null;
}

function findColumnHeaders(rows: unknown[][], firstDataRow: number, valueStart: number): string[] {
  // Search the 4 rows above first data row for column headers
  for (let i = firstDataRow - 1; i >= Math.max(0, firstDataRow - 4); i--) {
    const row = rows[i] as unknown[];
    const valueCols = row.slice(valueStart).map((v) => String(v ?? "").trim());
    if (valueCols.filter(Boolean).length > 1) return valueCols;
  }
  return [];
}

function extractWaveDate(rows: unknown[][]): string {
  for (let i = rows.length - 1; i >= Math.max(0, rows.length - 30); i--) {
    const text = (rows[i] as unknown[]).map((v) => String(v ?? "")).join(" ");
    const m = text.match(/TGI\s+GB\s+[^\n,]*/i) ?? text.match(/Source:\s*(.+)/i);
    if (m) return (m[1] ?? m[0]).trim();
  }
  return "";
}

function parseSheet(
  rows: unknown[][],
  sheetName: string,
  preFilter: boolean
): { text: string; segmentCount: number } {
  const found = findMetricCol(rows);
  if (!found) return { text: "", segmentCount: 0 };

  const { metricCol, firstDataRow } = found;
  const labelCol = Math.max(0, metricCol - 1);
  const valueStart = metricCol + 1;

  const columns = findColumnHeaders(rows, firstDataRow, valueStart);
  const colHeader = columns.length
    ? `Columns: ${columns.join(" | ")}`
    : "Columns: (not detected)";

  const segments: TGISegment[] = [];
  let current: TGISegment | null = null;

  for (let i = firstDataRow; i < rows.length; i++) {
    const row = rows[i] as unknown[];
    const label = String(row[labelCol] ?? "").trim();
    const metric = String(row[metricCol] ?? "").trim();

    if (!METRIC_LABELS.has(metric)) continue;

    const values = (row.slice(valueStart) as unknown[]).map(toNum);

    if (metric === "(000s)") {
      if (current) segments.push(current);
      current = {
        label: label || `Segment ${segments.length + 1}`,
        thousands: values,
        vertPct: [],
        horzPct: [],
        index: [],
        unwgt: [],
      };
    } else if (current) {
      if (metric === "Vert%") current.vertPct = values;
      else if (metric === "Horz%") current.horzPct = values;
      else if (metric === "Index") current.index = values;
      else if (metric === "Unwgt") current.unwgt = values;
    }
  }
  if (current) segments.push(current);

  // Apply pre-filter: keep only segments where any non-first column index >= 110 or <= 90
  const filtered = preFilter
    ? segments.filter((s) => {
        const nonTotal = s.index.slice(1);
        return nonTotal.some((v) => v >= 110 || (v > 0 && v <= 90));
      })
    : segments;

  if (filtered.length === 0) return { text: "", segmentCount: 0 };

  const lines: string[] = [`=== SHEET: ${sheetName} ===`, colHeader, ""];

  for (const s of filtered) {
    const fmt = (arr: number[], dp: number) =>
      arr.map((v) => v.toFixed(dp)).join(",");
    const parts = [`[${s.label}]`];
    if (s.thousands.length) parts.push(`000s: ${fmt(s.thousands, 0)}`);
    if (s.horzPct.length) parts.push(`Horz%: ${fmt(s.horzPct, 1)}`);
    if (s.index.length) parts.push(`Index: ${fmt(s.index, 0)}`);
    if (s.unwgt.length) parts.push(`Unwgt: ${fmt(s.unwgt, 0)}`);
    lines.push(parts.join(" | "));
  }

  return { text: lines.join("\n"), segmentCount: filtered.length };
}

export function parseTGIExcel(buffer: Buffer, preFilter = false): TGIParseResult {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetsDetected = workbook.SheetNames;

  let waveDate = "";
  const sheetTexts: string[] = [];

  for (const name of sheetsDetected) {
    const sheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
      header: 1,
      defval: "",
      raw: true,
    });

    if (!waveDate) waveDate = extractWaveDate(rows);

    const { text } = parseSheet(rows, name, preFilter);
    if (text) sheetTexts.push(text);
  }

  const fullText = sheetTexts.join("\n\n");
  return {
    sheetsDetected,
    waveDate,
    fullText,
    charCount: fullText.length,
  };
}

export const TGI_CHAR_LIMIT = 320_000;

export function checkTokenBudget(charCount: number): { withinLimit: boolean } {
  return { withinLimit: charCount <= TGI_CHAR_LIMIT };
}
