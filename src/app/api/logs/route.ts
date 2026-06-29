import { NextResponse } from "next/server";
import { fetchWorkflowLogs } from "@/lib/n8n";

export async function GET() {
  try {
    const logs = await fetchWorkflowLogs();
    return NextResponse.json({ logs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Loglar okunamadı.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
