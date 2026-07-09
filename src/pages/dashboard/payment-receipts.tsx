import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getPaymentReceipts, Receipt } from "@/lib/features";

import { ErrorDisplay } from "@/components/error-display";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineDisplay } from "@/components/offline-display";
import { isNetworkError } from "@/lib/utils";
import {
  ArrowLeft,
  Calendar,
  Receipt as ReceiptIcon,
  CreditCard,
  FileText,
  User,
  ChevronDown
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
  return <div className={`animate-pulse rounded-lg bg-muted/65 ${className}`} />;
}

function PaymentReceiptsSkeleton() {
  return (
    <div className="w-full space-y-6 px-2 py-4 animate-pulse">
      {/* Header */}
      <div className="space-y-1.5">
        <Sk className="h-7 w-44" />
        <Sk className="h-3.5 w-64" />
      </div>

      {/* Registration Details card */}
      <div className="bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl p-4 flex items-center gap-4">
        <Sk className="w-12 h-12 rounded-full shrink-0" />
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 flex-1">
          <div className="space-y-1.5">
            <Sk className="h-2.5 w-16" />
            <Sk className="h-4 w-24" />
          </div>
          <div className="space-y-1.5">
            <Sk className="h-2.5 w-20" />
            <Sk className="h-4 w-28" />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Sk className="h-2.5 w-20" />
            <Sk className="h-4 w-20" />
          </div>
        </div>
      </div>

      {/* Overview stats card */}
      <div className="bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-2 divide-x divide-border/10">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-3">
              <Sk className="w-10 h-10 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1">
                <Sk className="h-2.5 w-20" />
                <Sk className="h-5 w-10" />
                <Sk className="h-2 w-16" />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-border/10 p-4 flex items-center gap-3">
          <Sk className="w-10 h-10 rounded-xl shrink-0" />
          <div className="space-y-2 flex-1">
            <Sk className="h-2.5 w-24" />
            <Sk className="h-5 w-28" />
            <Sk className="h-2 w-20" />
          </div>
        </div>
      </div>

      {/* Receipt records list */}
      <div className="space-y-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Sk className="w-10 h-10 rounded-xl shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <Sk className="h-4 w-32" />
                <Sk className="h-3 w-20" />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Sk className="h-5 w-20" />
              <Sk className="h-4 w-4 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PaymentReceiptsPage() {
  const { loading: authLoading } = useAuth();
  const isOnline = useOnlineStatus();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
        // Remove placeholder row or waste header row
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

  const filteredReceipts = useMemo(() => receipts, [receipts]);

  // Compute Summary Statistics (Exactly 3 stats as requested)
  const stats = useMemo(() => {
    if (filteredReceipts.length === 0) {
      return { totalPaid: 0, count: 0, latestDate: "N/A", latestAmount: 0 };
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
      latestDate: latestReceipt?.date || "N/A",
      latestAmount: latestReceipt?.amount || 0
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

  const shell = (children: React.ReactNode) => <>{children}</>;

  const showOffline = receipts.length === 0 && (isOnline === false || isNetworkError(error, isOnline));

  if (showOffline && !loading) {
    return shell(<OfflineDisplay onRetry={load} />);
  }

  if (authLoading || (loading && receipts.length === 0)) {
    return shell(<PaymentReceiptsSkeleton />);
  }

  if (error && receipts.length === 0) {
    return shell(
      <div className="flex h-full items-center justify-center font-saira">
        <ErrorDisplay message={error} onRetry={load} />
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
          <button onClick={load} className="text-xs font-bold uppercase tracking-wider shrink-0 border-0 bg-transparent text-destructive cursor-pointer">
            Retry
          </button>
        </div>
      )}
      
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="flex items-center gap-4">
        <button
          onClick={() => window.history.back()}
          className="p-1 text-foreground shrink-0 border-0 bg-transparent cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="space-y-0.5">
          <h1 className="text-xl font-bold tracking-tight text-foreground">Receipt History</h1>
          <p className="text-xs text-muted-foreground">View all fee receipts and payment details</p>
        </div>
      </header>

      {/* ── Registration Details ────────────────────────────────────────────── */}
      {studentMeta && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 bg-sky-500 rounded-full" />
            <h2 className="text-sm font-semibold tracking-tight text-foreground">Registration Details</h2>
          </div>
          
          <div className="bg-muted/30 dark:bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-sky-500/10 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-sky-400" />
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 flex-1">
              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Reg. No.</span>
                <span className="text-sm font-semibold text-foreground">{studentMeta.regNo}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Application No.</span>
                <span className="text-sm font-semibold text-foreground">{studentMeta.applNo}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Campus Code</span>
                <span className="text-sm font-semibold text-foreground">{studentMeta.campusCode}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Overview Stats (3 stats card) ─────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-sky-500 rounded-full" />
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Overview</h2>
        </div>

        <div className="bg-muted/30 dark:bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl overflow-hidden divide-y divide-border/10">
          <div className="grid grid-cols-2 divide-x divide-border/10">
            {/* Cell 1: Total Receipts */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0 text-sky-400">
                <ReceiptIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider block leading-none">Total Receipts</span>
                <span className="text-lg font-bold text-foreground block mt-1 leading-none">{stats.count}</span>
                <span className="text-[9px] text-muted-foreground/60 block mt-1 leading-none">Successfully paid</span>
              </div>
            </div>
            {/* Cell 2: Total Amount Paid */}
            <div className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0 text-emerald-400">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] text-muted-foreground uppercase tracking-wider block leading-none">Total Amount Paid</span>
                <span className="text-lg font-bold text-emerald-400 block mt-1 leading-none">{formatINR(stats.totalPaid)}</span>
                <span className="text-[9px] text-muted-foreground/60 block mt-1 leading-none">All time</span>
              </div>
            </div>
          </div>
          {/* Cell 3: Latest Payment */}
          <div className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 text-purple-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider block leading-none">Latest Payment</span>
              <span className="text-lg font-bold text-foreground block mt-1 leading-none">{stats.latestDate}</span>
              <span className="text-[9px] text-muted-foreground/60 block mt-1 leading-none">Fee: {formatINR(stats.latestAmount)}</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Receipt Records Collapsible List ──────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-sky-500 rounded-full" />
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Receipt Records</h2>
        </div>

        <div className="space-y-3">
          {filteredReceipts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-muted/15 dark:bg-muted/15 dark:bg-[#0e0e0f]/20 border border-border/40 dark:border-border/10 rounded-2xl">
              <ReceiptIcon className="w-8 h-8 text-muted-foreground/20" />
              <p className="text-sm font-semibold text-foreground leading-none">No receipts found</p>
              <p className="text-xs text-muted-foreground">No payment records are available.</p>
            </div>
          ) : (
            filteredReceipts.map((receipt) => {
              const isExpanded = expandedId === receipt.receiptNumber;
              return (
                <div key={receipt.receiptNumber} className="bg-muted/30 dark:bg-muted/30 dark:bg-[#0e0e0f]/40 border border-border/40 dark:border-border/10 rounded-2xl overflow-hidden">
                  {/* Accordion Trigger */}
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : receipt.receiptNumber)}
                    className="w-full text-left p-4 flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/5 transition-colors border-0 bg-transparent"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-foreground leading-none truncate">Receipt #{receipt.receiptNumber}</h3>
                        <p className="text-[10px] text-muted-foreground mt-1.5 leading-none">{receipt.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-emerald-400">{formatINR(receipt.amount)}</span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </button>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-border/10 bg-muted/[0.02]">
                      <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-[10px] pt-2">
                        <div>
                          <span className="text-muted-foreground/60 font-semibold uppercase tracking-wider block">Receipt ID</span>
                          <span className="font-mono text-foreground mt-0.5 block">{receipt.receiptId || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground/60 font-semibold uppercase tracking-wider block">Campus Code</span>
                          <span className="text-foreground mt-0.5 block">{receipt.campusCode}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground/60 font-semibold uppercase tracking-wider block">Application No.</span>
                          <span className="text-foreground mt-0.5 block">{receipt.applNo || "N/A"}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-muted-foreground/60 font-semibold uppercase tracking-wider block">Registration ID</span>
                          <span className="text-foreground mt-0.5 block">{receipt.regNo || "N/A"}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
