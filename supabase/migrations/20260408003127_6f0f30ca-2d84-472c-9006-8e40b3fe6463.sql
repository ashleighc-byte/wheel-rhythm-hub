CREATE TABLE public.role_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id uuid NOT NULL,
  old_role text NOT NULL,
  new_role text NOT NULL,
  changed_by uuid NOT NULL,
  changed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.role_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view role changes"
ON public.role_change_log FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert role changes"
ON public.role_change_log FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));