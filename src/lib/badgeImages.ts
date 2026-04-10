// Badge image imports — maps challenge/level/achievement IDs to new brand badge images

import badgeShieldBW from "@/assets/badges/badge-shield-bw.png";
import badgeShieldDark from "@/assets/badges/badge-shield-dark.png";
import badgeShieldDark2 from "@/assets/badges/badge-shield-dark2.png";
import badgeCrestStripe from "@/assets/badges/badge-crest-stripe.png";
import badgePentagonStripe from "@/assets/badges/badge-pentagon-stripe.png";
import badgeArchStripe from "@/assets/badges/badge-arch-stripe.png";
import badgeCircleBike from "@/assets/badges/badge-circle-bike.png";
import badgeCircleLight from "@/assets/badges/badge-circle-light.png";
import badgeCircleDark from "@/assets/badges/badge-circle-dark.png";
import badgeShieldDiagonal from "@/assets/badges/badge-shield-diagonal.png";

// Challenge badges
export const CHALLENGE_BADGES: Record<string, string> = {
  "ch1-starter": badgeCircleBike,
  "ch2-distance": badgeShieldDark,
  "ch3-endurance": badgeCrestStripe,
  "ch4-climbing": badgeShieldDiagonal,
  "ch5-team": badgePentagonStripe,
};

// Level badges
export const LEVEL_BADGES: Record<string, string> = {
  "Pedal Pusher": badgeCircleLight,
  "Gear Shifter": badgeCircleBike,
  "Hill Climber": badgeCircleDark,
  "Breakaway Rider": badgeShieldBW,
  "Pace Setter": badgeShieldDark,
  "Sprint Leader": badgeCrestStripe,
  "Free Wheeler Legend": badgeShieldDiagonal,
};

// Achievement badges
export const ACHIEVEMENT_BADGES: Record<string, string> = {
  "first-ride": badgeCircleBike,
  "streak-3": badgeArchStripe,
  "streak-5": badgePentagonStripe,
  "streak-7": badgeCrestStripe,
  "10-sessions": badgeShieldDark,
  "25-sessions": badgeShieldDark2,
  "50km-club": badgeCircleDark,
  "100km-club": badgeShieldDiagonal,
  "5-hours": badgeShieldBW,
  "climb-250": badgeCircleLight,
  "climb-500": badgePentagonStripe,
  "climb-1000": badgeCrestStripe,
  "speed-demon": badgeShieldDark2,
  "school-top3": badgeArchStripe,
  "level-up": badgeCircleBike,
  "challenge-crusher": badgeShieldDiagonal,
};

export function getChallengeBadge(challengeId: string): string | undefined {
  return CHALLENGE_BADGES[challengeId];
}

export function getLevelBadge(levelName: string): string | undefined {
  return LEVEL_BADGES[levelName];
}

export function getAchievementBadge(achievementId: string): string | undefined {
  return ACHIEVEMENT_BADGES[achievementId];
}
