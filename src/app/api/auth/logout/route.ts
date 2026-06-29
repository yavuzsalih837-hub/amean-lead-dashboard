import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();

  session.isLoggedIn = false;
  session.email = undefined;
  await session.save();

  return NextResponse.json({ ok: true });
}