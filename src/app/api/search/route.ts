import { NextRequest, NextResponse } from "next/server";
import { triggerSearch } from "@/lib/n8n";
import { getSettings } from "@/lib/settings";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const settings = await getSettings();

  const keywords = body.keywords ?? settings.search.keywords ?? [];
  const keyword = body.keyword ?? settings.search.keyword ?? "";

  const payload = {
    keyword,
    keywords: keywords.length > 0 ? keywords : (keyword ? [keyword] : []),
    location: body.location ?? settings.search.location,
    industry: body.industry ?? settings.search.industry,
    resultLimit: body.resultLimit ?? settings.search.resultLimit,
    start: body.start ?? settings.search.start,
  };

  try {
    await triggerSearch(payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Arama tetiklenemedi.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
