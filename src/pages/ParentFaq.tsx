import { Link } from "react-router-dom";
import { ArrowLeft, Printer } from "lucide-react";
import logo from "@/assets/fw-logo-oval.png";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs: { q: string; a: string }[] = [
  {
    q: "What is Freewheeler?",
    a: "Freewheeler is a cycling league for secondary school students, delivered by Sport Waikato across seven Waikato schools in 2026. Students ride Wattbike Proton smart bikes at school using the MyWhoosh cycling app and compete on a points-based leaderboard over an 8-week season. No travel, no competition dates.",
  },
  {
    q: "Is there a cost?",
    a: "No. There is no participation fee for students or schools. The Wattbike bikes, iPads, and all equipment are provided by Sport Waikato at no cost.",
  },
  {
    q: "Is it safe?",
    a: "Yes. Students ride stationary smart bikes (Wattbike Proton) at school. The bikes are fixed in place. MyWhoosh is a cycling simulation app — not a social media platform. Students are supervised by their school as normal.",
  },
  {
    q: "What data is collected about my child?",
    a: "Sport Waikato stores only: first name, last initial (e.g. S), year level, and school. No email address, full surname, date of birth, or contact details are stored by Sport Waikato. All data is deleted within 90 days of the season ending (by 4 February 2027), in line with the Privacy Act 2020.",
  },
  {
    q: "Who can see my child's data?",
    a: "Only authorised Sport Waikato staff. Data is not shared with third parties. On the public leaderboard, students are shown by first name and last initial only (e.g. \"Sam T.\").",
  },
  {
    q: "How does my child log in to the platform?",
    a: "Students receive an NFC bracelet. They tap it on a small reader near the bikes and their session is logged automatically. A QR code backup card is also provided in case the bracelet is lost or forgotten.",
  },
  {
    q: "What happens at the end of the season?",
    a: "Sport Waikato will share an anonymised participation report with your school. All personal student data will be permanently deleted by 4 February 2027 (within 90 days of the season ending on 6 November 2026).",
  },
  {
    q: "How do I give consent?",
    a: "Complete the attached Student & Caregiver Consent Form and return it to your child's school by the date shown. Your school manages consent on behalf of Sport Waikato — you do not need to contact Sport Waikato directly.",
  },
  {
    q: "Who do I contact with questions?",
    a: "Speak to your child's sports coordinator or PE teacher. You can also visit freewheelerleague.com for more information.",
  },
];

const ParentFaq = () => {
  return (
    <div className="min-h-screen bg-muted">
      <style>{`
        @page { size: A4 portrait; margin: 15mm; }
        @media print {
          html, body { background: white !important; margin: 0; padding: 0; color: black !important; }
          .no-print { display: none !important; }
          .screen-only { display: none !important; }
          .print-only { display: block !important; }
          .faq-page {
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: auto !important;
          }
          .faq-page * { color: black !important; }
          .break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
        }
        .faq-page {
          width: 210mm;
          min-height: 297mm;
        }
        .print-only { display: none; }
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

      <div className="flex justify-center pb-12 print:pb-0">
        <div className="faq-page bg-white text-black p-12 shadow-lg font-body text-[11pt] leading-relaxed">
          {/* Header */}
          <header className="flex items-start gap-4 border-b-2 border-black pb-4">
            <img src={logo} alt="Freewheeler" className="h-20 w-auto object-contain" />
            <div className="flex-1">
              <h1 className="font-display font-black uppercase tracking-wider text-2xl text-black leading-tight">
                Parent &amp; Caregiver FAQ
              </h1>
              <p className="text-sm mt-1">Freewheeler Cycling League — Season 2026</p>
            </div>
          </header>

          {/* Screen-only accordion */}
          <div className="screen-only mt-6">
            <Accordion type="multiple" className="w-full">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`item-${i}`} className="border-b border-black/30">
                  <AccordionTrigger className="text-left font-display font-bold uppercase tracking-wide text-base hover:no-underline text-black">
                    Q: {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="font-body text-[11pt] text-black leading-relaxed">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Print-only expanded list */}
          <div className="print-only mt-6 space-y-4">
            {faqs.map((f, i) => (
              <div key={i} className="break-inside-avoid">
                <p className="font-display font-bold uppercase tracking-wide text-[11.5pt]">
                  Q: {f.q}
                </p>
                <p className="mt-1">A: {f.a}</p>
              </div>
            ))}
          </div>

          <footer className="mt-10 pt-3 border-t border-black text-center text-[9pt]">
            Freewheeler Cycling League · Delivered by Sport Waikato · freewheelerleague.com
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ParentFaq;
