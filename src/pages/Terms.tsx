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

      <div className="mt-8 space-y-6 font-body text-sm leading-relaxed text-muted-foreground">
        <section>
          <h2 className="mb-2 font-display text-lg uppercase text-foreground">
            1. Programme Overview
          </h2>
          <p>
            Free Wheeler Bike League is an indoor cycling programme for secondary
            school students. By registering, you agree to participate in the
            programme activities including riding smart bikes, logging sessions,
            and contributing to school leaderboards.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg uppercase text-foreground">
            2. Bike Use Agreement (MoU)
          </h2>
          <p>
            Participants agree to use the cycling equipment responsibly and in
            accordance with instructions provided by their teacher or programme
            coordinator. Any damage caused by wilful misuse may result in
            removal from the programme.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg uppercase text-foreground">
            3. Data Collection & Privacy
          </h2>
          <p>
            We collect personal information (name, email, school, year level)
            and session data (ride duration, distance, frequency) to operate the
            programme and report outcomes to Sport New Zealand. Your data will
            not be sold or shared with third parties outside of programme
            reporting. Aggregated, anonymised data may be used in programme
            evaluation reports.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg uppercase text-foreground">
            4. Consent
          </h2>
          <p>
            By checking the terms and conditions checkbox during registration,
            you (or your parent/guardian if under 16) consent to the collection
            and use of data as described above. You may withdraw consent at any
            time by contacting your programme coordinator.
          </p>
        </section>

        <section>
          <h2 className="mb-2 font-display text-lg uppercase text-foreground">
            5. Contact
          </h2>
          <p>
            For questions about these terms, contact your Free Wheeler programme
            coordinator or email the Sport Waikato team.
          </p>
        </section>
      </div>
    </div>
  </div>
);

export default Terms;
