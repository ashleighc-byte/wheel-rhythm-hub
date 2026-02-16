import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Send, X } from "lucide-react";
import SessionFeedbackForm from "./SessionFeedbackForm";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const CTASection = () => {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [issueTitle, setIssueTitle] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueTitle.trim()) return;
    setSubmitting(true);

    try {
      // For now, log the issue and show confirmation
      console.log("Issue reported:", {
        email: user?.email,
        title: issueTitle,
        description: issueDescription,
        timestamp: new Date().toISOString(),
      });

      toast({
        title: "Issue reported!",
        description: "Thanks for letting us know. We'll look into it.",
      });

      setIssueTitle("");
      setIssueDescription("");
      setIssueOpen(false);
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SessionFeedbackForm open={feedbackOpen} onOpenChange={setFeedbackOpen} />

      <Dialog open={issueOpen} onOpenChange={setIssueOpen}>
        <DialogContent className="border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-xl uppercase text-foreground">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Report an Issue
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleIssueSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
                What's the issue?
              </label>
              <Input
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                placeholder="e.g. My stats aren't updating"
                className="border-2 border-secondary bg-background font-body"
                maxLength={100}
                required
              />
            </div>
            <div>
              <label className="mb-1 block font-display text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Tell us more (optional)
              </label>
              <Textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Any extra details that might help us fix it..."
                className="border-2 border-secondary bg-background font-body"
                rows={4}
                maxLength={500}
              />
            </div>
            <Button
              type="submit"
              disabled={submitting || !issueTitle.trim()}
              className="tape-element-green w-full flex items-center justify-center gap-2 text-base"
            >
              <Send className="h-4 w-4" />
              {submitting ? "Sending..." : "Submit Report"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <section className="bg-secondary py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-8 inline-block">
              <span className="tape-element text-2xl md:text-3xl">THE POWER'S IN YOUR LEGS</span>
            </div>
            <p className="mx-auto max-w-md font-body text-lg text-secondary-foreground/80">
              Ready to pedal your own path? Join Free Wheeler and start riding with your school today.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <button
                onClick={() => setFeedbackOpen(true)}
                className="tape-element text-lg transition-transform hover:rotate-0 hover:scale-105"
              >
                LOG A DAILY RIDE
              </button>
              <button
                onClick={() => setIssueOpen(true)}
                className="tape-element-green text-lg transition-transform hover:rotate-0 hover:scale-105"
              >
                SOMETHING BROKEN?
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default CTASection;
