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

export const MILESTONE_BADGE_IMAGES: Record<string, string> = {
  "daily-ride": badgeShieldBW,
  "daily-20min": badgePentagonStripe,
  "weekly-3rides": badgeCrestStripe,
  "milestone-first": badgeCircleBike,
  "milestone-10sess": badgeShieldDark,
  "milestone-25sess": badgeArchStripe,
  "milestone-50km": badgeCircleDark,
  "milestone-100km": badgeShieldDiagonal,
  "milestone-speed20": badgeShieldDark2,
};

export function getMilestoneBadgeImage(milestoneId: string): string | undefined {
  return MILESTONE_BADGE_IMAGES[milestoneId];
}
