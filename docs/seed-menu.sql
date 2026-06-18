-- Menu seed data extracted from hubble.cafe and meteor.cafe (2026-06-18).
-- Run against a MariaDB instance after the schema has been created by Hibernate.
-- Safe to re-run: truncates existing menu data first.

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE daily_dish;
TRUNCATE TABLE menu_item;
TRUNCATE TABLE menu_category;
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- TABS (parent_id IS NULL): top-level navigation buttons
-- IDs 1001-1008: HUBBLE    IDs 1009-1014: METEOR
-- ============================================================

INSERT INTO menu_category (id, name, kind, availability_note, sort_order, bar, parent_id) VALUES
  (1001, 'Non-Alcoholic',      'DRINK', NULL,               1, 'HUBBLE', NULL),
  (1002, 'Beer',               'DRINK', NULL,               2, 'HUBBLE', NULL),
  (1003, 'Spirits & Wine',     'DRINK', NULL,               3, 'HUBBLE', NULL),
  (1004, 'Breakfast & Lunch',  'FOOD',  NULL,               4, 'HUBBLE', NULL),
  (1005, 'Snacks',             'FOOD',  NULL,               5, 'HUBBLE', NULL),
  (1006, 'Dinner',             'FOOD',  'Weekdays, until 19:30', 6, 'HUBBLE', NULL),
  (1007, 'Weekend Menu',       'FOOD',  'Weekends only',    7, 'HUBBLE', NULL),
  (1008, 'Dessert',            'FOOD',  NULL,               8, 'HUBBLE', NULL),

  (1009, 'Alcohol Free',       'DRINK', NULL,               1, 'METEOR', NULL),
  (1010, 'Cocktails & More',   'DRINK', NULL,               2, 'METEOR', NULL),
  (1011, 'Beer & Wine',        'DRINK', NULL,               3, 'METEOR', NULL),
  (1012, 'Hot Drinks',         'DRINK', NULL,               4, 'METEOR', NULL),
  (1013, 'Snacks (All Day)',   'FOOD',  NULL,               5, 'METEOR', NULL),
  (1014, 'Food (Until 19:30)', 'FOOD',  'Until 19:30',      6, 'METEOR', NULL);

-- ============================================================
-- SUB-CATEGORIES (parent_id points to a tab)
-- IDs 1-25: HUBBLE    IDs 26-48: METEOR
-- ============================================================

INSERT INTO menu_category (id, name, kind, availability_note, sort_order, bar, parent_id) VALUES
  -- Hubble: Non-Alcoholic (1001)
  (1,  'Coffee',               'DRINK', NULL,                        1, 'HUBBLE', 1001),
  (2,  'Special Coffees',      'DRINK', NULL,                        2, 'HUBBLE', 1001),
  (3,  'Coffee Extras',        'DRINK', NULL,                        3, 'HUBBLE', 1001),
  (4,  'Hot Drinks',           'DRINK', NULL,                        4, 'HUBBLE', 1001),
  (5,  'Cold Drinks',          'DRINK', NULL,                        5, 'HUBBLE', 1001),
  (6,  'Mocktails',            'DRINK', NULL,                        6, 'HUBBLE', 1001),
  (7,  'Alcohol-Free Beer',    'DRINK', NULL,                        7, 'HUBBLE', 1001),

  -- Hubble: Beer (1002)
  (8,  'Beers',                'DRINK', NULL,                        1, 'HUBBLE', 1002),
  (9,  'Cider & Stelzer',      'DRINK', NULL,                        2, 'HUBBLE', 1002),

  -- Hubble: Spirits & Wine (1003)
  (10, 'Shots',                'DRINK', NULL,                        1, 'HUBBLE', 1003),
  (11, 'Wine',                 'DRINK', NULL,                        2, 'HUBBLE', 1003),
  (12, 'Cocktails',            'DRINK', NULL,                        3, 'HUBBLE', 1003),

  -- Hubble: Breakfast & Lunch (1004)
  (13, 'Yogurt & Breakfast',   'FOOD',  NULL,                        1, 'HUBBLE', 1004),
  (14, 'Panini',               'FOOD',  'Weekdays only',             2, 'HUBBLE', 1004),
  (15, 'Buns',                 'FOOD',  NULL,                        3, 'HUBBLE', 1004),
  (16, 'Lunch Dishes',         'FOOD',  'Weekdays, 12:00 to 19:30', 4, 'HUBBLE', 1004),
  (17, 'Salads',               'FOOD',  NULL,                        5, 'HUBBLE', 1004),

  -- Hubble: Snacks (1005)
  (18, 'Snacks',               'FOOD',  NULL,                        1, 'HUBBLE', 1005),
  (19, 'Sauces',               'FOOD',  NULL,                        2, 'HUBBLE', 1005),
  (20, 'Snacks to Share',      'FOOD',  NULL,                        3, 'HUBBLE', 1005),
  (21, 'Fries',                'FOOD',  NULL,                        4, 'HUBBLE', 1005),

  -- Hubble: Dinner (1006)
  (22, 'Dinner Dishes',        'FOOD',  'Weekdays, until 19:30',    1, 'HUBBLE', 1006),
  (23, 'Burger Add-ons',       'FOOD',  NULL,                        2, 'HUBBLE', 1006),

  -- Hubble: Weekend Menu (1007)
  (24, 'Weekend Menu',         'FOOD',  'Weekends only',             1, 'HUBBLE', 1007),

  -- Hubble: Dessert (1008)
  (25, 'Dessert',              'FOOD',  NULL,                        1, 'HUBBLE', 1008),

  -- Meteor: Alcohol Free (1009)
  (26, 'Iced Teas & Lemonades',    'DRINK', NULL,                                               1, 'METEOR', 1009),
  (27, 'Sodas',                    'DRINK', NULL,                                               2, 'METEOR', 1009),
  (28, 'Mocktails',                'DRINK', NULL,                                               3, 'METEOR', 1009),
  (29, 'Alcohol-Free Beer',        'DRINK', NULL,                                               4, 'METEOR', 1009),

  -- Meteor: Cocktails & More (1010)
  (30, 'Cocktails',                'DRINK', NULL,                                               1, 'METEOR', 1010),
  (31, 'Hard Iced Tea & Lemonade', 'DRINK', NULL,                                               2, 'METEOR', 1010),
  (32, 'Seltzer',                  'DRINK', NULL,                                               3, 'METEOR', 1010),
  (33, 'Shots',                    'DRINK', NULL,                                               4, 'METEOR', 1010),

  -- Meteor: Beer & Wine (1011)
  (34, 'Draft Beers',              'DRINK', NULL,                                               1, 'METEOR', 1011),
  (35, 'Bottled Beers',            'DRINK', NULL,                                               2, 'METEOR', 1011),
  (36, 'Wine',                     'DRINK', NULL,                                               3, 'METEOR', 1011),

  -- Meteor: Hot Drinks (1012)
  (37, 'Coffee',                   'DRINK', NULL,                                               1, 'METEOR', 1012),
  (38, 'Special Coffee',           'DRINK', NULL,                                               2, 'METEOR', 1012),
  (39, 'Tea',                      'DRINK', NULL,                                               3, 'METEOR', 1012),

  -- Meteor: Snacks (All Day) (1013)
  (40, 'Snacks',                   'FOOD',  'Snacks cannot be ordered between 19:30 and 20:00', 1, 'METEOR', 1013),
  (41, 'Snacks to Share',          'FOOD',  NULL,                                               2, 'METEOR', 1013),
  (42, 'Sweet',                    'FOOD',  NULL,                                               3, 'METEOR', 1013),

  -- Meteor: Food (Until 19:30) (1014)
  (43, 'Pasta',                    'FOOD',  'Until 19:30',                                     1, 'METEOR', 1014),
  (44, 'Rice Dishes',              'FOOD',  'Until 19:30',                                     2, 'METEOR', 1014),
  (45, 'Wraps',                    'FOOD',  'Until 19:30',                                     3, 'METEOR', 1014),
  (46, 'Flatbread',                'FOOD',  'Until 19:30',                                     4, 'METEOR', 1014),
  (47, 'Loaded',                   'FOOD',  'Until 19:30',                                     5, 'METEOR', 1014),
  (48, 'Schnitzel & Burgers',      'FOOD',  'Until 19:30',                                     6, 'METEOR', 1014);

