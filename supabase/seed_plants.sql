-- Garden Coach plant catalog seed.
-- 40 common edibles for North American home gardeners.
--
-- ---------------------------------------------------------------------
-- Sources
-- ---------------------------------------------------------------------
-- - Old Farmer's Almanac plant pages (almanac.com/plant/*) for days-to-
--   maturity ranges, sun, spacing, and frost timing.
-- - University of Minnesota Extension and Cornell Cooperative Extension
--   guides for cool-season hardiness and direct-sow windows.
-- - Louise Riotte, "Carrots Love Tomatoes" (1975), for the bulk of the
--   companion / antagonist lore. The science behind companion planting
--   is mixed; we follow widely-cited traditional pairings, especially
--   the Three Sisters (corn / beans / squash), tomato + basil, alliums
--   versus legumes, and aromatic herbs around brassicas.
--
-- ---------------------------------------------------------------------
-- Conventions
-- ---------------------------------------------------------------------
-- - common_name uses Title Case so companion arrays can reference rows
--   exactly. Some companion strings (Marigold, Corn, Sage, Strawberry,
--   Fennel) point to plants that are NOT in this catalog yet — that's
--   intentional. They're canonical companions and the coach can speak
--   to them as advice even without catalog rows.
-- - hardiness_zones for annuals is the full set of zones where the
--   plant can complete its lifecycle within a normal North American
--   growing season. For perennial herbs it's the actual overwintering
--   range; in colder zones they're grown as annuals.
-- - Notes are dollar-quoted ($$...$$) so apostrophes don't need
--   escaping.
--
-- ---------------------------------------------------------------------
-- Known approximations
-- ---------------------------------------------------------------------
-- - "Sweet Pepper" and "Hot Pepper" both use Capsicum annuum even
--   though some hot varieties (habanero, ghost) are C. chinense.
-- - Pumpkin's scientific name is given as Cucurbita pepo, which
--   covers field/jack-o'-lantern types; giant cultivars are C. maxima.
-- - Mint is listed as Mentha spicata (spearmint) as the default; the
--   genus Mentha has many species in cultivation.
-- - Perennial herbs (rosemary, mint) have NULL days_to_maturity since
--   the seed-packet number isn't meaningful past year one.
--
-- ---------------------------------------------------------------------
-- Idempotency
-- ---------------------------------------------------------------------
-- This file does plain INSERTs. Running it twice creates duplicate
-- rows. It's wired into supabase/seed.sql so `supabase db reset` runs
-- it against an empty table. To re-seed an existing local DB without
-- a full reset:
--   delete from public.plantings;   -- only when no real user data!
--   truncate table public.plants restart identity cascade;
--   \i supabase/seed_plants.sql
-- ---------------------------------------------------------------------


-- =====================================================================
-- LEAFY GREENS (8)
-- =====================================================================

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Lettuce', 'Lactuca sativa', 'leafy_green',
  45, 65,
  4, 10,
  array['Carrot','Radish','Cucumber','Onion','Strawberry'],
  array[]::text[],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b','11a','11b'],
  4, -2,
  $$Cool-season crop that bolts in summer heat. Succession-sow every 2 weeks for a continuous harvest.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Kale', 'Brassica oleracea', 'leafy_green',
  50, 70,
  6, 18,
  array['Beet','Onion','Garlic','Dill','Mint','Rosemary'],
  array['Bush Bean','Pole Bean','Tomato','Strawberry'],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b'],
  6, -4,
  $$Cold-tolerant and actually sweetens after a light frost. Pick outer leaves and let the center keep growing.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Spinach', 'Spinacia oleracea', 'leafy_green',
  40, 50,
  4, 6,
  array['Lettuce','Strawberry','Cabbage','Pea'],
  array[]::text[],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b'],
  null, -4,
  $$Cool-season; bolts when day length passes 14 hours. Plant in early spring and again in late summer for a fall crop.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Swiss Chard', 'Beta vulgaris', 'leafy_green',
  50, 60,
  5, 9,
  array['Bush Bean','Cabbage','Onion'],
  array[]::text[],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b'],
  4, -2,
  $$More heat-tolerant than lettuce or spinach. Cut outer stalks at the base and the plant keeps producing for months.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Arugula', 'Eruca vesicaria', 'leafy_green',
  30, 40,
  4, 6,
  array['Lettuce','Spinach','Cucumber'],
  array[]::text[],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b','11a','11b'],
  null, -2,
  $$Peppery flavor gets sharper in heat. Quick to bolt — succession-sow every 2 weeks while temps stay below 75°F.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Bok Choy', 'Brassica rapa', 'leafy_green',
  45, 60,
  4, 8,
  array['Beet','Carrot','Onion'],
  array['Bush Bean','Pole Bean','Tomato'],
  array['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b'],
  4, -2,
  $$Bolts fast in summer heat. Best grown as a spring or fall crop with consistent moisture.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Mustard Greens', 'Brassica juncea', 'leafy_green',
  30, 45,
  4, 6,
  array['Lettuce','Spinach'],
  array['Bush Bean','Pole Bean'],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b'],
  null, -2,
  $$Sharp and spicy when grown warm, mellower when cool. Pick young leaves repeatedly for the best flavor.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Collard Greens', 'Brassica oleracea', 'leafy_green',
  55, 75,
  6, 18,
  array['Onion','Garlic','Dill','Mint','Thyme'],
  array['Bush Bean','Pole Bean','Tomato','Strawberry'],
  array['6a','6b','7a','7b','8a','8b','9a','9b','10a','10b','11a','11b'],
  6, -2,
  $$Tougher and more heat-tolerant than kale. Flavor improves after a frost; staple in Southern winter gardens.$$
);


