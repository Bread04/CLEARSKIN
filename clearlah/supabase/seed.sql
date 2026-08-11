-- ============================================================
-- ClearLah — Seed Data
-- Populates: users (demo), hawker_dishes (80+ dishes)
-- Run AFTER migration: supabase db push && supabase db seed
-- ============================================================

-- ─── Demo User ────────────────────────────────────────────────────────────────
-- DEMO_USER_ID must match lib/utils/demo.ts DEMO_USER_ID constant
INSERT INTO users (id, email, created_at, onboarding_complete)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'demo@clearlah.sg',
  now(),
  true
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (
  user_id, tracking_for, conditions, disclaimer_acknowledged,
  singlish_unlocked, onboarding_step, known_allergens,
  daily_skincare, streak, streak_last_date, updated_at
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'myself',
  ARRAY['eczema', 'food_allergy'],
  true,
  true,
  3,
  ARRAY['shellfish', 'peanuts'],
  'CeraVe Moisturising Cream',
  14,
  CURRENT_DATE,
  now()
)
ON CONFLICT (user_id) DO NOTHING;

-- ─── Hawker Dishes ────────────────────────────────────────────────────────────
-- 85 dishes covering all major hawker categories with allergen tags.
-- Categories: noodles | rice | soup | grilled | fried | dessert | drinks | bread_pastry | other

-- name_en is the natural unique key for hawker dishes
ALTER TABLE hawker_dishes ADD CONSTRAINT hawker_dishes_name_en_unique UNIQUE (name_en);

INSERT INTO hawker_dishes (name_en, name_ms, name_zh, aliases, allergens, category, popularity_rank) VALUES

-- ── Noodles ──────────────────────────────────────────────────────────────────
('Char Kway Teow', 'Char Kway Teow', '炒粿条',
 ARRAY['char kuay teow','ckt','fried flat noodles'], ARRAY['shellfish','gluten','eggs'], 'noodles', 1),

('Hokkien Mee', 'Mi Goreng Hokkien', '福建炒虾面',
 ARRAY['hokkien prawn noodles','hk mee'], ARRAY['shellfish','gluten','eggs'], 'noodles', 2),

('Laksa', 'Laksa', '叻沙',
 ARRAY['curry laksa','katong laksa'], ARRAY['shellfish','dairy','gluten'], 'noodles', 3),

('Bak Chor Mee', 'Mi Babi Cincang', '肉脞面',
 ARRAY['minced pork noodles','bcm'], ARRAY['gluten'], 'noodles', 4),

('Wonton Mee', 'Mi Wonton', '云吞面',
 ARRAY['wantan mee','wonton noodles'], ARRAY['gluten','eggs'], 'noodles', 5),

('Prawn Mee', 'Mi Udang', '虾面',
 ARRAY['hae mee','prawn noodle soup'], ARRAY['shellfish','gluten'], 'noodles', 6),

('Mee Rebus', 'Mee Rebus', '马来黄面',
 ARRAY['mee rebus','yellow noodles gravy'], ARRAY['gluten','peanuts'], 'noodles', 7),

('Mee Siam', 'Mee Siam', '暹罗米粉',
 ARRAY['thin rice vermicelli spicy'], ARRAY['shellfish','peanuts'], 'noodles', 8),

('Mee Goreng', 'Mee Goreng', '炒面',
 ARRAY['indian fried noodles','mamak mee goreng'], ARRAY['gluten','eggs'], 'noodles', 9),

('Lor Mee', 'Lor Mee', '卤面',
 ARRAY['braised noodles','lor mee thick gravy'], ARRAY['gluten','eggs'], 'noodles', 10),

('Yong Tau Foo', 'Yong Tau Fu', '酿豆腐',
 ARRAY['ytf','yong tao foo'], ARRAY['gluten'], 'noodles', 11),

('Ban Mian', 'Ban Mian', '板面',
 ARRAY['handmade noodles','flat noodle soup'], ARRAY['gluten','eggs'], 'noodles', 12),

