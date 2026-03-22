import { useState, useMemo, useEffect } from "react";
import { Search, User, MapPin, Building2, School, Hash } from "lucide-react";
import Fuse from "fuse.js";
import facultyData from "@/data/faculty_info.json";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Loader from "@/components/Loader";

interface Faculty {
  emp_sno: string;
  emp_name: string;
  emp_id: string;
  emp_designation: string;
  emp_school_abbr: string;
  emp_school: string;
  emp_location_building: string;
  emp_location_cabin: string;
}

const ITEMS_PER_PAGE = 30;

export default function FacultyInfoPage() {
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [loading, setLoading] = useState(true);

  // Initialize Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    return new Fuse(facultyData as Faculty[], {
      keys: ["emp_name", "emp_school", "emp_school_abbr", "emp_id", "emp_designation"],
      threshold: 0.3,
    });
  }, []);

  // Filtered results based on query
  const filteredData = useMemo(() => {
    if (!query) return facultyData as Faculty[];
    return fuse.search(query).map((result) => result.item);
  }, [query, fuse]);

  // Reset visible count when query changes
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [query]);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const visibleData = filteredData.slice(0, visibleCount);
  const hasMore = visibleCount < filteredData.length;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Faculty Directory
          </h1>
          <p className="text-muted-foreground mt-1">
            Search and find contact information for academic staff.
          </p>
        </div>
        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, school, ID..."
            className="pl-10 h-11 bg-card border-border focus:border-primary/50 focus:ring-primary/20 transition-all rounded-xl"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {visibleData.map((faculty, index) => (
          <div key={faculty.emp_id + index}>
            <Card className="h-full border-border bg-card/40 backdrop-blur-sm hover:border-primary/40 hover:bg-card/60 transition-all duration-200 desktop-shadow group">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0 transition-colors group-hover:bg-primary/20">
                    <User className="w-5 h-5" />
                  </div>
                  <Badge variant="secondary" className="bg-muted font-mono text-[10px] uppercase tracking-wider">
                    {faculty.emp_school_abbr}
                  </Badge>
                </div>
                <CardTitle className="mt-3 text-lg font-semibold leading-tight group-hover:text-primary transition-all">
                  {faculty.emp_name}
                </CardTitle>
                <CardDescription className="text-sm font-medium">
                  {faculty.emp_designation}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-0">
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <School className="w-4 h-4 mt-0.5 shrink-0" />
                    <span className="leading-snug">{faculty.emp_school}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Building2 className="w-4 h-4 mt-0.5 shrink-0" />
                    <span>{faculty.emp_location_building || "Not Available"}</span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                    <span className="italic">{faculty.emp_location_cabin || "Not Available"}</span>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-border flex items-center justify-between text-[11px] font-mono text-muted-foreground/60">
                  <div className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    ID: {faculty.emp_id}
                  </div>
                  <span>#{faculty.emp_sno}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="p-4 rounded-full bg-muted/20">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-semibold">No faculty found</h3>
            <p className="text-muted-foreground">Try adjusting your search terms.</p>
          </div>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center pt-8 pb-12">
          <Button 
            onClick={handleLoadMore} 
            variant="outline" 
            className="rounded-full px-8 h-12 border-border/60 hover:border-primary/50 transition-all bg-card/50 backdrop-blur-sm"
          >
            Load More Results
            {/* Show count of remaining */}
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              ({filteredData.length - visibleCount} remaining)
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}
