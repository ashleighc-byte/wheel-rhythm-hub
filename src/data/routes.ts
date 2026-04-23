export interface Route {
  id: string;
  name: string;
  region: string;
  description: string;
  distance_km: number;
  elevation_m: number;
  difficulty: 'flat' | 'rolling' | 'hilly';
  /** 20 sample elevation points (absolute metres) for the canvas terrain */
  elevationProfile: number[];
  emoji: string;
  /**
   * Key GPS waypoints [lat, lng] — Option B hand-placed approximations.
   * Replace each array with a real GPX polyline when upgrading to Option A.
   */
  waypoints: [number, number][];
}

/**
 * Linearly interpolate a lat/lng position along the waypoint polyline.
 * frac = 0 → start, frac = 1 → finish.
 */
export function interpolateWaypoint(
  waypoints: [number, number][],
  frac: number,
): [number, number] {
  if (!waypoints.length) return [0, 0];
  if (frac <= 0) return waypoints[0];
  if (frac >= 1) return waypoints[waypoints.length - 1];
  const raw = frac * (waypoints.length - 1);
  const lo = Math.floor(raw);
  const hi = Math.min(lo + 1, waypoints.length - 1);
  const t = raw - lo;
  return [
    waypoints[lo][0] + (waypoints[hi][0] - waypoints[lo][0]) * t,
    waypoints[lo][1] + (waypoints[hi][1] - waypoints[lo][1]) * t,
  ];
}

