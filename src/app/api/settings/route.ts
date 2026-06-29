import { NextRequest, NextResponse } from "next/server";
import { getSettings, updateSettings, type AppSettings } from "@/lib/settings";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({
    ...settings,
    n8nApiKey: settings.n8nApiKey ? "••••••••" : "",
  });
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Geçersiz istek gövdesi." }, { status: 400 });
  }

  const patch: Partial<Omit<AppSettings, "search">> = {
    n8nWebhookUrl: body.n8nWebhookUrl,
    n8nApiUrl: body.n8nApiUrl,
    n8nWorkflowId: body.n8nWorkflowId,
    googleSheetsId: body.googleSheetsId,
    googleSheetsRange: body.googleSheetsRange,
  };

  // Maskelenmiş placeholder geri gönderildiyse mevcut key'i ezme
  if (body.n8nApiKey && !String(body.n8nApiKey).includes("•")) {
    patch.n8nApiKey = body.n8nApiKey;
  }

  const updated = await updateSettings(patch);
  return NextResponse.json({
    ...updated,
    n8nApiKey: updated.n8nApiKey ? "••••••••" : "",
  });
}
