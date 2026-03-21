import { useEffect, useState } from "react";
import { getPaymentReceipts, type Receipt } from "@/lib/features";

export default function PaymentReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const res = await getPaymentReceipts();
      if (res.success && res.data) {
        setReceipts(res.data);
      } else {
        setError(res.error ?? "Failed to fetch payment receipts");
      }
      setLoading(false);
    };

    void run();
  }, []);

  return (
    <div className="w-full px-6 lg:px-10 py-10 space-y-8 pb-20">
      <header>
        <h1 className="text-4xl font-bold tracking-tight">Payment Receipts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Fee receipts history
        </p>
      </header>

      {loading ? (
        <main className="p-6 h-full flex items-center justify-center">
          Loading receipts...
        </main>
      ) : error ? (
        <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-5 text-destructive font-medium">
          {error}
        </div>
      ) : (
        <section className="rounded-xl border p-4 bg-card/30 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="py-2">Receipt No</th>
                <th className="py-2">Date</th>
                <th className="py-2">Amount</th>
                <th className="py-2">Campus</th>
              </tr>
            </thead>
            <tbody>
              {receipts.map((r) => (
                <tr
                  key={`${r.receiptId}-${r.receiptNumber}`}
                  className="border-b"
                >
                  <td className="py-2">{r.receiptNumber}</td>
                  <td className="py-2">{r.date}</td>
                  <td className="py-2">{r.amount}</td>
                  <td className="py-2">{r.campusCode}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}
