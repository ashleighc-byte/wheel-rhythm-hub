-- Create activity feed table
CREATE TABLE public.activity_feed (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL DEFAULT 'ride',
  rider_name TEXT NOT NULL,
  school_name TEXT NOT NULL DEFAULT '',
  message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_feed ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read all activity
CREATE POLICY "Anyone can view activity feed"
ON public.activity_feed
FOR SELECT
TO authenticated
USING (true);

-- Anon can also read (for public leaderboard page)
CREATE POLICY "Anon can view activity feed"
ON public.activity_feed
FOR SELECT
TO anon
USING (true);

-- Authenticated users can insert activity events
CREATE POLICY "Authenticated users can insert activity"
ON public.activity_feed
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_feed;

-- Index for efficient recent queries
CREATE INDEX idx_activity_feed_created_at ON public.activity_feed (created_at DESC);