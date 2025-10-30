-- ============================================
-- Migration 030: Create Regions and Cities Tables
-- ============================================
-- Purpose: Replace city-only filtering with Israeli regional divisions (מחוזות)
-- Allows students to find teachers in their broader area (e.g., "גליל עליון" instead of just "צפת")

-- Create regions table
CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_he TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL UNIQUE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create cities table
CREATE TABLE IF NOT EXISTS cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_he TEXT NOT NULL,
  name_en TEXT NOT NULL,
  region_id UUID NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name_he, region_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cities_region_id ON cities(region_id);
CREATE INDEX IF NOT EXISTS idx_cities_name_he ON cities(name_he);
CREATE INDEX IF NOT EXISTS idx_regions_sort_order ON regions(sort_order);

-- ============================================
-- Seed Israeli Regions (9 regions)
-- ============================================
INSERT INTO regions (name_he, name_en, sort_order) VALUES
  ('רמת הגולן', 'Golan Heights', 1),
  ('גליל עליון', 'Upper Galilee', 2),
  ('גליל תחתון', 'Lower Galilee', 3),
  ('גליל מערבי', 'Western Galilee', 4),
  ('חיפה והקריות', 'Haifa and Krayot', 5),
  ('גוש דן', 'Gush Dan', 6),
  ('שפלה', 'Shephelah', 7),
  ('דרום', 'South', 8),
  ('נגב וערבה', 'Negev and Arava', 9)
ON CONFLICT (name_he) DO NOTHING;

-- Get region IDs for city insertion
DO $$
DECLARE
  v_golan UUID;
  v_upper_galilee UUID;
  v_lower_galilee UUID;
  v_western_galilee UUID;
  v_haifa UUID;
  v_gush_dan UUID;
  v_shephelah UUID;
  v_south UUID;
  v_negev UUID;
BEGIN
  -- Fetch region IDs
  SELECT id INTO v_golan FROM regions WHERE name_he = 'רמת הגולן';
  SELECT id INTO v_upper_galilee FROM regions WHERE name_he = 'גליל עליון';
  SELECT id INTO v_lower_galilee FROM regions WHERE name_he = 'גליל תחתון';
  SELECT id INTO v_western_galilee FROM regions WHERE name_he = 'גליל מערבי';
  SELECT id INTO v_haifa FROM regions WHERE name_he = 'חיפה והקריות';
  SELECT id INTO v_gush_dan FROM regions WHERE name_he = 'גוש דן';
  SELECT id INTO v_shephelah FROM regions WHERE name_he = 'שפלה';
  SELECT id INTO v_south FROM regions WHERE name_he = 'דרום';
  SELECT id INTO v_negev FROM regions WHERE name_he = 'נגב וערבה';

  -- ============================================
  -- Seed Cities by Region
  -- ============================================

  -- רמת הגולן (Golan Heights)
  INSERT INTO cities (name_he, name_en, region_id, sort_order) VALUES
    ('קצרין', 'Katzrin', v_golan, 1),
    ('מעלה גמלא', 'Maaleh Gamla', v_golan, 2),
    ('מרום גולן', 'Merom Golan', v_golan, 3)
  ON CONFLICT (name_he, region_id) DO NOTHING;

  -- גליל עליון (Upper Galilee)
  INSERT INTO cities (name_he, name_en, region_id, sort_order) VALUES
    ('צפת', 'Safed', v_upper_galilee, 1),
    ('קריית שמונה', 'Kiryat Shmona', v_upper_galilee, 2),
    ('מעלות-תרשיחא', 'Maalot-Tarshiha', v_upper_galilee, 3),
    ('כרמיאל', 'Karmiel', v_upper_galilee, 4),
    ('ראש פינה', 'Rosh Pinna', v_upper_galilee, 5),
    ('חצור הגלילית', 'Hatzor HaGlilit', v_upper_galilee, 6)
  ON CONFLICT (name_he, region_id) DO NOTHING;

  -- גליל תחתון (Lower Galilee)
  INSERT INTO cities (name_he, name_en, region_id, sort_order) VALUES
    ('נצרת', 'Nazareth', v_lower_galilee, 1),
    ('טבריה', 'Tiberias', v_lower_galilee, 2),
    ('עפולה', 'Afula', v_lower_galilee, 3),
    ('מגדל העמק', 'Migdal HaEmek', v_lower_galilee, 4),
    ('נצרת עילית', 'Nof HaGalil', v_lower_galilee, 5),
    ('יקנעם', 'Yokneam', v_lower_galilee, 6)
  ON CONFLICT (name_he, region_id) DO NOTHING;

  -- גליל מערבי (Western Galilee)
  INSERT INTO cities (name_he, name_en, region_id, sort_order) VALUES
    ('עכו', 'Acre', v_western_galilee, 1),
    ('נהריה', 'Nahariya', v_western_galilee, 2)
  ON CONFLICT (name_he, region_id) DO NOTHING;

  -- חיפה והקריות (Haifa and Krayot)
  INSERT INTO cities (name_he, name_en, region_id, sort_order) VALUES
    ('חיפה', 'Haifa', v_haifa, 1),
    ('קריית אתא', 'Kiryat Ata', v_haifa, 2),
    ('קריית ביאליק', 'Kiryat Bialik', v_haifa, 3),
    ('קריית ים', 'Kiryat Yam', v_haifa, 4),
    ('קריית מוצקין', 'Kiryat Motzkin', v_haifa, 5),
    ('נשר', 'Nesher', v_haifa, 6),
    ('טירת כרמל', 'Tirat Carmel', v_haifa, 7)
  ON CONFLICT (name_he, region_id) DO NOTHING;

  -- גוש דן (Gush Dan - Tel Aviv Metropolitan Area)
  INSERT INTO cities (name_he, name_en, region_id, sort_order) VALUES
    ('תל אביב', 'Tel Aviv', v_gush_dan, 1),
    ('רמת גן', 'Ramat Gan', v_gush_dan, 2),
    ('בני ברק', 'Bnei Brak', v_gush_dan, 3),
    ('גבעתיים', 'Givatayim', v_gush_dan, 4),
    ('חולון', 'Holon', v_gush_dan, 5),
    ('בת ים', 'Bat Yam', v_gush_dan, 6),
    ('הרצליה', 'Herzliya', v_gush_dan, 7),
    ('רמת השרון', 'Ramat HaSharon', v_gush_dan, 8),
    ('כפר סבא', 'Kfar Saba', v_gush_dan, 9),
    ('רעננה', 'Ra''anana', v_gush_dan, 10),
    ('הוד השרון', 'Hod HaSharon', v_gush_dan, 11),
    ('ראש העין', 'Rosh HaAyin', v_gush_dan, 12),
    ('פתח תקווה', 'Petah Tikva', v_gush_dan, 13),
    ('ראשון לציון', 'Rishon LeZion', v_gush_dan, 14),
    ('נס ציונה', 'Ness Ziona', v_gush_dan, 15),
    ('נתניה', 'Netanya', v_gush_dan, 16)
  ON CONFLICT (name_he, region_id) DO NOTHING;

  -- שפלה (Shephelah - Coastal Plain)
  INSERT INTO cities (name_he, name_en, region_id, sort_order) VALUES
    ('רחובות', 'Rehovot', v_shephelah, 1),
    ('לוד', 'Lod', v_shephelah, 2),
    ('רמלה', 'Ramla', v_shephelah, 3),
    ('מודיעין-מכבים-רעות', 'Modiin-Maccabim-Reut', v_shephelah, 4),
    ('בית שמש', 'Beit Shemesh', v_shephelah, 5)
  ON CONFLICT (name_he, region_id) DO NOTHING;

  -- דרום (South - including Jerusalem area)
  INSERT INTO cities (name_he, name_en, region_id, sort_order) VALUES
    ('ירושלים', 'Jerusalem', v_south, 1),
    ('אשדוד', 'Ashdod', v_south, 2),
    ('אשקלון', 'Ashkelon', v_south, 3),
    ('קריית גת', 'Kiryat Gat', v_south, 4)
  ON CONFLICT (name_he, region_id) DO NOTHING;

  -- נגב וערבה (Negev and Arava)
  INSERT INTO cities (name_he, name_en, region_id, sort_order) VALUES
    ('באר שבע', 'Be''er Sheva', v_negev, 1),
    ('אילת', 'Eilat', v_negev, 2),
    ('דימונה', 'Dimona', v_negev, 3),
    ('ערד', 'Arad', v_negev, 4),
    ('מצפה רמון', 'Mitzpe Ramon', v_negev, 5),
    ('נתיבות', 'Netivot', v_negev, 6),
    ('אופקים', 'Ofakim', v_negev, 7),
    ('שדרות', 'Sderot', v_negev, 8)
  ON CONFLICT (name_he, region_id) DO NOTHING;