-- ============================================================
-- ITEMS - HUBBLE
-- ============================================================

-- 1: Coffee
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (1, 'Coffee',          NULL, 3.35, 2.30, '', '', '', 1, 1),
  (1, 'Espresso',        NULL, 3.35, 2.30, '', '', '', 2, 1),
  (1, 'Cappuccino',      NULL, 3.65, 2.60, '', '', '', 3, 1),
  (1, 'Latte Macchiato', NULL, 3.65, 2.60, '', '', '', 4, 1);

-- 2: Special Coffees
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (2, 'Special Latte Macchiato',           'Vanilla Latte, Caramel Latte, Dirty Chai Latte or White Chocolate Latte',                          4.90, 3.60, '', '', '', 1, 1),
  (2, 'Iced Coffee',                       'Optional: Caramel, Vanilla, White Chocolate, Pumpkin Spice or Dirty Chai (+€1)',                   4.71, 4.12, '', '', '', 2, 1),
  (2, 'Special Coffee with Whipped Cream', 'Irish Coffee (Jameson), French Coffee (Grand Marnier), Italian Coffee (Sambuca), Spanish Coffee (Licor 43)', 6.64, 5.19, '', '', '', 3, 1);

-- 3: Coffee Extras
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (3, 'Extra Shot Espresso', NULL, 1.05, NULL, '', '', '', 1, 1),
  (3, 'Whipped Cream',       NULL, 0.50, NULL, '', '', '', 2, 1),
  (3, 'Decaf Coffee',        NULL, 0.30, NULL, '', '', '', 3, 1),
  (3, 'Soy Milk',            NULL, 0.40, NULL, '', '', '', 4, 1),
  (3, 'Oat Milk',            NULL, 0.40, NULL, '', '', '', 5, 1);

-- 4: Hot Drinks
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (4, 'Tea',                     NULL,                               3.35, 2.30, '', '', '', 1, 1),
  (4, 'Fresh Mint Tea',          NULL,                               3.45, 2.60, '', '', '', 2, 1),
  (4, 'Fresh Ginger Tea',        NULL,                               3.45, 2.60, '', '', '', 3, 1),
  (4, 'Fresh Mint & Ginger Tea', NULL,                               3.75, 2.91, '', '', '', 4, 1),
  (4, 'Hot Chocolate',           'Optional: Whipped Cream (+€0.50)', 3.45, 2.61, '', '', '', 5, 1);

-- 5: Cold Drinks
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (5, 'Soda',   'Coca Cola, Coca Cola Zero, Sprite, Fanta, Cassis, Chaudfontaine Blue/Red, Bitter Lemon, Ginger Ale, Tonic, Fuzetea Sparkling Black/Green, Chocomel, Orange/Apple/Cranberry juice, Milk', 3.29, 2.19, '', '', '', 1, 1),
  (5, 'Fristi', NULL, 3.49, 2.39, '', '', '', 2, 1);

