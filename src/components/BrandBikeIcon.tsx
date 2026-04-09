import { cn } from "@/lib/utils";
import brandBikeYellow from "@/assets/brand-bike-yellow.png";
import brandBikeBlack from "@/assets/brand-bike-black.png";

interface BrandBikeIconProps {
  className?: string;
  variant?: "default" | "accent" | "muted" | "yellow" | "black";
}

/**
 * Brand cyclist icon from the Free Wheeler logo.
 * "yellow" and "black" variants use the official PNG assets.
 * Other variants render an inline SVG for colour flexibility.
 */
const BrandBikeIcon = ({ className, variant = "yellow" }: BrandBikeIconProps) => {
  // PNG variants – use actual brand asset images
  if (variant === "yellow" || variant === "black") {
    const src = variant === "yellow" ? brandBikeYellow : brandBikeBlack;
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className={cn("inline-block object-contain", className)}
      />
    );
  }

  // SVG fallback for currentColor-based tinting
  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("inline-block", className)}
      aria-hidden="true"
    >
      <circle cx="30" cy="72" r="22" stroke="currentColor" strokeWidth="6" fill="none" />
      <circle cx="30" cy="72" r="8" fill="currentColor" />
      <circle cx="90" cy="72" r="22" stroke="currentColor" strokeWidth="6" fill="none" />
      <circle cx="90" cy="72" r="8" fill="currentColor" />
      <path d="M30 72 C40 72, 42 40, 55 35 C68 30, 75 45, 90 72" stroke="currentColor" strokeWidth="7" strokeLinecap="round" fill="none" />
      <path d="M75 52 C82 38, 88 35, 95 38" stroke="currentColor" strokeWidth="6" strokeLinecap="round" fill="none" />
      <path d="M48 42 C52 28, 62 22, 72 28" stroke="currentColor" strokeWidth="7" strokeLinecap="round" fill="none" />
      <circle cx="76" cy="20" r="9" fill="currentColor" />
    </svg>
  );
};

export default BrandBikeIcon;
