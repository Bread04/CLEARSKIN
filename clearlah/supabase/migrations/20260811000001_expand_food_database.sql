-- Expand hawker_dishes to support restaurant chains and international cuisine.
-- Adds food_type column and new categories.

-- Add food_type to distinguish hawker from restaurant and international dishes
ALTER TABLE hawker_dishes
  ADD COLUMN IF NOT EXISTS food_type text NOT NULL DEFAULT 'hawker'
  CHECK (food_type IN ('hawker', 'restaurant', 'international'));

-- Drop old CHECK and add expanded categories (restaurant, fast_food, japanese, etc.)
ALTER TABLE hawker_dishes
  DROP CONSTRAINT IF EXISTS hawker_dishes_category_check;

ALTER TABLE hawker_dishes
  ADD CONSTRAINT hawker_dishes_category_check
  CHECK (category IN (
    'noodles', 'rice', 'soup', 'grilled', 'fried', 'dessert', 'drinks',
    'bread_pastry', 'other', 'fast_food', 'japanese', 'korean', 'italian',
    'western', 'thai', 'indian', 'vietnamese', 'mexican', 'chinese_restaurant'
  ));

-- Add index for food_type filtering
CREATE INDEX IF NOT EXISTS idx_hawker_dishes_food_type
  ON hawker_dishes (food_type);

-- ============================================================
-- Restaurant Chain Dishes (Singapore mall staples)
-- ============================================================

-- McDonald's (fast_food)
INSERT INTO hawker_dishes (name_en, name_ms, name_zh, aliases, allergens, category, popularity_rank, food_type)
VALUES
  ('Big Mac', 'Big Mac', '巨无霸', ARRAY['big mac meal', 'mcdonald burger'], ARRAY['gluten', 'dairy', 'eggs', 'beef'], 'fast_food', 10, 'restaurant'),
  ('McSpicy', 'McSpicy', '麦辣鸡腿堡', ARRAY['mcspicy burger', 'spicy chicken burger'], ARRAY['gluten', 'dairy', 'eggs'], 'fast_food', 8, 'restaurant'),
  ('McNuggets (6pc)', 'McNuggets', '麦乐鸡', ARRAY['chicken nuggets', '6 piece'], ARRAY['gluten', 'eggs'], 'fast_food', 12, 'restaurant'),
  ('Filet-O-Fish', 'Filet-O-Fish', '麦香鱼', ARRAY['fish burger', 'fillet'], ARRAY['gluten', 'dairy', 'eggs', 'fish'], 'fast_food', 6, 'restaurant'),
  ('McChicken', 'McChicken', '麦香鸡', ARRAY['mc chicken'], ARRAY['gluten', 'dairy', 'eggs'], 'fast_food', 7, 'restaurant')
ON CONFLICT (name_en) DO NOTHING;

-- KFC (fast_food)
INSERT INTO hawker_dishes (name_en, name_ms, name_zh, aliases, allergens, category, popularity_rank, food_type)
VALUES
  ('Zinger Burger', 'Zinger Burger', '香辣鸡腿堡', ARRAY['kfc burger', 'zinger'], ARRAY['gluten', 'dairy', 'eggs'], 'fast_food', 15, 'restaurant'),
  ('Original Recipe Chicken (2pc)', 'Ayam Goreng Original', '原味鸡', ARRAY['kfc chicken', 'fried chicken kfc'], ARRAY['gluten', 'eggs', 'dairy'], 'fast_food', 14, 'restaurant'),
  ('Chicken Popcorn', 'Chicken Popcorn', '鸡米花', ARRAY['popcorn chicken'], ARRAY['gluten', 'eggs'], 'fast_food', 9, 'restaurant'),
  ('Cheesy Wedges', 'Cheesy Wedges', '芝士薯角', ARRAY['cheese fries kfc', 'potato wedges'], ARRAY['dairy'], 'fast_food', 5, 'restaurant')
ON CONFLICT (name_en) DO NOTHING;

-- Burger King (fast_food)
INSERT INTO hawker_dishes (name_en, name_ms, name_zh, aliases, allergens, category, popularity_rank, food_type)
VALUES
  ('Whopper', 'Whopper', '皇堡', ARRAY['bk whopper', 'burger king burger'], ARRAY['gluten', 'dairy', 'eggs', 'beef'], 'fast_food', 11, 'restaurant'),
  ('Chicken Royale', 'Chicken Royale', '鸡排堡', ARRAY['royale burger'], ARRAY['gluten', 'dairy', 'eggs'], 'fast_food', 6, 'restaurant')
ON CONFLICT (name_en) DO NOTHING;