-- 6: Mocktails
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (6, 'Crimson Breeze',     NULL, 6.58, 4.38, '', '', '', 1, 1),
  (6, 'Emerald Whisper',    NULL, 6.58, 4.38, '', '', '', 2, 1),
  (6, 'Shirley Temple',     NULL, 6.58, 4.38, '', '', '', 3, 1),
  (6, 'Summer''s Serenade', NULL, 6.58, 4.38, '', '', '', 4, 1),
  (6, 'Verdant Bliss',      NULL, 6.58, 4.38, '', '', '', 5, 1),
  (6, 'Seasonal Mocktail',  NULL, 6.58, 4.38, '', '', '', 6, 1);

-- 7: Alcohol-Free Beer
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (7, 'Bavaria 0.0% Radler',   NULL,    3.98, 2.59, '', '', '', 1, 1),
  (7, 'Bavaria 0.0% IPA',      'Draft', 3.98, 2.59, '', '', '', 2, 1),
  (7, 'La Trappe 0.0% Epos',   NULL,    5.62, 4.91, '', '', '', 3, 1),
  (7, 'La Trappe 0.0% Nillis', NULL,    5.62, 4.91, '', '', '', 4, 1);

-- 8: Beers
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (8, 'Bavaria',                    'Draft',                            3.29,  2.19,  '', '',            '', 1,  1),
  (8, 'Bavaria Eendje',             'Buy 10 beers, get the 11th free', 32.90, 21.90, '', '',            '', 2,  1),
  (8, 'La Trappe Witte Trappist',   'Draft',                            4.71,  4.13,  '', '',            '', 3,  1),
  (8, 'La Trappe Blond',            'Draft',                            5.24,  4.59,  '', '',            '', 4,  1),
  (8, 'Palm',                       NULL,                               5.34,  4.67,  '', '',            '', 5,  1),
  (8, 'Brewdog Punk IPA',           'Draft',                            6.18,  5.41,  '', '',            '', 6,  1),
  (8, 'La Chouffe Blond',           NULL,                               5.14,  4.49,  '', '',            '', 7,  1),
  (8, 'La Trappe Dubbel',           NULL,                               5.55,  4.89,  '', '',            '', 8,  1),
  (8, 'La Trappe Tripel',           NULL,                               5.87,  5.13,  '', '',            '', 9,  1),
  (8, 'La Trappe Quadrupel',        NULL,                               6.08,  5.32,  '', '',            '', 10, 1),
  (8, 'La Trappe Isid''or',         NULL,                               5.87,  5.13,  '', '',            '', 11, 1),
  (8, 'Guinness',                   'Draft',                            7.09,  6.21,  '', '',            '', 12, 1),
  (8, 'Tripel Karmeliet',           NULL,                               6.08,  5.32,  '', '',            '', 13, 1),
  (8, 'Le Fort Tripel',             'Draft',                            4.25,  3.72,  '', '',            '', 14, 1),
  (8, 'Desperados',                 NULL,                               5.55,  4.86,  '', '',            '', 15, 1),
  (8, 'Weihenstephaner Hefeweizen', '0.5L',                             7.93,  6.94,  '', '',            '', 16, 1),
  (8, 'Rodenbach Fruitage',         NULL,                               4.40,  3.85,  '', '',            '', 17, 1),
  (8, 'Bavaria Gluten-free',        NULL,                               5.55,  4.86,  '', 'gluten-free', '', 18, 1);

-- 9: Cider & Stelzer
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (9, 'Magners Apple Cider', NULL, 5.36, 4.68, '', '', '', 1, 1),
  (9, 'Magners Pear Cider',  NULL, 5.36, 4.68, '', '', '', 2, 1),
  (9, 'Stelz',               'Ice Tea Lemon, Ice Tea Peach, Ice Tea Mango, Mango, Passionfruit, Peach, Raspberry', 4.71, 4.12, '', '', '', 3, 1);

-- 10: Shots
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (10, 'Single Shot', 'Jack Daniels, Jack Daniels Honey, Jack Daniels Fire, Gin, Licor 43, Vodka, Jagermeister, Sambuca, Amaretto, Tequila, Bacardi, Seasonal Shots', 3.29, 2.89, '', '', '', 1, 1),
  (10, 'Quackje',     '10 + 1 free shot', 32.90, 28.90, '', '', '', 2, 1);

-- 11: Wine
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (11, 'Red Wine',         'Glass',      4.29,  3.76,  '', '', '', 1,  1),
  (11, 'Red Wine',         'Bottle',    21.04, 18.42,  '', '', '', 2,  1),
  (11, 'Rose Wine',        'Glass',      4.29,  3.76,  '', '', '', 3,  1),
  (11, 'Rose Wine',        'Bottle',    21.04, 18.42,  '', '', '', 4,  1),
  (11, 'Dry White Wine',   'Glass',      4.29,  3.76,  '', '', '', 5,  1),
  (11, 'Dry White Wine',   'Bottle',    21.04, 18.42,  '', '', '', 6,  1),
  (11, 'Sweet White Wine', 'Glass',      4.19,  3.66,  '', '', '', 7,  1),
  (11, 'Sweet White Wine', 'Bottle 1L', 29.33, 25.66,  '', '', '', 8,  1),
  (11, 'Tawny Port',       'Glass',      5.67,  4.97,  '', '', '', 9,  1),
  (11, 'Tawny Port',       'Bottle 1L', 27.78, 24.31,  '', '', '', 10, 1),
  (11, 'Prosecco',         'Bottle',    30.44, 26.64,  '', '', '', 11, 1);

