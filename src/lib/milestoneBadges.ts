import badgeFirstRide from "@/assets/badges/badge-first-ride.png";
import badge10Sessions from "@/assets/badges/badge-10-sessions.png";
import badge25Sessions from "@/assets/badges/badge-25-sessions.png";
import badge50km from "@/assets/badges/badge-50km.png";
import badge100km from "@/assets/badges/badge-100km.png";
import badgeSpeed20 from "@/assets/badges/badge-speed20.png";
import badgeRideToday from "@/assets/badges/badge-ride-today.png";
import badge20min from "@/assets/badges/badge-20min.png";
import badge3RidesWeek from "@/assets/badges/badge-3rides-week.png";

export const MILESTONE_BADGE_IMAGES: Record<string, string> = {
  "daily-ride": badgeRideToday,
  "daily-20min": badge20min,
  "weekly-3rides": badge3RidesWeek,
  "milestone-first": badgeFirstRide,
  "milestone-10sess": badge10Sessions,
  "milestone-25sess": badge25Sessions,
  "milestone-50km": badge50km,
  "milestone-100km": badge100km,
  "milestone-speed20": badgeSpeed20,
};

export function getMilestoneBadgeImage(milestoneId: string): string | undefined {
  return MILESTONE_BADGE_IMAGES[milestoneId];
}