-- Subway (fast_food)
INSERT INTO hawker_dishes (name_en, name_ms, name_zh, aliases, allergens, category, popularity_rank, food_type)
VALUES
  ('Italian BMT Sub', 'Italian BMT', '意大利BMT三明治', ARRAY['subway bmt', 'italian sub'], ARRAY['gluten', 'dairy'], 'fast_food', 8, 'restaurant'),
  ('Subway Melt', 'Subway Melt', 'Subway Melt', ARRAY['melt sub', 'turkey melt'], ARRAY['gluten', 'dairy'], 'fast_food', 5, 'restaurant')
ON CONFLICT (name_en) DO NOTHING;

-- Din Tai Fung (chinese_restaurant)
INSERT INTO hawker_dishes (name_en, name_ms, name_zh, aliases, allergens, category, popularity_rank, food_type)
VALUES
  ('Xiao Long Bao', 'Xiao Long Bao', '小笼包', ARRAY['xlb', 'soup dumpling', 'steamed dumpling'], ARRAY['gluten', 'pork'], 'chinese_restaurant', 20, 'restaurant'),
  ('Fried Rice with Pork Chop', 'Nasi Goreng Pork Chop', '排骨蛋炒饭', ARRAY['dtf fried rice', 'pork chop rice'], ARRAY['gluten', 'eggs', 'pork'], 'chinese_restaurant', 18, 'restaurant'),
  ('Steamed Chicken Soup', 'Sup Ayam Kukus', '鸡汤', ARRAY['chicken soup dtf'], ARRAY[], 'chinese_restaurant', 12, 'restaurant')
ON CONFLICT (name_en) DO NOTHING;

-- Hai Di Lao (chinese_restaurant)
INSERT INTO hawker_dishes (name_en, name_ms, name_zh, aliases, allergens, category, popularity_rank, food_type)
VALUES
  ('Mala Hot Pot Broth', 'Sup Mala', '麻辣锅底', ARRAY['mala broth', 'spicy hotpot'], ARRAY['soy'], 'chinese_restaurant', 15, 'restaurant'),
  ('Hand-Pulled Noodles (HDL)', 'Mee Tarik', '拉面', ARRAY['hdl noodles', 'la mian'], ARRAY['gluten'], 'chinese_restaurant', 10, 'restaurant')
ON CONFLICT (name_en) DO NOTHING;

-- Tim Ho Wan (chinese_restaurant)
INSERT INTO hawker_dishes (name_en, name_ms, name_zh, aliases, allergens, category, popularity_rank, food_type)
VALUES
  ('BBQ Pork Buns', 'Pau Char Siew', '叉烧包', ARRAY['char siew bao', 'tim ho wan buns'], ARRAY['gluten', 'pork'], 'chinese_restaurant', 16, 'restaurant'),
  ('Steamed Egg Cake', 'Kek Telur Kukus', '马拉糕', ARRAY['malay cake', 'ma lai gao'], ARRAY['gluten', 'eggs', 'dairy'], 'chinese_restaurant', 8, 'restaurant')
ON CONFLICT (name_en) DO NOTHING;

-- Jollibee (fast_food)
INSERT INTO hawker_dishes (name_en, name_ms, name_zh, aliases, allergens, category, popularity_rank, food_type)
VALUES
  ('Chickenjoy', 'Chickenjoy', '快乐蜂炸鸡', ARRAY['jollibee chicken', 'chicken joy'], ARRAY['gluten', 'eggs', 'dairy'], 'fast_food', 13, 'restaurant'),
  ('Jolly Spaghetti', 'Jolly Spaghetti', '快乐蜂意大利面', ARRAY['jollibee pasta', 'sweet spaghetti'], ARRAY['gluten', 'dairy', 'eggs'], 'fast_food', 7, 'restaurant')
ON CONFLICT (name_en) DO NOTHING;

-- Shake Shack (fast_food)
INSERT INTO hawker_dishes (name_en, name_ms, name_zh, aliases, allergens, category, popularity_rank, food_type)
VALUES
  ('ShackBurger', 'ShackBurger', 'Shack汉堡', ARRAY['shake shack burger'], ARRAY['gluten', 'dairy', 'eggs', 'beef'], 'fast_food', 10, 'restaurant')
ON CONFLICT (name_en) DO NOTHING;

-- ============================================================
-- International Cuisine
-- ============================================================