('Duck Noodles', 'Mi Itik', '鸭肉面',
 ARRAY['duck bee hoon','braised duck noodles'], ARRAY['gluten'], 'noodles', 13),

('Dry Bak Kut Teh Noodles', NULL, '肉骨茶面线',
 ARRAY['bkt noodles','dry bkt'], ARRAY['gluten'], 'noodles', 14),

('Fishball Noodles', 'Mi Bebola Ikan', '鱼丸面',
 ARRAY['fishball mee','fishball noodle soup'], ARRAY['gluten','fish'], 'noodles', 15),

-- ── Rice ──────────────────────────────────────────────────────────────────────
('Hainanese Chicken Rice', 'Nasi Ayam Hainan', '海南鸡饭',
 ARRAY['chicken rice','white chicken rice'], ARRAY[]::text[], 'rice', 1),

('Nasi Lemak', 'Nasi Lemak', '椰浆饭',
 ARRAY['coconut rice','nasi lemak'], ARRAY['peanuts','shellfish','eggs'], 'rice', 2),

('Economic Rice', 'Nasi Campur', '经济饭',
 ARRAY['cai fan','economy rice','mixed rice'], ARRAY[]::text[], 'rice', 3),

('Nasi Padang', 'Nasi Padang', '巴东饭',
 ARRAY['nasi padang','padang rice'], ARRAY['peanuts'], 'rice', 4),

('Claypot Rice', NULL, '瓦煲饭',
 ARRAY['clay pot rice','claypot chicken rice'], ARRAY[]::text[], 'rice', 5),

('Biryani', 'Nasi Briyani', '印度香米饭',
 ARRAY['briyani','nasi briyani','indian rice'], ARRAY['dairy'], 'rice', 6),

('Nasi Goreng', 'Nasi Goreng', '炒饭',
 ARRAY['fried rice','nasi goreng'], ARRAY['eggs','shellfish'], 'rice', 7),

('Duck Rice', 'Nasi Itik', '鸭饭',
 ARRAY['braised duck rice','duck rice'], ARRAY[]::text[], 'rice', 8),

('Roast Pork Rice', NULL, '烧肉饭',
 ARRAY['sio bak rice','char siu rice'], ARRAY[]::text[], 'rice', 9),

('Curry Rice', 'Nasi Kari', '咖喱饭',
 ARRAY['chinese curry rice','curry pork chop rice'], ARRAY['dairy'], 'rice', 10),

-- ── Soup ──────────────────────────────────────────────────────────────────────
('Bak Kut Teh', 'Sup Tulang Babi', '肉骨茶',
 ARRAY['bkt','pork rib soup'], ARRAY[]::text[], 'soup', 1),

('Fish Soup', 'Sup Ikan', '鱼汤',
 ARRAY['fish head soup','sliced fish soup'], ARRAY['fish'], 'soup', 2),

('Soup Kambing', 'Sup Kambing', '羊肉汤',
 ARRAY['mutton soup','spiced mutton soup'], ARRAY[]::text[], 'soup', 3),

('Tom Yum Soup', 'Tom Yam', '冬阴功汤',
 ARRAY['tom yam','thai soup','tomyum'], ARRAY['shellfish','fish'], 'soup', 4),

('Herbal Duck Soup', NULL, '老鸭汤',
 ARRAY['duck herbal soup','braised duck soup'], ARRAY[]::text[], 'soup', 5),

('Thunder Tea Rice Soup', NULL, '擂茶',
 ARRAY['lei cha','thunder tea'], ARRAY['peanuts','tree nuts'], 'soup', 6),

('Pig Organ Soup', NULL, '猪杂汤',
 ARRAY['pig innards soup','zhu za tang'], ARRAY[]::text[], 'soup', 7),

('Teochew Fish Porridge', NULL, '潮州鱼粥',
 ARRAY['fish porridge','chao zhou fish congee'], ARRAY['fish'], 'soup', 8),