-- 12: Cocktails
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (12, 'Little Duckling',   NULL, 9.87, 7.97, '', '', '', 1, 1),
  (12, 'Bacardi Cola',      NULL, 9.87, 7.97, '', '', '', 2, 1),
  (12, 'Gin & Tonic',       NULL, 9.87, 7.97, '', '', '', 3, 1),
  (12, 'Ginger Duckling',   NULL, 9.87, 7.97, '', '', '', 4, 1),
  (12, 'Seasonal Cocktail', NULL, 9.87, 7.97, '', '', '', 5, 1);

-- 13: Yogurt & Breakfast
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (13, 'Yoghurt with Granola & Honey',               NULL, 3.49, NULL, '', '', '', 1, 1),
  (13, 'Yoghurt with Granola, Walnuts & Honey',      NULL, 3.95, NULL, '', '', '', 2, 1),
  (13, 'Yoghurt with Fresh Fruits, Granola & Honey', NULL, 6.20, NULL, '', '', '', 3, 1);

-- 14: Panini (weekdays)
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (14, 'Panini Ham & Cheese',                                  NULL, 5.50, NULL, '', '', '', 1, 1),
  (14, 'Panini Sweet Chicken Teriyaki with Jalapeno',          NULL, 6.45, NULL, '', '', '', 2, 1),
  (14, 'Panini Goat Cheese with Fig Jam and Grilled Zucchini', NULL, 5.99, NULL, '', '', '', 3, 1);

-- 15: Buns
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (15, 'Vegan Bun',          'Italian Bun, Muhamara, Grilled Zucchini, Bell Pepper, Rucola & Pine Nuts',       6.29, NULL, '', 'vegan', '', 1, 1),
  (15, 'Bun Pulled Chicken', 'Soft Brioche Bun with Salad, Teriyaki Sauce & Crispy Onions',                   7.34, NULL, '', '',      '', 2, 1),
  (15, 'Bun Carpaccio',      'Italian Bun, Beef Carpaccio, Rucola, Pine Nuts, Parmesan Cheese & Truffle Sauce',9.44, NULL, '', '',      '', 3, 1),
  (15, 'Bun Healthy',        'Italian Bun, Cheese, Ham, Tomato, Cucumber, Lettuce, Egg & Curry Sauce',        6.18, NULL, '', '',      '', 4, 1);

-- 16: Lunch Dishes (weekdays)
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (16, 'Croque Madam',               '2 Slices of Bread, Butter, Ham, Cheese, Fried Egg & Ketchup',                                   7.34,  NULL, '', '', '', 1, 1),
  (16, '12-uurtje Dutch Lunch',      'Fried Egg, Croquette, Mustard, Butter, Bread, Ham, Cheese, Salad & Tomato Soup. Meat or vega.',  9.45,  NULL, '', '', '', 2, 1),
  (16, 'Uitsmijter Ham & Cheese',    'Fried Eggs, Ham, Cheese, Bread Slices, Butter & Salad',                                         11.01, NULL, '', '', '', 3, 1),
  (16, 'Uitsmijter Bacon & Mushrooms','Fried Eggs, Bacon, Mushrooms, Bread Slices, Butter & Salad',                                   11.54, NULL, '', '', '', 4, 1);

-- 17: Salads
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (17, 'Carpaccio Salad',   'Beef Carpaccio, Salad, Sun-dried Tomatoes, Parmesan Cheese & Truffle Dressing',  9.75, NULL, '', '', '', 1, 1),
  (17, 'Caesar Salad',      'Fried Chicken Strips, Salad, Egg, Croutons & Homemade Dressing',                 9.75, NULL, '', '', '', 2, 1),
  (17, 'Couscous Salad',    'Pumpkin, Raisins, Chickpeas, Feta Cheese, Cucumber, Tomato, Salad & Curry Sauce',9.75, NULL, '', '', '', 3, 1),
  (17, 'Soup of the Moment','With Bread and Herbal Butter',                                                   6.04, NULL, '', '', '', 4, 1);

-- 18: Snacks
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (18, 'Borrelnootjes',             NULL,                                                                              2.93, NULL, '', '', '', 1, 1),
  (18, 'Bag of Chips',              NULL,                                                                              1.37, NULL, '', '', '', 2, 1),
  (18, 'Cheese Cubes with Mustard', NULL,                                                                              5.24, NULL, '', '', '', 3, 1),
  (18, 'Olives & White Cheese',     NULL,                                                                              5.24, NULL, '', '', '', 4, 1),
  (18, 'Frikandel',                 NULL,                                                                              2.89, NULL, '', '', '', 5, 1),
  (18, 'Cheese Souffle',            NULL,                                                                              2.89, NULL, '', '', '', 6, 1),
  (18, 'Kroket',                    'Vegan option available',                                                          3.14, NULL, '', '', '', 7, 1),
  (18, 'Snack Attack',              'Plate of Fries with one Snack: Frikandel, Kroket, Cheese Souffle or Veggie Kroket',5.50, NULL, '', '', '', 8, 1);

-- 19: Sauces
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (19, 'Sauce Simple', 'Fries sauce, Ketchup, Curry Gewurz, Mustard, Chili, Garlic, BBQ, Sriracha. Vegan Mayo +€0.25', 0.50, NULL, '', '', '', 1, 1),
  (19, 'Sauce Deluxe', 'Truffle Mayo, Satay Sauce, Speciaal, Oorlog (+€0.25)',                                         1.00, NULL, '', '', '', 2, 1);

