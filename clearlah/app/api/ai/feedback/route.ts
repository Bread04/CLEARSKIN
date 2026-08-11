import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveApiUserId } from "@/lib/utils/user-server";
import { UnauthenticatedError } from "@/lib/utils/demo";

const MAX_FEEDBACK_ENTRIES = 20;

interface FeedbackRequest {
  original_message: string;
  parsed_result: Record<string, unknown>;
  rating: "accurate" | "inaccurate";
  corrections?: Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const userId = await resolveApiUserId();
    const body = (await request.json()) as FeedbackRequest;

    if (!body.original_message || !body.parsed_result || !body.rating) {
      return NextResponse.json({ stored: false }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("ai_feedback_log")
      .eq("user_id", userId)
      .maybeSingle();

    const existingLog = (profile?.ai_feedback_log as FeedbackEntry[] | null) ?? [];

    const entry: FeedbackEntry = {
      message: body.original_message,
      parsed: body.parsed_result,
      rating: body.rating,
      corrections: body.corrections ?? null,
      timestamp: new Date().toISOString(),
    };

    const updatedLog = [entry, ...existingLog].slice(0, MAX_FEEDBACK_ENTRIES);

    await supabase
      .from("user_profiles")
      .upsert(
        {
          user_id: userId,
          ai_feedback_log: updatedLog,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    const accuracyRate = updatedLog.length > 0
      ? Math.round((updatedLog.filter((e) => e.rating === "accurate").length / updatedLog.length) * 100)
      : 100;

    return NextResponse.json({ stored: true, accuracy_rate: accuracyRate });
  } catch (e) {
    if (e instanceof UnauthenticatedError) {
      return NextResponse.json({ stored: false }, { status: 401 });
    }
    if (e instanceof Error && "digest" in e) throw e;
    return NextResponse.json({ stored: false }, { status: 500 });
  }
}

interface FeedbackEntry {
  message: string;
  parsed: Record<string, unknown>;
  rating: "accurate" | "inaccurate";
  corrections: Record<string, unknown> | null;
  timestamp: string;
}