('ABC Soup', NULL, 'ABC汤',
 ARRAY['abc vegetable soup','carrot potato soup'], ARRAY[]::text[], 'soup', 9),

('Watercress Soup', NULL, '西洋菜汤',
 ARRAY['sai yang choi tong','watercress pork soup'], ARRAY[]::text[], 'soup', 10),

-- ── Grilled ───────────────────────────────────────────────────────────────────
('Satay', 'Satay', '沙爹',
 ARRAY['sate','grilled skewers'], ARRAY['peanuts'], 'grilled', 1),

('Barbecue Stingray', 'Ikan Pari Bakar', '烤魔鬼鱼',
 ARRAY['bbq stingray','sambal stingray'], ARRAY['fish'], 'grilled', 2),

('Grilled Chicken Wings', 'Sayap Ayam Bakar', '烤鸡翅',
 ARRAY['bbq chicken wings','grilled wings'], ARRAY[]::text[], 'grilled', 3),

('Otak Otak', 'Otak-Otak', '乌达',
 ARRAY['otah','spiced fish cake grilled'], ARRAY['fish','eggs'], 'grilled', 4),

('Sate Lilit', 'Sate Lilit', '峇里烤肉串',
 ARRAY['balinese satay','wrapped satay'], ARRAY['peanuts','fish'], 'grilled', 5),

('Grilled Corn', 'Jagung Bakar', '烤玉米',
 ARRAY['bbq corn','grilled sweet corn'], ARRAY[]::text[], 'grilled', 6),

('Tandoori Chicken', 'Ayam Tanduri', '坦都鸡',
 ARRAY['tandoor chicken','indian grilled chicken'], ARRAY['dairy'], 'grilled', 7),

-- ── Fried ─────────────────────────────────────────────────────────────────────
('Oyster Omelette', 'Or Luak', '蚝煎',
 ARRAY['or luak','oyster egg','chye tow kway'], ARRAY['shellfish','eggs','gluten'], 'fried', 1),

('Carrot Cake', NULL, '菜头粿',
 ARRAY['chai tow kway','radish cake','white carrot cake','black carrot cake'], ARRAY['eggs','gluten'], 'fried', 2),

('Roti Prata', 'Roti Canai', '印度薄饼',
 ARRAY['prata','roti canai','indian flatbread'], ARRAY['gluten','dairy','eggs'], 'fried', 3),

('Curry Puff', 'Epok-Epok', '咖喱角',
 ARRAY['karipap','curry puff pastry'], ARRAY['gluten','eggs'], 'fried', 4),

('Spring Roll', 'Popiah Goreng', '炸春卷',
 ARRAY['fried popiah','spring roll'], ARRAY['gluten','eggs'], 'fried', 5),

('Sambal Kangkong', 'Kangkung Goreng', '炒空心菜',
 ARRAY['stir fried water spinach','kangkong belacan'], ARRAY['shellfish'], 'fried', 6),

('Fried Tofu', 'Tauhu Goreng', '炸豆腐',
 ARRAY['tahu goreng','fried beancurd peanut sauce'], ARRAY['peanuts','soy'], 'fried', 7),

('Goreng Pisang', 'Pisang Goreng', '炸香蕉',
 ARRAY['fried banana','banana fritter'], ARRAY['gluten'], 'fried', 8),

('Ngoh Hiang', NULL, '五香',
 ARRAY['five spice roll','wu xiang','ngoh hiang roll'], ARRAY['gluten','shellfish','eggs'], 'fried', 9),

('Fried Chicken Cutlet', NULL, '炸鸡排',
 ARRAY['chicken chop','fried chicken'], ARRAY['gluten','eggs'], 'fried', 10),

('Sotong Goreng', 'Sotong Goreng', '炸鱿鱼',
 ARRAY['fried squid','calamari'], ARRAY['shellfish','gluten'], 'fried', 11),

('Vadai', 'Vadai', '印度油炸饼',
 ARRAY['medu vada','lentil fritter','indian vadai'], ARRAY['gluten'], 'fried', 12),

