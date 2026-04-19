import { Link } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";
import socialStory from "@/assets/social-story-insta.jpg";
import socialSquare from "@/assets/social-square.jpg";
import socialTeaser from "@/assets/social-teaser.mp4";

interface Asset {
  label: string;
  dimensions: string;
  src: string;
  filename: string;
  type: "image" | "video";
}

const ASSETS: Asset[] = [
  {
    label: "Instagram Story / Reel",
    dimensions: "1080 × 1920",
    src: socialStory,
    filename: "freewheeler-social-story.jpg",
    type: "image",
  },
  {
    label: "Square Post",
    dimensions: "1200 × 1000",
    src: socialSquare,
    filename: "freewheeler-social-square.jpg",
    type: "image",
  },
  {
    label: "Teaser Video",
    dimensions: "MP4 · Short loop",
    src: socialTeaser,
    filename: "freewheeler-social-teaser.mp4",
    type: "video",
  },
];

const SocialGraphic = () => {
  return (
    <div className="min-h-screen bg-muted">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/resources"
            className="inline-flex items-center gap-2 font-display uppercase tracking-wider text-sm text-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Resources
          </Link>
        </div>

        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider text-foreground mb-2">
          Social Media Launch Graphics
        </h1>
        <p className="font-body text-sm text-muted-foreground mb-8">
          Download and share with your school community — tag @sportwaikato.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ASSETS.map((asset) => (
            <div
              key={asset.filename}
              className="bg-card border-[3px] border-secondary shadow-[4px_4px_0px_hsl(var(--brand-dark))] flex flex-col"
            >
              <div className="bg-muted aspect-[4/5] flex items-center justify-center overflow-hidden">
                {asset.type === "image" ? (
                  <img
                    src={asset.src}
                    alt={asset.label}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={asset.src}
                    className="w-full h-full object-contain"
                    controls
                    muted
                    loop
                    playsInline
                  />
                )}
              </div>
              <div className="p-4 flex flex-col gap-3">
                <div>
                  <p className="font-display uppercase tracking-wider text-sm text-foreground font-bold">
                    {asset.label}
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    {asset.dimensions}
                  </p>
                </div>
                <a
                  href={asset.src}
                  download={asset.filename}
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground font-display uppercase tracking-wider text-sm px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Download className="h-4 w-4" /> Download
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SocialGraphic;
