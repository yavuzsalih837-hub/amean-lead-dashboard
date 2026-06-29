import { NextRequest, NextResponse } from "next/server";
import { triggerSearch } from "@/lib/n8n";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));

  const payload = {
    keyword: body.keyword,
    keywords: body.keywords,
    location: body.location,
    industry: body.industry,
    resultLimit: body.resultLimit,
    start: body.start,
  };

  try {
    await triggerSearch(payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Arama tetiklenemedi.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