-- ── Dessert ───────────────────────────────────────────────────────────────────
('Ice Kachang', 'Air Batu Campur', '红豆冰',
 ARRAY['ABC','ice kacang','shaved ice'], ARRAY['dairy'], 'dessert', 1),

('Chendol', 'Cendol', '煎蕊',
 ARRAY['cendol','green jelly shaved ice'], ARRAY['dairy'], 'dessert', 2),

('Tau Huay', NULL, '豆花',
 ARRAY['tofu pudding','soya beancurd dessert','douhua'], ARRAY['soy'], 'dessert', 3),

('Chwee Kueh', NULL, '水粿',
 ARRAY['steamed rice cake','chui kueh'], ARRAY['gluten'], 'dessert', 4),

('Ondeh Ondeh', 'Onde-Onde', '椰糖糯米球',
 ARRAY['klepon','pandan glutinous rice ball'], ARRAY[]::text[], 'dessert', 5),

('Ang Ku Kueh', NULL, '红龟粿',
 ARRAY['red tortoise cake','ang ku kuih'], ARRAY['peanuts','gluten'], 'dessert', 6),

('Kueh Salat', NULL, '九层糕',
 ARRAY['kuih seri muka','blue rice kueh'], ARRAY['dairy','eggs'], 'dessert', 7),

('Bubur Cha Cha', 'Bubur Cha-Cha', '摩摩喳喳',
 ARRAY['coconut dessert','yam sweet potato coconut milk'], ARRAY['dairy'], 'dessert', 8),

('Mango Pomelo Sago', NULL, '杨枝甘露',
 ARRAY['yang zhi gan lu','mango sago'], ARRAY['dairy'], 'dessert', 9),

('Sugee Cake', NULL, '苏吉蛋糕',
 ARRAY['semolina cake','eurasian sugee'], ARRAY['gluten','dairy','eggs','tree nuts'], 'dessert', 10),

('Pandan Layer Cake', NULL, '班兰千层蛋糕',
 ARRAY['kueh lapis pandan','layer cake'], ARRAY['eggs','dairy','gluten'], 'dessert', 11),

-- ── Drinks ────────────────────────────────────────────────────────────────────
('Teh Tarik', 'Teh Tarik', '拉茶',
 ARRAY['pulled tea','milk tea','teh tarik'], ARRAY['dairy'], 'drinks', 1),

('Kopi', 'Kopi', '咖啡',
 ARRAY['singapore coffee','kopi o','kopi c'], ARRAY['dairy'], 'drinks', 2),

('Milo Dinosaur', NULL, '美禄恐龙',
 ARRAY['milo dino','milo ice'], ARRAY['dairy','gluten'], 'drinks', 3),

('Bandung', 'Air Bandung', '玫瑰糖水',
 ARRAY['rose syrup milk','bandung drink'], ARRAY['dairy'], 'drinks', 4),

('Barley Water', 'Air Barli', '大麦水',
 ARRAY['barley drink','chinese barley'], ARRAY[]::text[], 'drinks', 5),

('Sugarcane Juice', 'Air Tebu', '甘蔗汁',
 ARRAY['tebu juice','fresh sugarcane'], ARRAY[]::text[], 'drinks', 6),

('Chrysanthemum Tea', NULL, '菊花茶',
 ARRAY['chrysanthemum drink','ju hua cha'], ARRAY[]::text[], 'drinks', 7),

('Soy Bean Milk', 'Susu Soya', '豆浆',
 ARRAY['tau chuan','soya milk','soy milk'], ARRAY['soy'], 'drinks', 8),

('Lime Juice', 'Air Limau', '酸柑水',
 ARRAY['calamansi juice','limau juice','fresh lime'], ARRAY[]::text[], 'drinks', 9),

