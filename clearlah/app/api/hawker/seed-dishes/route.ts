import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const NEW_DISHES = [
  // McDonald's
  { name_en: "Big Mac", name_ms: "Big Mac", name_zh: "巨无霸", aliases: ["big mac meal", "mcdonald burger"], allergens: ["gluten", "dairy", "eggs", "beef"], category: "fast_food", popularity_rank: 10, food_type: "restaurant" },
  { name_en: "McSpicy", name_ms: "McSpicy", name_zh: "麦辣鸡腿堡", aliases: ["mcspicy burger", "spicy chicken burger"], allergens: ["gluten", "dairy", "eggs"], category: "fast_food", popularity_rank: 8, food_type: "restaurant" },
  { name_en: "McNuggets (6pc)", name_ms: "McNuggets", name_zh: "麦乐鸡", aliases: ["chicken nuggets", "6 piece"], allergens: ["gluten", "eggs"], category: "fast_food", popularity_rank: 12, food_type: "restaurant" },
  { name_en: "Filet-O-Fish", name_ms: "Filet-O-Fish", name_zh: "麦香鱼", aliases: ["fish burger", "fillet"], allergens: ["gluten", "dairy", "eggs", "fish"], category: "fast_food", popularity_rank: 6, food_type: "restaurant" },
  { name_en: "McChicken", name_ms: "McChicken", name_zh: "麦香鸡", aliases: ["mc chicken"], allergens: ["gluten", "dairy", "eggs"], category: "fast_food", popularity_rank: 7, food_type: "restaurant" },
  // KFC
  { name_en: "Zinger Burger", name_ms: "Zinger Burger", name_zh: "香辣鸡腿堡", aliases: ["kfc burger", "zinger"], allergens: ["gluten", "dairy", "eggs"], category: "fast_food", popularity_rank: 15, food_type: "restaurant" },
  { name_en: "Original Recipe Chicken (2pc)", name_ms: "Ayam Goreng Original", name_zh: "原味鸡", aliases: ["kfc chicken", "fried chicken kfc"], allergens: ["gluten", "eggs", "dairy"], category: "fast_food", popularity_rank: 14, food_type: "restaurant" },
  { name_en: "Chicken Popcorn", name_ms: "Chicken Popcorn", name_zh: "鸡米花", aliases: ["popcorn chicken"], allergens: ["gluten", "eggs"], category: "fast_food", popularity_rank: 9, food_type: "restaurant" },
  { name_en: "Cheesy Wedges", name_ms: "Cheesy Wedges", name_zh: "芝士薯角", aliases: ["cheese fries kfc", "potato wedges"], allergens: ["dairy"], category: "fast_food", popularity_rank: 5, food_type: "restaurant" },
  // Burger King
  { name_en: "Whopper", name_ms: "Whopper", name_zh: "皇堡", aliases: ["bk whopper", "burger king burger"], allergens: ["gluten", "dairy", "eggs", "beef"], category: "fast_food", popularity_rank: 11, food_type: "restaurant" },
  { name_en: "Chicken Royale", name_ms: "Chicken Royale", name_zh: "鸡排堡", aliases: ["royale burger"], allergens: ["gluten", "dairy", "eggs"], category: "fast_food", popularity_rank: 6, food_type: "restaurant" },
  // Subway
  { name_en: "Italian BMT Sub", name_ms: "Italian BMT", name_zh: "意大利BMT三明治", aliases: ["subway bmt", "italian sub"], allergens: ["gluten", "dairy"], category: "fast_food", popularity_rank: 8, food_type: "restaurant" },
  { name_en: "Subway Melt", name_ms: "Subway Melt", name_zh: "Subway Melt", aliases: ["melt sub", "turkey melt"], allergens: ["gluten", "dairy"], category: "fast_food", popularity_rank: 5, food_type: "restaurant" },
  // Din Tai Fung
  { name_en: "Xiao Long Bao", name_ms: "Xiao Long Bao", name_zh: "小笼包", aliases: ["xlb", "soup dumpling", "steamed dumpling"], allergens: ["gluten", "pork"], category: "chinese_restaurant", popularity_rank: 20, food_type: "restaurant" },
  { name_en: "Fried Rice with Pork Chop", name_ms: "Nasi Goreng Pork Chop", name_zh: "排骨蛋炒饭", aliases: ["dtf fried rice", "pork chop rice"], allergens: ["gluten", "eggs", "pork"], category: "chinese_restaurant", popularity_rank: 18, food_type: "restaurant" },
  { name_en: "Steamed Chicken Soup", name_ms: "Sup Ayam Kukus", name_zh: "鸡汤", aliases: ["chicken soup dtf"], allergens: [], category: "chinese_restaurant", popularity_rank: 12, food_type: "restaurant" },
  // Hai Di Lao
  { name_en: "Mala Hot Pot Broth", name_ms: "Sup Mala", name_zh: "麻辣锅底", aliases: ["mala broth", "spicy hotpot"], allergens: ["soy"], category: "chinese_restaurant", popularity_rank: 15, food_type: "restaurant" },
  { name_en: "Hand-Pulled Noodles (HDL)", name_ms: "Mee Tarik", name_zh: "拉面", aliases: ["hdl noodles", "la mian"], allergens: ["gluten"], category: "chinese_restaurant", popularity_rank: 10, food_type: "restaurant" },
  // Tim Ho Wan
  { name_en: "BBQ Pork Buns", name_ms: "Pau Char Siew", name_zh: "叉烧包", aliases: ["char siew bao", "tim ho wan buns"], allergens: ["gluten", "pork"], category: "chinese_restaurant", popularity_rank: 16, food_type: "restaurant" },
  { name_en: "Steamed Egg Cake", name_ms: "Kek Telur Kukus", name_zh: "马拉糕", aliases: ["malay cake", "ma lai gao"], allergens: ["gluten", "eggs", "dairy"], category: "chinese_restaurant", popularity_rank: 8, food_type: "restaurant" },
  // Jollibee
  { name_en: "Chickenjoy", name_ms: "Chickenjoy", name_zh: "快乐蜂炸鸡", aliases: ["jollibee chicken", "chicken joy"], allergens: ["gluten", "eggs", "dairy"], category: "fast_food", popularity_rank: 13, food_type: "restaurant" },
  { name_en: "Jolly Spaghetti", name_ms: "Jolly Spaghetti", name_zh: "快乐蜂意大利面", aliases: ["jollibee pasta", "sweet spaghetti"], allergens: ["gluten", "dairy", "eggs"], category: "fast_food", popularity_rank: 7, food_type: "restaurant" },
  // Shake Shack
  { name_en: "ShackBurger", name_ms: "ShackBurger", name_zh: "Shack汉堡", aliases: ["shake shack burger"], allergens: ["gluten", "dairy", "eggs", "beef"], category: "fast_food", popularity_rank: 10, food_type: "restaurant" },
  // Italian
  { name_en: "Margherita Pizza", name_ms: "Pizza Margherita", name_zh: "玛格丽特披萨", aliases: ["margherita", "cheese pizza"], allergens: ["gluten", "dairy"], category: "italian", popularity_rank: 25, food_type: "international" },
  { name_en: "Pepperoni Pizza", name_ms: "Pizza Pepperoni", name_zh: "意大利辣香肠披萨", aliases: ["pepperoni"], allergens: ["gluten", "dairy"], category: "italian", popularity_rank: 22, food_type: "international" },
  { name_en: "Spaghetti Bolognese", name_ms: "Spaghetti Bolognese", name_zh: "肉酱意面", aliases: ["bolognese pasta", "meat sauce pasta"], allergens: ["gluten", "eggs", "beef"], category: "italian", popularity_rank: 20, food_type: "international" },
  { name_en: "Carbonara", name_ms: "Carbonara", name_zh: "奶油培根意面", aliases: ["carbonara pasta", "cream pasta"], allergens: ["gluten", "dairy", "eggs"], category: "italian", popularity_rank: 18, food_type: "international" },
  { name_en: "Lasagna", name_ms: "Lasagna", name_zh: "千层面", aliases: ["lasagne", "baked pasta"], allergens: ["gluten", "dairy", "beef"], category: "italian", popularity_rank: 12, food_type: "international" },
  { name_en: "Caesar Salad", name_ms: "Caesar Salad", name_zh: "凯撒沙拉", aliases: ["caesar", "chicken salad"], allergens: ["dairy", "eggs", "gluten"], category: "italian", popularity_rank: 15, food_type: "international" },
  // Japanese
  { name_en: "Salmon Sashimi", name_ms: "Sashimi Salmon", name_zh: "三文鱼刺身", aliases: ["sashimi", "raw salmon"], allergens: ["fish"], category: "japanese", popularity_rank: 20, food_type: "international" },
  { name_en: "Chicken Katsu Curry", name_ms: "Kari Katsu Ayam", name_zh: "鸡排咖喱饭", aliases: ["katsu curry", "japanese curry"], allergens: ["gluten", "eggs"], category: "japanese", popularity_rank: 18, food_type: "international" },
  { name_en: "Tonkotsu Ramen", name_ms: "Ramen Tonkotsu", name_zh: "豚骨拉面", aliases: ["ramen", "pork broth ramen"], allergens: ["gluten", "eggs", "pork"], category: "japanese", popularity_rank: 22, food_type: "international" },
  { name_en: "Tempura Udon", name_ms: "Udon Tempura", name_zh: "天妇罗乌冬", aliases: ["udon tempura", "tempura noodles"], allergens: ["gluten", "shellfish", "eggs"], category: "japanese", popularity_rank: 14, food_type: "international" },
  { name_en: "Teriyaki Chicken Don", name_ms: "Don Ayam Teriyaki", name_zh: "照烧鸡丼", aliases: ["teriyaki chicken rice", "chicken don"], allergens: ["gluten", "soy", "eggs"], category: "japanese", popularity_rank: 16, food_type: "international" },
  { name_en: "Gyoza (6pc)", name_ms: "Gyoza", name_zh: "煎饺", aliases: ["gyoza", "pan fried dumpling"], allergens: ["gluten", "pork", "soy"], category: "japanese", popularity_rank: 12, food_type: "international" },
  // Korean
  { name_en: "Bibimbap", name_ms: "Bibimbap", name_zh: "石锅拌饭", aliases: ["korean mixed rice", "bibim bap"], allergens: ["gluten", "eggs", "soy"], category: "korean", popularity_rank: 16, food_type: "international" },
  { name_en: "Korean Fried Chicken", name_ms: "Ayam Goreng Korea", name_zh: "韩式炸鸡", aliases: ["kfc korean", "yangnyeom chicken", "soy garlic chicken"], allergens: ["gluten", "eggs", "soy"], category: "korean", popularity_rank: 20, food_type: "international" },
  { name_en: "Kimchi Jjigae", name_ms: "Kimchi Jjigae", name_zh: "泡菜汤", aliases: ["kimchi stew", "kimchi soup"], allergens: ["shellfish", "pork"], category: "korean", popularity_rank: 14, food_type: "international" },
  { name_en: "Bulgogi", name_ms: "Bulgogi", name_zh: "烤牛肉", aliases: ["korean bbq beef", "bulgogi beef"], allergens: ["soy", "beef", "gluten"], category: "korean", popularity_rank: 12, food_type: "international" },
  // Western
  { name_en: "Fish and Chips", name_ms: "Fish and Chips", name_zh: "炸鱼薯条", aliases: ["fish n chips", "battered fish"], allergens: ["gluten", "fish", "eggs"], category: "western", popularity_rank: 16, food_type: "international" },
  { name_en: "Grilled Chicken Breast", name_ms: "Dada Ayam Panggang", name_zh: "烤鸡胸", aliases: ["chicken breast", "grilled chicken"], allergens: [], category: "western", popularity_rank: 12, food_type: "international" },
  { name_en: "Sirloin Steak", name_ms: "Steak Sirloin", name_zh: "西冷牛排", aliases: ["steak", "beef steak"], allergens: ["beef"], category: "western", popularity_rank: 14, food_type: "international" },
  { name_en: "Club Sandwich", name_ms: "Club Sandwich", name_zh: "俱乐部三明治", aliases: ["triple decker", "chicken sandwich"], allergens: ["gluten", "dairy", "eggs"], category: "western", popularity_rank: 10, food_type: "international" },
  { name_en: "Mushroom Soup", name_ms: "Sup Cendawan", name_zh: "蘑菇汤", aliases: ["cream of mushroom", "mushroom soup"], allergens: ["dairy"], category: "western", popularity_rank: 8, food_type: "international" },
  // Thai
  { name_en: "Pad Thai", name_ms: "Pad Thai", name_zh: "泰式炒河粉", aliases: ["thai fried noodles", "phat thai"], allergens: ["gluten", "shellfish", "eggs", "peanuts"], category: "thai", popularity_rank: 22, food_type: "international" },
  { name_en: "Green Curry", name_ms: "Kari Hijau", name_zh: "青咖喱", aliases: ["green curry chicken", "gaeng keow wan"], allergens: ["dairy", "shellfish"], category: "thai", popularity_rank: 16, food_type: "international" },
  { name_en: "Mango Sticky Rice", name_ms: "Pulut Mangga", name_zh: "芒果糯米饭", aliases: ["mango sticky rice", "khao niew mamuang"], allergens: ["dairy"], category: "thai", popularity_rank: 14, food_type: "international" },
  { name_en: "Thai Basil Chicken", name_ms: "Ayam Basil Thai", name_zh: "泰式打抛鸡", aliases: ["pad krapow", "basil chicken rice"], allergens: ["gluten", "eggs", "soy"], category: "thai", popularity_rank: 18, food_type: "international" },
  // Indian
  { name_en: "Butter Chicken", name_ms: "Ayam Mentega", name_zh: "黄油鸡", aliases: ["butter chicken", "murgh makhani"], allergens: ["dairy", "nuts"], category: "indian", popularity_rank: 20, food_type: "international" },
  { name_en: "Garlic Naan", name_ms: "Naan Bawang Putih", name_zh: "蒜香烤饼", aliases: ["naan bread", "garlic bread indian"], allergens: ["gluten", "dairy"], category: "indian", popularity_rank: 16, food_type: "international" },
  { name_en: "Palak Paneer", name_ms: "Palak Paneer", name_zh: "菠菜奶酪", aliases: ["spinach paneer", "saag paneer"], allergens: ["dairy"], category: "indian", popularity_rank: 12, food_type: "international" },
  { name_en: "Chicken Tikka", name_ms: "Ayam Tikka", name_zh: "烤鸡块", aliases: ["tikka chicken", "tandoori chicken tikka"], allergens: ["dairy"], category: "indian", popularity_rank: 14, food_type: "international" },
  // Vietnamese
  { name_en: "Pho Bo", name_ms: "Pho Bo", name_zh: "牛肉粉", aliases: ["pho", "beef pho", "vietnamese noodles"], allergens: ["gluten"], category: "vietnamese", popularity_rank: 18, food_type: "international" },
  { name_en: "Banh Mi", name_ms: "Banh Mi", name_zh: "越南法棍", aliases: ["vietnamese sandwich", "banh mi thit"], allergens: ["gluten", "eggs", "pork"], category: "vietnamese", popularity_rank: 14, food_type: "international" },
  { name_en: "Fresh Spring Rolls", name_ms: "Popiah Segar", name_zh: "生春卷", aliases: ["goi cuon", "summer rolls", "rice paper rolls"], allergens: ["shellfish"], category: "vietnamese", popularity_rank: 10, food_type: "international" },
  // Mexican
  { name_en: "Chicken Tacos (3pc)", name_ms: "Taco Ayam", name_zh: "鸡肉玉米饼", aliases: ["tacos", "mexican tacos"], allergens: ["gluten", "dairy"], category: "mexican", popularity_rank: 12, food_type: "international" },
  { name_en: "Beef Burrito", name_ms: "Burrito Daging", name_zh: "牛肉卷饼", aliases: ["burrito", "mexican wrap"], allergens: ["gluten", "dairy", "beef"], category: "mexican", popularity_rank: 10, food_type: "international" },
  { name_en: "Nachos with Cheese", name_ms: "Nachos Keju", name_zh: "芝士玉米片", aliases: ["nachos", "cheese nachos"], allergens: ["dairy", "gluten"], category: "mexican", popularity_rank: 8, food_type: "international" },
];

