import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const date = req.nextUrl.searchParams.get("date");

  let query = supabase
    .from("meal_logs")
    .select("*")
    .eq("user_id", user.id)
    .order("logged_at", { ascending: true });

  if (date) {
    query = query.gte("logged_at", `${date}T00:00:00`).lt("logged_at", `${date}T23:59:59.999`);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ meals: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const { data, error } = await supabase
    .from("meal_logs")
    .insert({
      user_id: user.id,
      logged_at: body.logged_at || new Date().toISOString(),
      meal_type: body.meal_type || "snack",
      label: body.label || "",
      items: body.items || [],
      calories: body.calories || 0,
      protein: body.protein || 0,
      carbs: body.carbs || 0,
      fat: body.fat || 0,
      image_url: body.image_url || null,
      notes: body.notes || null,
      source: body.source || "manual",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}
