import { useEffect, useState } from "react";
import { format, isWeekend, startOfDay } from "date-fns";
import { CalendarIcon, Trash2, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import Navbar from "@/components/Navbar";
import { callAirtable } from "@/lib/airtable";

interface Booking {
  id: string;
  bike_label: string;
  time_slot: string;
  booked_by_name: string;
  booking_date: string;
  school_name: string;
  user_id: string | null;
  created_at: string;
}

interface HardwareAsset {
  id: string;
  fields: Record<string, unknown>;
}

const TIME_SLOTS: string[] = [];
for (let h = 8; h <= 16; h++) {
  for (const m of [0, 30]) {
    TIME_SLOTS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

const AdminBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterSchool, setFilterSchool] = useState<string>("all");
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined);
  const [schools, setSchools] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<Booking | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Create-on-behalf dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createSchool, setCreateSchool] = useState("");
  const [createDate, setCreateDate] = useState<Date | undefined>(undefined);
  const [createBike, setCreateBike] = useState("");
  const [createTime, setCreateTime] = useState("");
  const [createName, setCreateName] = useState("");
  const [createBikes, setCreateBikes] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  const today = startOfDay(new Date());

  const loadBookings = async () => {
    setLoading(true);
    let q = supabase
      .from("bike_bookings")
      .select("id, bike_label, time_slot, booked_by_name, booking_date, school_name, user_id, created_at")
      .gte("booking_date", format(today, "yyyy-MM-dd"))
      .order("booking_date", { ascending: true })
      .order("time_slot", { ascending: true });
    if (filterSchool !== "all") q = q.eq("school_name", filterSchool);
    if (filterDate) q = q.eq("booking_date", format(filterDate, "yyyy-MM-dd"));
    const { data, error } = await q;
    if (error) {
      toast({ title: "Failed to load bookings", description: error.message, variant: "destructive" });
    } else {
      setBookings(data ?? []);
    }
    setLoading(false);
  };

  // Load schools list (from bookings + Hardware Assets) for filter + create dialog
  useEffect(() => {
    const loadSchools = async () => {
      try {
        const res = await callAirtable("Hardware Assets", "GET", {
          filterByFormula: `AND({Asset Type} = 'Bike', {School Location} != '')`,
        });
        const unique = new Set<string>();
        (res.records as HardwareAsset[]).forEach((r) => {
          const s = String(r.fields["School Location"] ?? "").trim();
          if (s) unique.add(s);
        });
        setSchools(Array.from(unique).sort((a, b) => a.localeCompare(b)));
      } catch {
        setSchools([]);
      }
    };
    loadSchools();
  }, []);

  useEffect(() => {
    loadBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSchool, filterDate]);

  // Load bikes when create dialog school changes
  useEffect(() => {
    if (!createSchool) {
      setCreateBikes([]);
      return;
    }
    const fetchBikes = async () => {
      try {
        const res = await callAirtable("Hardware Assets", "GET", {
          filterByFormula: `AND({School Location} = '${createSchool.replace(/'/g, "\\'")}', {Asset Type} = 'Bike')`,
        });
        const names = (res.records as HardwareAsset[])
          .map((r) => String(r.fields["Asset Name 1"] ?? r.fields["Asset Name"] ?? ""))
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
        setCreateBikes(names);
      } catch {
        setCreateBikes([]);
      }
    };
    fetchBikes();
  }, [createSchool]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    const { error } = await supabase
      .from("bike_bookings")
      .delete()
      .eq("id", pendingDelete.id);
    if (error) {
      toast({ title: "Cancel failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Booking cancelled", description: `${pendingDelete.bike_label} at ${pendingDelete.time_slot}` });
      setBookings((prev) => prev.filter((b) => b.id !== pendingDelete.id));
    }
    setDeleting(false);
    setPendingDelete(null);
  };

  const handleCreate = async () => {
    if (!createSchool || !createDate || !createBike || !createTime || !createName.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("bike_bookings").insert({
      school_name: createSchool,
      bike_label: createBike,
      booking_date: format(createDate, "yyyy-MM-dd"),
      time_slot: createTime,
      booked_by_name: createName.trim(),
    });
    if (error) {
      const desc = error.code === "23505" ? "Slot already booked." : error.message;
      toast({ title: "Booking failed", description: desc, variant: "destructive" });
    } else {
      toast({ title: "Booking created", description: `${createBike} · ${createTime} · ${createName.trim()}` });
      setCreateOpen(false);
      setCreateBike("");
      setCreateTime("");
      setCreateName("");
      loadBookings();
    }
    setCreating(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl text-foreground md:text-4xl">MANAGE BOOKINGS</h1>
              <p className="mt-1 font-body text-sm text-muted-foreground">
                Cancel suspicious bookings or add slots for office staff.
              </p>
            </div>
            <Button onClick={() => setCreateOpen(true)} className="tape-element-green">
              <Plus className="mr-1 h-4 w-4" /> NEW BOOKING
            </Button>
          </div>

          {/* Filters */}
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Label className="font-display text-xs uppercase tracking-wider text-foreground/70">Filter by school</Label>
              <Select value={filterSchool} onValueChange={setFilterSchool}>
                <SelectTrigger className="border-2 border-secondary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All schools</SelectItem>
                  {schools.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label className="font-display text-xs uppercase tracking-wider text-foreground/70">Filter by date</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "flex-1 justify-start border-2 border-secondary text-left font-normal",
                        !filterDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterDate ? format(filterDate, "EEE, dd MMM yyyy") : "Any upcoming date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={filterDate}
                      onSelect={setFilterDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                {filterDate && (
                  <Button variant="outline" onClick={() => setFilterDate(undefined)}>
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border-[3px] border-secondary bg-card shadow-[6px_6px_0px_hsl(var(--brand-dark))]">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : bookings.length === 0 ? (
              <div className="p-12 text-center font-display text-sm uppercase text-muted-foreground">
                No upcoming bookings
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-secondary">
                    <th className="px-3 py-2 text-left font-display text-xs uppercase tracking-wider text-secondary-foreground">Date</th>
                    <th className="px-3 py-2 text-left font-display text-xs uppercase tracking-wider text-secondary-foreground">Time</th>
                    <th className="px-3 py-2 text-left font-display text-xs uppercase tracking-wider text-secondary-foreground">School</th>
                    <th className="px-3 py-2 text-left font-display text-xs uppercase tracking-wider text-secondary-foreground">Bike</th>
                    <th className="px-3 py-2 text-left font-display text-xs uppercase tracking-wider text-secondary-foreground">Name</th>
                    <th className="px-3 py-2 text-right font-display text-xs uppercase tracking-wider text-secondary-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id} className="border-t border-muted">
                      <td className="px-3 py-2 font-body text-foreground whitespace-nowrap">
                        {format(new Date(b.booking_date), "dd MMM yyyy")}
                      </td>
                      <td className="px-3 py-2 font-body text-foreground whitespace-nowrap">{b.time_slot}</td>
                      <td className="px-3 py-2 font-body text-foreground">{b.school_name}</td>
                      <td className="px-3 py-2 font-body text-foreground">{b.bike_label}</td>
                      <td className="px-3 py-2 font-body text-foreground">{b.booked_by_name}</td>
                      <td className="px-3 py-2 text-right">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setPendingDelete(b)}
                        >
                          <Trash2 className="mr-1 h-3 w-3" /> Cancel
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirm */}
      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete && (
                <>
                  <strong>{pendingDelete.booked_by_name}</strong> · {pendingDelete.bike_label} ·{" "}
                  {format(new Date(pendingDelete.booking_date), "dd MMM yyyy")} at {pendingDelete.time_slot} ·{" "}
                  {pendingDelete.school_name}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Keep booking</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Cancelling…" : "Cancel booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create-on-behalf */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg uppercase tracking-wider">
              New booking (admin)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="font-display text-xs uppercase">School</Label>
              <Select value={createSchool} onValueChange={(v) => { setCreateSchool(v); setCreateBike(""); }}>
                <SelectTrigger className="border-2 border-secondary"><SelectValue placeholder="Select school" /></SelectTrigger>
                <SelectContent>
                  {schools.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="font-display text-xs uppercase">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start border-2 border-secondary text-left font-normal", !createDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {createDate ? format(createDate, "EEE, dd MMM yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={createDate}
                    onSelect={setCreateDate}
                    disabled={(d) => d < today || isWeekend(d)}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="font-display text-xs uppercase">Bike</Label>
                <Select value={createBike} onValueChange={setCreateBike} disabled={!createSchool}>
                  <SelectTrigger className="border-2 border-secondary"><SelectValue placeholder="Bike" /></SelectTrigger>
                  <SelectContent>
                    {createBikes.map((b) => (<SelectItem key={b} value={b}>{b}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-display text-xs uppercase">Time</Label>
                <Select value={createTime} onValueChange={setCreateTime}>
                  <SelectTrigger className="border-2 border-secondary"><SelectValue placeholder="Time" /></SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="font-display text-xs uppercase">Name (any)</Label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value.slice(0, 80))}
                placeholder="e.g. Office — staff use"
                className="border-2 border-secondary"
              />
              <p className="mt-1 text-xs text-muted-foreground">Admins can book under any name (e.g. staff, maintenance).</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>Cancel</Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !createSchool || !createDate || !createBike || !createTime || !createName.trim()}
              className="tape-element-green"
            >
              {creating ? "Booking…" : "Create booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBookings;