-- 20: Snacks to Share
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (20, 'Bitterballen / Mini Frikandellen / Falafel / Onion Rings',    '8pc €5.72 | 16pc €11.24 | 32pc €25.20 | 48pc €32.52 | 96pc €61.44', 5.72,  NULL, '8 pcs,16 pcs,32 pcs,48 pcs,96 pcs', '',      '', 1, 1),
  (20, 'Bittergarnituur / Cheese Souffles / Spring Rolls / Calamari', '8pc €6.50 | 16pc €12.80 | 32pc €25.20 | 48pc €37.20 | 96pc €70.80', 6.50,  NULL, '8 pcs,16 pcs,32 pcs,48 pcs,96 pcs', '',      '', 2, 1),
  (20, 'Vegan Bitterballen / Vegan Vlammetjes / Mozzarella Sticks',   '8pc €10.39 | 16pc €20.58 | 32pc €40.76 | 48pc €60.54',              10.39, NULL, '8 pcs,16 pcs,32 pcs,48 pcs',         'vegan', '', 3, 1);

-- 21: Fries
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (21, 'Fries (Small)',  NULL, 2.78, NULL, '', '', '', 1, 1),
  (21, 'Fries (Medium)', NULL, 5.62, NULL, '', '', '', 2, 1),
  (21, 'Fries (Large)',  NULL, 8.45, NULL, '', '', '', 3, 1);

-- 22: Dinner Dishes (weekdays)
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (22, 'Daily Dinner Dish',              'Meat or vega. With TU/e discount: €7.19',                                                                   9.49,  NULL, '', '',      '', 1,  1),
  (22, '100% Beef Burger',               'Medium Rare Beef Burger, Lettuce, Onion, Tomato, BBQ Sauce and Pickles',                                     8.14,  NULL, '', '',      '', 2,  1),
  (22, 'Cheesy Burger',                  'Medium Rare Beef Patty, Lettuce, Tomato, Pickle, Onion, Melted Cheese',                                      8.49,  NULL, '', '',      '', 3,  1),
  (22, 'Kimchi Burger',                  'Mushroom Burger Patty or Falafel Burger, Lettuce, Kimchi and Kimchi Sauce',                                  9.50,  NULL, '', '',      '', 4,  1),
  (22, 'Crispy Chicken Truffle Burger',  'Fried Chicken or Falafel Burger, Parmesan Cheese, Truffle Sauce, Sun-dried Tomatoes and Rucola',             10.76, NULL, '', '',      '', 5,  1),
  (22, 'Truffle Fries',                  'Fries, Parmesan Cheese, Sun-dried Tomatoes, Pine Nuts, Rucola & Truffle Sauce',                              8.99,  NULL, '', '',      '', 6,  1),
  (22, 'Legendary Fries',               'Fries or Rice, Chicken Skewers, Satay Sauce, Crispy Onions, Prawn Crackers, Atjar & Fries Sauce. XL: €12.59',9.44,  NULL, '', '',      '', 7,  1),
  (22, 'Peter''s Schnitzel',            'Pork Schnitzel (200g), Fries, Lemon, Salad & Sauce of Choice',                                              12.99, NULL, '', '',      '', 8,  1),
  (22, 'Kapsalon XXL',                   'Chicken Thigh, Fries, Cheese, Lettuce, Tomato, Cucumber, Pickle, Onion & Spicy Garlic Sauce',               11.01, NULL, '', '',      '', 9,  1),
  (22, 'Kapsalon XXL Vegan',             'Sweet Potato, Seleriac, Fries, Vegan Cheese, Lettuce, Tomato, Cucumber, Pickle, Onion & Spicy Garlic Sauce',11.01, NULL, '', 'vegan', '', 10, 1);

-- 23: Burger Add-ons
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (23, 'Burger Extras: Fries & Sauce', NULL, 3.14, NULL, '', '', '', 1, 1),
  (23, 'Burger Extras: Bacon',         NULL, 1.05, NULL, '', '', '', 2, 1),
  (23, 'Burger Extras: Cheese',        NULL, 1.05, NULL, '', '', '', 3, 1);

-- 24: Weekend Menu
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (24, 'Panini Ham & Cheese',                                  NULL, 5.50, NULL, '', '', '', 1, 1),
  (24, 'Panini Chicken Teriyaki with Jalapeno',                NULL, 6.45, NULL, '', '', '', 2, 1),
  (24, 'Panini Goat Cheese with Fig Jam and Grilled Zucchini', NULL, 5.99, NULL, '', '', '', 3, 1);

-- 25: Dessert
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (25, 'Apple Pie',         'Optional: Whipped Cream (+€0.50)', 3.41, NULL, '', '', '', 1, 1),
  (25, 'Special Pie',       'Optional: Whipped Cream (+€0.50)', 4.20, NULL, '', '', '', 2, 1),
  (25, 'Ice Cream Royale',  'Magnum',                           3.14, NULL, '', '', '', 3, 1),
  (25, 'Ice Cream Cornets', NULL,                               2.88, NULL, '', '', '', 4, 1),
  (25, 'Rocket',            NULL,                               1.26, NULL, '', '', '', 5, 1);

-- ============================================================
-- ITEMS - METEOR
-- ============================================================

-- 26: Iced Teas & Lemonades
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (26, 'Iced Tea Deluxe', 'Mango, Apple, Forest Fruit, Lime Mint',   3.29, 2.19, '', '', '', 1, 1),
  (26, 'Lemonade',        'Mango, Strawberry, Mint, Raspberry Lime', 3.29, 2.19, '', '', '', 2, 1);

