import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase.from("user_profiles").select("*").eq("user_id", user.id).single();

  if (data) return NextResponse.json({ profile: data });

  const name = user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
  const { data: created, error } = await supabase
    .from("user_profiles")
    .insert({ user_id: user.id, display_name: name })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: created });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { display_name } = await req.json();
  const { error } = await supabase.from("user_profiles").update({ display_name }).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