-- Italian
INSERT INTO hawker_dishes (name_en, name_ms, name_zh, aliases, allergens, category, popularity_rank, food_type)
VALUES
  ('Margherita Pizza', 'Pizza Margherita', '玛格丽特披萨', ARRAY['margherita', 'cheese pizza'], ARRAY['gluten', 'dairy'], 'italian', 25, 'international'),
  ('Pepperoni Pizza', 'Pizza Pepperoni', '意大利辣香肠披萨', ARRAY['pepperoni'], ARRAY['gluten', 'dairy'], 'italian', 22, 'international'),
  ('Spaghetti Bolognese', 'Spaghetti Bolognese', '肉酱意面', ARRAY['bolognese pasta', 'meat sauce pasta'], ARRAY['gluten', 'eggs', 'beef'], 'italian', 20, 'international'),
  ('Carbonara', 'Carbonara', '奶油培根意面', ARRAY['carbonara pasta', 'cream pasta'], ARRAY['gluten', 'dairy', 'eggs'], 'italian', 18, 'international'),
  ('Lasagna', 'Lasagna', '千层面', ARRAY['lasagne', 'baked pasta'], ARRAY['gluten', 'dairy', 'beef'], 'italian', 12, 'international'),
  ('Caesar Salad', 'Caesar Salad', '凯撒沙拉', ARRAY['caesar', 'chicken salad'], ARRAY['dairy', 'eggs', 'gluten'], 'italian', 15, 'international')
ON CONFLICT (name_en) DO NOTHING;

-- Japanese
INSERT INTO hawker_dishes (name_en, name_ms, name_zh, aliases, allergens, category, popularity_rank, food_type)
VALUES
  ('Salmon Sashimi', 'Sashimi Salmon', '三文鱼刺身', ARRAY['sashimi', 'raw salmon'], ARRAY['fish'], 'japanese', 20, 'international'),
  ('Chicken Katsu Curry', 'Kari Katsu Ayam', '鸡排咖喱饭', ARRAY['katsu curry', 'japanese curry'], ARRAY['gluten', 'eggs'], 'japanese', 18, 'international'),
  ('Tonkotsu Ramen', 'Ramen Tonkotsu', '豚骨拉面', ARRAY['ramen', 'pork broth ramen'], ARRAY['gluten', 'eggs', 'pork'], 'japanese', 22, 'international'),
  ('Tempura Udon', 'Udon Tempura', '天妇罗乌冬', ARRAY['udon tempura', 'tempura noodles'], ARRAY['gluten', 'shellfish', 'eggs'], 'japanese', 14, 'international'),
  ('Teriyaki Chicken Don', 'Don Ayam Teriyaki', '照烧鸡丼', ARRAY['teriyaki chicken rice', 'chicken don'], ARRAY['gluten', 'soy', 'eggs'], 'japanese', 16, 'international'),
  ('Gyoza (6pc)', 'Gyoza', '煎饺', ARRAY['gyoza', 'pan fried dumpling'], ARRAY['gluten', 'pork', 'soy'], 'japanese', 12, 'international')
ON CONFLICT (name_en) DO NOTHING;

-- Korean
INSERT INTO hawker_dishes (name_en, name_ms, name_zh, aliases, allergens, category, popularity_rank, food_type)
VALUES
  ('Bibimbap', 'Bibimbap', '石锅拌饭', ARRAY['korean mixed rice', 'bibim bap'], ARRAY['gluten', 'eggs', 'soy'], 'korean', 16, 'international'),
  ('Korean Fried Chicken', 'Ayam Goreng Korea', '韩式炸鸡', ARRAY['kfc korean', 'yangnyeom chicken', 'soy garlic chicken'], ARRAY['gluten', 'eggs', 'soy'], 'korean', 20, 'international'),
  ('Kimchi Jjigae', 'Kimchi Jjigae', '泡菜汤', ARRAY['kimchi stew', 'kimchi soup'], ARRAY['shellfish', 'pork'], 'korean', 14, 'international'),
  ('Bulgogi', 'Bulgogi', '烤牛肉', ARRAY['korean bbq beef', 'bulgogi beef'], ARRAY['soy', 'beef', 'gluten'], 'korean', 12, 'international')
ON CONFLICT (name_en) DO NOTHING;