-- 27: Sodas
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (27, 'Soda',                    NULL,                                                             3.29, 2.19, '', '', '', 1, 1),
  (27, 'Chocomel',                NULL,                                                             3.29, 2.19, '', '', '', 2, 1),
  (27, 'Juice',                   'Orange, Apple, Sparkling Apple, Cranberry, Sparkling Cranberry', 3.29, 2.19, '', '', '', 3, 1),
  (27, 'Orange Mango Juice',      NULL,                                                             4.29, 3.76, '', '', '', 4, 1),
  (27, 'Orange Strawberry Juice', NULL,                                                             4.29, 3.76, '', '', '', 5, 1);

-- 28: Mocktails
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (28, 'Mojito Mocktail',             'Original, Mango, Strawberry, Passionfruit', 6.67, 5.83, '', '', '', 1, 1),
  (28, 'Berry Beach',                 'Cranberry, strawberry, lime, sugar syrup',  6.67, 5.83, '', '', '', 2, 1),
  (28, 'Strawberry Daiquiri Mocktail',NULL,                                         6.67, 5.83, '', '', '', 3, 1),
  (28, 'Paloma',                      NULL,                                         6.67, 5.83, '', '', '', 4, 1),
  (28, 'Spiced Mule Mocktail',        NULL,                                         6.67, 5.83, '', '', '', 5, 1),
  (28, 'Mimosa Virgin',               NULL,                                         6.67, 5.83, '', '', '', 6, 1);

-- 29: Alcohol-Free Beer
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (29, 'Bavaria 0%',          'Draft', 3.69, 2.59, '', '', '', 1, 1),
  (29, 'Bavaria Radler 0.0%', NULL,    3.98, 2.65, '', '', '', 2, 1),
  (29, 'Corona Cero',         NULL,    4.57, 4.00, '', '', '', 3, 1),
  (29, 'Fruity Rose 0.0%',    NULL,    5.62, 4.91, '', '', '', 4, 1);

-- 30: Cocktails
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (30, 'Apple Business',      'Gin, apple juice, lime, sugar syrup',           7.67, 6.71, '', '', '', 1,  1),
  (30, 'Apple Gin Fizz',      'Gin, apple juice, soda, lime, sugar syrup',     7.67, 6.71, '', '', '', 2,  1),
  (30, 'Berry Breeze',        'Gin, soda, raspberry, strawberry, lime',        7.67, 6.71, '', '', '', 3,  1),
  (30, 'Cosmopolitan',        'Vodka, triple sec, lime, cranberry',            7.67, 6.71, '', '', '', 4,  1),
  (30, 'Fizzy Peach Tree',    'Peach liqueur, soda, lime',                     7.67, 6.71, '', '', '', 5,  1),
  (30, 'Limoncello Spritz',   'Original or Strawberry',                        7.67, 6.71, '', '', '', 6,  1),
  (30, 'Martini',             'Espresso, Pornstar or Peach Tree',              7.67, 6.71, '', '', '', 7,  1),
  (30, 'Mimosa',              'Prosecco, limoncello, orange juice',            7.67, 6.71, '', '', '', 8,  1),
  (30, 'Mojito',              'Original, Mango or Strawberry',                7.67, 6.71, '', '', '', 9,  1),
  (30, 'Rum Apple Sour',      'Rum, triple sec, apple, lime, sugar syrup',    7.67, 6.71, '', '', '', 10, 1),
  (30, 'Sex on the Beach',    'Vodka, peach liqueur, cranberry, orange',       7.67, 6.71, '', '', '', 11, 1),
  (30, 'Spiced Mule',         'Rum, soda, apple, lime, sugar syrup',           7.67, 6.71, '', '', '', 12, 1),
  (30, 'Strawberry Daiquiri', 'Rum, strawberry, lime, sugar syrup',            7.67, 6.71, '', '', '', 13, 1),
  (30, 'Woo Woo',             'Vodka, peach liqueur, cranberry',               7.67, 6.71, '', '', '', 14, 1),
  (30, 'Seasonal Cocktail',   NULL,                                            7.67, 6.71, '', '', '', 15, 1);

-- 31: Hard Iced Tea & Lemonade
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (31, 'Hard Iced Tea',  'Mango, Forest Fruit, Mint, Apple',           4.71, 4.12, '', '', '', 1, 1),
  (31, 'Hard Lemonade',  'Mango, Strawberry, Lime Mint, Raspberry Lime',4.71, 4.12, '', '', '', 2, 1);

-- 32: Seltzer
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (32, 'Homemade Seltzer', 'Mango, Strawberry, Lime, Raspberry', 7.00, 6.13, '', '', '', 1, 1),
  (32, 'Sync Seltzer',     'Peach Iced Tea, Green Iced Tea',      4.71, 4.12, '', '', '', 2, 1);

-- 33: Shots
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (33, 'Shot',     'Sambuca, Rum, Koekie, Sourz Red, Tequila, Licor 43', 3.29,  2.89,  '', '', '', 1, 1),
  (33, 'Egbertje', 'Buy 10 shots and get the 11th for free (11 shots)', 32.90, 28.90, '', '', '', 2, 1);

