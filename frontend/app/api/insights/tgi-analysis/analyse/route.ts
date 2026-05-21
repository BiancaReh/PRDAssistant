import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { parseTGIExcel, checkTokenBudget } from "@/lib/tgi-parser";
import { TGI_SYSTEM_PROMPT, buildTGIUserPrompt } from "@/lib/tgi-prompt";
import { MOCK_TGI_RESULT, isMockMode } from "@/lib/tgi-mock";
import type { TGIAnalysisResult } from "@/lib/tgi-types";
// TGIFinding and ThemeTable used via TGIAnalysisResult

export const maxDuration = 300;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  maxRetries: 2,
});

function extractAnalysisJSON(text: string): TGIAnalysisResult | null {
  const match = text.match(/<analysis>([\s\S]*?)<\/analysis>/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[1].trim());
    if (!parsed.topFindings || !parsed.detailedAnalysis) return null;
    return parsed as TGIAnalysisResult;
  } catch {
    return null;
  }
}

function fallbackResult(rawText: string, waveDate: string, sheetsDetected: string[]): TGIAnalysisResult {
  return {
    topFindings: [],
    detailedAnalysis: rawText,
    themeTables: [],
    waveDate,
    sheetsDetected,
  };
}

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request — expected multipart form data." }, { status: 400 });
  }

  const tgiFileEntry = formData.get("tgiFile");
  if (!tgiFileEntry || !(tgiFileEntry instanceof File)) {
    return NextResponse.json({ error: "No Excel file provided." }, { status: 400 });
  }

  const preFilter = formData.get("preFilter") === "true";
  const reportTitle = String(formData.get("reportTitle") ?? "");
  const briefText = String(formData.get("briefText") ?? "");
  const briefFilesRaw = String(formData.get("briefFiles") ?? "[]");

  let briefFiles: { name: string; text: string }[] = [];
  try {
    briefFiles = JSON.parse(briefFilesRaw);
  } catch {
    briefFiles = [];
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await tgiFileEntry.arrayBuffer());
  } catch {
    return NextResponse.json({ error: "Could not read the uploaded file." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseTGIExcel(buffer, preFilter);
  } catch {
    return NextResponse.json(
      { error: "Could not parse the Excel file. Please check it is a valid TGI cross-tab export." },
      { status: 422 }
    );
  }

  if (!parsed.fullText) {
    return NextResponse.json(
      { error: "No TGI data structure detected in this file. Please check it is a valid TGI cross-tab export (.xlsx or .xls)." },
      { status: 422 }
    );
  }

  const { withinLimit } = checkTokenBudget(parsed.charCount);
  if (!withinLimit) {
    return NextResponse.json({
      status: "too_large",
      charCount: parsed.charCount,
      sheetCount: parsed.sheetsDetected.length,
    });
  }

  // Return mock data in development when no real API key is configured
  if (isMockMode()) {
    return NextResponse.json({
      result: {
        ...MOCK_TGI_RESULT,
        waveDate: parsed.waveDate || MOCK_TGI_RESULT.waveDate,
        sheetsDetected: parsed.sheetsDetected.length > 0 ? parsed.sheetsDetected : MOCK_TGI_RESULT.sheetsDetected,
      },
      jsonParseFailed: false,
      preFiltered: preFilter,
    });
  }

  const userPrompt = buildTGIUserPrompt({
    reportTitle,
    briefText,
    briefFiles,
    excelText: parsed.fullText,
    waveDate: parsed.waveDate,
    sheetsDetected: parsed.sheetsDetected,
  });

  let rawText: string;
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      thinking: { type: "enabled", budget_tokens: 10000 },
      system: TGI_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    rawText = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
  } catch (err) {
    console.error("Claude API error:", err);
    return NextResponse.json(
      { error: "Analysis failed — the AI service returned an error. Please try again." },
      { status: 502 }
    );
  }

  if (!rawText.trim()) {
    return NextResponse.json(
      { error: "Analysis returned empty output. Please try again." },
      { status: 502 }
    );
  }

  const analysisJSON = extractAnalysisJSON(rawText);

  const result: TGIAnalysisResult = analysisJSON
    ? {
        ...analysisJSON,
        waveDate: parsed.waveDate,
        sheetsDetected: parsed.sheetsDetected,
      }
    : fallbackResult(rawText, parsed.waveDate, parsed.sheetsDetected);

  return NextResponse.json({
    result,
    jsonParseFailed: !analysisJSON,
    preFiltered: preFilter,
  });
}
