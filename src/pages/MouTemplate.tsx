import { Link } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import logo from "@/assets/fw-logo-oval.png";

const Line = ({ width = "60%" }: { width?: string }) => (
  <span
    className="inline-block border-b border-black align-bottom"
    style={{ width, height: "1.1em" }}
  />
);

const Clause = ({ number, title, children }: { number: string; title: string; children: React.ReactNode }) => (
  <section className="mt-5 break-inside-avoid">
    <h2 className="font-display font-bold uppercase tracking-wide text-base border-b border-black pb-1 mb-2">
      Clause {number} — {title}
    </h2>
    <div className="space-y-2">{children}</div>
  </section>
);

const MouTemplate = () => {
  return (
    <div className="min-h-screen bg-muted">
      <style>{`
        @page { size: A4 portrait; margin: 18mm; }
        @media print {
          html, body { background: white !important; margin: 0; padding: 0; color: black !important; }
          .no-print { display: none !important; }
          .mou-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: auto !important;
          }
          .mou-page * { color: black !important; }
          .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
        }
        .mou-page {
          width: 210mm;
          min-height: 297mm;
        }
      `}</style>

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

      <div className="flex justify-center pb-12 print:pb-0">
        <div className="mou-page bg-white text-black p-12 shadow-lg font-body text-[11pt] leading-relaxed">
          <header className="flex items-start gap-4 border-b-2 border-black pb-4">
            <img src={logo} alt="Freewheeler" className="h-20 w-auto object-contain" />
            <div className="flex-1">
              <h1 className="font-display font-black uppercase tracking-wider text-2xl text-black leading-tight">
                Memorandum of Understanding
              </h1>
              <p className="text-sm mt-1">Freewheeler Cycling League — Season 2026</p>
            </div>
          </header>

          <section className="mt-5">
            <h2 className="font-display font-bold uppercase tracking-wide text-base border-b border-black pb-1 mb-2">
              Parties
            </h2>
            <p>This Memorandum of Understanding is between:</p>
            <p className="mt-2">
              <strong>Sport Waikato</strong> ("Sport Waikato"), and{" "}
              <span className="inline-block border-b border-black px-1 min-w-[200px]">
                <strong>[SCHOOL NAME]</strong>
              </span>{" "}
              ("the School").
            </p>
          </section>

          <Clause number="1" title="Purpose">
            <p>
              This MoU establishes the terms under which the School will participate in the
              Freewheeler Cycling League pilot season (31 August – 6 November 2026), delivered
              by Sport Waikato.
            </p>
          </Clause>

          <Clause number="2" title="Sport Waikato Will">
            <p><strong>2.1</strong> Provide on loan to the School for the season duration: 2 x Wattbike Proton smart bikes, 2 x iPads pre-loaded with MyWhoosh, 1 x power multibox, 1 x 5m extension lead, and NFC bracelets for each registered student.</p>
            <p><strong>2.2</strong> Deliver and collect equipment at agreed dates.</p>
            <p><strong>2.3</strong> Provide onboarding support, teacher resources, and promotional materials.</p>
            <p><strong>2.4</strong> Operate the freewheelerleague.com platform and manage the league season.</p>
            <p><strong>2.5</strong> Create NFC login tokens and starter packs for consented students.</p>
            <p><strong>2.6</strong> Hold student data securely and delete all personal data within 90 days of the season ending.</p>
          </Clause>

          <Clause number="3" title="The School Will">
            <p><strong>3.1</strong> Promote the Freewheeler opportunity to Year 9-13 students.</p>
            <p><strong>3.2</strong> Collect signed Student &amp; Caregiver Consent Forms before any student participates.</p>
            <p><strong>3.3</strong> Send Sport Waikato a list of consented students (first name, last initial, year level only). The school retains signed consent forms.</p>
            <p><strong>3.4</strong> Store equipment securely. Report any damage or faults to Sport Waikato promptly.</p>
            <p><strong>3.5</strong> Ensure students use the equipment safely and respectfully, in accordance with school behaviour policies.</p>
            <p><strong>3.6</strong> Designate a named staff contact person responsible for the programme at the school.</p>
          </Clause>

          <Clause number="4" title="Privacy and Data">
            <p><strong>4.1</strong> Sport Waikato will collect and hold only the minimum personal information necessary: student first name, last initial, year level, and school. No email addresses, full surnames, or caregiver contact details are held by Sport Waikato.</p>
            <p><strong>4.2</strong> The school is the consent gatekeeper. By providing a student's details to Sport Waikato, the school confirms that caregiver consent has been obtained.</p>
            <p><strong>4.3</strong> All student data will be permanently deleted within 90 days of the season end date (by 4 February 2027), in accordance with the Privacy Act 2020 and Sport Waikato's Karawhiua Digital Safety Management Plan.</p>
          </Clause>

          <Clause number="5" title="Liability">
            <p><strong>5.1</strong> Equipment is provided in good working order. The school accepts responsibility for damage caused by misuse or neglect during the loan period.</p>
            <p><strong>5.2</strong> Sport Waikato is not liable for injuries sustained through improper use of the equipment.</p>
          </Clause>

          <Clause number="6" title="Term">
            <p>
              This MoU is effective from the date of signing and expires on 30 November 2026
              unless otherwise agreed in writing.
            </p>
          </Clause>

          <section className="mt-8 break-inside-avoid">
            <h2 className="font-display font-bold uppercase tracking-wide text-base border-b border-black pb-1 mb-4">
              Signatures
            </h2>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="font-bold uppercase">Sport Waikato Representative</p>
                <div>Name: <Line width="70%" /></div>
                <div>Title: <Line width="70%" /></div>
                <div style={{ marginTop: "10mm" }}>Signature: <Line width="60%" /></div>
                <div style={{ marginTop: "6mm" }}>Date: <Line width="50%" /></div>
              </div>
              <div className="space-y-4">
                <p className="font-bold uppercase">School Representative</p>
                <div>Name: <Line width="70%" /></div>
                <div>Title: <Line width="70%" /></div>
                <div>School: <Line width="70%" /></div>
                <div style={{ marginTop: "10mm" }}>Signature: <Line width="60%" /></div>
                <div style={{ marginTop: "6mm" }}>Date: <Line width="50%" /></div>
              </div>
            </div>
          </section>

          <footer className="mt-10 pt-3 border-t border-black text-center text-[9pt]">
            Freewheeler Cycling League · freewheelerleague.com · Sport Waikato · Season 2026
          </footer>
        </div>
      </div>
    </div>
  );
};

export default MouTemplate;