-- 34: Draft Beers
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (34, 'Bavaria Pils',                  '0.25L. Pitcher: €19.74/€13.14',                    3.29,  2.19,  '', '',            '', 1, 1),
  (34, 'Bavaria Pils 0.5L',             NULL,                                                6.58,  4.38,  '', '',            '', 2, 1),
  (34, 'Bavaria Beertje',               'Buy 10 beers and get the 11th for free (11 beers)',32.90, 21.90, '', '',            '', 3, 1),
  (34, 'Magners Cider',                 '0.25L',                                             4.03,  3.53,  '', '',            '', 4, 1),
  (34, 'Magners Cider 0.5L',            NULL,                                                8.06,  7.06,  '', '',            '', 5, 1),
  (34, 'La Chouffe Blond',              NULL,                                                6.11,  5.40,  '', '',            '', 6, 1),
  (34, 'Max Kriek',                     NULL,                                                5.68,  5.18,  '', '',            '', 7, 1),
  (34, 'La Trappe Witte Trappist',      '0.33L. Pitcher: €23.57/€22.62',                   4.71,  4.13,  '', '',            '', 8, 1),
  (34, 'La Trappe Witte Trappist 0.5L', NULL,                                                7.85,  6.88,  '', '',            '', 9, 1);

-- 35: Bottled Beers
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (35, 'Corona',               NULL, 5.60, 4.95, '', '',            '', 1, 1),
  (35, 'Desperados',           NULL, 6.07, 5.37, '', '',            '', 2, 1),
  (35, 'Westmalle Dubbel',     NULL, 6.38, 5.65, '', '',            '', 3, 1),
  (35, 'Tripel Karmeliet',     NULL, 6.59, 5.83, '', '',            '', 4, 1),
  (35, 'St. Bernardus Abt 12', NULL, 6.17, 5.46, '', '',            '', 5, 1),
  (35, 'Bavaria Gluten Free',  NULL, 5.55, 4.86, '', 'gluten-free', '', 6, 1);

-- 36: Wine
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (36, 'Wine (glass)',  'Sweet White, Dry White, Rose or Red', 4.19,  3.66,  '', '', '', 1, 1),
  (36, 'Prosecco',      'Glass',                              4.29,  3.76,  '', '', '', 2, 1),
  (36, 'Wine (bottle)', 'Sweet White, Dry White, Rose or Red',21.04, 18.42, '', '', '', 3, 1);

-- 37: Coffee
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (37, 'Lungo',               'Large: €4.35/€3.30',                                        3.35, 2.30, '', '', '', 1, 1),
  (37, 'Espresso',            NULL,                                                         3.35, 2.30, '', '', '', 2, 1),
  (37, 'Cappuccino',          NULL,                                                         3.65, 2.60, '', '', '', 3, 1),
  (37, 'Latte Macchiato',     'Optional flavour: Vanilla, Caramel or Dirty Chai (+€1.25)', 3.65, 2.60, '', '', '', 4, 1),
  (37, 'Matcha or Chai Latte','Optional shot: Mango, Strawberry or Raspberry (+€0.50)',    4.49, 3.60, '', '', '', 5, 1),
  (37, 'Hot Chocolate',       'Optional: Whipped Cream (+€0.50)',                          3.45, 2.61, '', '', '', 6, 1);

-- 38: Special Coffee
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (38, 'Hot Chocolate Tia Maria', NULL,           6.74, 5.50, '', '', '', 1, 1),
  (38, 'Hot Chocolate Rum',       NULL,           6.74, 5.50, '', '', '', 2, 1),
  (38, 'Irish Coffee',            'With whiskey', 6.64, 5.19, '', '', '', 3, 1),
  (38, 'Coffee Corretto',         'With Sambuca', 6.64, 5.19, '', '', '', 4, 1),
  (38, 'Spanish Coffee',          'With Licor 43',6.64, 5.19, '', '', '', 5, 1);

-- 39: Tea
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (39, 'Homemade Ginger & Mint Tea', NULL, 3.75, 2.91, '', '', '', 1, 1),
  (39, 'Homemade Ginger Tea',        NULL, 3.45, 2.61, '', '', '', 2, 1),
  (39, 'Homemade Mint Tea',          NULL, 3.45, 2.61, '', '', '', 3, 1),
  (39, 'Tea',                        NULL, 3.35, 2.30, '', '', '', 4, 1);

-- 40: Snacks (Meteor)
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (40, 'Borrelnootjes',               NULL,                                                                      2.93, NULL, '', '', '', 1, 1),
  (40, 'Frikandel or Cheese Souffle', NULL,                                                                      2.89, NULL, '', '', '', 2, 1),
  (40, '(Veggie) Kroket',             'Vegan option available',                                                  3.14, NULL, '', '', '', 3, 1),
  (40, 'Snack Attack',                'Fries with choice of: Frikandel, Kroket, Veggie Kroket, Cheese Souffle', 5.25, NULL, '', '', '', 4, 1),
  (40, 'Fries (Small)',               NULL,                                                                      2.78, NULL, '', '', '', 5, 1),
  (40, 'Fries (Medium)',              NULL,                                                                      5.62, NULL, '', '', '', 6, 1),
  (40, 'Fries (Large)',               NULL,                                                                      8.45, NULL, '', '', '', 7, 1),
  (40, 'Sauce (Simple)',              'Fries sauce, Ketchup, Curry, Mustard, Chili, Garlic, Sriracha. Vegan Mayo +€0.25', 0.50, NULL, '', '', '', 8, 1),
  (40, 'Sauce (Deluxe)',              'Truffle Mayo, Speciaal',                                                  1.00, NULL, '', '', '', 9, 1);

