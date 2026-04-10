import { useState, useEffect } from "react";
import { format, addDays, isWeekend, startOfDay } from "date-fns";
import { CalendarIcon, Bike, X, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import logoSrc from "@/assets/fw-logo-oval.png";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "@/components/Navbar";

const TIME_SLOTS: string[] = [];
for (let h = 8; h < 16; h++) {
  for (let m = 0; m < 60; m += 15) {
    TIME_SLOTS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

const BIKES = ["Bike A", "Bike B"];

interface Booking {
  id: string;
  bike_label: string;
  time_slot: string;
  booked_by_name: string;
  user_id: string | null;
}

const BookBike = () => {
  const { session, loading: authLoading } = useAuth();
  const [schools, setSchools] = useState<{ id: string; name: string }[]>([]);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false);
  const [bookingSlot, setBookingSlot] = useState<{ bike: string; time: string } | null>(null);
  const [studentName, setStudentName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load schools
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/registration-count`;
        const res = await fetch(url, {
          headers: { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        });
        if (res.ok) {
          const data = await res.json();
          setSchools((data.schools || []).map((s: any) => ({ id: s.id, name: s.name })));
        }
      } catch {
        console.error("Failed to load schools");
      }
    };
    fetchSchools();
  }, []);

  // Load bookings when school + date change
  useEffect(() => {
    if (!selectedSchool || !selectedDate) return;
    const loadBookings = async () => {
      setLoadingBookings(true);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("bike_bookings")
        .select("id, bike_label, time_slot, booked_by_name, user_id")
        .eq("school_name", selectedSchool)
        .eq("booking_date", dateStr);
      if (!error && data) setBookings(data);
      setLoadingBookings(false);
    };
    loadBookings();
  }, [selectedSchool, selectedDate]);

  const getBooking = (bike: string, time: string) =>
    bookings.find((b) => b.bike_label === bike && b.time_slot === time);

  const handleCellClick = (bike: string, time: string) => {
    const existing = getBooking(bike, time);
    if (existing) return; // already booked
    setBookingSlot({ bike, time });
    setStudentName("");
    setBookingDialogOpen(true);
  };

  const handleBook = async () => {
    if (!bookingSlot || !studentName.trim() || !selectedDate) return;
    setSubmitting(true);
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const { error } = await supabase.from("bike_bookings").insert({
      school_name: selectedSchool,
      bike_label: bookingSlot.bike,
      booking_date: dateStr,
      time_slot: bookingSlot.time,
      booked_by_name: studentName.trim(),
    });
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Slot already booked", description: "Someone just booked this slot.", variant: "destructive" });
      } else {
        toast({ title: "Booking failed", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Booked! 🚴", description: `${bookingSlot.bike} at ${bookingSlot.time} for ${studentName.trim()}` });
      // Refresh bookings
      const { data } = await supabase
        .from("bike_bookings")
        .select("id, bike_label, time_slot, booked_by_name, user_id")
        .eq("school_name", selectedSchool)
        .eq("booking_date", dateStr);
      if (data) setBookings(data);
    }
    setSubmitting(false);
    setBookingDialogOpen(false);
  };

  const today = startOfDay(new Date());

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      {session ? (
        <Navbar />
      ) : (
        <header className="bg-secondary border-b-4 border-primary">
          <div className="container mx-auto flex items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-2">
              <img src={logoSrc} alt="Free Wheeler" className="h-10 object-contain md:h-12" />
            </Link>
            <Link to="/auth" className="tape-element text-sm md:text-base">
              SIGN IN
            </Link>
          </div>
        </header>
      )}

      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl text-foreground md:text-5xl">BOOK A BIKE</h1>
            <p className="mt-2 font-body text-base text-muted-foreground">
              Reserve a 15-minute slot on a smart bike. Book two slots for a 30-minute ride.
            </p>
          </div>

          {/* School + Date selectors */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <Label className="font-display text-xs uppercase tracking-wider text-foreground/70">School</Label>
              <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                <SelectTrigger className="border-2 border-secondary">
                  <SelectValue placeholder="Select your school" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="font-display text-xs uppercase tracking-wider text-foreground/70">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start border-2 border-secondary text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "EEE, dd MMM yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => date < today || isWeekend(date)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Timetable */}
          {selectedSchool && selectedDate ? (
            <div className="overflow-x-auto border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary">
                    <th className="px-3 py-2 text-left font-display text-xs uppercase tracking-wider text-secondary-foreground">
                      <Clock className="inline h-3 w-3 mr-1" /> Time
                    </th>
                    {BIKES.map((bike) => (
                      <th key={bike} className="px-3 py-2 text-center font-display text-xs uppercase tracking-wider text-secondary-foreground">
                        <Bike className="inline h-3 w-3 mr-1" /> {bike}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((time) => (
                    <tr key={time} className="border-t border-muted">
                      <td className="px-3 py-2 font-display text-xs font-bold text-foreground whitespace-nowrap">
                        {time}
                      </td>
                      {BIKES.map((bike) => {
                        const booking = getBooking(bike, time);
                        return (
                          <td key={bike} className="px-2 py-1 text-center">
                            {booking ? (
                              <div className="border-[2px] border-muted bg-muted/50 px-2 py-1.5 font-body text-xs text-muted-foreground">
                                {booking.booked_by_name}
                              </div>
                            ) : (
                              <button
                                onClick={() => handleCellClick(bike, time)}
                                className="w-full border-[2px] border-primary/30 bg-primary/5 px-2 py-1.5 font-display text-[10px] uppercase tracking-wider text-primary transition-colors hover:bg-primary/20 hover:border-primary"
                              >
                                Available
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="border-[3px] border-secondary bg-card p-12 text-center shadow-[4px_4px_0px_hsl(var(--brand-dark))]">
              <Bike className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
              <p className="font-display text-lg uppercase text-muted-foreground">
                Select a school and date to view available slots
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={bookingDialogOpen} onOpenChange={setBookingDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold uppercase tracking-wider text-foreground">
              Book a Slot
            </DialogTitle>
          </DialogHeader>
          {bookingSlot && (
            <div className="space-y-4">
              <div className="flex gap-4 text-sm">
                <div className="border-[2px] border-secondary bg-muted px-3 py-2 font-display text-xs uppercase tracking-wider">
                  {bookingSlot.bike}
                </div>
                <div className="border-[2px] border-secondary bg-muted px-3 py-2 font-display text-xs uppercase tracking-wider">
                  {bookingSlot.time}
                </div>
                <div className="border-[2px] border-secondary bg-muted px-3 py-2 font-display text-xs uppercase tracking-wider">
                  {selectedDate && format(selectedDate, "dd MMM")}
                </div>
              </div>
              <div>
                <Label className="font-display text-xs uppercase tracking-wider">Student Name *</Label>
                <Input
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter student name"
                  className="border-2 border-secondary"
                />
              </div>
              <Button
                onClick={handleBook}
                disabled={!studentName.trim() || submitting}
                className="tape-element-green w-full text-base"
              >
                {submitting ? "Booking..." : "CONFIRM BOOKING"}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t-4 border-primary bg-secondary px-4 py-10">
        <div className="container mx-auto text-center">
          <div className="font-display text-lg font-bold uppercase text-accent">
            Free Wheeler Bike League
          </div>
          <p className="mt-2 font-body text-sm text-secondary-foreground/60">
            Pedal Your Own Path · © 2026
          </p>
          <Link to="/terms" className="mt-2 inline-block font-body text-xs text-secondary-foreground/40 underline hover:text-secondary-foreground/60">
            Terms & Conditions
          </Link>
        </div>
      </footer>
    </div>
  );
};

export default BookBike;
