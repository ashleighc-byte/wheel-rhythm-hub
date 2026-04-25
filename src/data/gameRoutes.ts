import type { GameRoute } from '@/components/ride/CyclingGame';

export const GAME_ROUTES: GameRoute[] = [
  { id: 'waikato-river',     name: 'Waikato River Trail',       desc: 'Smooth riverside cruise',    dist: 8,  elevGain: 40,  terrain: 'flat',    region: 'Waikato',            theme: 'river'   },
  { id: 'taupo-lakefront',   name: 'Taupo Lakefront',           desc: 'Lakeside rolling hills',     dist: 10, elevGain: 60,  terrain: 'rolling', region: 'Waikato',            theme: 'lake'    },
  { id: 'hamilton-sprint',   name: 'Hamilton City Sprint',      desc: 'Fast city laps',             dist: 6,  elevGain: 20,  terrain: 'flat',    region: 'Waikato',            theme: 'city'    },
  { id: 'cambridge-country', name: 'Cambridge Countryside',     desc: 'Farmland rollers',           dist: 11, elevGain: 110, terrain: 'rolling', region: 'Waikato',            theme: 'farmland'},
  { id: 'rotorua-redwoods',  name: 'Rotorua Redwoods Loop',     desc: 'Forest winding roads',       dist: 15, elevGain: 180, terrain: 'rolling', region: 'Bay of Plenty',      theme: 'forest'  },
  { id: 'mt-maunganui',      name: 'Mount Maunganui Coastal',   desc: 'Coastal climb',              dist: 12, elevGain: 120, terrain: 'rolling', region: 'Bay of Plenty',      theme: 'coastal' },
  { id: 'bop-beachfront',    name: 'Bay of Plenty Beachfront',  desc: 'Beachside flat',             dist: 10, elevGain: 30,  terrain: 'flat',    region: 'Bay of Plenty',      theme: 'beach'   },
  { id: 'hawkes-bay-wine',   name: "Hawke's Bay Wine Country",  desc: 'Vineyard undulations',       dist: 12, elevGain: 90,  terrain: 'rolling', region: "Hawke's Bay",        theme: 'vineyard'},
  { id: 'napier-coastal',    name: 'Napier Coastal Cruise',     desc: 'Art Deco seaside',           dist: 8,  elevGain: 25,  terrain: 'flat',    region: "Hawke's Bay",        theme: 'coastal' },
  { id: 'coromandel',        name: 'Coromandel Peninsula',      desc: 'Big climbs, big views',      dist: 14, elevGain: 280, terrain: 'hilly',   region: 'Waikato',            theme: 'mountain'},
  { id: 'tongariro',         name: 'Tongariro Challenge',       desc: 'Volcanic plateau',           dist: 18, elevGain: 420, terrain: 'hilly',   region: 'Manawatu-Whanganui', theme: 'volcanic'},
  { id: 'whakapapa',         name: 'Whakapapa Climb',           desc: 'Ruapehu ascent',             dist: 16, elevGain: 560, terrain: 'hilly',   region: 'Manawatu-Whanganui', theme: 'mountain'},
];