export async function POST() {
  try {
    const supabase = await createClient();

    // Apply schema changes first (add food_type column + expand categories)
    const { error: colErr } = await supabase.rpc("exec_sql", {
      sql: `
        ALTER TABLE hawker_dishes ADD COLUMN IF NOT EXISTS food_type text NOT NULL DEFAULT 'hawker';
        ALTER TABLE hawker_dishes DROP CONSTRAINT IF EXISTS hawker_dishes_category_check;
        ALTER TABLE hawker_dishes ADD CONSTRAINT hawker_dishes_category_check CHECK (category IN ('noodles','rice','soup','grilled','fried','dessert','drinks','bread_pastry','other','fast_food','japanese','korean','italian','western','thai','indian','vietnamese','mexican','chinese_restaurant'));
      `
    });
    // rpc may fail if exec_sql doesn't exist — fall through to direct inserts

    let inserted = 0;
    let skipped = 0;

    for (const dish of NEW_DISHES) {
      const { error } = await supabase
        .from("hawker_dishes")
        .upsert({
          name_en: dish.name_en,
          name_ms: dish.name_ms,
          name_zh: dish.name_zh,
          aliases: dish.aliases,
          allergens: dish.allergens,
          category: dish.category,
          popularity_rank: dish.popularity_rank,
          food_type: dish.food_type,
        }, { onConflict: "name_en" });

      if (!error) inserted++;
      else skipped++;
    }

    return NextResponse.json({ seeded: true, inserted, skipped, total: NEW_DISHES.length });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ seeded: false, error: message }, { status: 500 });
  }
}
