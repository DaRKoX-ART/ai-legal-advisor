-- Custom enums
CREATE TYPE public.legal_urgency AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.legal_source AS ENUM ('ai', 'demo');
CREATE TYPE public.legal_language AS ENUM ('he', 'ar', 'en');

-- Legal requests table: cloud storage for SavedAnswer data
CREATE TABLE public.legal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,

  -- Question & AI response
  question TEXT NOT NULL CHECK (char_length(question) <= 2000),
  title TEXT NOT NULL CHECK (char_length(title) <= 120),
  brief TEXT NOT NULL CHECK (char_length(brief) <= 280),
  insight TEXT CHECK (char_length(insight) <= 280),
  explanation TEXT NOT NULL,

  -- Categorization
  category TEXT NOT NULL DEFAULT 'כללי',
  urgency public.legal_urgency NOT NULL DEFAULT 'low',
  language public.legal_language NOT NULL DEFAULT 'he',
  source public.legal_source NOT NULL DEFAULT 'ai',

  -- Structured data (JSONB for flexibility)
  action_plan JSONB NOT NULL DEFAULT '[]',
  evidence_checklist JSONB NOT NULL DEFAULT '[]',
  common_mistakes JSONB NOT NULL DEFAULT '[]',
  lawyer_questions JSONB NOT NULL DEFAULT '[]',
  glossary JSONB NOT NULL DEFAULT '[]',
  legal_aid JSONB NOT NULL DEFAULT '[]',
  deadline_hint JSONB,

  -- Metadata
  disclaimer TEXT NOT NULL,
  lawyer_reason TEXT,

  -- Sync tracking
  local_id TEXT, -- maps to AsyncStorage SavedAnswer.id during migration
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Full-text search (Hebrew-aware via pg_trgm or future)
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(question, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(brief, '')), 'C')
  ) STORED
);

-- Indexes
CREATE INDEX idx_legal_requests_user_id ON public.legal_requests(user_id);
CREATE INDEX idx_legal_requests_created_at ON public.legal_requests(created_at DESC);
CREATE INDEX idx_legal_requests_category ON public.legal_requests(category);
CREATE INDEX idx_legal_requests_local_id ON public.legal_requests(local_id) WHERE local_id IS NOT NULL;
CREATE INDEX idx_legal_requests_search ON public.legal_requests USING GIN(search_vector);

-- RLS
ALTER TABLE public.legal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own requests"
  ON public.legal_requests FOR ALL
  USING (auth.uid() = user_id);

-- Updated at trigger helper
CREATE OR REPLACE FUNCTION public.moddatetime()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.legal_requests
  FOR EACH ROW EXECUTE PROCEDURE public.moddatetime();
