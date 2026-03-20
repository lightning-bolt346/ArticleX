-- ============================================================
-- ArticleX — Complete Supabase Setup
-- ============================================================
-- IMPORTANT: Run this in your Supabase SQL Editor.
--
-- If you already have old tables, run the DROP section first,
-- then run the rest. If starting fresh, just run everything.
-- ============================================================


-- ─── STEP 0: CLEAN UP OLD TABLES (if upgrading) ────────────
-- Uncomment these lines if you have old tables:

-- DROP POLICY IF EXISTS "public_read_collections" ON collections;
-- DROP POLICY IF EXISTS "public_read_items" ON collection_items;
-- DROP POLICY IF EXISTS "service_write_collections" ON collections;
-- DROP POLICY IF EXISTS "service_write_items" ON collection_items;
-- DROP POLICY IF EXISTS "collections_select" ON collections;
-- DROP POLICY IF EXISTS "collections_insert" ON collections;
-- DROP POLICY IF EXISTS "collections_update" ON collections;
-- DROP POLICY IF EXISTS "items_select" ON collection_items;
-- DROP POLICY IF EXISTS "items_insert" ON collection_items;
-- DROP POLICY IF EXISTS "items_delete" ON collection_items;
-- DROP POLICY IF EXISTS "anyone_read_articles" ON articles;
-- DROP POLICY IF EXISTS "anyone_write_articles" ON articles;
-- DROP POLICY IF EXISTS "anyone_update_articles" ON articles;
-- DROP TABLE IF EXISTS collection_items;
-- DROP TABLE IF EXISTS collections;
-- DROP TABLE IF EXISTS articles;
-- DROP TABLE IF EXISTS tweet_cache;


-- ─── STEP 1: CREATE TABLES ─────────────────────────────────

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

CREATE TABLE IF NOT EXISTS tweet_cache (
  tweet_id   TEXT PRIMARY KEY,
  payload    JSONB NOT NULL,
  fetched_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS articles (
  tweet_id      TEXT PRIMARY KEY,
  tweet_url     TEXT NOT NULL,
  author_name   TEXT NOT NULL DEFAULT '',
  author_handle TEXT NOT NULL DEFAULT '',
  author_avatar TEXT NOT NULL DEFAULT '',
  published_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  title         TEXT,
  snippet       TEXT NOT NULL DEFAULT '',
  cover_image   TEXT,
  word_count    INTEGER NOT NULL DEFAULT 0,
  reading_time  INTEGER NOT NULL DEFAULT 0,
  payload       JSONB NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- ─── STEP 2: INDEXES ───────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_items_collection ON collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_coll_views       ON collections(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_coll_user        ON collections(user_id);
CREATE INDEX IF NOT EXISTS idx_coll_public      ON collections(is_public);
CREATE INDEX IF NOT EXISTS idx_cache_fetched    ON tweet_cache(fetched_at);
CREATE INDEX IF NOT EXISTS idx_articles_updated ON articles(updated_at DESC);


-- ─── STEP 3: ENABLE ROW LEVEL SECURITY ─────────────────────

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tweet_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;


-- ─── STEP 4: RLS POLICIES ──────────────────────────────────
-- These policies allow the anon key to read/write.
-- The app handles auth logic; RLS just prevents abuse.

-- Collections: anyone can read public collections
CREATE POLICY "anon_read_public_collections"
  ON collections FOR SELECT
  USING (is_public = true);

-- Collections: authenticated users can also read their private ones
CREATE POLICY "auth_read_own_collections"
  ON collections FOR SELECT
  USING (auth.role() = 'authenticated' AND user_id = auth.uid()::text);

-- Collections: anyone can create (anon or authenticated)
CREATE POLICY "anyone_insert_collections"
  ON collections FOR INSERT
  WITH CHECK (true);

-- Collections: only authenticated owner can update their editable collections
CREATE POLICY "owner_update_collections"
  ON collections FOR UPDATE
  USING (auth.role() = 'authenticated' AND user_id = auth.uid()::text AND editable = true);

-- Collection items: anyone can read (visibility handled by parent)
CREATE POLICY "anyone_read_items"
  ON collection_items FOR SELECT
  USING (true);

-- Collection items: anyone can insert
CREATE POLICY "anyone_insert_items"
  ON collection_items FOR INSERT
  WITH CHECK (true);

-- Collection items: authenticated owner can delete from editable collections
CREATE POLICY "owner_delete_items"
  ON collection_items FOR DELETE
  USING (
    auth.role() = 'authenticated'
    AND collection_id IN (
      SELECT id FROM collections
      WHERE user_id = auth.uid()::text AND editable = true
    )
  );

-- Tweet cache: fully open (public data, no sensitive info)
CREATE POLICY "anyone_read_cache"  ON tweet_cache FOR SELECT USING (true);
CREATE POLICY "anyone_write_cache" ON tweet_cache FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone_update_cache" ON tweet_cache FOR UPDATE USING (true);

-- Saved articles: fully open because tweet/article content is public
CREATE POLICY "anyone_read_articles" ON articles FOR SELECT USING (true);
CREATE POLICY "anyone_write_articles" ON articles FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone_update_articles" ON articles FOR UPDATE USING (true);


-- ─── STEP 5: VIEW COUNTER FUNCTION ─────────────────────────
-- SECURITY DEFINER lets this bypass RLS (needed for anonymous view counting)

CREATE OR REPLACE FUNCTION increment_collection_views(collection_id TEXT)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE collections SET view_count = view_count + 1 WHERE id = collection_id;
$$;


-- ─── DONE! ──────────────────────────────────────────────────
-- Your tables are ready. The app will connect automatically.
-- For production on Vercel, also add:
--   VITE_SUPABASE_URL
--   VITE_SUPABASE_ANON_KEY
--   SUPABASE_SERVICE_ROLE_KEY
-- Then redeploy the site so Vercel rebuilds with the new values.
