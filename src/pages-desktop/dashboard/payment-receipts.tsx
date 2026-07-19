import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getPaymentReceipts, Receipt } from "@/lib/features";

import { ErrorDisplay } from "@/components/error-display";
import {
  ArrowLeft,
  Search,
  Calendar,
  Receipt as ReceiptIcon,
  CreditCard,
  FileText,
  User
} from "lucide-react";

// ─── Currency Formatter Helper ────────────────────────────────────────────────

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

// ─── Date Parser Helper ───────────────────────────────────────────────────────

function parseReceiptDate(dateStr: string): Date {
  const parts = dateStr.trim().split("-");
  if (parts.length !== 3) return new Date();
  
  const day = parseInt(parts[0], 10);
  const monthStr = parts[1].toUpperCase();
  const year = parseInt(parts[2], 10);

  const months: Record<string, number> = {
    JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
    JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11
  };
  
  const month = months[monthStr] ?? 0;
  return new Date(year, month, day);
}

// ─── Loader Skeleton Layout ───────────────────────────────────────────────────

function Sk({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-muted/65 ${className}`} />;
}

function PaymentReceiptsSkeleton() {
  return (
    <div className="w-full space-y-6">
      {/* Header skeleton */}
      <div className="pb-4 border-b border-border/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Sk className="w-8 h-8 rounded-full" />
            <Sk className="h-6 w-36 rounded-full" />
          </div>
          <Sk className="h-3 w-56 rounded-full pl-10" />
        </div>
      </div>

      {/* Student Profile Details skeleton */}
      <div className="w-full py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full">
          <Sk className="w-10 h-10 rounded-full shrink-0" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-2 w-full max-w-xl">
            <div className="space-y-1">
              <Sk className="h-2.5 w-12 rounded-full" />
              <Sk className="h-4 w-24 rounded-full" />
            </div>
            <div className="space-y-1">
              <Sk className="h-2.5 w-24 rounded-full" />
              <Sk className="h-4 w-28 rounded-full" />
            </div>
            <div className="space-y-1 col-span-2 md:col-span-1">
              <Sk className="h-2.5 w-16 rounded-full" />
              <Sk className="h-4 w-16 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Stats Summary Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="py-2 flex items-center gap-4">
            <Sk className="w-10 h-10 rounded-full shrink-0" />
            <div className="space-y-2 w-full">
              <Sk className="h-2.5 w-20 rounded-full" />
              <Sk className="h-5 w-24 rounded-full" />
              <Sk className="h-2 w-16 rounded-full" />
            </div>
          </div>
        ))}
      </div>

      {/* Search Controls skeleton */}
      <div className="w-full py-4">
        <Sk className="h-10 w-full max-w-sm rounded-full" />
      </div>

      {/* Table skeleton (Desktop) / Cards (Mobile) */}
      <div className="w-full">
        <div className="hidden md:block">
          <div className="bg-accent/15 border-b border-border/30 p-3 flex justify-between rounded-full">
            <Sk className="h-3 w-10 rounded-full" />
            <Sk className="h-3 w-28 rounded-full" />
            <Sk className="h-3 w-20 rounded-full" />
            <Sk className="h-3 w-16 rounded-full" />
            <Sk className="h-3 w-16 rounded-full" />
            <Sk className="h-3 w-24 rounded-full" />
          </div>
          <div className="divide-y divide-border/20 p-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="py-4 flex justify-between items-center">
                <Sk className="h-8 w-8 rounded-full" />
                <Sk className="h-4 w-24 rounded-full" />
                <Sk className="h-4 w-16 rounded-full" />
                <Sk className="h-4 w-20 rounded-full" />
                <Sk className="h-4 w-10 rounded-full" />
                <Sk className="h-4 w-28 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile View skeleton */}
        <div className="md:hidden divide-y divide-border/20">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="py-4 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-3">
                  <Sk className="w-8 h-8 rounded-full" />
                  <div className="space-y-1">
                    <Sk className="h-3.5 w-20 rounded-full" />
                    <Sk className="h-2 w-12 rounded-full" />
                  </div>
                </div>
                <Sk className="h-4 w-16 rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-2 pl-11">
                <div className="space-y-1">
                  <Sk className="h-2 w-10 rounded-full" />
                  <Sk className="h-3 w-20 rounded-full" />
                </div>
                <div className="space-y-1">
                  <Sk className="h-2 w-14 rounded-full" />
                  <Sk className="h-3 w-12 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PaymentReceiptsPage() {
  const { loading: authLoading } = useAuth();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Load receipts data
  useEffect(() => {
    const cached = localStorage.getItem("deskly::cache::payment_receipts");
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.length > 0) {
          setReceipts(parsed);
          setLoading(false);
        }
      } catch (e) {
        console.error("Failed to parse cached receipts", e);
      }
    }
  }, []);

  async function load() {
    try {
      setLoading(receipts && receipts.length > 0 ? false : true);
      const res = await getPaymentReceipts();
      if (res.success && res.data) {
        // Remove placeholder row or waste header row (e.g. where receiptNumber is "RECEIPT NUMBER")
        const cleanList = res.data.filter(
          (r) => r.receiptNumber.trim().toUpperCase() !== "RECEIPT NUMBER"
        );
        setReceipts(cleanList);
        localStorage.setItem("deskly::cache::payment_receipts", JSON.stringify(cleanList));
      } else {
        setError(res.error ?? "Failed to fetch payment receipts.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  // Compute clean, filtered data
  const filteredReceipts = useMemo(() => {
    return receipts.filter((receipt) => {
      return (
        receipt.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        receipt.receiptId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });
  }, [receipts, searchQuery]);

  // Compute Summary Statistics
  const stats = useMemo(() => {
    if (filteredReceipts.length === 0) {
      return { totalPaid: 0, count: 0, latestDate: "N/A" };
    }

    const count = filteredReceipts.length;
    const totalPaid = filteredReceipts.reduce((sum, r) => sum + r.amount, 0);
    
    // Pick the most recent payment date
    const latestReceipt = filteredReceipts.reduce((latest, current) => {
      const latestDate = parseReceiptDate(latest.date);
      const currentDate = parseReceiptDate(current.date);
      return currentDate > latestDate ? current : latest;
    }, filteredReceipts[0]);

    return {
      totalPaid,
      count,
      latestDate: latestReceipt?.date || "N/A"
    };
  }, [filteredReceipts]);

  // Extract Student profile metadata dynamically from the first valid receipt record
  const studentMeta = useMemo(() => {
    if (receipts.length === 0) return null;
    return {
      regNo: receipts[0].regNo || "N/A",
      applNo: receipts[0].applNo || "N/A",
      campusCode: receipts[0].campusCode || "N/A"
    };
  }, [receipts]);


  const shell = (children: React.ReactNode) => (
    <>{children}</>
  );

  if (authLoading || loading) {
    return shell(<PaymentReceiptsSkeleton />);
  }

  if (error && receipts.length === 0) {
    return shell(
      <div className="flex h-full items-center justify-center">
        <ErrorDisplay message={error} onRetry={load} />
      </div>
    );
  }

  return shell(
    <div className="w-full space-y-6">
      
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="pb-4 border-b border-border/20 flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.history.back()}
              className="p-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/95 to-muted-foreground bg-clip-text text-transparent">
              Receipt History
            </h1>
          </div>
          <p className="text-xs text-muted-foreground pl-7">
            View all fee receipts and payment details
          </p>
        </div>
      </header>

      {/* ── Student Profile Details ───────────────────────────────────────── */}
      {studentMeta && (
        <div className="w-full py-4 flex items-center justify-between gap-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-1 sm:gap-y-0.5">
              <div className="min-w-0">
                <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">Reg. No.</p>
                <p className="text-sm font-black text-foreground truncate">{studentMeta.regNo}</p>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">Application No.</p>
                <p className="text-sm font-bold text-foreground truncate">{studentMeta.applNo}</p>
              </div>
              <div className="min-w-0 col-span-2 md:col-span-1">
                <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wider">Campus Code</p>
                <p className="text-sm font-bold text-foreground/80">{studentMeta.campusCode}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Top Stats Summary Grid ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:grid-cols-3 py-2">
        {/* Total Receipts */}
        <div className="flex items-center gap-4 py-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <ReceiptIcon className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Receipts</p>
            <p className="text-lg font-black text-foreground leading-none">{stats.count}</p>
            <p className="text-xs text-muted-foreground/60 font-semibold">Successfully Paid</p>
          </div>
        </div>

        {/* Total Amount Paid */}
        <div className="flex items-center gap-4 py-2">
          <div className="w-10 h-10 rounded-full bg-chart-2/10 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5 text-chart-2" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Amount Paid</p>
            <p className="text-lg font-black text-chart-2 leading-none">{formatINR(stats.totalPaid)}</p>
            <p className="text-xs text-muted-foreground/60 font-semibold">All Time</p>
          </div>
        </div>

        {/* Latest Payment */}
        <div className="flex items-center gap-4 py-2">
          <div className="w-10 h-10 rounded-full bg-chart-4/10 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-chart-4" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Latest Payment</p>
            <p className="text-lg font-black text-foreground leading-none truncate max-w-full">{stats.latestDate}</p>
            <p className="text-xs text-muted-foreground/60 font-semibold">Most Recent</p>
          </div>
        </div>
      </div>

      {/* ── Search Controls ──────────────────────────────────────── print:hidden */}
      <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden py-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <input
            type="text"
            placeholder="Search by receipt number..."
            className="h-10 w-full rounded-full border border-border/50 bg-background pl-9 pr-3 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all placeholder:text-muted-foreground/40 text-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Table / Cards Container ───────────────────────────────────────── */}
      <div className="w-full">
        {filteredReceipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-dashed border-border/60 rounded-3xl bg-accent/5">
            <ReceiptIcon className="w-10 h-10 text-muted-foreground/25" />
            <p className="text-sm font-bold text-foreground">No receipts found</p>
            <p className="text-xs text-muted-foreground">
              Try adjusting your search criteria.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto rounded-3xl">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-accent/15 border-b border-border/30 text-xs font-black uppercase tracking-wider text-muted-foreground/80">
                    <th className="py-3 px-4 w-12 text-center">Icon</th>
                    <th className="py-3 px-4">Receipt Number</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Campus Code</th>
                    <th className="py-3 px-4">Receipt ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20 text-xs font-semibold text-foreground/90">
                  {filteredReceipts.map((receipt) => {
                    return (
                      <tr
                        key={receipt.receiptNumber}
                        className="hover:bg-accent/5 transition-colors duration-150"
                      >
                        <td className="py-3 px-4 text-center">
                          <div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center mx-auto text-primary">
                            <FileText className="w-4 h-4" />
                          </div>
                        </td>
                        <td className="py-3 px-4 font-bold text-foreground">{receipt.receiptNumber}</td>
                        <td className="py-3 px-4 text-muted-foreground/80">{receipt.date}</td>
                        <td className="py-3 px-4 font-extrabold text-chart-2">
                          {formatINR(receipt.amount)}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground/80">{receipt.campusCode}</td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground/70 shrink-0">
                          {receipt.receiptId || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile List View (Flat, divider-based item list with no offset card color) */}
            <div className="divide-y divide-border/20 md:hidden">
              {filteredReceipts.map((receipt) => {
                return (
                  <div
                    key={receipt.receiptNumber}
                    className="py-4 flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-xs font-black text-foreground">
                            Receipt #{receipt.receiptNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">{receipt.date}</p>
                        </div>
                      </div>
                      <span className="text-sm font-extrabold text-chart-2">
                        {formatINR(receipt.amount)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pl-11">
                      <div>
                        <p className="text-muted-foreground/60 font-bold uppercase tracking-wider">Receipt ID</p>
                        <p className="font-mono text-foreground mt-0.5 truncate">{receipt.receiptId || "-"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground/60 font-bold uppercase tracking-wider">Campus Code</p>
                        <p className="font-semibold text-foreground mt-0.5">{receipt.campusCode}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

    </div>
  );
}
