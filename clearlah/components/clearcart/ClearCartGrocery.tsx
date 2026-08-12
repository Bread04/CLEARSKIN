"use client";

interface GroceryItem {
  name: string;
  category: "hawker" | "restaurant" | "international";
  frequency: number;
  last_eaten: string;
  safe_score: number;
}

interface ClearCartGroceryProps {
  items: GroceryItem[];
  loading: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  hawker: "Hawker",
  restaurant: "Restaurant",
  international: "International",
};

function getCartUrl(itemName: string): string {
  const encoded = encodeURIComponent(itemName);
  return `https://www.fairprice.com.sg/search?query=${encoded}`;
}

export default function ClearCartGrocery({ items, loading }: ClearCartGroceryProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card rounded-xl p-4 skeleton h-20" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="card rounded-xl p-6 text-center">
        <p className="text-body-md text-neutral-500">
          No safe meals detected yet. Keep logging to build your Safe Shop.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.name} className="card rounded-xl p-4 flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-body-md font-semibold text-neutral-800 truncate">{item.name}</h4>
              <span className={`text-caption px-2 py-0.5 rounded-full ${
                item.category === "hawker" ? "bg-yellow-50 text-yellow-700" :
                item.category === "restaurant" ? "bg-blue-50 text-blue-700" :
                "bg-purple-50 text-purple-700"
              }`}>
                {CATEGORY_LABELS[item.category]}
              </span>
            </div>
            <p className="text-caption text-neutral-500">
              Eaten {item.frequency}x · Last: {new Date(item.last_eaten).toLocaleDateString("en-SG", { month: "short", day: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-3 ml-3">
            <span className="text-numeric text-2xl text-primary-sage font-bold">{item.safe_score}%</span>
            <a
              href={getCartUrl(item.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-body-sm min-h-[44px] px-3 whitespace-nowrap"
            >
              Add to cart
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
