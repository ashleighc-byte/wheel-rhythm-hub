import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import { callAirtable } from "@/lib/airtable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Copy, Users } from "lucide-react";

type Reg = {
  id: string;
  firstName: string;
  lastInitial: string;
  yearLevel: string;
  school: string;
  status: string;
  createdTime: string;
};

const STATUSES = ["Pending Consent", "Active", "Waitlisted"] as const;
type Status = (typeof STATUSES)[number];

const cardClass =
  "border-[3px] border-secondary bg-card shadow-[4px_4px_0px_hsl(var(--brand-dark))]";

const formatDate = (iso: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

const AdminRegistrations = () => {
  const [records, setRecords] = useState<Reg[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Status>("Pending Consent");
  const [schoolFilter, setSchoolFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await callAirtable("Student Registration", "GET", {
          filterByFormula: `{Registration Status}='${statusFilter}'`,
          maxRecords: 500,
        });
        if (cancelled) return;
        const mapped: Reg[] = (res?.records ?? []).map((r: any) => ({
          id: r.id,
          firstName: r.fields?.["First Name"] ?? "",
          lastInitial: r.fields?.["Last Initial"] ?? "",
          yearLevel: String(r.fields?.["Year Level"] ?? ""),
          school: r.fields?.["School"] ?? "Unknown",
          status: r.fields?.["Registration Status"] ?? statusFilter,
          createdTime: r.createdTime ?? r.fields?.["Created"] ?? "",
        }));
        setRecords(mapped);
      } catch (e: any) {
        toast({ title: "Failed to load registrations", description: e?.message ?? "Unknown error", variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [statusFilter]);

  const schools = useMemo(
    () => Array.from(new Set(records.map((r) => r.school))).sort(),
    [records],
  );

  const filtered = useMemo(
    () => (schoolFilter === "all" ? records : records.filter((r) => r.school === schoolFilter)),
    [records, schoolFilter],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Reg[]>();
    for (const r of filtered) {
      if (!map.has(r.school)) map.set(r.school, []);
      map.get(r.school)!.push(r);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const copyAsList = async (school: string, regs: Reg[]) => {
    const text = regs
      .map((r) => `${r.firstName} ${r.lastInitial}.${r.yearLevel ? ` - Year ${r.yearLevel}` : ""}`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: `${regs.length} students from ${school} copied to clipboard` });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard not available", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto max-w-6xl px-4 py-8 space-y-6">
        <header>
          <h1 className="font-display text-3xl md:text-4xl font-bold uppercase tracking-wider text-foreground">
            Registrations
          </h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Manage student registrations across all schools.
          </p>
        </header>

        {/* Filter bar */}
        <div className={`${cardClass} p-4 flex flex-col sm:flex-row gap-3 sm:items-end`}>
          <div className="flex-1">
            <label className="block font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              Status
            </label>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as Status)}>
              <SelectTrigger className="border-[2px] border-secondary"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="block font-display text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
              School
            </label>
            <Select value={schoolFilter} onValueChange={setSchoolFilter}>
              <SelectTrigger className="border-[2px] border-secondary"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All schools</SelectItem>
                {schools.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="font-display text-sm font-semibold uppercase tracking-wider text-foreground">
            {loading ? "Loading..." : `${filtered.length} total`}
          </div>
        </div>

        {/* Grouped tables */}
        {!loading && grouped.length === 0 && (
          <div className={`${cardClass} p-8 text-center font-body text-muted-foreground`}>
            No registrations match these filters.
          </div>
        )}

        {grouped.map(([school, regs]) => (
          <section key={school} className={`${cardClass} p-5`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center border-[2px] border-secondary bg-primary/10">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold uppercase tracking-wider text-foreground">
                    {school}
                  </h2>
                  <p className="font-body text-xs text-muted-foreground">
                    {regs.length} {statusFilter.toLowerCase()}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => copyAsList(school, regs)}
                variant="outline"
                className="border-[2px] border-secondary font-display text-xs uppercase tracking-wider"
              >
                <Copy className="h-4 w-4 mr-2" /> Copy as list
              </Button>
            </div>

            <div className="overflow-x-auto border-[2px] border-secondary">
              <Table>
                <TableHeader>
                  <TableRow className="bg-primary/5">
                    <TableHead className="font-display text-xs uppercase tracking-wider">First Name</TableHead>
                    <TableHead className="font-display text-xs uppercase tracking-wider">Last Initial</TableHead>
                    <TableHead className="font-display text-xs uppercase tracking-wider">Year Level</TableHead>
                    <TableHead className="font-display text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="font-display text-xs uppercase tracking-wider">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regs.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-body">{r.firstName}</TableCell>
                      <TableCell className="font-body">{r.lastInitial}</TableCell>
                      <TableCell className="font-body">{r.yearLevel || "—"}</TableCell>
                      <TableCell className="font-body">{r.status}</TableCell>
                      <TableCell className="font-body">{formatDate(r.createdTime)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
};

export default AdminRegistrations;
