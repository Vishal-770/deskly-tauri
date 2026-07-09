import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";

import { Users, Search, X, MapPin, GraduationCap, Briefcase } from "lucide-react";
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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted/65 ${className}`} />;
}

function FacultySkeleton() {
  return (
    <div className="w-full space-y-8">
      <div className="pb-6 border-b border-border/10 space-y-2">
        <Sk className="h-7 w-40 animate-pulse" />
        <Sk className="h-4 w-72 animate-pulse" />
      </div>
      
      {/* Search Input Skeleton */}
      <Sk className="h-10 w-full rounded-xl animate-pulse" />

      {/* School Filter Chips Skeleton */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {[...Array(6)].map((_, i) => (
          <Sk key={i} className="h-7 w-20 rounded-full shrink-0 animate-pulse" />
        ))}
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="space-y-4 pb-6 border-b border-border/10">
            <div className="flex items-center gap-3.5">
              <Sk className="w-11 h-11 rounded-xl shrink-0 animate-pulse" />
              <div className="space-y-2 flex-1 min-w-0">
                <Sk className="h-4.5 w-3/4 animate-pulse" />
                <Sk className="h-3.5 w-1/2 animate-pulse" />
                <Sk className="h-3 w-1/3 animate-pulse" />
              </div>
            </div>
            <div className="space-y-2.5 pt-2">
              <Sk className="h-3.5 w-5/6 animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FacultyInfoPage() {
  const { loading: authLoading } = useAuth();
  const [query, setQuery] = useState("");
  const [activeSchool, setActiveSchool] = useState<string>("All");
  const [visibleCount, setVisibleCount] = useState(30);

  // Reset visibleCount on search/filter changes
  useEffect(() => {
    setVisibleCount(30);
  }, [query, activeSchool]);

  // Aggregate all faculty entries from DB
  const combinedFacultyList = useMemo<FacultyEntry[]>(() => {
    const list: FacultyEntry[] = (rawFacultyData as FacultyJsonEntry[]).map((item) => {
      return {
        name: item.emp_name,
        empId: item.emp_id,
        designation: item.emp_designation,
        schoolAbbr: item.emp_school_abbr,
        school: item.emp_school,
        building: item.emp_location_building,
        cabin: item.emp_location_cabin,
      };
    });

    // Sort: alphabetical by name
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Unique school abbreviations for filter chips
  const schools = useMemo(() => {
    const set = new Set<string>();
    (rawFacultyData as FacultyJsonEntry[]).forEach((item) => {
      if (item.emp_school_abbr && item.emp_school_abbr !== "Not Available") {
        set.add(item.emp_school_abbr.toUpperCase());
      }
    });
    return ["All", ...Array.from(set).sort()];
  }, []);

  // Filtered list based on query and school chip
  const filteredList = useMemo(() => {
    let result = combinedFacultyList;

    if (activeSchool !== "All") {
      result = result.filter(
        (f) => f.schoolAbbr.toUpperCase() === activeSchool
      );
    }

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

  const visibleFaculty = useMemo(() => {
    return filteredList.slice(0, visibleCount);
  }, [filteredList, visibleCount]);

  const shell = (children: React.ReactNode) => (
    <>{children}</>
  );

  const isLoading = authLoading;

  return shell(
    <div className="w-full space-y-8">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="pb-6 border-b border-border/10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary shrink-0" />
            Faculty Info
          </h1>
          <p className="text-xs text-muted-foreground">
            Search and view details of all VIT faculty members and cabins
          </p>
        </div>
        {!isLoading && filteredList.length > 0 && (
          <span className="text-[10px] text-muted-foreground/60 font-black tracking-widest uppercase pb-0.5">
            Showing {Math.min(visibleCount, filteredList.length)} of {filteredList.length} Faculty
          </span>
        )}
      </header>

      {isLoading ? (
        <FacultySkeleton />
      ) : (
        <>
          {/* ── Search Bar ───────────────────────────────────────────────────── */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search faculty by name, ID, cabin, building..."
              className="w-full h-10 pl-9 pr-10 rounded-xl border border-border/15 bg-muted/10 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/20 transition-all duration-150"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* ── School Chips (Horizontal Scrollable) ───────────────────────── */}
          {schools.length > 1 && (
            <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 pt-0 -mx-4 px-4 sm:mx-0 sm:px-0 scroll-smooth">
              {schools.map((school) => (
                <button
                  key={school}
                  onClick={() => setActiveSchool(school)}
                  className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer border shrink-0
                    ${
                      activeSchool === school
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border/10 text-muted-foreground hover:text-foreground hover:border-border/20 bg-muted/10"
                    }
                  `}
                >
                  {school === "All" ? "All Schools" : school}
                </button>
              ))}
            </div>
          )}

          {/* ── Faculty Flat Listing Grid ──────────────────────────────────── */}
          {filteredList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <Users className="w-10 h-10 text-muted-foreground/15" />
              <p className="text-sm font-bold text-foreground">
                No faculty members match your filters
              </p>
              <p className="text-xs text-muted-foreground/60">
                Try typing a different name or choosing a different school filter.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-10 pt-2">
              {visibleFaculty.map((faculty, i) => {
                const initials = getInitials(faculty.name);
                const hasLocation = 
                  (faculty.building && faculty.building !== "Not Available") || 
                  (faculty.cabin && faculty.cabin !== "Not Available");

                return (
                  <div 
                    key={`${faculty.empId}-${i}`} 
                    className="flex flex-col justify-between pb-6 border-b border-border/10 space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Avatar + Primary Info */}
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-muted/50 text-muted-foreground border border-border/10 flex items-center justify-center font-bold text-sm shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-foreground leading-snug truncate">
                            {faculty.name}
                          </h3>
                          <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground/60">
                            <Briefcase className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate leading-none">
                              {faculty.designation}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] font-black uppercase tracking-wider text-primary">
                            <GraduationCap className="w-3.5 h-3.5 shrink-0 text-primary/80" />
                            <span className="truncate leading-none">
                              {faculty.schoolAbbr} (ID: {faculty.empId})
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Location Cabin details */}
                      {hasLocation && (
                        <div className="space-y-1 text-xs text-muted-foreground">
                          {faculty.cabin && faculty.cabin !== "Not Available" && (
                            <div className="flex items-start gap-1.5">
                              <MapPin className="w-3.5 h-3.5 mt-0.5 text-muted-foreground/50 shrink-0" />
                              <span className="leading-snug">
                                {faculty.cabin}
                                {faculty.building && faculty.building !== "Not Available" && `, ${faculty.building}`}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Load More Button */}
          {filteredList.length > visibleCount && (
            <div className="flex justify-center pt-8">
              <button
                onClick={() => setVisibleCount((prev) => prev + 30)}
                className="px-6 py-2.5 rounded-xl border border-border/10 bg-muted/5 text-xs font-extrabold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted/10 hover:border-border/20 transition-all duration-150 cursor-pointer"
              >
                Load More Faculty
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