-- =====================================================================
-- FRUITING (8)
-- =====================================================================

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Tomato', 'Solanum lycopersicum', 'fruiting',
  60, 85,
  8, 24,
  array['Basil','Parsley','Carrot','Onion','Marigold'],
  array['Cabbage','Broccoli','Kale','Bok Choy','Collard Greens','Mustard Greens','Fennel'],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b','11a','11b'],
  6, null,
  $$Heavy feeder and warm-loving. Set transplants out about 2 weeks after the last frost, once soil reaches 60°F.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Sweet Pepper', 'Capsicum annuum', 'fruiting',
  60, 90,
  8, 18,
  array['Basil','Tomato','Carrot','Onion'],
  array['Bush Bean','Pole Bean'],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b','11a','11b'],
  8, null,
  $$Slow starter — start seeds early. Wait until nighttime temps stay above 55°F before transplanting outside.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Hot Pepper', 'Capsicum annuum', 'fruiting',
  70, 100,
  8, 18,
  array['Basil','Tomato','Onion'],
  array['Bush Bean','Pole Bean'],
  array['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b','11a','11b'],
  8, null,
  $$Heat in the fruit intensifies with sun, heat, and mild water stress. Habaneros and ghost peppers are actually C. chinense and need an even longer season.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Eggplant', 'Solanum melongena', 'fruiting',
  70, 90,
  8, 24,
  array['Bush Bean','Basil','Sweet Pepper'],
  array[]::text[],
  array['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b','11a','11b'],
  8, null,
  $$Loves heat. Wait until soil is consistently above 60°F before transplanting; cold checks growth for weeks.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Cucumber', 'Cucumis sativus', 'fruiting',
  50, 70,
  6, 12,
  array['Bush Bean','Pole Bean','Dill','Radish','Sunflower'],
  array['Sage'],
  array['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b','11a','11b'],
  3, 2,
  $$Tender and frost-sensitive. Direct sow once soil hits 70°F; trellising saves space and keeps fruit clean.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Summer Squash', 'Cucurbita pepo', 'fruiting',
  45, 60,
  6, 24,
  array['Pole Bean','Bush Bean','Dill','Corn'],
  array[]::text[],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b','11a','11b'],
  3, 1,
  $$One healthy plant out-produces a small family. Pick young (6–8") for the best flavor and to keep the plant cranking.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Winter Squash', 'Cucurbita moschata', 'fruiting',
  85, 110,
  6, 36,
  array['Pole Bean','Bush Bean','Corn'],
  array[]::text[],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b'],
  3, 1,
  $$Long-season sprawler. Cure mature fruit in a warm, dry spot for 10 days post-harvest before storing.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Tomatillo', 'Physalis philadelphica', 'fruiting',
  75, 100,
  8, 24,
  array['Tomato','Basil','Carrot'],
  array['Cabbage','Broccoli'],
  array['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b','11a','11b'],
  6, null,
  $$Plant at least two — they're not self-fertile. Fruit is ripe when the papery husk splits or fills out and turns pale.$$
);


