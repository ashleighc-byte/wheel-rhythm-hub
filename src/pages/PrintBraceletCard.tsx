import { useSearchParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import brandLogo from "@/assets/fw-logo-oval.png";

const PrintBraceletCard = () => {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const name = params.get("name") ?? "Student Name";
  const school = params.get("school") ?? "";
  const tapUrl = `https://freewheelerleague.com/tap/${token}`;

  return (
    <div className="min-h-screen bg-muted">
      <style>{`
        @page { size: A6; margin: 0; }
        @media print {
          html, body { background: white !important; margin: 0; padding: 0; }
          .no-print { display: none !important; }
          .print-card {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            page-break-after: always;
          }
        }
        .print-card {
          width: 105mm;
          height: 148mm;
        }
      `}</style>

      <div className="no-print container mx-auto max-w-3xl px-4 py-8 flex flex-col items-center gap-4">
        <div className="flex items-center justify-between w-full">
          <h1 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
            Bracelet Card Preview
          </h1>
          <Button
            onClick={() => window.print()}
            className="font-display uppercase tracking-wider"
          >
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
        </div>
        <p className="font-body text-sm text-muted-foreground self-start">
          A6 (105 × 148 mm). Use browser print → set scale to 100%, margins: None.
        </p>
      </div>

      <div className="flex justify-center pb-12 print:pb-0">
        <div className="print-card bg-white border-[3px] border-secondary shadow-[4px_4px_0px_hsl(var(--brand-dark))] flex flex-col items-center justify-between p-4">
          {/* Logo */}
          <img
            src={brandLogo}
            alt="Freewheeler"
            className="h-16 w-auto object-contain"
          />

          {/* Name + school */}
          <div className="text-center">
            <div className="font-display text-2xl font-bold uppercase tracking-wider text-foreground leading-tight">
              {name}
            </div>
            {school && (
              <div className="font-body text-xs text-muted-foreground mt-1">
                {school}
              </div>
            )}
          </div>

          {/* QR */}
          <div className="border-[2px] border-secondary p-2 bg-white">
            <QRCodeSVG value={tapUrl} size={140} level="M" includeMargin={false} />
          </div>

          {/* Instruction */}
          <p className="text-center font-body text-[10px] leading-snug text-foreground px-2">
            Tap your NFC bracelet or scan this QR code to log in to Freewheeler.
          </p>

          {/* Footer */}
          <div className="font-display text-[9px] uppercase tracking-widest text-muted-foreground">
            freewheelerleague.com
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrintBraceletCard;
