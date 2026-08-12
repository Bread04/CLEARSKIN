import { createClient } from "@/lib/supabase/server";
import { requireOnboardedUserId } from "@/lib/utils/user-server";
import ClearCartClient from "@/components/clearcart/ClearCartClient";

export default async function ClearCartPage() {
  const userId = await requireOnboardedUserId();

  const supabase = await createClient();
  const { count } = await supabase
    .from("log_entries")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  const logCount = count ?? 0;

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      <header className="flex items-center px-4 py-3 border-b border-neutral-200 bg-white">
        <a
          href="/dashboard"
          aria-label="Back to dashboard"
          className="btn-ghost rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </a>
        <h1 className="text-h3 text-neutral-800 ml-2">My Safe Shop</h1>
      </header>

      <div className="flex-1 overflow-y-auto pb-24">
        <ClearCartClient logCount={logCount} />
      </div>
    </div>
  );
}