-- =====================================================================
-- ROOT (5)
-- =====================================================================

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Carrot', 'Daucus carota', 'root',
  60, 80,
  6, 3,
  array['Tomato','Onion','Lettuce','Leek','Rosemary','Sage'],
  array['Dill','Parsnip'],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b'],
  null, -3,
  $$Direct sow in deep, stone-free soil — carrots fork when they hit obstructions. Don't try to transplant.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Beet', 'Beta vulgaris', 'root',
  50, 70,
  6, 4,
  array['Lettuce','Onion','Cabbage','Kohlrabi'],
  array['Pole Bean'],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b'],
  null, -2,
  $$Each "seed" is actually a cluster — thin to one strongest seedling per spot. The greens are delicious too.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Radish', 'Raphanus sativus', 'root',
  25, 35,
  6, 2,
  array['Lettuce','Cucumber','Carrot','Onion','Spinach','Pea'],
  array[]::text[],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b'],
  null, -4,
  $$The fastest crop in the garden — sometimes 25 days from seed. Interplant with carrots to mark slow-germinating rows.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Turnip', 'Brassica rapa', 'root',
  35, 60,
  6, 4,
  array['Onion','Snap Pea','Lettuce'],
  array['Carrot','Mustard Greens'],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b'],
  null, -4,
  $$Both roots and greens are edible. Best when grown cool and pulled small (1.5–2" across) for tender, sweet flavor.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Parsnip', 'Pastinaca sativa', 'root',
  100, 130,
  6, 4,
  array['Onion','Garlic','Bush Bean'],
  array['Carrot'],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b'],
  null, -2,
  $$Slow to germinate (2–3 weeks) and slow to mature. Flavor sweetens dramatically after a hard frost.$$
);


-- =====================================================================
-- HERB (8)
-- =====================================================================

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Basil', 'Ocimum basilicum', 'herb',
  60, 75,
  6, 12,
  array['Tomato','Sweet Pepper','Hot Pepper','Oregano'],
  array['Cucumber'],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b','11a','11b'],
  6, 2,
  $$Pinch off flower buds the moment they appear to keep leaf production going. Hates cold — wait for warm soil.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Parsley', 'Petroselinum crispum', 'herb',
  70, 90,
  4, 8,
  array['Tomato','Carrot','Asparagus','Chive'],
  array[]::text[],
  array['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b'],
  10, -2,
  $$Biennial grown as an annual. Soak seeds overnight before sowing — they're notoriously slow to germinate.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Cilantro', 'Coriandrum sativum', 'herb',
  45, 60,
  5, 4,
  array['Tomato','Sweet Pepper','Hot Pepper','Bush Bean'],
  array['Fennel'],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b','11a','11b'],
  null, -2,
  $$Bolts to seed (coriander) in heat. Direct sow only — the taproot doesn't transplant well; succession-sow every 2–3 weeks.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Dill', 'Anethum graveolens', 'herb',
  40, 55,
  6, 8,
  array['Cucumber','Cabbage','Onion','Lettuce'],
  array['Carrot','Tomato'],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b','11a','11b'],
  null, -2,
  $$Self-seeds enthusiastically — let a few plants flower and you'll have dill volunteers for years. Doesn't transplant.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Thyme', 'Thymus vulgaris', 'herb',
  90, 120,
  6, 12,
  array['Cabbage','Broccoli','Eggplant'],
  array[]::text[],
  array['5a','5b','6a','6b','7a','7b','8a','8b','9a','9b'],
  8, null,
  $$Perennial. Loves lean, well-drained soil — overwatering and rich compost both ruin it. Repels cabbage worms.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Rosemary', 'Salvia rosmarinus', 'herb',
  null, null,
  8, 24,
  array['Cabbage','Bush Bean','Carrot','Sage'],
  array[]::text[],
  array['7a','7b','8a','8b','9a','9b','10a','10b'],
  10, null,
  $$Mediterranean perennial: full sun, sharp drainage, easy on the water. In zones colder than 7, pot it up and overwinter indoors.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Oregano', 'Origanum vulgare', 'herb',
  80, 90,
  6, 12,
  array['Basil','Cabbage','Broccoli'],
  array[]::text[],
  array['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b'],
  8, null,
  $$Perennial. Cut back hard mid-season to keep fresh, tender growth coming. Flavor concentrates as plants mature.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Mint', 'Mentha spicata', 'herb',
  null, null,
  4, 18,
  array['Cabbage','Broccoli','Tomato'],
  array['Parsley'],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b'],
  null, null,
  $$Spreads by runners and will take over a bed. Keep it in a container — even a pot sunk into the ground works.$$
);


