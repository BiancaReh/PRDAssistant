import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  HeadingLevel,
  AlignmentType,
  WidthType,
  BorderStyle,
  ShadingType,
  convertInchesToTwip,
} from "docx";
import type { TGIAnalysisResult } from "@/lib/tgi-types";

const BLACK = "000000";
const WHITE = "FFFFFF";
const LIGHT_GREY = "F2F2F2";
const AMBER = "D97706";

function bold(text: string, size = 20, color = BLACK): TextRun {
  return new TextRun({ text, bold: true, size, color, font: "Calibri" });
}

function normal(text: string, size = 20, color = BLACK): TextRun {
  return new TextRun({ text, size, color, font: "Calibri" });
}

function headingPara(text: string, level: typeof HeadingLevel[keyof typeof HeadingLevel], spaceAfter = 120): Paragraph {
  return new Paragraph({
    heading: level,
    spacing: { after: spaceAfter },
    children: [new TextRun({ text, bold: true, size: level === HeadingLevel.HEADING_1 ? 32 : 24, font: "Calibri", color: BLACK })],
  });
}

function themeTable(rows: TGIAnalysisResult["themeTables"][0]["rows"]): Table {
  const headerCells = ["Variable", "Index", "What this means", "Horz%", "000s", "Unwgt", "Signal"].map(
    (label) =>
      new TableCell({
        shading: { type: ShadingType.SOLID, color: BLACK, fill: BLACK },
        margins: { top: 80, bottom: 80, left: 100, right: 100 },
        children: [
          new Paragraph({
            children: [new TextRun({ text: label, bold: true, size: 16, color: WHITE, font: "Calibri" })],
          }),
        ],
      })
  );

  const dataRows = rows.map((row, i) =>
    new TableRow({
      children: [
        new TableCell({
          shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? WHITE : LIGHT_GREY, fill: i % 2 === 0 ? WHITE : LIGHT_GREY },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new Paragraph({ children: [normal(row.variable, 18)] })],
        }),
        new TableCell({
          shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? WHITE : LIGHT_GREY, fill: i % 2 === 0 ? WHITE : LIGHT_GREY },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [bold(String(row.index), 18)] })],
        }),
        new TableCell({
          shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? WHITE : LIGHT_GREY, fill: i % 2 === 0 ? WHITE : LIGHT_GREY },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new Paragraph({ children: [normal(row.whatThisMeans, 18)] })],
        }),
        new TableCell({
          shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? WHITE : LIGHT_GREY, fill: i % 2 === 0 ? WHITE : LIGHT_GREY },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [normal(`${row.horzPct}%`, 18)] })],
        }),
        new TableCell({
          shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? WHITE : LIGHT_GREY, fill: i % 2 === 0 ? WHITE : LIGHT_GREY },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [normal(String(row.universe), 18)] })],
        }),
        new TableCell({
          shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? WHITE : LIGHT_GREY, fill: i % 2 === 0 ? WHITE : LIGHT_GREY },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                row.unwgt < 100
                  ? new TextRun({ text: `⚠ ${row.unwgt}`, size: 18, color: AMBER, font: "Calibri" })
                  : normal(String(row.unwgt), 18),
              ],
            }),
          ],
        }),
        new TableCell({
          shading: { type: ShadingType.SOLID, color: i % 2 === 0 ? WHITE : LIGHT_GREY, fill: i % 2 === 0 ? WHITE : LIGHT_GREY },
          margins: { top: 60, bottom: 60, left: 100, right: 100 },
          children: [new Paragraph({ children: [bold(row.signal, 18)] })],
        }),
      ],
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
    },
    rows: [new TableRow({ children: headerCells, tableHeader: true }), ...dataRows],
  });
}

function inlineRuns(text: string): TextRun[] {
  // Split on **bold** segments and return mixed TextRun array
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return new TextRun({ text: part.slice(2, -2), bold: true, size: 20, font: "Calibri", color: BLACK });
    }
    return new TextRun({ text: part, size: 20, font: "Calibri", color: BLACK });
  });
}

