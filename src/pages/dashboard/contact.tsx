import { useEffect, useState } from "react";
import { getContactInfo, type ContactDetail } from "@/lib/features";

export default function ContactPage() {
  const [contacts, setContacts] = useState<ContactDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const res = await getContactInfo();
      if (res.success && res.data) {
        setContacts(res.data);
      } else {
        setError(res.error ?? "Failed to fetch contact info");
      }
      setLoading(false);
    };

    void run();
  }, []);

  return (
    <div className="w-full px-6 lg:px-10 py-10 space-y-8 pb-20">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Contact</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Important contact details
        </p>
      </header>

      {loading ? (
        <main className="p-6 h-full flex items-center justify-center">
          Loading contacts...
        </main>
      ) : error ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-5 text-destructive font-medium">
          {error}
        </div>
      ) : (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contacts.map((c, idx) => (
            <article
              key={`${c.department}-${idx}`}
              className="rounded-xl border p-4 bg-card/30"
            >
              <h2 className="text-lg font-semibold">{c.department}</h2>
              <p className="text-sm text-muted-foreground mt-2">
                {c.description}
              </p>
              <p className="text-sm mt-3">{c.email}</p>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
