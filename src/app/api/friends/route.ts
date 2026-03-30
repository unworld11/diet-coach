import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).toISOString();
  return { start, end };
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: friendships } = await supabase
    .from("friendships")
    .select("friend_id")
    .eq("user_id", user.id);

  if (!friendships || friendships.length === 0) {
    return NextResponse.json({ friends: [] });
  }

  const friendIds = friendships.map((f) => f.friend_id);

  const { data: profiles } = await supabase
    .from("user_profiles")
    .select("user_id, display_name, share_code")
    .in("user_id", friendIds);

  const { start, end } = todayRange();
  const { data: meals } = await supabase
    .from("meal_logs")
    .select("user_id, calories, protein, carbs, fat")
    .in("user_id", friendIds)
    .gte("logged_at", start)
    .lte("logged_at", end);

  const macroMap: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {};
  for (const m of meals || []) {
    if (!macroMap[m.user_id]) macroMap[m.user_id] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    macroMap[m.user_id].calories += m.calories;
    macroMap[m.user_id].protein += m.protein;
    macroMap[m.user_id].carbs += m.carbs;
    macroMap[m.user_id].fat += m.fat;
  }

  const friends = (profiles || []).map((p) => ({
    user_id: p.user_id,
    display_name: p.display_name,
    share_code: p.share_code,
    today: macroMap[p.user_id] || { calories: 0, protein: 0, carbs: 0, fat: 0 },
  }));

  return NextResponse.json({ friends });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { code } = await req.json();
  if (!code) return NextResponse.json({ error: "No code provided" }, { status: 400 });

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("user_id, display_name")
    .eq("share_code", code.trim().toLowerCase())
    .single();

  if (!profile) return NextResponse.json({ error: "No user found with that code" }, { status: 404 });
  if (profile.user_id === user.id) return NextResponse.json({ error: "That's your own code" }, { status: 400 });

  const { error } = await supabase
    .from("friendships")
    .insert({ user_id: user.id, friend_id: profile.user_id });

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "Already friends" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, friend_name: profile.display_name });
}
