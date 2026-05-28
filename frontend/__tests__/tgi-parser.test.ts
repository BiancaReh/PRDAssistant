import * as XLSX from "xlsx";
import { parseTGIExcel, checkTokenBudget, TGI_CHAR_LIMIT } from "@/lib/tgi-parser";

function makeTGIBuffer(segments: { label: string; thousands: number[]; vertPct: number[]; horzPct: number[]; index: number[]; unwgt: number[] }[], columns: string[], waveLine = "TGI GB Q1 2025, Kantar Media"): Buffer {
  const headerRow = ["Segment", "Metric", ...columns];
  const rows: unknown[][] = [headerRow];

  for (const seg of segments) {
    rows.push([seg.label, "(000s)", ...seg.thousands]);
    rows.push(["", "Vert%", ...seg.vertPct]);
    rows.push(["", "Horz%", ...seg.horzPct]);
    rows.push(["", "Index", ...seg.index]);
    rows.push(["", "Unwgt", ...seg.unwgt]);
  }

  rows.push(["", ""]);
  rows.push([`Source: ${waveLine}`]);

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

const COLUMNS = ["Total", "Brand A Website", "Brand B Magazine", "Brand C Print"];

const SEGMENTS = [
  {
    label: "Adults 18-34",
    thousands: [25000, 5000, 3000, 2000],
    vertPct: [100, 20, 12, 8],
    horzPct: [100, 25.0, 15.0, 10.0],
    index: [100, 125, 95, 80],
    unwgt: [5000, 1200, 800, 500],
  },
  {
    label: "Car Intenders [Yes]",
    thousands: [8000, 2000, 1500, 600],
    vertPct: [100, 25, 18.75, 7.5],
    horzPct: [100, 22.0, 18.0, 7.0],
    index: [100, 105, 87, 55],
    unwgt: [2000, 450, 380, 150],
  },
  {
    label: "EV Intent [Any Agree]",
    thousands: [3000, 900, 800, 400],
    vertPct: [100, 30, 26.7, 13.3],
    horzPct: [100, 30.0, 28.0, 14.0],
    index: [100, 145, 133, 68],
    unwgt: [800, 210, 190, 100],
  },
];

describe("parseTGIExcel", () => {
  it("detects sheet names", () => {
    const buf = makeTGIBuffer(SEGMENTS, COLUMNS);
    const result = parseTGIExcel(buf);
    expect(result.sheetsDetected).toEqual(["Sheet1"]);
  });

  it("extracts wave/date from source line", () => {
    const buf = makeTGIBuffer(SEGMENTS, COLUMNS, "TGI GB Q1 2025, Kantar Media");
    const result = parseTGIExcel(buf);
    expect(result.waveDate).toMatch(/TGI GB Q1 2025/);
  });

  it("produces non-empty fullText", () => {
    const buf = makeTGIBuffer(SEGMENTS, COLUMNS);
    const result = parseTGIExcel(buf);
    expect(result.fullText.length).toBeGreaterThan(0);
    expect(result.charCount).toBe(result.fullText.length);
  });

  it("includes segment labels in fullText", () => {
    const buf = makeTGIBuffer(SEGMENTS, COLUMNS);
    const result = parseTGIExcel(buf);
    expect(result.fullText).toContain("Adults 18-34");
    expect(result.fullText).toContain("EV Intent");
  });

  it("includes Index and Horz% values in fullText", () => {
    const buf = makeTGIBuffer(SEGMENTS, COLUMNS);
    const result = parseTGIExcel(buf);
    expect(result.fullText).toContain("Index:");
    expect(result.fullText).toContain("Horz%:");
  });
});

describe("parseTGIExcel with preFilter", () => {
  it("includes segment with index >= 110 (EV Intent: 145, 133)", () => {
    const buf = makeTGIBuffer(SEGMENTS, COLUMNS);
    const result = parseTGIExcel(buf, true);
    expect(result.fullText).toContain("EV Intent");
  });

  it("includes segment with index <= 90 (Car Intenders has 87 and 55)", () => {
    const buf = makeTGIBuffer(SEGMENTS, COLUMNS);
    const result = parseTGIExcel(buf, true);
    expect(result.fullText).toContain("Car Intenders");
  });

  it("excludes segment where all non-total indices are between 91 and 109", () => {
    const averageSegments = [
      {
        label: "Average Segment",
        thousands: [10000, 2000, 1500],
        vertPct: [100, 20, 15],
        horzPct: [100, 20, 15],
        index: [100, 105, 95],
        unwgt: [2500, 500, 375],
      },
    ];
    const buf = makeTGIBuffer(averageSegments, ["Total", "Brand A", "Brand B"]);
    const result = parseTGIExcel(buf, true);
    expect(result.fullText).not.toContain("Average Segment");
  });

  it("includes segment with index exactly 110", () => {
    const boundarySegments = [
      {
        label: "Boundary Segment",
        thousands: [10000, 2000],
        vertPct: [100, 20],
        horzPct: [100, 20],
        index: [100, 110],
        unwgt: [2500, 500],
      },
    ];
    const buf = makeTGIBuffer(boundarySegments, ["Total", "Brand A"]);
    const result = parseTGIExcel(buf, true);
    expect(result.fullText).toContain("Boundary Segment");
  });
});

describe("checkTokenBudget", () => {
  it("returns withinLimit true when under limit", () => {
    expect(checkTokenBudget(TGI_CHAR_LIMIT - 1).withinLimit).toBe(true);
  });

  it("returns withinLimit true at exact limit", () => {
    expect(checkTokenBudget(TGI_CHAR_LIMIT).withinLimit).toBe(true);
  });

  it("returns withinLimit false when over limit", () => {
    expect(checkTokenBudget(TGI_CHAR_LIMIT + 1).withinLimit).toBe(false);
  });
});