END $$;

-- ============================================
-- Enable RLS on new tables
-- ============================================
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Anyone can view regions" ON regions;
DROP POLICY IF EXISTS "Anyone can view cities" ON cities;

-- Everyone can read regions and cities
CREATE POLICY "Anyone can view regions" ON regions FOR SELECT USING (true);
CREATE POLICY "Anyone can view cities" ON cities FOR SELECT USING (true);

-- ============================================
-- Create helper functions
-- ============================================

-- Function to get region by city name
CREATE OR REPLACE FUNCTION get_region_by_city(p_city_name TEXT)
RETURNS UUID AS $$
DECLARE
  v_region_id UUID;
BEGIN
  SELECT region_id INTO v_region_id
  FROM cities
  WHERE name_he ILIKE p_city_name OR name_en ILIKE p_city_name
  LIMIT 1;

  RETURN v_region_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get all cities in a region
CREATE OR REPLACE FUNCTION get_cities_in_region(p_region_id UUID)
RETURNS TABLE (
  id UUID,
  name_he TEXT,
  name_en TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.name_he, c.name_en
  FROM cities c
  WHERE c.region_id = p_region_id
  ORDER BY c.sort_order, c.name_he;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- Success message with statistics
-- ============================================
DO $$
DECLARE
  v_region_count INTEGER;
  v_city_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_region_count FROM regions;
  SELECT COUNT(*) INTO v_city_count FROM cities;

  RAISE NOTICE '✅ Migration 030 completed successfully!';
  RAISE NOTICE '   ';
  RAISE NOTICE '   📊 Database Statistics:';
  RAISE NOTICE '   - Regions created: %', v_region_count;
  RAISE NOTICE '   - Cities created: %', v_city_count;
  RAISE NOTICE '   ';
  RAISE NOTICE '   ✅ Components created:';
  RAISE NOTICE '   - regions table (9 Israeli regions)';
  RAISE NOTICE '   - cities table (57 major cities)';
  RAISE NOTICE '   - RLS policies (public read access)';
  RAISE NOTICE '   - Helper functions (get_region_by_city, get_cities_in_region)';
  RAISE NOTICE '   ';
  RAISE NOTICE '   🎯 Next step: Run Migration 031 to add region fields to profiles';
END $$;
