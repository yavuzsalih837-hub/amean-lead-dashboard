import { NextResponse } from "next/server";
import { fetchLeads } from "@/lib/googleSheets";

export async function GET() {
  try {
    const result = await fetchLeads();
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Lead'ler okunamadı.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
