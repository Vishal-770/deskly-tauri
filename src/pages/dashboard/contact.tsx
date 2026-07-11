import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getContactInfo, ContactDetail } from "@/lib/features";
import { openUrl } from "@tauri-apps/plugin-opener";
import { isNetworkError } from "@/lib/utils";

import { ErrorDisplay } from "@/components/error-display";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineDisplay } from "@/components/offline-display";
import { Copy, Check, Phone, Search, X, Mail } from "lucide-react";

// ─── Gmail SVG Icon ───────────────────────────────────────────────────────────

function GmailIcon({ className }: { className?: string }) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
    >
      <title>Gmail</title>
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-1.29 1.454-2.032 2.509-1.2L12 11.23l9.491-6.973c1.055-.831 2.509-.09 2.509 1.2z" />
    </svg>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-muted/65 ${className}`} />;
}

function ContactSkeleton() {
  return (
    <div className="w-full space-y-6 px-2 py-4 animate-pulse font-saira">
      <div className="space-y-1">
        <Sk className="h-7 w-32" />
      </div>
      <Sk className="h-10 w-full rounded-xl" />
      <div className="divide-y divide-border/10 border-t border-b border-border/10">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="py-4 flex items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <Sk className="h-4.5 w-1/3" />
              <Sk className="h-3.5 w-2/3" />
              <Sk className="h-3 w-1/2" />
            </div>
            <div className="flex gap-2">
              <Sk className="w-8 h-8 rounded-xl" />
              <Sk className="w-8 h-8 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Contact Row ─────────────────────────────────────────────────────────────

function ContactRow({ contact }: { contact: ContactDetail }) {
  const [copied, setCopied] = useState(false);
  const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contact.email)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contact.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleOpenGmail = async () => {
    try {
      await openUrl(gmailUrl);
    } catch (err) {
      console.error("Failed to open Gmail link:", err);
    }
  };

  return (
    <div className="py-4 flex items-center justify-between gap-4 hover:bg-muted/5 transition-colors duration-150">
      {/* Left section: Name + Description + Email */}
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="text-sm font-bold text-foreground leading-none">
          {contact.department}
        </h3>
        {contact.description && (
          <p className="text-xs text-muted-foreground/60 leading-relaxed font-medium">
            {contact.description}
          </p>
        )}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground/60 leading-none pt-0.5">
          <Mail className="w-3.5 h-3.5 shrink-0 text-muted-foreground/45" />
          <span className="truncate">{contact.email}</span>
        </div>
      </div>

      {/* Right section: Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Copy Button */}
        <button
          onClick={handleCopy}
          title="Copy email address"
          className={`p-2 rounded-xl border transition-colors cursor-pointer flex items-center justify-center bg-transparent
            ${copied
              ? "bg-primary/10 border-primary/20 text-primary"
              : "bg-muted/10 border border-border/10 text-muted-foreground hover:text-foreground hover:bg-muted/20"
            }`}
        >
          {copied ? (
            <Check className="w-4 h-4 text-primary" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>

        {/* Gmail Link */}
        <button
          onClick={handleOpenGmail}
          title="Compose Email"
          className="p-2 rounded-xl border border-border/10 bg-muted/10 text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors flex items-center justify-center cursor-pointer"
        >
          <GmailIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ContactPage() {
  const { loading: authLoading } = useAuth();
  const isOnline = useOnlineStatus();
  const [contacts, setContacts] = useState<ContactDetail[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Load from Cache first
  useEffect(() => {
    const cached = localStorage.getItem("deskly::cache::contact");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) {
          setContacts(parsed);
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to parse cached contacts", e);
      }
    }
  }, []);

  const fetchContacts = async () => {
    setLoading(contacts && contacts.length > 0 ? false : true);
    setError(null);
    try {
      const res = await getContactInfo();
      if (res.success && res.data) {
        setContacts(res.data);
        localStorage.setItem("deskly::cache::contact", JSON.stringify(res.data));
      } else {
        setError(res.error ?? "Failed to load contact information.");
      }
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

  const shell = (children: React.ReactNode) => <>{children}</>;

  const showOffline = !contacts && (isOnline === false || isNetworkError(error, isOnline));

  if (showOffline && !loading) {
    return shell(<OfflineDisplay onRetry={fetchContacts} />);
  }

  if (authLoading || (loading && !contacts)) return shell(<ContactSkeleton />);

  if (error && !contacts) {
    return shell(
      <div className="flex h-full items-center justify-center font-saira">
        <ErrorDisplay title="Contacts Unavailable" message={error} onRetry={fetchContacts} />
      </div>
    );
  }

  return shell(
    <div className="w-full space-y-6 px-2 py-4 font-saira select-none overscroll-y-contain">
      <style>{`.font-saira { font-family: 'Saira', sans-serif !important; }`}</style>

      {/* Error banner */}
      {error && !isNetworkError(error, isOnline) && (
        <div className="flex items-center justify-between gap-4 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl">
          <p className="text-xs font-semibold truncate">Sync failed — {error}</p>
          <button onClick={fetchContacts} className="text-xs font-bold uppercase tracking-wider shrink-0 border-0 bg-transparent text-destructive cursor-pointer">
            Retry
          </button>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-start gap-2">
        <Phone className="w-6 h-6 text-primary shrink-0 mt-0.5" />
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground leading-none">
          Contacts
        </h1>
      </header>

      {/* ── Search ──────────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search department, email..."
          className="w-full h-10 pl-9 pr-9 bg-muted/20 border border-border/10 rounded-xl text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition-colors"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-foreground transition-colors cursor-pointer border-0 bg-transparent"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Directory ───────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
          <Phone className="w-8 h-8 text-muted-foreground/20" />
          <p className="text-sm font-semibold text-foreground leading-none">No contacts found</p>
          <p className="text-xs text-muted-foreground">Try a different search term.</p>
        </div>
      ) : (
        <div className="divide-y divide-border/10 border-t border-b border-border/10">
          {filtered.map((contact) => (
            <ContactRow key={contact.department} contact={contact} />
          ))}
        </div>
      )}
    </div>
  );
}
