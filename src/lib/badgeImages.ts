// Badge image imports — maps challenge/level/achievement IDs to generated badge images

// Challenge badges
import ch1Starter from "@/assets/badges/ch1-starter.png";
import ch2Distance from "@/assets/badges/ch2-distance.png";
import ch3Endurance from "@/assets/badges/ch3-endurance.png";
import ch4Climbing from "@/assets/badges/ch4-climbing.png";
import ch5Team from "@/assets/badges/ch5-team.png";

// Level badges
import level1 from "@/assets/badges/level-1-pedal-pusher.png";
import level2 from "@/assets/badges/level-2-gear-shifter.png";
import level3 from "@/assets/badges/level-3-hill-climber.png";
import level4 from "@/assets/badges/level-4-breakaway-rider.png";
import level5 from "@/assets/badges/level-5-pace-setter.png";
import level6 from "@/assets/badges/level-6-sprint-leader.png";
import level7 from "@/assets/badges/level-7-legend.png";

// Achievement badges
import achFirstRide from "@/assets/badges/ach-first-ride.png";
import achStreak3 from "@/assets/badges/ach-streak-3.png";
import achStreak5 from "@/assets/badges/ach-streak-5.png";
import achStreak7 from "@/assets/badges/ach-streak-7.png";
import ach10Sessions from "@/assets/badges/ach-10-sessions.png";
import ach50km from "@/assets/badges/ach-50km.png";
import ach100km from "@/assets/badges/ach-100km.png";
import ach5Hours from "@/assets/badges/ach-5-hours.png";
import achClimb500 from "@/assets/badges/ach-climb-500.png";
import achSpeedDemon from "@/assets/badges/ach-speed-demon.png";
import achSchoolTop3 from "@/assets/badges/ach-school-top3.png";
import achChallengeCrusher from "@/assets/badges/ach-challenge-crusher.png";

export const CHALLENGE_BADGES: Record<string, string> = {
  "ch1-starter": ch1Starter,
  "ch2-distance": ch2Distance,
  "ch3-endurance": ch3Endurance,
  "ch4-climbing": ch4Climbing,
  "ch5-team": ch5Team,
};

export const LEVEL_BADGES: Record<string, string> = {
  "Pedal Pusher": level1,
  "Gear Shifter": level2,
  "Hill Climber": level3,
  "Breakaway Rider": level4,
  "Pace Setter": level5,
  "Sprint Leader": level6,
  "Free Wheeler Legend": level7,
};

export const ACHIEVEMENT_BADGES: Record<string, string> = {
  "first-ride": achFirstRide,
  "streak-3": achStreak3,
  "streak-5": achStreak5,
  "streak-7": achStreak7,
  "10-sessions": ach10Sessions,
  "25-sessions": ach10Sessions, // reuse 10-sessions badge
  "50km-club": ach50km,
  "100km-club": ach100km,
  "5-hours": ach5Hours,
  "climb-250": achClimb500, // reuse climb badge
  "climb-500": achClimb500,
  "climb-1000": achClimb500, // reuse climb badge
  "speed-demon": achSpeedDemon,
  "school-top3": achSchoolTop3,
  "level-up": level2, // reuse gear shifter as level-up icon
  "challenge-crusher": achChallengeCrusher,
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
