export interface Route {
  id: string;
  name: string;
  region: string;
  description: string;
  distance_km: number;
  elevation_m: number;
  difficulty: 'flat' | 'rolling' | 'hilly';
  // 20 sample elevation points (absolute metres above sea level) for the SVG chart
  elevationProfile: number[];
  emoji: string;
}

export const ROUTES: Route[] = [
  {
    id: 'waikato-river',
    name: 'Waikato River Trail',
    region: 'Waikato',
    description: 'A smooth cruise along the mighty Waikato. Great for first rides.',
    distance_km: 8,
    elevation_m: 40,
    difficulty: 'flat',
    emoji: '🌊',
    elevationProfile: [20,22,21,20,23,24,22,20,19,21,23,24,22,20,19,18,20,22,21,20],
  },
  {
    id: 'taupo-lakefront',
    name: 'Taupō Lakefront',
    region: 'Waikato',
    description: 'Cruise around the edge of New Zealand\'s largest lake.',
    distance_km: 10,
    elevation_m: 60,
    difficulty: 'flat',
    emoji: '🏔️',
    elevationProfile: [357,358,360,362,363,362,360,358,357,360,363,365,362,360,358,357,360,362,360,358],
  },
  {
    id: 'hamilton-city-sprint',
    name: 'Hamilton City Sprint',
    region: 'Waikato',
    description: 'Fast laps through Hamilton\'s riverside streets. Great for speed hunters.',
    distance_km: 6,
    elevation_m: 20,
    difficulty: 'flat',
    emoji: '⚡',
    elevationProfile: [40,42,43,44,42,41,40,42,43,44,43,41,40,42,44,43,41,40,42,41],
  },
  {
    id: 'cambridge-countryside',
    name: 'Cambridge Countryside',
    region: 'Waikato',
    description: 'Rolling farmland loops through the horse country of Cambridge.',
    distance_km: 11,
    elevation_m: 110,
    difficulty: 'rolling',
    emoji: '🐴',
    elevationProfile: [60,75,95,115,135,155,145,125,105,88,80,98,118,138,128,108,90,80,72,65],
  },
  {
    id: 'rotorua-redwoods',
    name: 'Rotorua Redwoods Loop',
    region: 'Bay of Plenty',
    description: 'Wind through the famous redwood forest. Rolling terrain with epic vibes.',
    distance_km: 15,
    elevation_m: 180,
    difficulty: 'rolling',
    emoji: '🌲',
    elevationProfile: [200,215,240,262,280,268,250,238,258,278,298,285,268,250,240,230,220,232,216,200],
  },
  {
    id: 'mount-maunganui',
    name: 'Mount Maunganui Coastal',
    region: 'Bay of Plenty',
    description: 'Coastal road around the base of The Mount with ocean views.',
    distance_km: 12,
    elevation_m: 120,
    difficulty: 'rolling',
    emoji: '🏄',
    elevationProfile: [5,18,38,60,82,102,120,130,124,110,90,68,48,30,20,10,5,8,12,8],
  },
  {
    id: 'bay-of-plenty-beach',
    name: 'Bay of Plenty Beachfront',
    region: 'Bay of Plenty',
    description: 'Flat coastal cruiser past white sand beaches. Perfect for beginners.',
    distance_km: 10,
    elevation_m: 30,
    difficulty: 'flat',
    emoji: '🌞',
    elevationProfile: [5,6,7,6,5,8,7,6,5,8,9,7,5,7,9,7,5,6,8,6],
  },
  {
    id: 'hawkes-bay-wine',
    name: "Hawke's Bay Wine Country",
    region: "Hawke's Bay",
    description: 'Roll through vineyards and orchards on undulating country roads.',
    distance_km: 12,
    elevation_m: 90,
    difficulty: 'rolling',
    emoji: '🍇',
    elevationProfile: [30,48,68,90,108,98,78,60,70,90,108,98,78,60,50,68,90,80,60,38],
  },
  {
    id: 'napier-coastal',
    name: 'Napier Coastal Cruise',
    region: "Hawke's Bay",
    description: 'Art Deco city streets to the beachfront. Almost entirely flat.',
    distance_km: 8,
    elevation_m: 25,
    difficulty: 'flat',
    emoji: '🏛️',
    elevationProfile: [5,6,5,7,6,5,5,7,8,6,5,5,7,8,6,5,6,8,7,5],
  },
  {
    id: 'coromandel-peninsula',
    name: 'Coromandel Peninsula',
    region: 'Waikato',
    description: 'The hardest route on the list. Big climbs, big views, big points.',
    distance_km: 14,
    elevation_m: 280,
    difficulty: 'hilly',
    emoji: '🏔️',
    elevationProfile: [10,48,118,198,278,318,298,258,198,150,100,80,118,178,238,278,248,178,100,30],
  },
  {
    id: 'tongariro-northern',
    name: 'Tongariro Challenge',
    region: 'Manawatū-Whanganui',
    description: 'Epic volcanic plateau riding. Serious elevation, serious bragging rights.',
    distance_km: 18,
    elevation_m: 420,
    difficulty: 'hilly',
    emoji: '🌋',
    elevationProfile: [400,448,520,598,698,778,818,798,758,698,648,598,548,498,448,398,378,358,378,400],
  },
  {
    id: 'whakapapa-climb',
    name: 'Whakapapa Climb',
    region: 'Manawatū-Whanganui',
    description: 'Climb the flanks of Ruapehu. The toughest route for the strongest riders.',
    distance_km: 16,
    elevation_m: 560,
    difficulty: 'hilly',
    emoji: '❄️',
    elevationProfile: [300,348,420,498,578,648,718,778,820,858,878,858,838,818,778,718,658,598,520,440],
  },
];

/** Approximate elevation gained (m) for a given distance ridden on a route. */
export function getElevationForDistance(route: Route, distanceRiddenKm: number): number {
  const frac = Math.min(distanceRiddenKm / route.distance_km, 1);
  return Math.round(route.elevation_m * frac);
}

/** Normalised elevation points (0–1) for the SVG chart. */
export function normaliseProfile(profile: number[]): number[] {
  const min = Math.min(...profile);
  const max = Math.max(...profile);
  const range = max - min;
  if (range === 0) return profile.map(() => 0.5);
  return profile.map(v => (v - min) / range);
}