-- ── Bread & Pastry ────────────────────────────────────────────────────────────
('Kaya Toast', 'Roti Kaya', '咖椰吐司',
 ARRAY['kaya butter toast','toast with kaya'], ARRAY['gluten','eggs','dairy'], 'bread_pastry', 1),

('Roti John', 'Roti John', '罗提约翰',
 ARRAY['roti john sandwich','french loaf omelette'], ARRAY['gluten','eggs'], 'bread_pastry', 2),

('Soft Boiled Eggs', NULL, '半生熟鸡蛋',
 ARRAY['runny eggs','sg soft boiled eggs'], ARRAY['eggs'], 'bread_pastry', 3),

('Pandan Waffles', NULL, '班兰华夫饼',
 ARRAY['waffle pandan','crispy waffle'], ARRAY['gluten','eggs','dairy'], 'bread_pastry', 4),

('Putu Piring', 'Putu Piring', '普都比林',
 ARRAY['steamed rice cake coconut'], ARRAY['tree nuts'], 'bread_pastry', 5),

('Popiah (Fresh)', 'Popiah Basah', '薄饼',
 ARRAY['fresh spring roll','popiah'], ARRAY['gluten','eggs','peanuts'], 'bread_pastry', 6),

('Thosai', 'Tosai', '印度煎饼',
 ARRAY['dosa','dosai','fermented lentil crepe'], ARRAY['gluten'], 'bread_pastry', 7),

('Idli', 'Idli', '印度米糕',
 ARRAY['steamed rice cake indian'], ARRAY[]::text[], 'bread_pastry', 8),

-- ── Other ─────────────────────────────────────────────────────────────────────
('Rojak', 'Rojak', '罗惹',
 ARRAY['fruit rojak','indian rojak','pasembur'], ARRAY['peanuts','shellfish','gluten'], 'other', 1),

('Popiah (Fried)', 'Popiah Goreng', '炸薄饼',
 ARRAY['fried popiah roll'], ARRAY['gluten','eggs','peanuts'], 'other', 2),

('Kueh Pie Tee', NULL, '粿杯',
 ARRAY['top hat','pastry cups'], ARRAY['gluten','shellfish','eggs'], 'other', 3),

('Murtabak', 'Murtabak', '穆尔塔巴克',
 ARRAY['mutton murtabak','chicken murtabak','stuffed pancake'], ARRAY['gluten','eggs'], 'other', 4),

('Tahu Goreng', 'Tahu Goreng', '炸豆腐罗惹',
 ARRAY['fried tofu rojak','peanut sauce tofu'], ARRAY['peanuts','soy','gluten'], 'other', 5),

('Nasi Lemak Ayam Penyet', 'Nasi Lemak Ayam Penyet', '压碎炸鸡椰浆饭',
 ARRAY['ayam penyet nasi lemak'], ARRAY['peanuts','eggs'], 'other', 6),

('Sambal Goreng', 'Sambal Goreng', '参巴炒杂菜',
 ARRAY['sambal mix veg','nasi padang side'], ARRAY['shellfish'], 'other', 7),

('Kang Kong Belacan', 'Kangkung Belacan', '参巴空心菜',
 ARRAY['kangkong belacan stir fry'], ARRAY['shellfish'], 'other', 8),

('Ikan Bilis', 'Ikan Bilis', '江鱼仔',
 ARRAY['dried anchovies','ikan bilis'], ARRAY['fish'], 'other', 9),

('Tempeh', 'Tempe', '天贝',
 ARRAY['tempe','fermented soy block'], ARRAY['soy'], 'other', 10)

ON CONFLICT (name_en) DO UPDATE SET
  name_ms        = EXCLUDED.name_ms,
  name_zh        = EXCLUDED.name_zh,
  aliases        = EXCLUDED.aliases,
  allergens      = EXCLUDED.allergens,
  category       = EXCLUDED.category,
  popularity_rank = EXCLUDED.popularity_rank;

-- ─── Verify count ─────────────────────────────────────────────────────────────
-- SELECT COUNT(*) FROM hawker_dishes;  -- Expected: 85
