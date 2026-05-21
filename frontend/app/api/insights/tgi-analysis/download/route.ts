import { NextRequest, NextResponse } from "next/server";
import { generateTGIDOCX } from "@/lib/tgi-docx";
import type { TGIAnalysisResult } from "@/lib/tgi-types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function POST(request: NextRequest) {
  let body: { result: TGIAnalysisResult; reportTitle?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!body.result) {
    return NextResponse.json({ error: "No result data provided." }, { status: 400 });
  }

  let buffer: Buffer;
  try {
    buffer = await generateTGIDOCX(body.result, body.reportTitle);
  } catch (err) {
    console.error("DOCX generation error:", err);
    return NextResponse.json({ error: "Failed to generate Word document." }, { status: 500 });
  }

  const date = new Date().toISOString().slice(0, 10);
  const slug = body.reportTitle?.trim() ? slugify(body.reportTitle) : "tgi-analysis";
  const filename = `${slug}-${date}.docx`;

  return new NextResponse(buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
