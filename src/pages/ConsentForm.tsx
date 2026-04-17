import { Link } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import logo from "@/assets/fw-logo-oval.png";

const Line = ({ width = "60%" }: { width?: string }) => (
  <span
    className="inline-block border-b border-black align-bottom"
    style={{ width, height: "1.1em" }}
  />
);

const Box = () => (
  <span
    className="inline-block border border-black align-middle mr-2"
    style={{ width: "14px", height: "14px" }}
  />
);

const ConsentForm = () => {
  return (
    <div className="min-h-screen bg-muted">
      <style>{`
        @page { size: A4 portrait; margin: 15mm; }
        @media print {
          html, body { background: white !important; margin: 0; padding: 0; color: black !important; }
          .no-print { display: none !important; }
          .consent-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: auto !important;
          }
          .consent-page * { color: black !important; }
        }
        .consent-page {
          width: 210mm;
          min-height: 297mm;
        }
      `}</style>

      {/* Screen-only controls */}
      <div className="no-print container mx-auto max-w-4xl px-4 py-6 flex items-center justify-between">
        <Link
          to="/resources"
          className="inline-flex items-center gap-2 font-display uppercase tracking-wider text-sm text-foreground hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Resources
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground font-display uppercase tracking-wider text-sm px-4 py-2 rounded-md hover:bg-primary/90"
        >
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </button>
      </div>

      {/* Page */}
      <div className="flex justify-center pb-12 print:pb-0">
        <div className="consent-page bg-white text-black p-12 shadow-lg font-body text-[11pt] leading-relaxed">
          {/* Header */}
          <header className="flex items-start gap-4 border-b-2 border-black pb-4">
            <img src={logo} alt="Freewheeler" className="h-20 w-auto object-contain" />
            <div className="flex-1">
              <h1 className="font-display font-black uppercase tracking-wider text-2xl text-black leading-tight">
                Student &amp; Caregiver Consent Form
              </h1>
              <p className="text-sm mt-1">
                Season: 31 August – 6 November 2026 &nbsp;|&nbsp; Delivered by Sport Waikato
              </p>
            </div>
          </header>

          {/* Section 1 */}
          <section className="mt-5">
            <h2 className="font-display font-bold uppercase tracking-wide text-base border-b border-black pb-1 mb-2">
              Section 1 — About Freewheeler
            </h2>
            <p>
              Freewheeler is a cycling league for secondary school students, delivered by Sport
              Waikato. Students ride Wattbike Proton smart bikes at school using the MyWhoosh
              app and compete on a points-based leaderboard over an 8-week season.
              Participation is voluntary and there is no fee.
            </p>
          </section>

          {/* Section 2 */}
          <section className="mt-5">
            <h2 className="font-display font-bold uppercase tracking-wide text-base border-b border-black pb-1 mb-3">
              Section 2 — Student Details
            </h2>
            <div className="space-y-3">
              <div>
                Student First Name: <Line width="65%" />
              </div>
              <div>
                Student Last Initial (first letter of surname only): <Line width="10%" />
              </div>
              <div>
                Year Level: <Line width="20%" />
              </div>
              <div>
                School: <Line width="70%" />
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="mt-5">
            <h2 className="font-display font-bold uppercase tracking-wide text-base border-b border-black pb-1 mb-2">
              Section 3 — Privacy and Data
            </h2>
            <p>
              Sport Waikato collects only: first name, last initial, year level, and school.
              No email address, full surname, or caregiver contact details are stored by Sport
              Waikato. All data is held securely and deleted within 90 days of the season
              ending (by 4 February 2027), in accordance with the Privacy Act 2020 and Sport
              Waikato's Karawhiua Digital Safety Management Plan.
            </p>
            <p className="mt-2">
              Students interact with MyWhoosh (a third-party cycling simulation app). Students
              must not share personal information on the platform and must behave respectfully.
            </p>
          </section>

          {/* Section 4 */}
          <section className="mt-5">
            <h2 className="font-display font-bold uppercase tracking-wide text-base border-b border-black pb-1 mb-3">
              Section 4 — Consent Statement
            </h2>
            <ul className="space-y-2">
              <li><Box /> I have read and understood the information above</li>
              <li><Box /> I consent to my child participating in the Freewheeler Cycling League Season 2026</li>
              <li><Box /> I understand that Sport Waikato will hold my child's first name, last initial, year level, and school for the purpose of running the league</li>
              <li><Box /> I understand all data will be deleted within 90 days of the season ending</li>
            </ul>

            <div className="mt-5 space-y-5">
              <div>
                Caregiver Name: <Line width="65%" />
              </div>
              <div>
                Relationship to student: <Line width="55%" />
              </div>
              <div style={{ marginTop: "10mm" }}>
                Signature: <Line width="60%" />
              </div>
              <div style={{ marginTop: "8mm" }}>
                Date: <Line width="40%" />
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="mt-6">
            <h2 className="font-display font-bold uppercase tracking-wide text-base border-b border-black pb-1 mb-2">
              Section 5 — Return Instructions
            </h2>
            <p>
              Please return this completed form to <Line width="40%" /> (teacher) at your
              school by <Line width="25%" />.
            </p>
            <p className="mt-2">
              Questions? Visit freewheelerleague.com or contact <Line width="40%" />.
            </p>
          </section>

          {/* Footer */}
          <footer className="mt-8 pt-3 border-t border-black text-center text-[9pt]">
            Freewheeler Cycling League · Delivered by Sport Waikato · freewheelerleague.com
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ConsentForm;