-- =====================================================================
-- LEGUME (3)
-- =====================================================================

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Bush Bean', 'Phaseolus vulgaris', 'legume',
  50, 60,
  6, 4,
  array['Carrot','Cucumber','Radish','Strawberry','Summer Squash'],
  array['Onion','Garlic','Scallion','Leek','Chive'],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b','11a','11b'],
  null, 1,
  $$Fixes its own nitrogen — keep alliums far away. Succession-sow every 3 weeks for a steady harvest.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Pole Bean', 'Phaseolus vulgaris', 'legume',
  60, 75,
  6, 6,
  array['Corn','Summer Squash','Winter Squash','Pumpkin','Cucumber','Carrot','Radish'],
  array['Onion','Garlic','Scallion','Leek','Beet'],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b','11a','11b'],
  null, 1,
  $$The bean of the Three Sisters: climbs corn, shades squash, feeds them all nitrogen. Provide a 6–8' trellis.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Snap Pea', 'Pisum sativum', 'legume',
  60, 70,
  6, 2,
  array['Carrot','Radish','Turnip','Cucumber','Bush Bean'],
  array['Onion','Garlic','Scallion','Leek'],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b','11a','11b'],
  null, -4,
  $$Cool-season — plant as soon as soil can be worked, ideally 4–6 weeks before last frost. Vining varieties need a trellis.$$
);


-- =====================================================================
-- ALLIUM (4)
-- =====================================================================

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Garlic', 'Allium sativum', 'allium',
  240, 270,
  6, 6,
  array['Tomato','Sweet Pepper','Hot Pepper','Beet','Carrot','Kale','Broccoli','Cabbage'],
  array['Bush Bean','Pole Bean','Snap Pea'],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b'],
  null, null,
  $$Plant cloves in fall, 4–6 weeks before the ground freezes. Mulch thick; harvest the next summer when bottom leaves turn brown.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Onion', 'Allium cepa', 'allium',
  100, 140,
  6, 4,
  array['Tomato','Sweet Pepper','Carrot','Lettuce','Beet','Strawberry','Cabbage'],
  array['Bush Bean','Pole Bean','Snap Pea'],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b'],
  10, -4,
  $$Day-length sensitive: long-day varieties for the north (above latitude 35), short-day for the south, day-neutral anywhere.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Scallion', 'Allium fistulosum', 'allium',
  60, 80,
  6, 2,
  array['Tomato','Carrot','Lettuce','Cabbage'],
  array['Bush Bean','Pole Bean','Snap Pea'],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b'],
  null, -4,
  $$Cut-and-come-again: snip tops above the white base and they'll regrow two or three times before exhausting.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Leek', 'Allium ampeloprasum', 'allium',
  100, 130,
  6, 6,
  array['Carrot','Onion','Celery','Tomato'],
  array['Bush Bean','Pole Bean','Snap Pea'],
  array['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b'],
  12, -2,
  $$Hill soil up around the stems as they grow to blanch a long, tender white shank. Tolerates frost well into fall.$$
);


-- =====================================================================
-- BRASSICA (2)
-- =====================================================================

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Broccoli', 'Brassica oleracea', 'brassica',
  60, 90,
  6, 18,
  array['Beet','Onion','Garlic','Dill','Mint','Thyme','Oregano'],
  array['Tomato','Sweet Pepper','Hot Pepper','Bush Bean','Pole Bean','Snap Pea','Strawberry'],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b'],
  6, -2,
  $$Heavy feeder. Cut the central head just before the buds open and keep watering — side shoots will give you a second harvest.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Cabbage', 'Brassica oleracea', 'brassica',
  70, 100,
  6, 18,
  array['Beet','Onion','Garlic','Dill','Mint','Thyme','Oregano','Sage'],
  array['Tomato','Sweet Pepper','Hot Pepper','Bush Bean','Pole Bean','Snap Pea','Strawberry'],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b'],
  8, -4,
  $$Heads split when watering swings between wet and dry. Twist the plant a quarter-turn at maturity to slow uptake and prevent splits.$$
);


-- =====================================================================
-- VINE (2)
-- =====================================================================

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Pumpkin', 'Cucurbita pepo', 'vine',
  90, 120,
  6, 60,
  array['Pole Bean','Bush Bean','Corn','Summer Squash','Winter Squash'],
  array[]::text[],
  array['3a','3b','4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b','11a','11b'],
  3, 1,
  $$Needs serious room — vines sprawl 10+ feet. Ripe when the rind resists a fingernail and the stem starts to dry.$$
);

insert into public.plants (
  common_name, scientific_name, type,
  days_to_maturity_min, days_to_maturity_max,
  sunlight_min_hours, spacing_inches,
  companion_plants, antagonist_plants,
  hardiness_zones,
  start_indoor_weeks_before_last_frost,
  direct_sow_weeks_relative_to_last_frost,
  notes
) values (
  'Watermelon', 'Citrullus lanatus', 'vine',
  80, 100,
  8, 48,
  array['Pumpkin','Summer Squash','Winter Squash','Corn'],
  array[]::text[],
  array['4a','4b','5a','5b','6a','6b','7a','7b','8a','8b','9a','9b','10a','10b','11a','11b'],
  3, 2,
  $$Wants a long, hot season. Look for a dried tendril nearest the fruit plus a yellow ground spot to know when to pick.$$
);
