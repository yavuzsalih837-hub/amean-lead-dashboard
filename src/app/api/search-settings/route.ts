import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSearchSettings } from "@/lib/settings";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json(settings.search);
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const updated = await updateSearchSettings({
    keyword: body.keyword,
    location: body.location,
    industry: body.industry,
    resultLimit: body.resultLimit,
  });

  return NextResponse.json(updated.search);
}