function markdownToDocx(markdown: string): (Paragraph | Table)[] {
  const result: (Paragraph | Table)[] = [];
  const lines = markdown.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // H2
    if (line.startsWith("## ")) {
      result.push(new Paragraph({
        spacing: { before: 240, after: 80 },
        children: [new TextRun({ text: line.slice(3).trim(), bold: true, size: 24, font: "Calibri", color: BLACK })],
      }));
      i++;
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      result.push(new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [new TextRun({ text: line.slice(4).trim(), bold: true, size: 22, font: "Calibri", color: BLACK })],
      }));
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      result.push(new Paragraph({
        spacing: { after: 120 },
        indent: { left: convertInchesToTwip(0.4) },
        children: [new TextRun({ text: line.slice(2).replace(/\*\*/g, ""), size: 18, italics: true, color: "666666", font: "Calibri" })],
      }));
      i++;
      continue;
    }

    // Bullet list
    if (line.startsWith("- ") || line.startsWith("* ")) {
      result.push(new Paragraph({
        spacing: { after: 60 },
        indent: { left: convertInchesToTwip(0.3), hanging: convertInchesToTwip(0.2) },
        children: [new TextRun({ text: "• ", bold: true, size: 20, font: "Calibri" }), ...inlineRuns(line.slice(2))],
      }));
      i++;
      continue;
    }

    // Markdown table — collect all rows until blank line
    if (line.startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      // Filter out separator rows (---|---)
      const dataRows = tableLines.filter((l) => !/^\|[-| :]+\|$/.test(l.replace(/\s/g, "")));
      if (dataRows.length >= 2) {
        const parseCells = (l: string) => l.split("|").slice(1, -1).map((c) => c.trim());
        const [headerRow, ...bodyRows] = dataRows;
        const headers = parseCells(headerRow);

        const headerCells = headers.map((h) =>
          new TableCell({
            shading: { type: ShadingType.SOLID, color: BLACK, fill: BLACK },
            margins: { top: 60, bottom: 60, left: 100, right: 100 },
            children: [new Paragraph({ children: [new TextRun({ text: h, bold: true, size: 16, color: WHITE, font: "Calibri" })] })],
          })
        );

        const docxBodyRows = bodyRows.map((rowLine, ri) =>
          new TableRow({
            children: parseCells(rowLine).map((cell) =>
              new TableCell({
                shading: { type: ShadingType.SOLID, color: ri % 2 === 0 ? WHITE : LIGHT_GREY, fill: ri % 2 === 0 ? WHITE : LIGHT_GREY },
                margins: { top: 60, bottom: 60, left: 100, right: 100 },
                children: [new Paragraph({ children: inlineRuns(cell) })],
              })
            ),
          })
        );

        result.push(
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
              bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
              left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
              right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
              insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
              insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
            },
            rows: [new TableRow({ children: headerCells, tableHeader: true }), ...docxBodyRows],
          }),
          new Paragraph({ spacing: { after: 160 }, children: [] })
        );
      }
      continue;
    }

    // Regular paragraph (skip blank lines)
    if (line.trim()) {
      result.push(new Paragraph({
        spacing: { after: 120 },
        children: inlineRuns(line.trim()),
      }));
    }
    i++;
  }

  return result;
}

export async function generateTGIDOCX(
  result: TGIAnalysisResult,
  reportTitle?: string
): Promise<Buffer> {
  const title = reportTitle?.trim() || "TGI DATA ANALYSIS";
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  const sections: (Paragraph | Table)[] = [];

  // Title block
  sections.push(
    new Paragraph({
      spacing: { after: 160 },
      children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 48, font: "Calibri", color: BLACK })],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [normal(result.waveDate || "TGI GB, Kantar Media", 20)],
    }),
    new Paragraph({
      spacing: { after: 80 },
      children: [normal(`Sheets analysed: ${result.sheetsDetected.join(", ")}`, 20)],
    }),
    new Paragraph({
      spacing: { after: 400 },
      children: [normal(`Generated: ${today}`, 20)],
    })
  );

  // Top 5 findings
  if (result.topFindings.length > 0) {
    sections.push(headingPara("TOP 5 FINDINGS", HeadingLevel.HEADING_1));

    result.topFindings.forEach((f, i) => {
      sections.push(
        new Paragraph({
          spacing: { after: 60 },
          children: [
            bold(`${i + 1}. `, 22),
            normal(f.statement, 22),
          ],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            bold(`Index ${f.index}`, 18),
            normal("  ·  ", 18),
            normal(`Horz% ${f.horzPct}%`, 18),
            normal("  ·  ", 18),
            normal(`${f.universe} (000s)`, 18),
            ...(f.lowBase
              ? [normal("  ·  ", 18), new TextRun({ text: "⚠ LOW BASE", size: 18, color: AMBER, font: "Calibri", bold: true })]
              : []),
          ],
        })
      );
    });
  }

  // Detailed findings — one section per theme
  if (result.themeTables.length > 0) {
    sections.push(headingPara("DETAILED FINDINGS", HeadingLevel.HEADING_1));

    for (const theme of result.themeTables) {
      sections.push(
        headingPara(theme.themeName.toUpperCase(), HeadingLevel.HEADING_2, 80),
        new Paragraph({
          spacing: { after: 160 },
          children: [normal(theme.headline, 20)],
        }),
        themeTable(theme.rows),
        new Paragraph({ spacing: { after: 320 }, children: [] })
      );
    }
  }

  // Full analysis (markdown → Word paragraphs)
  if (result.detailedAnalysis?.trim()) {
    sections.push(headingPara("FULL ANALYSIS", HeadingLevel.HEADING_1));
    sections.push(...markdownToDocx(result.detailedAnalysis));
  }

  // Source attribution
  sections.push(
    new Paragraph({
      spacing: { before: 400 },
      children: [
        new TextRun({ text: `Source: ${result.waveDate || "TGI GB, Kantar Media"}`, size: 16, italics: true, color: "666666", font: "Calibri" }),
      ],
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.2),
              right: convertInchesToTwip(1.2),
            },
          },
        },
        children: sections,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
