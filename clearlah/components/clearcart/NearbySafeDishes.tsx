"use client";

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

interface NearbySafeDishesProps {
  dishes: NearbyDish[];
  loading: boolean;
}

const FOOD_TYPE_STYLES: Record<string, string> = {
  Hawker: "bg-yellow-50 text-yellow-700",
  Restaurant: "bg-blue-50 text-blue-700",
  International: "bg-purple-50 text-purple-700",
};

function getOrderUrl(dishName: string): string {
  const encoded = encodeURIComponent(dishName);
  return `https://food.grab.com/sg/en/search/${encoded}`;
}

export default function NearbySafeDishes({ dishes, loading }: NearbySafeDishesProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="card rounded-xl p-4 skeleton h-28" />
        ))}
      </div>
    );
  }

  if (dishes.length === 0) {
    return (
      <div className="card rounded-xl p-6 text-center">
        <p className="text-body-md text-neutral-500">
          No nearby safe dishes found. Your safe food list grows as you log more.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {dishes.map((dish) => (
        <div key={dish.dish_id} className="card rounded-xl p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-body-md font-semibold text-neutral-800">{dish.dish_name}</h4>
                <span className={`text-caption px-2 py-0.5 rounded-full ${FOOD_TYPE_STYLES[dish.food_type] || "bg-neutral-100 text-neutral-500"}`}>
                  {dish.food_type}
                </span>
              </div>
              {(dish.dish_name_ms || dish.dish_name_zh) && (
                <p className="text-caption text-neutral-500 mt-0.5">
                  {dish.dish_name_ms && <span lang="ms">{dish.dish_name_ms}</span>}
                  {dish.dish_name_ms && dish.dish_name_zh && " · "}
                  {dish.dish_name_zh && <span lang="zh-Hans">{dish.dish_name_zh}</span>}
                </p>
              )}
            </div>
            <span className="text-numeric text-2xl text-primary-sage font-bold">{dish.safety_score}% safe</span>
          </div>

          {dish.allergens.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {dish.allergens.map((a) => (
                <span key={a} className="pill bg-neutral-100 text-neutral-700 text-caption">{a}</span>
              ))}
            </div>
          )}

          <a
            href={getOrderUrl(dish.dish_name)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-body-sm inline-flex items-center gap-1 min-h-[44px] px-4"
          >
            Order now
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
          </a>
        </div>
      ))}
    </div>
  );
}
