
CREATE TABLE public.leaderboard_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key text NOT NULL UNIQUE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.leaderboard_cache ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read cache
CREATE POLICY "Anyone can read cache"
ON public.leaderboard_cache
FOR SELECT
TO authenticated
USING (true);

-- Also allow anonymous/public reads for the landing page
CREATE POLICY "Public can read cache"
ON public.leaderboard_cache
FOR SELECT
TO anon
USING (true);
