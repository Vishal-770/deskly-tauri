import { useEffect, useState, useMemo } from "react";
import { getContactInfo, type ContactDetail } from "@/lib/features";
import { Search, Mail, Copy, Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "@/components/Loader";
import { ErrorDisplay } from "@/components/error-display";
import { Button } from "@/components/ui/button";

export default function ContactPage() {
  const [contacts, setContacts] = useState<ContactDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const fetchContacts = async () => {
    setLoading(true);
    setError(null);
    const res = await getContactInfo();
    if (res.success && res.data) {
      setContacts(res.data);
    } else {
      let msg = res.error ?? "Failed to fetch contact info";
      if (msg.toLowerCase().includes("keyring") || msg.toLowerCase().includes("auto-relogin")) {
        msg = "Session expired. Please log in again to refresh contact details.";
      }
      setError(msg);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(c => 
      c.department.toLowerCase().includes(q) || 
      c.description.toLowerCase().includes(q) || 
      c.email.toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  const copyToClipboard = (email: string) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  if (loading && contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">
          Syncing Directory...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full px-6 lg:px-12 py-12 space-y-12 pb-32">
      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-10 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]" />
          <h1 className="text-4xl md:text-6xl font-black tracking-tightest text-foreground uppercase leading-none">
            Directory
          </h1>
        </div>
        <p className="text-sm text-muted-foreground font-bold opacity-30 tracking-widest pl-4 uppercase">
          Official University Support & Contact Points
        </p>
      </header>

      {/* Search Bar */}
      <div className="relative group max-w-2xl">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <input
          type="text"
          placeholder="SEARCH DEPARTMENTS, EMAILS, OR ROLES..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-12 py-4 bg-muted/20 border-b-2 border-transparent focus:border-primary focus:bg-muted/40 transition-all outline-none text-xs font-bold tracking-widest uppercase placeholder:text-muted-foreground/30"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 hover:text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {error ? (
        <ErrorDisplay 
          message={error} 
          onRetry={fetchContacts}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredContacts.map((contact, idx) => (
              <motion.div
                layout
                key={`${contact.department}-${idx}`}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: idx * 0.03 }}
                className="group relative flex flex-col p-6 rounded-2xl border border-border/50 bg-card/30 hover:bg-muted/5 transition-all duration-300"
              >
                <div className="flex-1 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-lg font-black tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">
                      {contact.department}
                    </h3>
                  </div>
                  
                  <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                    {contact.description}
                  </p>
                </div>

                <div className="mt-6 pt-6 border-t border-border/50 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-[10px] font-bold text-muted-foreground truncate tracking-wider uppercase">
                      {contact.email}
                    </span>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary shrink-0"
                    onClick={() => copyToClipboard(contact.email)}
                  >
                    {copiedEmail === contact.email ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {filteredContacts.length === 0 && !loading && !error && (
        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4 opacity-30">
          <Search className="w-12 h-12" />
          <p className="text-xs font-black uppercase tracking-widest">
            No contacts found matching your search
          </p>
        </div>
      )}
    </div>
  );
}
