import { NextRequest, NextResponse } from "next/server";
import { parseTGIExcel, checkTokenBudget } from "@/lib/tgi-parser";

export const maxDuration = 300;

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

  let buffer: Buffer;
  try {
    const arrayBuffer = await tgiFileEntry.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
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

  // Stub: return parse metadata only (no Claude call yet)
  return NextResponse.json({
    sheetsDetected: parsed.sheetsDetected,
    waveDate: parsed.waveDate,
    charCount: parsed.charCount,
  });
}
