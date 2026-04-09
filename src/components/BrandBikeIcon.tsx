import { cn } from "@/lib/utils";

interface BrandBikeIconProps {
  className?: string;
  variant?: "default" | "accent" | "muted";
}

/**
 * Brand cyclist icon extracted from the Free Wheeler logo.
 * Replaces generic Lucide Bike icons throughout the app.
 */
const BrandBikeIcon = ({ className, variant = "default" }: BrandBikeIconProps) => {
  const colorClass = variant === "accent"
    ? "text-accent"
    : variant === "muted"
      ? "text-muted-foreground/30"
      : "currentColor";

  return (
    <svg
      viewBox="0 0 120 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("inline-block", className)}
      aria-hidden="true"
    >
      {/* Rear wheel */}
      <circle cx="30" cy="72" r="22" stroke="currentColor" strokeWidth="6" fill="none" />
      <circle cx="30" cy="72" r="8" fill="currentColor" />

      {/* Front wheel */}
      <circle cx="90" cy="72" r="22" stroke="currentColor" strokeWidth="6" fill="none" />
      <circle cx="90" cy="72" r="8" fill="currentColor" />

      {/* Frame – swooping line from rear axle through body to front */}
      <path
        d="M30 72 C40 72, 42 40, 55 35 C68 30, 75 45, 90 72"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Handlebar arm */}
      <path
        d="M75 52 C82 38, 88 35, 95 38"
        stroke="currentColor"
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />

      {/* Rider body – torso leaning forward */}
      <path
        d="M48 42 C52 28, 62 22, 72 28"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />

      {/* Rider head */}
      <circle cx="76" cy="20" r="9" fill="currentColor" />
    </svg>
  );
};

export default BrandBikeIcon;
