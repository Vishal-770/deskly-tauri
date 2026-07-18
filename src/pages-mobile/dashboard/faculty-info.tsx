import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Users, Search, X, MapPin, User, Mail, ChevronRight } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import rawFacultyData from "@/data/faculty_info.json";

// ─── Types ────────────────────────────────────────────────────────────────────

interface FacultyJsonEntry {
  emp_sno: string;
  emp_name: string;
  emp_id: string;
  emp_designation: string;
  emp_school_abbr: string;
  emp_school: string;
  emp_location_building: string;
  emp_location_cabin: string;
}

type FacultyEntry = {
  name: string;
  empId: string;
  designation: string;
  schoolAbbr: string;
  school: string;
  building: string;
  cabin: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function getFacultyEmail(name: string): string {
  const clean = name.trim().toLowerCase().replace(/[^a-z\s]/g, "");
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "faculty@vit.ac.in";
  if (parts.length === 1) return `${parts[0]}@vit.ac.in`;
  let longestIdx = 0;
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].length > parts[longestIdx].length) longestIdx = i;
  }
  const mainName = parts[longestIdx];
  const otherParts = parts.filter((_, idx) => idx !== longestIdx);
  const initials = otherParts.map((p) => p[0]).join("");
  return initials ? `${mainName}.${initials}@vit.ac.in` : `${mainName}@vit.ac.in`;
}

// ─── Drawer ───────────────────────────────────────────────────────────────────

function FacultyDetailDrawer({
  faculty,
  open,
  onOpenChange,
}: {
  faculty: FacultyEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) setCopied(false);
  }, [open]);

  if (!faculty) return null;

  const initials = getInitials(faculty.name);
  const email = getFacultyEmail(faculty.name);

  const handleCopy = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const details = [
    { icon: User,   label: "Employee ID",   value: faculty.empId },
    { icon: User,   label: "Designation",   value: faculty.designation },
    { icon: Users,  label: "School / Dept", value: `${faculty.school} (${faculty.schoolAbbr})` },
    { icon: MapPin, label: "Cabin / Room",  value: faculty.cabin !== "Not Available" ? faculty.cabin : "TBA" },
    { icon: MapPin, label: "Building",      value: faculty.building !== "Not Available" ? faculty.building : "TBA" },
  ];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="pb-8 font-saira max-h-[92vh]">
        <div className="overflow-y-auto no-scrollbar px-5 space-y-6 pt-5">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="text-sm font-black text-primary">{initials}</span>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">Faculty Profile</span>
                <h2 className="text-[17px] font-extrabold text-foreground leading-snug tracking-tight">{faculty.name}</h2>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-xl bg-muted/50 border border-border/25 flex items-center justify-center text-muted-foreground cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Email row */}
          <div className="bg-card/70 backdrop-blur-md border border-border/30 rounded-2xl px-4 py-4 flex items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3 min-w-0">
              <Mail className="w-4 h-4 text-muted-foreground/35 shrink-0" />
              <div className="min-w-0">
                <span className="text-[9px] font-black text-muted-foreground/40 uppercase tracking-widest block leading-none">Email Address</span>
                <span className="text-[13px] font-semibold text-foreground truncate block mt-1">{email}</span>
              </div>
            </div>
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all shrink-0 border cursor-pointer
                ${copied
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-muted/40 border-border/25 text-muted-foreground"
                }`}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Details card */}
          <div className="bg-card/70 backdrop-blur-md border border-border/30 rounded-2xl p-4 shadow-sm">
            <p className="text-[9px] font-black text-muted-foreground/35 uppercase tracking-widest leading-none mb-3">Details</p>
            {details.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between gap-4 py-3 border-b border-border/20 last:border-0">
                <div className="flex items-center gap-2.5 shrink-0">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground/35 shrink-0" />
                  <span className="text-[10px] font-bold text-muted-foreground/45 uppercase tracking-widest leading-none">{label}</span>
                </div>
                <span className="text-[13px] font-semibold text-foreground text-right truncate max-w-[55%]">{value || "—"}</span>
              </div>
            ))}
          </div>

        </div>
      </DrawerContent>
    </Drawer>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/65 ${className}`} />;
}

