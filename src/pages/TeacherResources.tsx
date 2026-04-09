import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import StudentQRCodes from "@/components/StudentQRCodes";
import { useAuth } from "@/hooks/useAuth";
import { callAirtable } from "@/lib/airtable";
import {
  Wifi, Plug, Smartphone, Bike, QrCode, Printer, ClipboardList,
  Package, Calendar, Users, ChevronRight, CheckCircle2, Download,
} from "lucide-react";

interface StudentQR {
  name: string;
  token: string;
}

const TeacherResources = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentQR[]>([]);
  const [schoolName, setSchoolName] = useState("");
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStudents = async () => {
      if (!user?.email) return;
      try {
        // Find teacher's org
        const orgsRes = await callAirtable("Organisations", "GET");
        const teacherOrg = orgsRes.records.find((o: any) => {
          const emails = String(o.fields["Teacher Email"] ?? "").toLowerCase();
          return emails.includes(user.email!.toLowerCase());
        });
        if (!teacherOrg) { setLoading(false); return; }
        setSchoolName(String(teacherOrg.fields["Organisation Name"] ?? ""));

        const studentIds = teacherOrg.fields["Student Registration"] as string[] | undefined;
        if (!studentIds?.length) { setLoading(false); return; }

        // Fetch student details
        const formula = `OR(${studentIds.map(id => `RECORD_ID()='${id}'`).join(",")})`;
        const studentsRes = await callAirtable("Student Registration", "GET", {
          filterByFormula: formula,
        });
        const mapped: StudentQR[] = studentsRes.records.map((r: any) => ({
          name: String(r.fields["Full Name"] ?? ""),
          token: String(r.fields["NFC Token"] ?? ""),
        }));
        setStudents(mapped);
      } catch (err) {
        console.error("Failed to load students for QR codes:", err);
      } finally {
        setLoading(false);
      }
    };
    loadStudents();
  }, [user?.email]);

  const handlePrintPoster = (posterId: string) => {
    const content = document.getElementById(posterId);
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Print Poster</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 40px; }
        h1 { font-size: 32px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 24px; }
        .step { display: flex; gap: 16px; margin-bottom: 20px; align-items: flex-start; }
        .step-num { width: 40px; height: 40px; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 18px; flex-shrink: 0; }
        .step-text { font-size: 16px; line-height: 1.5; }
        .step-title { font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
        @media print { body { padding: 20px; } }
      </style>
      </head><body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    win.print();
  };

  const setupItems = [
    {
      icon: Plug,
      title: "Set Up a Bike Space",
      desc: "Find a dedicated space at school with access to power outlets for the 2 smart bikes. The bikes need to stay plugged in and accessible to students throughout the day.",
    },
    {
      icon: Wifi,
      title: "WiFi Access",
      desc: "The bikes connect to MyWhoosh via the school iPad. Make sure the WiFi code is available in the bike room so students can connect the tablet.",
    },
    {
      icon: Smartphone,
      title: "MyWhoosh on iPad",
      desc: "Download MyWhoosh onto the iPad/tablet provided by Sport Waikato. Log in with the admin account provided. Students will use this shared account for all rides.",
    },
    {
      icon: Smartphone,
      title: "iPad Screenshot",
      desc: "Students need to screenshot their results after each ride. On iPad: press the Top Button and Volume Up button at the same time. The screenshot saves to Photos and can be uploaded when logging their ride.",
    },
    {
      icon: Bike,
      title: "Student Access — NFC Bracelets",
      desc: "Students use their NFC bracelet to log in to the Free Wheeler website on the school iPad. They tap their bracelet, log their session, and they're done. No teacher intervention needed.",
    },
    {
      icon: Users,
      title: "Share the Registration Link",
      desc: "Share freewheeler.lovable.app with students to register. First 24 students per school — first in, first served. Registration is open for a 2-week window.",
    },
    {
      icon: Calendar,
      title: "Book Bike Slots",
      desc: "Use the built-in booking system at freewheeler.lovable.app/book to help students schedule 15-minute bike slots. This keeps access fair and organised. Office staff can also book on behalf of students.",
    },
    {
      icon: Package,
      title: "User Packs from Sport Waikato",
      desc: "Once a student registers, Sport Waikato receives the information, creates a user pack (NFC bracelet + stickers), and delivers it to the school. Allow a few days for delivery after registration.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="bg-secondary py-14 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl font-extrabold uppercase tracking-wider text-accent md:text-6xl">
            Teacher Resources
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-body text-lg text-secondary-foreground/70">
            Everything you need to run the Free Wheeler Bike League at your school.
          </p>
        </div>
      </section>

      {/* Setup Instructions */}
      <section className="bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-primary">
                <ClipboardList className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
                Setup Guide
              </h2>
            </div>
            <div className="space-y-4">
              {setupItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex gap-4 border-[3px] border-secondary bg-card p-5 shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-primary">
                      <Icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
                        {item.title}
                      </p>
                      <p className="mt-1 font-body text-sm text-foreground/70">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* QR Code Backup */}
      <section className="bg-muted py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-accent">
                <QrCode className="h-5 w-5 text-accent-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
                Student QR Code Backup
              </h2>
            </div>
            <p className="mb-4 font-body text-sm text-foreground/70">
              Print this sheet and keep it in the bike room. If a student forgets their NFC bracelet, they can scan their backup QR code on the iPad to log their session.
            </p>
            {loading ? (
              <p className="font-body text-sm text-muted-foreground">Loading students...</p>
            ) : students.filter(s => s.token).length > 0 ? (
              <button
                onClick={() => setShowQR(true)}
                className="tape-element-green inline-flex items-center gap-2 text-base"
              >
                <Printer className="h-5 w-5" /> VIEW & PRINT QR CODES
              </button>
            ) : (
              <p className="font-body text-sm text-muted-foreground">No students with NFC tokens found for your school.</p>
            )}
          </div>
        </div>
      </section>

      {/* Printable Posters */}
      <section className="bg-background py-12">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center bg-primary">
                <Printer className="h-5 w-5 text-primary-foreground" />
              </div>
              <h2 className="font-display text-2xl font-bold uppercase tracking-wider text-foreground">
                Printable Posters
              </h2>
            </div>
            <p className="mb-6 font-body text-sm text-foreground/70">
              Print these posters and display them in the bike room to guide students.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Poster 1 */}
              <div className="border-[3px] border-secondary bg-card p-5 shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
                <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-foreground">
                  🚴 How to Log a Ride
                </h3>
                <ol className="space-y-2 font-body text-sm text-foreground/80">
                  <li className="flex gap-2"><span className="font-bold text-primary">1.</span> Tap your NFC bracelet on the iPad</li>
                  <li className="flex gap-2"><span className="font-bold text-primary">2.</span> Your name appears — tap "Log a Ride"</li>
                  <li className="flex gap-2"><span className="font-bold text-primary">3.</span> Fill in your session details</li>
                  <li className="flex gap-2"><span className="font-bold text-primary">4.</span> Submit — you're done!</li>
                </ol>
                <button
                  onClick={() => handlePrintPoster("poster-log-ride")}
                  className="mt-4 inline-flex items-center gap-1 border-[2px] border-primary bg-primary px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  <Printer className="h-3 w-3" /> Print Poster
                </button>
              </div>

              {/* Poster 2 */}
              <div className="border-[3px] border-secondary bg-card p-5 shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
                <h3 className="mb-3 font-display text-sm font-bold uppercase tracking-wider text-foreground">
                  📅 How to Book a Bike
                </h3>
                <ol className="space-y-2 font-body text-sm text-foreground/80">
                  <li className="flex gap-2"><span className="font-bold text-primary">1.</span> Go to freewheeler.lovable.app/book</li>
                  <li className="flex gap-2"><span className="font-bold text-primary">2.</span> Pick your school, date, and time slot</li>
                  <li className="flex gap-2"><span className="font-bold text-primary">3.</span> Choose Bike A or Bike B</li>
                  <li className="flex gap-2"><span className="font-bold text-primary">4.</span> Book your 15-min slot (book 2 for 30 min)</li>
                </ol>
                <button
                  onClick={() => handlePrintPoster("poster-book-bike")}
                  className="mt-4 inline-flex items-center gap-1 border-[2px] border-primary bg-primary px-3 py-1.5 font-display text-[10px] font-bold uppercase tracking-wider text-primary-foreground transition-transform hover:-translate-y-0.5"
                >
                  <Printer className="h-3 w-3" /> Print Poster
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Poster content is rendered inline in the print function via handlePrintPoster */}

      {showQR && (
        <StudentQRCodes
          students={students}
          schoolName={schoolName}
          onClose={() => setShowQR(false)}
        />
      )}

      <footer className="border-t-4 border-primary bg-secondary px-4 py-10">
        <div className="container mx-auto text-center">
          <div className="font-display text-lg font-bold uppercase text-accent">
            Free Wheeler Bike League
          </div>
          <p className="mt-2 font-body text-sm text-secondary-foreground/60">
            Pedal Your Own Path · © 2026
          </p>
        </div>
      </footer>
    </div>
  );
};

export default TeacherResources;
