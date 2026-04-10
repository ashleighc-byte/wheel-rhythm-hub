import { useEffect } from "react";
import fwLogo from "@/assets/fw-logo-oval.png";

const PERMISSION_LINK = "https://bit.ly/GameFITPermission";
const WEBSITE_LINK = "https://freewheeler.lovable.app/auth";

const steps = [
  {
    num: "01",
    title: "Set Up the Group",
    body: 'Create a group in your school\'s management system called "Free Wheeler Pilot" and add the 10 identified target students.',
    note: null,
  },
  {
    num: "02",
    title: "Contact Caregivers",
    body: "Send a message via your school's communications explaining the pilot, that their child has been selected, and that they need to complete the permission form to participate.",
    note: `Permission form: ${PERMISSION_LINK}`,
  },
  {
    num: "03",
    title: "Permission Slip Completed",
    body: "Once both caregiver and student have signed the permission form, the system marks the student as active and adds them to the approved sign-up list. No action required from you.",
    note: null,
  },
  {
    num: "04",
    title: "Student Signs Up",
    body: `Students visit ${WEBSITE_LINK} and click Sign Up using their school email address (the same one used on the permission form). They'll receive a confirmation email to verify their account.`,
    note: "Must use their school email address.",
  },
  {
    num: "05",
    title: "Pre-Pilot Survey",
    body: "On first sign-in, students are prompted to complete the Pre-Pilot Survey before accessing the site. Once submitted, they can start using the platform.",
    note: null,
  },
];

const sessionSteps = [
  { num: "A", title: "Complete a Session", body: "Student rides the smart bike using the shared MyWhoosh account." },
  { num: "B", title: "Screenshot the Results", body: "Take a screenshot of the results screen on the iPad at the end of the session." },
  { num: "C", title: "Log the Ride", body: `Sign in to ${WEBSITE_LINK} on the iPad and tap "Log a Ride". Upload the screenshot and submit.` },
  { num: "D", title: "Sign Out", body: "Always sign out after logging so the next student's data isn't mixed up." },
];

const ongoing = [
  { title: "4-Week Check-In", body: "Around week 4, students are prompted with a mid-pilot survey. If overdue, redirect them to their Info page checklist." },
  { title: "End of Pilot Survey", body: "At the end of the year students complete the Post-Pilot Survey to measure programme impact." },
  { title: "Teacher Observations", body: "Use the Teacher Observation Form on your dashboard to note changes in student attitude, confidence, and engagement." },
  { title: "Report Issues", body: "Use the Report an Issue button on the Info page for any bike, app, or hardware problems." },
];