-- 41: Snacks to Share (Meteor)
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (41, 'Bitterballen / Mini Frikandellen / Crunchy Cauliflower Bites',       '8pc €5.72 | 16pc €11.24 | 32pc €22.08 | 48pc €32.52 | 96pc €61.44',                     5.72,  NULL, '8 pcs,16 pcs,32 pcs,48 pcs,96 pcs',      '',           '', 1, 1),
  (41, 'Bittergarnituur / Cheese Souffles / Spring Rolls / Calamari / Gyoza','4pc gyoza €3.25 | 8pc €6.50 | 16pc €12.89 | 32pc €25.20 | 48pc €37.20 | 96pc €70.80', 6.50,  NULL, '4 pcs,8 pcs,16 pcs,32 pcs,48 pcs,96 pcs', '',           '', 2, 1),
  (41, 'Vegetarian Bitterballen',                                              '8pc €10.39 | 16pc €20.58 | 32pc €40.76 | 48pc €60.54',                                  10.39, NULL, '8 pcs,16 pcs,32 pcs,48 pcs',             'vegetarian', '', 3, 1);

-- 42: Sweet
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (42, 'Apple Pie',             NULL, 3.41, NULL, '', '', '', 1, 1),
  (42, 'Chocolate Chip Cookie', NULL, 2.50, NULL, '', '', '', 2, 1),
  (42, 'Brownie',               NULL, 2.50, NULL, '', '', '', 3, 1);

-- 43: Pasta
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (43, 'Pasta Bolognese', 'Linguine, bolognese sauce, parmesan, arugula',        6.99, NULL, '', '',  '', 1, 1),
  (43, 'Pasta Carbonara', 'Linguine, creamy carbonara sauce, parmesan, arugula', 7.99, NULL, '', '',  '', 2, 1);

-- 44: Rice Dishes
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (44, 'Yellow Curry Vegetarian', 'Rice, vegetable curry sauce, cauliflower, chickpeas, tofu',                             6.99, NULL, '', 'vegetarian', '', 1, 1),
  (44, 'Chicken Tikka Masala',    'Rice, tikka masala sauce, coconut milk, bell pepper, chickpeas, chicken, naan bread',   8.99, NULL, '', '',           '', 2, 1),
  (44, 'Vega Tikka Masala',       'Rice, tikka masala sauce, coconut milk, bell pepper, chickpeas, tofu, naan bread',      8.99, NULL, '', 'vegan',      '', 3, 1);

-- 45: Wraps
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (45, 'Kebab Wrap Deluxe',        'Tortilla, kebab, white cabbage, ras el hanout mayo, muhammara, cream spread', 7.49, NULL, '', '',      '', 1, 1),
  (45, 'Crispy Chicken Wrap',      'Tortilla, crispy chicken, cream spread, salad, cheese, spicy cocktail sauce', 6.49, NULL, '', '',      '', 2, 1),
  (45, 'Vega Crispy Chicken Wrap', 'Tortilla, vegan chicken, cream spread, salad, cheese, spicy cocktail sauce',  6.49, NULL, '', 'vegan', '', 3, 1);

-- 46: Flatbread
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (46, 'Crispy Chicken Flatbread',      'Flatbread, crispy chicken, muhammara, tzatziki, cucumber, tomato, fries', 8.99, NULL, '', '',      '', 1, 1),
  (46, 'Vega Crispy Chicken Flatbread', 'Flatbread, vegan chicken, muhammara, tzatziki, cucumber, tomato, fries',  8.99, NULL, '', 'vegan', '', 2, 1);

-- 47: Loaded
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (47, 'Loaded Nachos',                       'Nachos, jalapeno, corn, onion, cheese. Optional sauces: Guacamole, Sour cream or Tomato salsa (+€2.00 each)', 6.00, NULL, '', '', '', 1, 1),
  (47, 'Loaded Fries Bolognese',              'Fries, bolognese sauce, cheese',                                                                               7.49, NULL, '', '', '', 2, 1),
  (47, 'Loaded Fries Truffle Pulled Chicken', 'Fries, pulled chicken, truffle mayo, parmesan, spring onion',                                                  8.49, NULL, '', '', '', 3, 1),
  (47, 'Loaded Fries Kebab',                  'Fries, kebab, garlic sauce, spring onion, fried onions',                                                       9.99, NULL, '', '', '', 4, 1);

-- 48: Schnitzel & Burgers
INSERT INTO menu_item (category_id, name, description, regular_price, student_price, size_options, dietary_tags, allergens, sort_order, active) VALUES
  (48, 'Schnitzel with Stroganoff Sauce',   'Chicken schnitzel, stroganoff sauce, salad, fries',                                                        10.49, NULL, '', '',      '', 1, 1),
  (48, 'Mexican Style Chicken Burger',      'Soft potato bun, crispy chicken, guacamole, crispy onion rings, cheddar, pickles, tomato, fries',          10.19, NULL, '', '',      '', 2, 1),
  (48, 'Vega Mexican Style Chicken Burger', 'Soft potato bun, vegan chicken, guacamole, crispy onion rings, cheddar, pickles, tomato, fries',           10.19, NULL, '', 'vegan', '', 3, 1);

-- ============================================================
-- DAILY DISH sample (replace date each day or manage via admin)
-- ============================================================

INSERT INTO daily_dish (date, name, description, price) VALUES
  ('2026-06-18', 'Pasta Arrabiata', 'Penne with spicy tomato sauce, garlic and fresh basil. Served with bread.', 9.49);

-- Reset AUTO_INCREMENT so admin-created records don't collide with seed IDs.
ALTER TABLE menu_category AUTO_INCREMENT = 2000;
ALTER TABLE menu_item AUTO_INCREMENT = 1000;
ALTER TABLE daily_dish AUTO_INCREMENT = 100;
