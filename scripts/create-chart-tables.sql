-- Create tables for charting feature
-- Run this in Supabase SQL Editor

-- Chart annotations (drawings, trend lines, etc.)
CREATE TABLE IF NOT EXISTS chart_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  exchange TEXT NOT NULL DEFAULT 'NSE',
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chart layouts (indicator preferences, chart style)
CREATE TABLE IF NOT EXISTS chart_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  exchange TEXT NOT NULL DEFAULT 'NSE',
  layout JSONB NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chart comments (notes pinned to specific time or global)
CREATE TABLE IF NOT EXISTS chart_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  symbol TEXT NOT NULL,
  exchange TEXT NOT NULL DEFAULT 'NSE',
  ts TIMESTAMPTZ,
  body TEXT NOT NULL,
  tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_chart_annotations_user_symbol
  ON chart_annotations(user_id, symbol, exchange);

CREATE INDEX IF NOT EXISTS idx_chart_layouts_user_symbol
  ON chart_layouts(user_id, symbol, exchange);

CREATE INDEX IF NOT EXISTS idx_chart_comments_user_symbol
  ON chart_comments(user_id, symbol, exchange);

-- Enable Row Level Security
ALTER TABLE chart_annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_layouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies (for authenticated users - adjust based on your auth setup)
-- For now, we'll use simple policies that check user_id

-- Annotations policies
CREATE POLICY "Users can view own annotations"
  ON chart_annotations FOR SELECT
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own annotations"
  ON chart_annotations FOR INSERT
  WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own annotations"
  ON chart_annotations FOR UPDATE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own annotations"
  ON chart_annotations FOR DELETE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Layouts policies
CREATE POLICY "Users can view own layouts"
  ON chart_layouts FOR SELECT
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own layouts"
  ON chart_layouts FOR INSERT
  WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own layouts"
  ON chart_layouts FOR UPDATE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own layouts"
  ON chart_layouts FOR DELETE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

-- Comments policies
CREATE POLICY "Users can view own comments"
  ON chart_comments FOR SELECT
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can insert own comments"
  ON chart_comments FOR INSERT
  WITH CHECK (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own comments"
  ON chart_comments FOR DELETE
  USING (user_id::text = current_setting('request.jwt.claims', true)::json->>'sub');