function FacultySkeleton() {
  return (
    <div className="w-full flex flex-col gap-5 px-2 py-4">
      <Sk className="h-7 w-40" />
      <Sk className="h-11 w-full rounded-2xl" />
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[...Array(5)].map((_, i) => <Sk key={i} className="h-8 w-20 rounded-xl shrink-0" />)}
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <Sk key={i} className="h-[72px] w-full rounded-2xl" />)}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FacultyInfoPage() {
  const { loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [activeSchool, setActiveSchool] = useState<string>("All");
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedFaculty, setSelectedFaculty] = useState<FacultyEntry | null>(null);

  useEffect(() => { setVisibleCount(20); }, [query, activeSchool]);

  const combinedFacultyList = useMemo<FacultyEntry[]>(() => {
    const list: FacultyEntry[] = (rawFacultyData as FacultyJsonEntry[]).map((item) => ({
      name: item.emp_name,
      empId: item.emp_id,
      designation: item.emp_designation,
      schoolAbbr: item.emp_school_abbr,
      school: item.emp_school,
      building: item.emp_location_building,
      cabin: item.emp_location_cabin,
    }));
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  const schools = useMemo(() => {
    const set = new Set<string>();
    (rawFacultyData as FacultyJsonEntry[]).forEach((item) => {
      if (item.emp_school_abbr && item.emp_school_abbr !== "Not Available")
        set.add(item.emp_school_abbr.toUpperCase());
    });
    return ["All", ...Array.from(set).sort()];
  }, []);

  const filteredList = useMemo(() => {
    let result = combinedFacultyList;
    if (activeSchool !== "All")
      result = result.filter((f) => f.schoolAbbr.toUpperCase() === activeSchool);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          f.empId.toLowerCase().includes(q) ||
          f.designation.toLowerCase().includes(q) ||
          f.school.toLowerCase().includes(q) ||
          f.schoolAbbr.toLowerCase().includes(q) ||
          f.building.toLowerCase().includes(q) ||
          f.cabin.toLowerCase().includes(q)
      );
    }
    return result;
  }, [combinedFacultyList, activeSchool, query]);

  const visibleFaculty = useMemo(() => filteredList.slice(0, visibleCount), [filteredList, visibleCount]);

  const shell = (children: React.ReactNode) => <>{children}</>;

  if (authLoading) return shell(<FacultySkeleton />);

  return shell(
    <div className="w-full flex flex-col gap-5 px-2 py-4 font-saira select-none overscroll-y-contain">
      <style>{`.font-saira { font-family: 'Saira', sans-serif !important; }`}</style>

      {/* Header */}
      <header className="flex items-center gap-2.5">
        <Users className="w-5 h-5 text-primary shrink-0" />
        <h1 className="text-[26px] font-medium tracking-tight text-foreground leading-none">Faculty</h1>
      </header>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search faculty by name, ID, cabin..."
          className="w-full h-11 pl-10 pr-10 bg-card/70 backdrop-blur-sm border border-border/30 rounded-2xl text-sm text-foreground placeholder:text-muted-foreground/35 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/40 cursor-pointer border-0 bg-transparent"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* School filter chips */}
      {schools.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5 -mx-2 px-2">
          {schools.map((school) => {
            const active = activeSchool === school;
            return (
              <button
                key={school}
                onClick={() => setActiveSchool(school)}
                className={`px-4 py-2 rounded-xl text-[11px] font-black transition-colors cursor-pointer border shrink-0
                  ${active
                    ? "bg-primary border-primary text-primary-foreground shadow-sm"
                    : "bg-card/70 backdrop-blur-sm border-border/30 text-muted-foreground"
                  }`}
              >
                {school === "All" ? "All" : school}
              </button>
            );
          })}
        </div>
      )}

      {/* Faculty list */}
      {filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-card/60 backdrop-blur-md border border-border/25 rounded-2xl">
          <Users className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-sm font-semibold text-foreground leading-none">No faculty found</p>
          <p className="text-xs text-muted-foreground">Try modifying your search or filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleFaculty.map((faculty, i) => {
            const initials = getInitials(faculty.name);
            const hasLocation =
              (faculty.building && faculty.building !== "Not Available") ||
              (faculty.cabin && faculty.cabin !== "Not Available");

            return (
              <div
                key={`${faculty.empId}-${i}`}
                onClick={() => setSelectedFaculty(faculty)}
                className="bg-card/70 backdrop-blur-md border border-border/30 rounded-2xl px-4 py-4 flex items-center gap-3.5 shadow-sm cursor-pointer active:opacity-80 transition-opacity"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-[12px] font-black text-primary leading-none">{initials}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-[13px] font-bold text-foreground leading-none truncate">{faculty.name}</p>
                  <p className="text-[11px] text-muted-foreground/55 leading-none truncate">{faculty.designation}</p>
                  {hasLocation && (
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground/40 leading-none">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {faculty.cabin && faculty.cabin !== "Not Available" ? faculty.cabin : ""}
                        {faculty.building && faculty.building !== "Not Available" ? `, ${faculty.building}` : ""}
                      </span>
                    </div>
                  )}
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
              </div>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {filteredList.length > visibleCount && (
        <button
          onClick={() => setVisibleCount((prev) => prev + 20)}
          className="w-full py-3 rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm text-[12px] font-black uppercase tracking-widest text-muted-foreground cursor-pointer transition-colors"
        >
          Load More Faculty
        </button>
      )}

      {/* Drawer */}
      <FacultyDetailDrawer
        faculty={selectedFaculty}
        open={selectedFaculty !== null}
        onOpenChange={(open) => { if (!open) setSelectedFaculty(null); }}
      />
    </div>
  );
}
