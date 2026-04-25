import type { GameRoute } from '@/components/ride/CyclingGame';

export const GAME_ROUTES: GameRoute[] = [
  { id: 'waikato-river',      name: 'Waikato River Trail',       dist: 8,  elevGain: 40,  terrain: 'flat',    region: 'Waikato',              theme: 'river'   },
  { id: 'taupo-lakefront',    name: 'Taupo Lakefront',           dist: 10, elevGain: 60,  terrain: 'rolling', region: 'Waikato',              theme: 'lake'    },
  { id: 'hamilton-sprint',    name: 'Hamilton City Sprint',      dist: 6,  elevGain: 20,  terrain: 'flat',    region: 'Waikato',              theme: 'city'    },
  { id: 'cambridge-country',  name: 'Cambridge Countryside',     dist: 11, elevGain: 110, terrain: 'rolling', region: 'Waikato',              theme: 'farmland'},
  { id: 'rotorua-redwoods',   name: 'Rotorua Redwoods Loop',     dist: 15, elevGain: 180, terrain: 'rolling', region: 'Bay of Plenty',        theme: 'forest'  },
  { id: 'mt-maunganui',       name: 'Mount Maunganui Coastal',   dist: 12, elevGain: 120, terrain: 'rolling', region: 'Bay of Plenty',        theme: 'coastal' },
  { id: 'bop-beachfront',     name: 'Bay of Plenty Beachfront',  dist: 10, elevGain: 30,  terrain: 'flat',    region: 'Bay of Plenty',        theme: 'beach'   },
  { id: 'hawkes-bay-wine',    name: "Hawke's Bay Wine Country",  dist: 12, elevGain: 90,  terrain: 'rolling', region: "Hawke's Bay",          theme: 'vineyard'},
  { id: 'napier-coastal',     name: 'Napier Coastal Cruise',     dist: 8,  elevGain: 25,  terrain: 'flat',    region: "Hawke's Bay",          theme: 'coastal' },
  { id: 'coromandel',         name: 'Coromandel Peninsula',      dist: 14, elevGain: 280, terrain: 'hilly',   region: 'Waikato',              theme: 'mountain'},
  { id: 'tongariro',          name: 'Tongariro Challenge',       dist: 18, elevGain: 420, terrain: 'hilly',   region: 'Manawatu-Whanganui',   theme: 'volcanic'},
  { id: 'whakapapa',          name: 'Whakapapa Climb',           dist: 16, elevGain: 560, terrain: 'hilly',   region: 'Manawatu-Whanganui',   theme: 'mountain'},
];