export const ROUTES: Route[] = [
  // ── Waikato ──────────────────────────────────────────────────────────────────
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
    waypoints: [
      [-37.742, 175.258], // Ryan Reserve, Riverlea
      [-37.751, 175.261],
      [-37.760, 175.264],
      [-37.769, 175.265],
      [-37.778, 175.265],
      [-37.787, 175.264], // Bader Bridge
      [-37.796, 175.264],
      [-37.804, 175.264],
      [-37.812, 175.264], // Horotiu end
    ],
  },
  {
    id: 'taupo-lakefront',
    name: 'Taupō Lakefront',
    region: 'Waikato',
    description: "Cruise along the edge of New Zealand's largest lake.",
    distance_km: 10,
    elevation_m: 60,
    difficulty: 'flat',
    emoji: '🏔️',
    elevationProfile: [357,358,360,362,363,362,360,358,357,360,363,365,362,360,358,357,360,362,360,358],
    waypoints: [
      [-38.685, 176.070], // Taupo Boat Harbour
      [-38.689, 176.058],
      [-38.693, 176.046],
      [-38.697, 176.034],
      [-38.701, 176.022],
      [-38.705, 176.010],
      [-38.708, 175.998],
      [-38.711, 175.986], // Wairakei end (~10 km)
    ],
  },
  {
    id: 'hamilton-city-sprint',
    name: 'Hamilton City Sprint',
    region: 'Waikato',
    description: "Fast laps through Hamilton's riverside streets. Great for speed hunters.",
    distance_km: 6,
    elevation_m: 20,
    difficulty: 'flat',
    emoji: '⚡',
    elevationProfile: [40,42,43,44,42,41,40,42,43,44,43,41,40,42,44,43,41,40,42,41],
    waypoints: [
      [-37.787, 175.279], // Hamilton Gardens
      [-37.781, 175.271],
      [-37.776, 175.261], // Riverside
      [-37.772, 175.255],
      [-37.775, 175.265],
      [-37.779, 175.275],
      [-37.784, 175.282],
      [-37.787, 175.279], // Back to start
    ],
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
    waypoints: [
      [-37.882, 175.470], // Cambridge town
      [-37.891, 175.482],
      [-37.901, 175.494],
      [-37.912, 175.500],
      [-37.922, 175.492],
      [-37.928, 175.478],
      [-37.920, 175.462],
      [-37.909, 175.455],
      [-37.897, 175.458],
      [-37.887, 175.462],
      [-37.882, 175.470], // Return
    ],
  },

  // ── Bay of Plenty ─────────────────────────────────────────────────────────────
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
    waypoints: [
      [-38.165, 176.267], // Redwoods entrance (Sala St)
      [-38.172, 176.277],
      [-38.181, 176.284],
      [-38.191, 176.281],
      [-38.199, 176.270],
      [-38.204, 176.256],
      [-38.198, 176.242],
      [-38.188, 176.237],
      [-38.176, 176.244],
      [-38.167, 176.255],
      [-38.165, 176.267], // Back to entrance
    ],
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
    waypoints: [
      [-37.627, 176.184], // Main Beach start
      [-37.632, 176.193], // Around base NE
      [-37.638, 176.201],
      [-37.643, 176.211], // Pilot Bay
      [-37.638, 176.220],
      [-37.628, 176.221], // Westside
      [-37.618, 176.214],
      [-37.615, 176.201],
      [-37.618, 176.189],
      [-37.624, 176.183],
      [-37.627, 176.184], // Return
    ],
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
    waypoints: [
      [-37.700, 176.290], // Papamoa Beach
      [-37.703, 176.308],
      [-37.705, 176.326],
      [-37.707, 176.344],
      [-37.709, 176.362],
      [-37.711, 176.380],
      [-37.713, 176.398], // Ohope direction (~10 km)
    ],
  },

  // ── Hawke's Bay ───────────────────────────────────────────────────────────────
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
    waypoints: [
      [-39.662, 176.878], // Havelock North village
      [-39.672, 176.888],
      [-39.683, 176.891], // Craggy Range area
      [-39.694, 176.882],
      [-39.702, 176.870], // Te Mata Peak area
      [-39.698, 176.856],
      [-39.686, 176.851],
      [-39.675, 176.857],
      [-39.665, 176.865],
      [-39.662, 176.878], // Return
    ],
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
    waypoints: [
      [-39.490, 176.912], // Napier city / Clive Square
      [-39.502, 176.916],
      [-39.515, 176.918],
      [-39.527, 176.920],
      [-39.539, 176.922],
      [-39.551, 176.924],
      [-39.563, 176.925],
      [-39.574, 176.926], // Bay View direction (~8 km)
    ],
  },

  // ── Coromandel (listed under Waikato region) ──────────────────────────────────
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
    waypoints: [
      [-36.760, 175.503], // Coromandel town
      [-36.770, 175.517],
      [-36.780, 175.529],
      [-36.790, 175.533], // Buffalo Beach ridge
      [-36.800, 175.524],
      [-36.808, 175.511],
      [-36.815, 175.496], // Highland section
      [-36.808, 175.480],
      [-36.797, 175.470],
      [-36.782, 175.477],
      [-36.771, 175.490],
      [-36.760, 175.503], // Return
    ],
  },

  // ── Manawatū-Whanganui ────────────────────────────────────────────────────────
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
    waypoints: [
      [-38.989, 175.812], // Turangi
      [-39.002, 175.796],
      [-39.016, 175.778],
      [-39.030, 175.762],
      [-39.044, 175.746],
      [-39.057, 175.730],
      [-39.069, 175.716],
      [-39.080, 175.703],
      [-39.090, 175.691],
      [-39.099, 175.679], // End point (~18 km)
    ],
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
    waypoints: [
      [-39.202, 175.566], // Whakapapa Village
      [-39.210, 175.554],
      [-39.219, 175.542],
      [-39.228, 175.530],
      [-39.237, 175.520],
      [-39.247, 175.513],
      [-39.255, 175.507],
      [-39.262, 175.502],
      [-39.268, 175.498], // Highest point
      [-39.262, 175.503],
      [-39.253, 175.510],
      [-39.243, 175.518],
      [-39.232, 175.528],
      [-39.220, 175.540],
      [-39.210, 175.552],
      [-39.202, 175.566], // Return
    ],
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
