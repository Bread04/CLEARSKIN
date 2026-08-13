"use client";

import { useEffect, useState } from "react";
import ClearCartGrocery from "@/components/clearcart/ClearCartGrocery";
import NearbySafeDishes from "@/components/clearcart/NearbySafeDishes";

interface GroceryItem {
  name: string;
  category: "hawker" | "restaurant" | "international";
  frequency: number;
  last_eaten: string;
  safe_score: number;
}

interface NearbyDish {
  dish_id: string;
  dish_name: string;
  dish_name_ms: string | null;
  dish_name_zh: string | null;
  category: string;
  food_type: string;
  allergens: string[];
  safety_score: number;
}

interface ClearCartClientProps {
  logCount: number;
}

export default function ClearCartClient({ logCount }: ClearCartClientProps) {
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [nearbyDishes, setNearbyDishes] = useState<NearbyDish[]>([]);
  const [loadingGrocery, setLoadingGrocery] = useState(true);
  const [loadingNearby, setLoadingNearby] = useState(true);

  useEffect(() => {
    if (logCount < 7) {
      setLoadingGrocery(false);
      setLoadingNearby(false);
      return;
    }

    fetch("/api/clearcart/grocery-list")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((data) => {
        setGroceryItems(data.items || []);
      })
      .catch(() => {})
      .finally(() => setLoadingGrocery(false));

    fetch("/api/clearcart/nearby")
      .then((r) => (r.ok ? r.json() : { dishes: [] }))
      .then((data) => {
        setNearbyDishes(data.dishes || []);
      })
      .catch(() => {})
      .finally(() => setLoadingNearby(false));
  }, [logCount]);

  if (logCount < 7) {
    return (
      <div className="flex flex-col items-center justify-center p-8 mt-16">
        <div className="w-16 h-16 rounded-full bg-primary-sage-50 flex items-center justify-center mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-8 h-8 text-primary-sage">
            <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        </div>
        <p className="text-h3 text-neutral-800 mb-2">Your Safe Shop</p>
        <p className="text-body-md text-neutral-500 text-center max-w-xs">
          Log 7+ days of meals to unlock your personal Safe Shop — grocery lists and nearby safe dishes based on your trigger profile.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <section>
        <h2 className="text-h2 text-neutral-800 mb-3">Weekly Grocery List</h2>
        <p className="text-body-sm text-neutral-500 mb-3">Based on your safe meals from the last 14 days.</p>
        <ClearCartGrocery items={groceryItems} loading={loadingGrocery} />
      </section>

      <section>
        <h2 className="text-h2 text-neutral-800 mb-3">Nearby Safe Dishes</h2>
        <p className="text-body-sm text-neutral-500 mb-3">92%+ safety match for your trigger profile.</p>
        <NearbySafeDishes dishes={nearbyDishes} loading={loadingNearby} />
      </section>
    </div>
  );
}
