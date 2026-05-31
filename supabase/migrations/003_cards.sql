-- 003_cards.sql
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID REFERENCES decks(id) ON DELETE CASCADE,
  position INT NOT NULL,
  sentence TEXT NOT NULL,             -- full sentence with {{blanks}} markers
  blanks JSONB NOT NULL,              -- [{ term: string, hint: string }]
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking (Redis is primary, this is backup/analytics)
CREATE TABLE IF NOT EXISTS daily_usage (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  conversions_used INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, date)
);
