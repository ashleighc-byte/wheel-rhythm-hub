
-- Drop the broken restrictive policies
DROP POLICY IF EXISTS "Anyone can view all points for leaderboards" ON public.student_points;
DROP POLICY IF EXISTS "Users can view their own points" ON public.student_points;

-- Create a single PERMISSIVE select policy allowing all authenticated users to read all points
CREATE POLICY "Authenticated users can view all points"
ON public.student_points
FOR SELECT
TO authenticated
USING (true);
