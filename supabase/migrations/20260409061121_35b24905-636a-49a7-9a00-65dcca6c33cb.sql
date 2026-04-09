
CREATE TABLE public.bike_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_name text NOT NULL,
  bike_label text NOT NULL,
  booking_date date NOT NULL,
  time_slot text NOT NULL,
  booked_by_name text NOT NULL,
  booked_by_email text,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bike_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view school bookings"
  ON public.bike_bookings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can insert bookings"
  ON public.bike_bookings FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can cancel own bookings"
  ON public.bike_bookings FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anon can view bookings"
  ON public.bike_bookings FOR SELECT TO anon
  USING (true);

CREATE POLICY "Anon can insert bookings"
  ON public.bike_bookings FOR INSERT TO anon
  WITH CHECK (true);

ALTER TABLE public.bike_bookings
  ADD CONSTRAINT unique_bike_slot UNIQUE (school_name, bike_label, booking_date, time_slot);
