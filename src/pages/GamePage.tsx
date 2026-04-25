import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CyclingGame from '@/components/ride/CyclingGame';
import { GAME_ROUTES } from '@/data/gameRoutes';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export default function GamePage() {
  const { routeId } = useParams<{ routeId: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { toast } = useToast();

  const route = GAME_ROUTES.find(r => r.id === routeId);

  // Full-screen — hide body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!route) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0a0f1e] text-white flex-col gap-4">
        <p className="text-xl">Route not found</p>
        <button onClick={() => navigate('/ride')} className="underline text-blue-400">← Back to Ride</button>
      </div>
    );
  }

  const handleComplete = async (data: {
    distance: number; speed: number; power: number;
    cadence: number; elevation: number; duration: number;
  }) => {
    const userId = session?.user?.id;
    if (userId) {
      // Save ride to game_rides table (see Supabase migration below)
      const { error } = await supabase.from('game_rides' as never).insert({
        user_id:          userId,
        route_id:         route.id,
        route_name:       route.name,
        distance_km:      parseFloat(data.distance.toFixed(3)),
        avg_speed_kmh:    parseFloat(data.speed.toFixed(1)),
        avg_power_watts:  Math.round(data.power),
        avg_cadence_rpm:  Math.round(data.cadence),
        elevation_gain_m: Math.round(data.elevation),
        duration_seconds: data.duration,
        source:           'game',
      });

      if (error) {
        // If game_rides table doesn't exist yet, fall back to activity_feed
        await supabase.from('activity_feed').insert({
          rider_name:  session.user.email ?? 'Rider',
          school_name: '',
          event_type:  'game_ride_complete',
          message:     `Completed ${route.name} — ${data.distance.toFixed(2)} km in ${Math.round(data.duration / 60)} min`,
          metadata: {
            route_id:         route.id,
            route_name:       route.name,
            distance_km:      data.distance,
            avg_speed_kmh:    data.speed,
            avg_power_watts:  data.power,
            avg_cadence_rpm:  data.cadence,
            elevation_gain_m: data.elevation,
            duration_seconds: data.duration,
          },
        });
      }

      toast({
        title: 'Ride saved!',
        description: `${route.name} — ${data.distance.toFixed(2)} km · ${Math.round(data.power)}W avg`,
      });
    }

    navigate('/leaderboards');
  };

  const displayName = session?.user?.email?.split('@')[0] ?? 'Rider';

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0f1e' }}>
      <CyclingGame
        route={route}
        playerName={displayName}
        onComplete={handleComplete}
        onBack={() => navigate('/ride')}
      />
    </div>
  );
}