-- Western
INSERT INTO hawker_dishes (name_en, name_ms, name_zh, aliases, allergens, category, popularity_rank, food_type)
VALUES
  ('Fish and Chips', 'Fish and Chips', '炸鱼薯条', ARRAY['fish n chips', 'battered fish'], ARRAY['gluten', 'fish', 'eggs'], 'western', 16, 'international'),
  ('Grilled Chicken Breast', 'Dada Ayam Panggang', '烤鸡胸', ARRAY['chicken breast', 'grilled chicken'], ARRAY[], 'western', 12, 'international'),
  ('Sirloin Steak', 'Steak Sirloin', '西冷牛排', ARRAY['steak', 'beef steak'], ARRAY['beef'], 'western', 14, 'international'),
  ('Club Sandwich', 'Club Sandwich', '俱乐部三明治', ARRAY['triple decker', 'chicken sandwich'], ARRAY['gluten', 'dairy', 'eggs'], 'western', 10, 'international'),
  ('Mushroom Soup', 'Sup Cendawan', '蘑菇汤', ARRAY['cream of mushroom', 'mushroom soup'], ARRAY['dairy'], 'western', 8, 'international')
ON CONFLICT (name_en) DO NOTHING;

-- Thai
INSERT INTO hawker_dishes (name_en, name_ms, name_zh, aliases, allergens, category, popularity_rank, food_type)
VALUES
  ('Pad Thai', 'Pad Thai', '泰式炒河粉', ARRAY['thai fried noodles', 'phat thai'], ARRAY['gluten', 'shellfish', 'eggs', 'peanuts'], 'thai', 22, 'international'),
  ('Green Curry', 'Kari Hijau', '青咖喱', ARRAY['green curry chicken', 'gaeng keow wan'], ARRAY['dairy', 'shellfish'], 'thai', 16, 'international'),
  ('Mango Sticky Rice', 'Pulut Mangga', '芒果糯米饭', ARRAY['mango sticky rice', 'khao niew mamuang'], ARRAY['dairy'], 'thai', 14, 'international'),
  ('Thai Basil Chicken', 'Ayam Basil Thai', '泰式打抛鸡', ARRAY['pad krapow', 'basil chicken rice'], ARRAY['gluten', 'eggs', 'soy'], 'thai', 18, 'international')
ON CONFLICT (name_en) DO NOTHING;

-- Indian
INSERT INTO hawker_dishes (name_en, name_ms, name_zh, aliases, allergens, category, popularity_rank, food_type)
VALUES
  ('Butter Chicken', 'Ayam Mentega', '黄油鸡', ARRAY['butter chicken', 'murgh makhani'], ARRAY['dairy', 'nuts'], 'indian', 20, 'international'),
  ('Garlic Naan', 'Naan Bawang Putih', '蒜香烤饼', ARRAY['naan bread', 'garlic bread indian'], ARRAY['gluten', 'dairy'], 'indian', 16, 'international'),
  ('Palak Paneer', 'Palak Paneer', '菠菜奶酪', ARRAY['spinach paneer', 'saag paneer'], ARRAY['dairy'], 'indian', 12, 'international'),
  ('Chicken Tikka', 'Ayam Tikka', '烤鸡块', ARRAY['tikka chicken', 'tandoori chicken tikka'], ARRAY['dairy'], 'indian', 14, 'international')
ON CONFLICT (name_en) DO NOTHING;

-- Vietnamese
INSERT INTO hawker_dishes (name_en, name_ms, name_zh, aliases, allergens, category, popularity_rank, food_type)
VALUES
  ('Pho Bo', 'Pho Bo', '牛肉粉', ARRAY['pho', 'beef pho', 'vietnamese noodles'], ARRAY['gluten'], 'vietnamese', 18, 'international'),
  ('Banh Mi', 'Banh Mi', '越南法棍', ARRAY['vietnamese sandwich', 'banh mi thit'], ARRAY['gluten', 'eggs', 'pork'], 'vietnamese', 14, 'international'),
  ('Fresh Spring Rolls', 'Popiah Segar', '生春卷', ARRAY['goi cuon', 'summer rolls', 'rice paper rolls'], ARRAY['shellfish'], 'vietnamese', 10, 'international')
ON CONFLICT (name_en) DO NOTHING;

-- Mexican
INSERT INTO hawker_dishes (name_en, name_ms, name_zh, aliases, allergens, category, popularity_rank, food_type)
VALUES
  ('Chicken Tacos (3pc)', 'Taco Ayam', '鸡肉玉米饼', ARRAY['tacos', 'mexican tacos'], ARRAY['gluten', 'dairy'], 'mexican', 12, 'international'),
  ('Beef Burrito', 'Burrito Daging', '牛肉卷饼', ARRAY['burrito', 'mexican wrap'], ARRAY['gluten', 'dairy', 'beef'], 'mexican', 10, 'international'),
  ('Nachos with Cheese', 'Nachos Keju', '芝士玉米片', ARRAY['nachos', 'cheese nachos'], ARRAY['dairy', 'gluten'], 'mexican', 8, 'international')
ON CONFLICT (name_en) DO NOTHING;
