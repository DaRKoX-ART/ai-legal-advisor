-- Admin support: add is_admin flag to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- RPC: check if current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$;

-- RPC: get admin overview stats
CREATE OR REPLACE FUNCTION public.admin_stats()
RETURNS TABLE (
  total_users BIGINT,
  total_requests BIGINT,
  requests_today BIGINT,
  active_users_today BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.profiles),
    (SELECT COUNT(*) FROM public.legal_requests),
    (SELECT COUNT(*) FROM public.legal_requests WHERE created_at >= NOW() - INTERVAL '1 day'),
    (SELECT COUNT(DISTINCT user_id) FROM public.legal_requests WHERE created_at >= NOW() - INTERVAL '1 day');
END;
$$;

-- RPC: list recent requests (admin only)
CREATE OR REPLACE FUNCTION public.admin_recent_requests(limit_count INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  question TEXT,
  title TEXT,
  category TEXT,
  urgency TEXT,
  source TEXT,
  created_at TIMESTAMPTZ,
  user_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    lr.id,
    lr.user_id,
    lr.question,
    lr.title,
    lr.category,
    lr.urgency::TEXT,
    lr.source::TEXT,
    lr.created_at,
    p.name AS user_name
  FROM public.legal_requests lr
  LEFT JOIN public.profiles p ON p.id = lr.user_id
  ORDER BY lr.created_at DESC
  LIMIT limit_count;
END;
$$;

-- RPC: list users (admin only)
CREATE OR REPLACE FUNCTION public.admin_users_list(limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ,
  request_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    p.id,
    p.name,
    u.email,
    p.created_at,
    (SELECT COUNT(*) FROM public.legal_requests lr WHERE lr.user_id = p.id) AS request_count
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  ORDER BY p.created_at DESC
  LIMIT limit_count;
END;
$$;
