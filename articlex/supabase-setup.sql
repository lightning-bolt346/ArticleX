-- ============================================================
-- ArticleX — Supabase Setup Script
-- ============================================================
-- Run this ONCE in your Supabase SQL Editor to set up all tables.
--
-- If you have OLD tables (without tags, contact_email, etc.),
-- run the MIGRATION section at the bottom instead.
-- ============================================================


-- ─── FRESH SETUP (new project, no existing tables) ──────────

-- 1. Collections table
CREATE TABLE IF NOT EXISTS collections (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  description    TEXT,
  tags           TEXT[] DEFAULT '{}',
  contact_email  TEXT,
  editable       BOOLEAN DEFAULT false,
  is_public      BOOLEAN DEFAULT true,
  user_id        TEXT,
  created_at     TIMESTAMPTZ DEFAULT now(),
  view_count     INTEGER DEFAULT 0 NOT NULL
);

-- 2. Collection items table
CREATE TABLE IF NOT EXISTS collection_items (
  id             BIGSERIAL PRIMARY KEY,
  collection_id  TEXT NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  tweet_id       TEXT NOT NULL,
  tweet_url      TEXT NOT NULL,
  author_name    TEXT NOT NULL DEFAULT '',
  author_handle  TEXT NOT NULL DEFAULT '',
  author_avatar  TEXT NOT NULL DEFAULT '',
  title          TEXT,
  snippet        TEXT NOT NULL DEFAULT '',
  cover_image    TEXT,
  added_at       TIMESTAMPTZ DEFAULT now()
);

-- 3. Tweet cache table (for the caching proxy)
CREATE TABLE IF NOT EXISTS tweet_cache (
  tweet_id   TEXT PRIMARY KEY,
  payload    JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_collection_items_cid ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_collections_views    ON collections(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_collections_user     ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_public   ON collections(is_public);
CREATE INDEX IF NOT EXISTS idx_tweet_cache_fetched  ON tweet_cache(fetched_at);

-- 5. Row Level Security
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tweet_cache ENABLE ROW LEVEL SECURITY;

-- Collections: public ones readable by all; private ones only by owner
CREATE POLICY "collections_select" ON collections FOR SELECT
  USING (is_public = true OR user_id = auth.uid()::text);

-- Collections: anyone can insert
CREATE POLICY "collections_insert" ON collections FOR INSERT
  WITH CHECK (true);

-- Collections: only owner can update editable collections
CREATE POLICY "collections_update" ON collections FOR UPDATE
  USING (user_id = auth.uid()::text AND editable = true);

-- Collection items: readable by all (RLS on parent handles visibility)
CREATE POLICY "items_select" ON collection_items FOR SELECT
  USING (true);

-- Collection items: anyone can insert
CREATE POLICY "items_insert" ON collection_items FOR INSERT
  WITH CHECK (true);

-- Collection items: owner can delete from their editable collections
CREATE POLICY "items_delete" ON collection_items FOR DELETE
  USING (collection_id IN (
    SELECT id FROM collections WHERE user_id = auth.uid()::text AND editable = true
  ));

-- Tweet cache: fully open (public data)
CREATE POLICY "cache_select" ON tweet_cache FOR SELECT USING (true);
CREATE POLICY "cache_insert" ON tweet_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "cache_upsert" ON tweet_cache FOR UPDATE USING (true);

-- 6. View counter function (SECURITY DEFINER bypasses RLS)
CREATE OR REPLACE FUNCTION increment_collection_views(collection_id TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE collections SET view_count = view_count + 1 WHERE id = collection_id;
$$;


-- ============================================================
-- MIGRATION (if you already have the OLD tables without new columns)
-- ============================================================
-- Only run this section if you created tables BEFORE the tags/auth update.
-- It safely adds columns that don't exist yet.
--
-- ALTER TABLE collections ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
-- ALTER TABLE collections ADD COLUMN IF NOT EXISTS contact_email TEXT;
-- ALTER TABLE collections ADD COLUMN IF NOT EXISTS editable BOOLEAN DEFAULT false;
-- ALTER TABLE collections ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
-- ALTER TABLE collections ADD COLUMN IF NOT EXISTS user_id TEXT;
--
-- CREATE INDEX IF NOT EXISTS idx_collections_user ON collections(user_id);
-- CREATE INDEX IF NOT EXISTS idx_collections_public ON collections(is_public);
--
-- Then re-run the RLS policies above (drop old ones first):
-- DROP POLICY IF EXISTS "public_read_collections" ON collections;
-- DROP POLICY IF EXISTS "public_read_items" ON collection_items;
-- DROP POLICY IF EXISTS "service_write_collections" ON collections;
-- DROP POLICY IF EXISTS "service_write_items" ON collection_items;
-- Then run the CREATE POLICY statements from section 5 above.
