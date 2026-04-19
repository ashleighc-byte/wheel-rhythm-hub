import { Link } from "react-router-dom";
import { ArrowLeft, Download } from "lucide-react";

const PDF_URL = "/resources/ride-guide-a3.pdf";

const RideGuide = () => {
  return (
    <div className="min-h-screen bg-muted">
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <Link
            to="/resources"
            className="inline-flex items-center gap-2 font-display uppercase tracking-wider text-sm text-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Resources
          </Link>
          <a
            href={PDF_URL}
            download="freewheeler-ride-guide-a3.pdf"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-display uppercase tracking-wider text-sm px-4 py-2 rounded-md hover:bg-primary/90"
          >
            <Download className="h-4 w-4" /> Download PDF
          </a>
        </div>

        <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider text-foreground mb-2">
          Ride Guide · A3 Print
        </h1>
        <p className="font-body text-sm text-muted-foreground mb-6">
          Print at A3 and display next to the bikes. Use the download button for
          the highest-quality file.
        </p>

        <div className="bg-card border-[3px] border-secondary shadow-[4px_4px_0px_hsl(var(--brand-dark))] overflow-hidden">
          <object
            data={PDF_URL}
            type="application/pdf"
            className="w-full"
            style={{ height: "85vh" }}
          >
            <div className="p-6 text-center font-body text-sm">
              Your browser can't preview PDFs.{" "}
              <a href={PDF_URL} className="underline text-primary">
                Download the Ride Guide instead.
              </a>
            </div>
          </object>
        </div>
      </div>
    </div>
  );
};

export default RideGuide;
