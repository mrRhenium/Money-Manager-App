import { NextResponse } from "next/server";
import { getAvailableIcons } from "@/actions/icon";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const icons = await getAvailableIcons();
    return NextResponse.json(icons);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch icons" }, { status: 500 });
  }
}
