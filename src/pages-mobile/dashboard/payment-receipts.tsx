import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getPaymentReceipts, Receipt } from "@/lib/features";
import { ErrorDisplay } from "@/components/error-display";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { OfflineDisplay } from "@/components/offline-display";
import { isNetworkError } from "@/lib/utils";
import {
  FileText,
  ChevronDown,
  CreditCard,
  User,
  Receipt as ReceiptIcon,
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
  return <div className={`animate-pulse rounded-2xl bg-muted/65 ${className}`} />;
}

function PaymentReceiptsSkeleton() {
  return (
    <div className="w-full space-y-6 px-2 py-4 animate-pulse font-saira">
      <div className="space-y-1">
        <Sk className="h-7 w-44" />
      </div>
      <Sk className="h-20 w-full rounded-[24px]" />
      <Sk className="h-24 w-full rounded-[24px]" />
      <div className="space-y-3 pt-2">
        <Sk className="h-5 w-36" />
        {[...Array(4)].map((_, i) => (
          <Sk key={i} className="h-20 w-full rounded-[24px]" />
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

  const stats = useMemo(() => {
    if (filteredReceipts.length === 0) {
      return { totalPaid: 0, count: 0, latestDate: "N/A" };
    }

    const count = filteredReceipts.length;
    const totalPaid = filteredReceipts.reduce((sum, r) => sum + r.amount, 0);
    
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
    <div className="w-full space-y-6 px-2 py-4 font-saira select-none overscroll-y-contain relative">
      <style>{`.font-saira { font-family: 'Saira', sans-serif !important; }`}</style>

      {/* Error banner */}
      {error && !isNetworkError(error, isOnline) && (
        <div className="relative z-10 flex items-center justify-between gap-4 px-4 py-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl">
          <p className="text-xs font-semibold truncate">Sync failed — {error}</p>
          <button onClick={load} className="text-xs font-bold uppercase tracking-wider shrink-0 border-0 bg-transparent text-destructive cursor-pointer">
            Retry
          </button>
        </div>
      )}
      
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex items-center gap-2.5">
        <CreditCard className="w-6 h-6 text-primary shrink-0" />
        <h1 className="text-[26px] font-medium tracking-tight text-foreground leading-none">Receipts</h1>
      </header>

      {/* ── Registration Details Card ────────────────────────────────────────── */}
      {studentMeta && (
        <div className="relative z-10 bg-gradient-to-br from-card/90 to-card/45 border border-border/15 p-5 rounded-[28px] shadow-sm backdrop-blur-md space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary shrink-0" />
            <h2 className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest leading-none">Registration Info</h2>
          </div>
          
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div>
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider block leading-none">Reg. No.</span>
              <span className="text-xs font-bold text-foreground block mt-1.5 leading-none">{studentMeta.regNo}</span>
            </div>
            <div className="border-x border-border/15 px-2">
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider block leading-none">Appl. No.</span>
              <span className="text-xs font-bold text-foreground block mt-1.5 leading-none">{studentMeta.applNo}</span>
            </div>
            <div className="pl-2">
              <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider block leading-none">Campus</span>
              <span className="text-xs font-bold text-foreground block mt-1.5 leading-none">{studentMeta.campusCode}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Overview Stats Card ──────────────────────────────────────────────── */}
      <div className="relative z-10 bg-gradient-to-br from-card/90 to-card/45 border border-border/15 p-5 rounded-[28px] shadow-sm backdrop-blur-md flex items-center justify-between text-center">
        <div className="flex-1 min-w-0">
          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-widest block leading-none mb-2">Receipts</span>
          <span className="text-xl font-black text-foreground leading-none">{stats.count}</span>
        </div>
        <div className="w-px h-8 bg-border/20 shrink-0 mx-2" />
        <div className="flex-1 min-w-0">
          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-widest block leading-none mb-2">Total Paid</span>
          <span className="text-xl font-black text-foreground leading-none truncate block px-1">{formatINR(stats.totalPaid)}</span>
        </div>
        <div className="w-px h-8 bg-border/20 shrink-0 mx-2" />
        <div className="flex-1 min-w-0">
          <span className="text-[9px] text-muted-foreground/50 uppercase tracking-widest block leading-none mb-2">Latest Date</span>
          <span className="text-xs font-black text-foreground leading-none block pt-1 truncate">{stats.latestDate}</span>
        </div>
      </div>

      {/* ── Receipt Records ──────────────────────────────────────────────────── */}
      <section className="relative z-10 space-y-4">
        <div className="flex items-center gap-2">
          <ReceiptIcon className="w-4 h-4 text-primary shrink-0" />
          <h2 className="text-xs font-bold text-primary uppercase tracking-widest leading-none">Receipt Records</h2>
        </div>

        {filteredReceipts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center bg-card/85 border border-border/15 rounded-[28px] shadow-sm backdrop-blur-md">
            <FileText className="w-8 h-8 text-muted-foreground/20" />
            <p className="text-sm font-semibold text-foreground leading-none">No receipts found</p>
            <p className="text-xs text-muted-foreground">No payment records are available.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredReceipts.map((receipt) => {
              const isExpanded = expandedId === receipt.receiptNumber;
              return (
                <div
                  key={receipt.receiptNumber}
                  className="bg-gradient-to-br from-card/90 to-card/45 border border-border/15 p-4.5 rounded-[24px] shadow-sm backdrop-blur-md space-y-3 transition-all duration-200"
                >
                  {/* Collapsible Header */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : receipt.receiptNumber)}
                    className="flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-extrabold text-foreground leading-none truncate">
                          Receipt #{receipt.receiptNumber}
                        </h3>
                        <p className="text-[10px] text-muted-foreground/60 font-semibold mt-1.5 leading-none">
                          {receipt.date}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="text-sm font-black text-foreground tabular-nums">
                        {formatINR(receipt.amount)}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground/40 transition-transform duration-200 shrink-0 ${
                          isExpanded ? "rotate-180 text-foreground" : ""
                        }`}
                      />
                    </div>
                  </div>

                  {/* Collapsible Details */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-border/15 grid grid-cols-2 gap-y-3.5 gap-x-6 text-[10px] font-semibold text-muted-foreground/60 animate-fadeIn">
                      <div>
                        <span className="text-[9px] text-muted-foreground/45 uppercase tracking-widest block leading-none mb-1">Receipt ID</span>
                        <span className="font-mono text-foreground block leading-none">{receipt.receiptId || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground/45 uppercase tracking-widest block leading-none mb-1">Campus Code</span>
                        <span className="text-foreground block leading-none">{receipt.campusCode}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground/45 uppercase tracking-widest block leading-none mb-1">Application No.</span>
                        <span className="text-foreground block leading-none">{receipt.applNo || "—"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground/45 uppercase tracking-widest block leading-none mb-1">Registration ID</span>
                        <span className="text-foreground block leading-none">{receipt.regNo || "—"}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
