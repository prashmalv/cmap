import { NextRequest, NextResponse } from "next/server";
import { matchCareers, getCareerById, getCategories, type UserProfile } from "@/lib/career-engine";

export async function POST(req: NextRequest) {
  try {
    const profile: UserProfile = await req.json();
    const matches = matchCareers(profile);
    return NextResponse.json({ matches, total: matches.length });
  } catch (error) {
    console.error("Career match error:", error);
    return NextResponse.json({ error: "Matching failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (id) {
    const career = getCareerById(id);
    if (!career) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ career });
  }

  const categories = getCategories();
  return NextResponse.json({ categories });
}
