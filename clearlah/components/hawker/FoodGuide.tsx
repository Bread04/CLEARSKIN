"use client";

interface SavedDish {
  dish_id: string;
  dish_name: string;
  safety_label: string;
  saved_at: string;
}

interface FoodGuideProps {
  dishes: SavedDish[];
  onRemove: (dishId: string) => void;
}

const GROUPS: { key: string; label: string; color: string }[] = [
  { key: "avoid", label: "Avoid", color: "bg-secondary-terracotta-50 text-secondary-terracotta-dark" },
  { key: "risky", label: "Approach with caution", color: "bg-status-warning-bg text-status-warning" },
  { key: "safe", label: "Safe", color: "bg-primary-sage-50 text-primary-sage-dark" },
];

export default function FoodGuide({ dishes, onRemove }: FoodGuideProps) {
  if (dishes.length === 0) {
    return (
      <div className="card rounded-xl p-6 text-center">
        <p className="text-body-md text-neutral-500">
          Your food guide is empty. Search for dishes to build your reference.
        </p>
      </div>
    );
  }

  return (
    <div className="card rounded-xl p-4">
      <h3 className="text-h3 text-neutral-800 mb-3">
        My Food Guide ({dishes.length})
      </h3>

      {GROUPS.map((group) => {
        const items = dishes.filter((d) => d.safety_label === group.key);
        if (items.length === 0) return null;

        return (
          <div key={group.key} className="mb-3 last:mb-0">
            <p className={`text-label-sm font-semibold px-2 py-0.5 rounded-full inline-block mb-2 ${group.color}`}>
              {group.label} ({items.length})
            </p>
            <div className="space-y-1">
              {items.map((d) => (
                <div key={d.dish_id} className="flex items-center justify-between py-1 border-b border-neutral-100 last:border-0">
                  <span className="text-body-sm text-neutral-800">{d.dish_name}</span>
                  <button
                    type="button"
                    onClick={() => onRemove(d.dish_id)}
                    className="text-body-sm text-status-error hover:underline min-h-[44px] px-2"
                    aria-label={`Remove ${d.dish_name} from food guide`}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
