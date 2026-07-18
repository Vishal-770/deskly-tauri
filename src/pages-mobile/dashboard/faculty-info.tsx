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
        <div className="overflow-y-auto no-scrollbar px-6 space-y-6 pt-6">

          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-[16px] bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <span className="text-base font-bold text-primary">{initials}</span>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">Faculty Profile</span>
                <h2 className="text-xl font-bold text-foreground leading-snug tracking-tight">{faculty.name}</h2>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 rounded-full bg-muted/40 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all border-none cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Email card */}
          <div className="p-4 bg-card/80 border border-border/40 rounded-[20px] shadow-sm backdrop-blur-md flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Mail className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-muted-foreground/50 uppercase tracking-wider block">Email Address</span>
                <span className="text-sm font-semibold text-foreground truncate block mt-0.5 font-mono">{email}</span>
              </div>
            </div>
            <button
              onClick={handleCopy}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border cursor-pointer
                ${copied
                  ? "bg-primary/10 border-primary/20 text-primary"
                  : "bg-muted border-border/40 text-muted-foreground hover:bg-muted/60"
                }`}
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Details list */}
          <div className="space-y-3">
            <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest leading-none">Details</p>
            <div className="divide-y divide-border/15 border-t border-b border-border/15">
              {details.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center justify-between gap-4 py-3.5">
                  <div className="flex items-center gap-3 shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                    <span className="text-xs font-semibold text-muted-foreground/60 uppercase tracking-wide leading-none">{label}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground text-right truncate max-w-[60%]">{value || "—"}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </DrawerContent>
    </Drawer>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-muted/65 ${className}`} />;
}

function FacultySkeleton() {
  return (
    <div className="w-full flex flex-col gap-5 px-2 py-4 font-saira">
      <Sk className="h-7 w-40" />
      <Sk className="h-10 w-full rounded-xl" />
      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {[...Array(5)].map((_, i) => <Sk key={i} className="h-8 w-20 rounded-full shrink-0" />)}
      </div>
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => <Sk key={i} className="h-[76px] w-full rounded-[24px]" />)}
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
    <div className="w-full flex flex-col gap-5 px-2 py-4 font-saira select-none overscroll-y-contain relative">
      <style>{`.font-saira { font-family: 'Saira', sans-serif !important; }`}</style>

      {/* Header */}
      <header className="flex items-center gap-2">
        <Users className="w-6 h-6 text-primary shrink-0" />
        <h1 className="text-[26px] font-medium tracking-tight text-foreground leading-none">Faculty</h1>
      </header>

      {/* Search bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, ID, cabin, building..."
          className="w-full h-10 pl-9 pr-9 bg-muted/20 border-border/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground cursor-pointer border-0 bg-transparent"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* School filter chips */}
      {schools.length > 1 && (
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-2 px-2 shrink-0">
          {schools.map((school) => {
            const active = activeSchool === school;
            return (
              <button
                key={school}
                onClick={() => setActiveSchool(school)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer border shrink-0
                  ${active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/10"
                  }`}
              >
                {school === "All" ? "All Faculty" : school}
              </button>
            );
          })}
        </div>
      )}

      {/* Faculty list */}
      {filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-card/80 border border-border/40 rounded-[24px] shadow-sm backdrop-blur-md">
          <Users className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-sm font-semibold text-foreground leading-none">No faculty members found</p>
          <p className="text-xs text-muted-foreground">Try modifying your search or filter.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleFaculty.map((faculty, i) => {
            const initials = getInitials(faculty.name);
            const hasLocation =
              (faculty.building && faculty.building !== "Not Available") ||
              (faculty.cabin && faculty.cabin !== "Not Available");

            return (
              <div
                key={`${faculty.empId}-${i}`}
                onClick={() => setSelectedFaculty(faculty)}
                className="p-4.5 bg-card/80 border border-border/40 rounded-[24px] shadow-sm flex items-center justify-between gap-4 active:opacity-75 hover:bg-muted/5 transition-all cursor-pointer backdrop-blur-md"
              >
                <div className="flex-1 min-w-0 flex items-center gap-3.5">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm shrink-0">
                    {initials}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 font-medium flex-wrap">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wide leading-none">
                        {faculty.schoolAbbr || "VIT"}
                      </span>
                      {hasLocation && (
                        <>
                          <span>&bull;</span>
                          <span className="truncate">
                            {faculty.cabin && faculty.cabin !== "Not Available" ? faculty.cabin : ""}
                            {faculty.building && faculty.building !== "Not Available" ? `, ${faculty.building}` : ""}
                          </span>
                        </>
                      )}
                    </div>
                    <p className="text-sm font-bold text-foreground leading-snug truncate">{faculty.name}</p>
                    <p className="text-[10px] text-muted-foreground/50 font-mono leading-none truncate">{faculty.designation}</p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground/30 shrink-0" />
              </div>
            );
          })}
        </div>
      )}

      {/* Load more */}
      {filteredList.length > visibleCount && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setVisibleCount((prev) => prev + 20)}
            className="px-6 py-2.5 rounded-xl border border-border/20 bg-muted/10 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors duration-150 cursor-pointer"
          >
            Load More Faculty
          </button>
        </div>
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
