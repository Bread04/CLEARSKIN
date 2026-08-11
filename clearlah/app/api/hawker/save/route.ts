import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UnauthenticatedError } from "@/lib/utils/demo";
import { resolveApiUserId } from "@/lib/utils/user-server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userIdParam = searchParams.get("user_id");
    const userId = await resolveApiUserId(userIdParam ?? undefined);

    const supabase = await createClient();
    const { data } = await supabase
      .from("saved_dishes")
      .select("dish_id, safety_label, saved_at, hawker_dishes!inner(name_en)")
      .eq("user_id", userId)
      .order("saved_at", { ascending: false });

    const dishes = (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      const hawker = (r.hawker_dishes as Record<string, unknown>) ?? {};
      return {
        dish_id: r.dish_id as string,
        safety_label: r.safety_label as string,
        saved_at: r.saved_at as string,
        dish_name: (hawker.name_en as string) ?? (r.dish_id as string),
      };
    });

    return NextResponse.json({ success: true, dishes });
  } catch (e) {
    if (e instanceof UnauthenticatedError) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    return NextResponse.json({ success: false, dishes: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      user_id?: string;
      dish_id?: string;
      safety_label?: string;
    };

    const userId = await resolveApiUserId(body.user_id);

    if (!body.dish_id || !body.safety_label) {
      return NextResponse.json(
        { success: false, error: "dish_id and safety_label are required" },
        { status: 400 }
      );
    }

    if (!["safe", "risky", "avoid"].includes(body.safety_label)) {
      return NextResponse.json(
        { success: false, error: "safety_label must be safe, risky, or avoid" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data: dish } = await supabase
      .from("hawker_dishes")
      .select("id")
      .eq("id", body.dish_id)
      .maybeSingle();

    if (!dish) {
      return NextResponse.json(
        { success: false, error: "Dish not found" },
        { status: 404 }
      );
    }

    const { error: upsertError } = await supabase
      .from("saved_dishes")
      .upsert(
        {
          user_id: userId,
          dish_id: body.dish_id,
          safety_label: body.safety_label,
          saved_at: new Date().toISOString(),
        },
        { onConflict: "user_id, dish_id" }
      );

    if (upsertError) {
      console.error("[ClearLah] Save dish upsert failed:", upsertError.message);
      return NextResponse.json(
        { success: false, error: "Could not save dish. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, dish: { dish_id: body.dish_id, safety_label: body.safety_label } });
  } catch (e) {
    if (e instanceof UnauthenticatedError) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    if (e instanceof Error && "digest" in e) throw e;
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { user_id?: string; dish_id?: string };
    const userId = await resolveApiUserId(body.user_id);

    if (!body.dish_id) {
      return NextResponse.json({ success: false, error: "dish_id is required" }, { status: 400 });
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("saved_dishes")
      .delete()
      .eq("user_id", userId)
      .eq("dish_id", body.dish_id);

    if (error) {
      console.error("[ClearLah] Delete saved dish failed:", error.message);
      return NextResponse.json({ success: false, error: "Could not remove dish" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    if (e instanceof UnauthenticatedError) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }
    if (e instanceof Error && "digest" in e) throw e;
    return NextResponse.json({ success: false, error: "Something went wrong" }, { status: 500 });
  }
}