const SetupInstructionsPrint = () => {
  useEffect(() => {
    // slight delay so images load
    const t = setTimeout(() => window.print(), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="print-page">
      {/* Header */}
      <div className="print-header">
        <img src={fwLogo} alt="Free Wheeler Bike League" className="print-logo" />
        <div>
          <h1 className="print-title">Setup Instructions</h1>
          <p className="print-subtitle">Free Wheeler Bike League — Teacher Guide</p>
        </div>
      </div>

      {/* Section 1: Onboarding Flow */}
      <h2 className="print-section-heading">Getting Students Onboard</h2>
      <div className="print-flow">
        {steps.map((step, i) => (
          <div key={step.num} className="print-flow-item">
            <div className="print-step-badge">{step.num}</div>
            <div className="print-step-body">
              <div className="print-step-title">{step.title}</div>
              <p className="print-step-text">{step.body}</p>
              {step.note && <p className="print-step-note">{step.note}</p>}
            </div>
            {i < steps.length - 1 && <div className="print-arrow">↓</div>}
          </div>
        ))}
      </div>

      {/* Section 2: Session Logging */}
      <h2 className="print-section-heading" style={{ marginTop: "28px" }}>Logging a Session (Each Ride)</h2>
      <div className="print-flow print-flow-horizontal">
        {sessionSteps.map((step, i) => (
          <div key={step.num} className="print-flow-item print-flow-item-h">
            <div className="print-step-badge print-badge-accent">{step.num}</div>
            <div className="print-step-body">
              <div className="print-step-title">{step.title}</div>
              <p className="print-step-text">{step.body}</p>
            </div>
            {i < sessionSteps.length - 1 && <div className="print-arrow print-arrow-right">→</div>}
          </div>
        ))}
      </div>

      {/* Section 3: Ongoing */}
      <h2 className="print-section-heading" style={{ marginTop: "28px" }}>Ongoing Responsibilities</h2>
      <div className="print-grid">
        {ongoing.map((item) => (
          <div key={item.title} className="print-grid-item">
            <div className="print-step-title">{item.title}</div>
            <p className="print-step-text">{item.body}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="print-footer">
        <span>Free Wheeler Bike League · Pedal Your Own Path · © 2026</span>
        <span>Website: {WEBSITE_LINK}</span>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800&family=Inter:wght@400;500;600&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body { background: white; }

        .print-page {
          font-family: 'Inter', sans-serif;
          background: white;
          color: #1a1a1a;
          padding: 20px 28px;
          max-width: 210mm;
          margin: 0 auto;
          font-size: 11px;
        }

        .print-header {
          display: flex;
          align-items: center;
          gap: 14px;
          border-bottom: 4px solid #f5a623;
          padding-bottom: 12px;
          margin-bottom: 18px;
        }

        .print-logo {
          height: 48px;
          width: auto;
        }

        .print-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 26px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #1a3a2a;
          line-height: 1;
        }

        .print-subtitle {
          font-size: 11px;
          color: #555;
          margin-top: 2px;
        }

        .print-section-heading {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 14px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #1a3a2a;
          background: #f5a623;
          padding: 4px 10px;
          margin-bottom: 12px;
          display: inline-block;
        }

        .print-flow {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .print-flow-horizontal {
          flex-direction: row;
          align-items: flex-start;
          gap: 0;
          flex-wrap: nowrap;
        }

        .print-flow-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          position: relative;
        }

        .print-flow-item-h {
          flex: 1;
          flex-direction: column;
          align-items: flex-start;
          gap: 6px;
        }

        .print-step-badge {
          flex-shrink: 0;
          width: 28px;
          height: 28px;
          background: #1a3a2a;
          color: white;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 2px;
        }

        .print-badge-accent {
          background: #f5a623;
          color: #1a1a1a;
        }

        .print-step-body {
          flex: 1;
          background: #f9f9f7;
          border: 1.5px solid #e0e0d8;
          border-left: 4px solid #1a3a2a;
          padding: 7px 10px;
          margin-bottom: 0;
        }

        .print-flow-item-h .print-step-body {
          border-left: 4px solid #f5a623;
          width: 100%;
        }

        .print-step-title {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #1a3a2a;
          margin-bottom: 3px;
        }

        .print-step-text {
          color: #333;
          line-height: 1.45;
          font-size: 10.5px;
        }

        .print-step-note {
          margin-top: 5px;
          font-size: 10px;
          font-weight: 600;
          color: #1a3a2a;
          background: #eef7ee;
          border-left: 3px solid #f5a623;
          padding: 3px 6px;
        }

        .print-arrow {
          font-size: 18px;
          color: #f5a623;
          font-weight: 700;
          text-align: center;
          line-height: 1;
          padding: 2px 0 2px 9px;
          margin-left: 5px;
          align-self: center;
        }

        .print-arrow-right {
          padding: 0 4px;
          align-self: center;
          margin-top: 20px;
        }

        .print-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .print-grid-item {
          background: #f9f9f7;
          border: 1.5px solid #e0e0d8;
          border-top: 4px solid #f5a623;
          padding: 8px 10px;
        }

        .print-footer {
          margin-top: 20px;
          border-top: 2px solid #f5a623;
          padding-top: 8px;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #888;
        }

        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 14mm;
          }
          body { margin: 0; }
          .print-page { padding: 0; max-width: 100%; }
        }

        @media screen {
          body { background: #e8e8e8; }
          .print-page {
            box-shadow: 0 4px 24px rgba(0,0,0,0.15);
            margin: 24px auto;
            padding: 28px 32px;
          }
        }
      `}</style>
    </div>
  );
};

export default SetupInstructionsPrint;
