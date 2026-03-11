CREATE TABLE public.onboarding_completed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);
ALTER TABLE public.onboarding_completed ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own onboarding" ON public.onboarding_completed
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own onboarding" ON public.onboarding_completed
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);