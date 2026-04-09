import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <Link
        to="/"
        className="mb-8 inline-flex items-center gap-2 font-display text-xs uppercase tracking-wider text-primary hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Home
      </Link>

      <h1 className="font-display text-3xl uppercase tracking-wider text-foreground">
        Terms & Conditions
      </h1>
      <p className="mt-2 font-body text-sm text-muted-foreground">
        Free Wheeler Bike League — Memorandum of Understanding
      </p>

      <div className="mt-8 space-y-6 font-body text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 font-display text-lg uppercase text-foreground">
            1. Programme Overview
          </h2>
          <p>
            Free Wheeler Bike League is an indoor cycling programme for secondary
            school students, delivered by Sport Waikato in partnership with your
            school. The programme uses Proton Wattbike smart bikes paired with
            the MyWhoosh virtual cycling app. By registering, you agree to
            participate in programme activities including riding the bikes,
            logging sessions via your NFC bracelet, and contributing to school
            leaderboards.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg uppercase text-foreground">
            2. Programme Objectives
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Provide inclusive access to cycling for rangatahi who may not otherwise participate in traditional sport or physical activity.</li>
            <li>Support student wellbeing through positive movement experiences.</li>
            <li>Build a sense of belonging and friendly competition through team-based leaderboards and milestones.</li>
            <li>Explore the use of smart-bike technology and gamification to engage young people in regular physical activity.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg uppercase text-foreground">
            3. Participant Responsibilities
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Use the cycling equipment responsibly and in accordance with instructions provided by your teacher or programme coordinator.</li>
            <li>Look after your NFC bracelet — it is your login to the programme. If lost, a backup QR code is available from your teacher.</li>
            <li>Follow your school's code of conduct and health &amp; safety policies while using the bikes.</li>
            <li>Report any equipment issues to your teacher immediately.</li>
          </ul>
          <p className="mt-2">
            Any damage caused by wilful misuse may result in removal from the
            programme.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg uppercase text-foreground">
            4. School Responsibilities
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Provide a suitable space with access to power outlets for the two smart bikes.</li>
            <li>Ensure WiFi access is available for the MyWhoosh app on the provided iPad/tablet.</li>
            <li>Supervise the bike area during school hours and manage the booking timetable.</li>
            <li>Collect and store participant consent forms as required by school policy.</li>
            <li>Communicate programme information to students and whānau.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg uppercase text-foreground">
            5. Sport Waikato Responsibilities
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Supply and maintain the Proton Wattbike smart bikes and associated equipment.</li>
            <li>Provide an iPad/tablet pre-loaded with MyWhoosh for each school.</li>
            <li>Deliver the Free Wheeler digital platform (website, leaderboards, milestones, booking system).</li>
            <li>Create and deliver student user packs (NFC bracelet, stickers) to participating schools.</li>
            <li>Provide technical setup guidance and ongoing support throughout the pilot.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg uppercase text-foreground">
            6. Data Collection & Privacy
          </h2>
          <p>
            We collect personal information (name, email, school, year level,
            gender) and session data (ride duration, distance, elevation, course,
            frequency) to operate the programme and report outcomes to Sport New
            Zealand.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>All data is stored securely and accessible only to authorised programme staff.</li>
            <li>Individual data is anonymised in any external reporting.</li>
            <li>Aggregated, de-identified data may be used in programme evaluation reports for Sport New Zealand.</li>
            <li>Your data will not be sold or shared with third parties outside of programme reporting.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg uppercase text-foreground">
            7. Consent
          </h2>
          <p>
            By checking the terms and conditions checkbox during registration,
            you (or your parent/guardian if you are under 16) consent to:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>The collection and use of data as described above.</li>
            <li>Your session data appearing on school leaderboards (first name and school only).</li>
            <li>Anonymised data being included in programme evaluation reports.</li>
          </ul>
          <p className="mt-2">
            You may withdraw consent at any time by contacting your programme
            coordinator. Withdrawal will result in removal from the programme
            and deletion of your personal data.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg uppercase text-foreground">
            8. Programme Duration
          </h2>
          <p>
            The Free Wheeler Bike League operates for the agreed pilot period as
            confirmed with your school. Equipment will be collected at the end
            of the programme period unless an extension is agreed.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg uppercase text-foreground">
            9. Contact
          </h2>
          <p>
            For questions about these terms or the programme, contact your Free
            Wheeler programme coordinator or the Sport Waikato team at{" "}
            <a
              href="mailto:info@sportwaikato.org.nz"
              className="font-bold text-primary underline"
            >
              info@sportwaikato.org.nz
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  </div>
);

export default Terms;
