-- Run this in your Supabase SQL editor to set up the selfie board.

-- ── Cards table ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     text NOT NULL,
  image_url   text NOT NULL,
  x           float NOT NULL,
  y           float NOT NULL,
  rotation    float NOT NULL,
  name        text,
  created_at  timestamptz DEFAULT now()
  -- Uncomment when you add auth:
  -- user_id  uuid REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS cards_room_id_idx ON cards(room_id);

-- ── Storage bucket ───────────────────────────────────────────────────────────
-- Create a PUBLIC bucket called "selfie-board-images" in the Storage tab,
-- or run the following (requires Storage admin privileges):

INSERT INTO storage.buckets (id, name, public)
VALUES ('selfie-board-images', 'selfie-board-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read images (public board)
CREATE POLICY "Public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'selfie-board-images');

-- Allow anyone to upload images (no auth required for now)
CREATE POLICY "Public insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'selfie-board-images');

-- ── Row-level security ───────────────────────────────────────────────────────
-- Cards are read/written by the PartyKit server via the service role key,
-- which bypasses RLS. Enable RLS anyway so anonymous browser clients can't
-- write directly; they must go through PartyKit.
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read cards (public board)
CREATE POLICY "Public read" ON cards FOR SELECT USING (true);

-- Only the service role (PartyKit) can insert/update
-- (No INSERT/UPDATE policy needed — service role bypasses RLS by default)
