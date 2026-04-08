CREATE OR REPLACE FUNCTION public.calculate_weekly_bonus(_user_id uuid, _session_date date)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  week_start DATE;
  sessions_this_week INTEGER;
  bonus INTEGER := 0;
BEGIN
  week_start := date_trunc('week', _session_date)::DATE;
  
  SELECT COUNT(*)
  INTO sessions_this_week
  FROM public.student_points
  WHERE user_id = _user_id
    AND session_date >= week_start
    AND session_date < week_start + INTERVAL '7 days';
  
  -- +5 bonus when hitting 3 sessions in a week
  IF sessions_this_week >= 3 THEN
    bonus := bonus + 5;
  END IF;
  
  -- +10 bonus when hitting 5 sessions in a week
  IF sessions_this_week >= 5 THEN
    bonus := bonus + 10;
  END IF;
  
  RETURN bonus;
END;
$function$;