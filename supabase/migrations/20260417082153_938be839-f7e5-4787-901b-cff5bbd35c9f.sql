-- Allow admins to delete any bike booking (for /admin/bookings cancel)
CREATE POLICY "Admins can delete any booking"
ON public.bike_bookings
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));