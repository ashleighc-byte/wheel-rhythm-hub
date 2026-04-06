import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StudentQR {
  name: string;
  token: string;
}

interface StudentQRCodesProps {
  students: StudentQR[];
  schoolName: string;
  onClose: () => void;
}

const BASE_URL = "https://freewheeler.lovable.app/tap/";

export default function StudentQRCodes({ students, schoolName, onClose }: StudentQRCodesProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>QR Codes – ${schoolName}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 12mm; }
        h1 { font-size: 16px; text-align: center; margin-bottom: 6mm; text-transform: uppercase; letter-spacing: 2px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8mm; }
        .card { border: 2px solid #333; padding: 4mm; text-align: center; break-inside: avoid; }
        .card svg { width: 100%; max-width: 120px; height: auto; }
        .name { font-size: 13px; font-weight: 700; margin-top: 3mm; text-transform: uppercase; }
        .hint { font-size: 9px; color: #666; margin-top: 1mm; }
        @media print { body { padding: 10mm; } }
      </style></head><body>`);
    win.document.write(content.innerHTML);
    win.document.write("</body></html>");
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 400);
  };

  const validStudents = students.filter((s) => s.token);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-background/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl my-8">
        {/* Toolbar */}
        <div className="mb-4 flex items-center justify-between rounded-none border-[3px] border-secondary bg-card p-4 shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
          <h2 className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
            Student QR Code Backup Sheet
          </h2>
          <div className="flex gap-2">
            <Button onClick={handlePrint} className="gap-2 font-display text-xs uppercase tracking-wider">
              <Printer className="h-4 w-4" /> Print
            </Button>
            <Button variant="outline" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Printable content */}
        <div ref={printRef} className="border-[3px] border-secondary bg-white p-8 shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
          <h1 style={{ fontSize: "16px", textAlign: "center", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "2px", fontFamily: "Arial, sans-serif" }}>
            {schoolName} — QR Code Backup
          </h1>

          {validStudents.length === 0 ? (
            <p style={{ textAlign: "center", color: "#666", fontFamily: "Arial, sans-serif" }}>
              No students have NFC tokens assigned yet.
            </p>
          ) : (
            <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
              {validStudents.map((s) => (
                <div
                  key={s.token}
                  className="card"
                  style={{ border: "2px solid #333", padding: "12px", textAlign: "center", breakInside: "avoid" }}
                >
                  <QRCodeSVG value={`${BASE_URL}${s.token}`} size={120} level="M" />
                  <div style={{ fontSize: "13px", fontWeight: 700, marginTop: "8px", textTransform: "uppercase", fontFamily: "Arial, sans-serif" }}>
                    {s.name}
                  </div>
                  <div style={{ fontSize: "9px", color: "#666", marginTop: "4px", fontFamily: "Arial, sans-serif" }}>
                    Scan to log a session
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
