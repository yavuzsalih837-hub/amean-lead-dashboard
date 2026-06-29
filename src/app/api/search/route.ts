import { NextRequest, NextResponse } from "next/server";
import { triggerSearch } from "@/lib/n8n";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const webhookUrl = typeof body.webhookUrl === "string" ? body.webhookUrl.trim() : "";

  if (!webhookUrl) {
    return NextResponse.json({ error: "webhookUrl eksik." }, { status: 400 });
  }

  const payload = {
    keyword: body.keyword,
    keywords: body.keywords,
    location: body.location,
    industry: body.industry,
    resultLimit: body.resultLimit,
    start: body.start,
  };

  try {
    await triggerSearch(webhookUrl, payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Arama tetiklenemedi.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
