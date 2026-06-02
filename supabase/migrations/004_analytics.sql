-- Event stream: fine-grained analytics events
CREATE TABLE public.request_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  client_timestamp TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: users can only view their own events
ALTER TABLE public.request_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON public.request_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_events_type ON public.request_events(event_type, created_at DESC);
CREATE INDEX idx_events_user ON public.request_events(user_id, created_at DESC);

-- Daily aggregated metrics (for fast dashboard queries)
CREATE TABLE public.analytics_daily (
  date DATE PRIMARY KEY,
  total_users BIGINT DEFAULT 0,
  active_users BIGINT DEFAULT 0,
  total_requests BIGINT DEFAULT 0,
  total_demo_requests BIGINT DEFAULT 0,
  avg_response_time_ms BIGINT,
  success_rate NUMERIC(5,2),
  top_category TEXT,
  category_breakdown JSONB DEFAULT '{}',
  avg_checklist_completion NUMERIC(5,2),
  avg_actions_per_user NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only service role can write
ALTER TABLE public.analytics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin write only"
  ON public.analytics_daily FOR ALL
  USING (false);

-- AI interaction logs (quality & cost tracking)
CREATE TABLE public.ai_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.legal_requests ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  latency_ms INTEGER NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  error_code TEXT,
  error_message TEXT,
  raw_response_size_bytes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service role only
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin write only"
  ON public.ai_interactions FOR ALL
  USING (false);
