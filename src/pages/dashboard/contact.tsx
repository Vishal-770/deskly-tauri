import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getContactInfo, ContactDetail } from "@/lib/features";
import DashboardSidebar from "@/components/DashBoardSideBar";
import { ErrorDisplay } from "@/components/error-display";
import { Mail, Phone, Search, Building2, X } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(dept: string): string {
  return dept
    .split(/[\s/&-]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Fixed palette — rotates through hues based on index
const ACCENT_PALETTES = [
  "from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-500",
  "from-violet-500/10 to-violet-500/5 border-violet-500/20 text-violet-500",
  "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-500",
  "from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-500",
  "from-rose-500/10 to-rose-500/5 border-rose-500/20 text-rose-500",
  "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20 text-cyan-500",
  "from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 text-indigo-500",
  "from-orange-500/10 to-orange-500/5 border-orange-500/20 text-orange-500",
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-muted/60 ${className}`} />;
}

function ContactSkeleton() {
  return (
    <div className="w-full space-y-6">
      <div className="pb-4 border-b border-border/20 space-y-2">
        <Sk className="h-7 w-36" />
        <Sk className="h-3 w-60" />
      </div>
      <Sk className="h-10 w-full rounded-xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="rounded-2xl border border-border/10 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <Sk className="w-10 h-10 rounded-xl shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Sk className="h-3.5 w-3/4" />
                <Sk className="h-2.5 w-1/2" />
              </div>
            </div>
            <div className="h-px bg-border/20" />
            <Sk className="h-3 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Contact Card ─────────────────────────────────────────────────────────────

function ContactCard({ contact, index }: { contact: ContactDetail; index: number }) {
  const palette = ACCENT_PALETTES[index % ACCENT_PALETTES.length];
  const initials = getInitials(contact.department);

  return (
    <div className="group rounded-2xl border border-border/10 bg-card p-5 space-y-4 hover:border-border/30 transition-colors duration-200">
      {/* Icon + Title */}
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${palette} border flex items-center justify-center shrink-0`}>
          <span className="text-xs font-black">{initials}</span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-extrabold text-foreground leading-snug">
            {contact.department}
          </h3>
          {contact.description && (
            <p className="text-[10px] sm:text-xs text-muted-foreground/60 leading-snug mt-0.5 line-clamp-2">
              {contact.description}
            </p>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-border/10" />

      {/* Email */}
      <a
        href={`mailto:${contact.email}`}
        className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors group/link"
      >
        <Mail className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 group-hover/link:text-primary transition-colors" />
        <span className="truncate">{contact.email}</span>
      </a>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ContactPage() {
  const { loading: authLoading } = useAuth();
  const [contacts, setContacts] = useState<ContactDetail[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getContactInfo();
      if (res.success && res.data) setContacts(res.data);
      else setError(res.error ?? "Failed to load contact information.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContacts(); }, []);

  const filtered = useMemo(() => {
    if (!contacts) return [];
    if (!query.trim()) return contacts;
    const q = query.toLowerCase();
    return contacts.filter(
      (c) =>
        c.department.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q)
    );
  }, [contacts, query]);

  const shell = (children: React.ReactNode) => (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground select-none">
      <DashboardSidebar />
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden no-scrollbar pt-4 sm:pt-8 pb-16 px-4 sm:px-6 md:px-10 bg-background">
        {children}
      </main>
    </div>
  );

  if (error && !contacts) {
    return shell(
      <div className="flex h-full items-center justify-center">
        <ErrorDisplay title="Contacts Unavailable" message={error} onRetry={fetchContacts} />
      </div>
    );
  }

  const isLoading = authLoading || loading;

  return shell(
    <div className="w-full space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="pb-4 border-b border-border/20 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2.5">
            <Phone className="w-6 h-6 text-primary shrink-0" />
            Contacts
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            University department contacts and email directory
          </p>
        </div>
        {!isLoading && contacts && (
          <span className="text-xs text-muted-foreground/50 font-bold pb-0.5">
            {filtered.length} of {contacts.length} departments
          </span>
        )}
      </header>

      {isLoading ? <ContactSkeleton /> : (
        <>
          {/* ── Search ──────────────────────────────────────────────────────── */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search department, email…"
              className="w-full h-10 pl-10 pr-10 rounded-xl border border-border/20 bg-muted/10 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all"
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

          {/* ── Grid ────────────────────────────────────────────────────────── */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
              <Building2 className="w-10 h-10 text-muted-foreground/20" />
              <p className="text-sm font-bold text-foreground">No contacts found</p>
              <p className="text-xs text-muted-foreground">
                Try a different search term
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((contact, i) => (
                <ContactCard key={`${contact.department}-${i}`} contact={contact} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
