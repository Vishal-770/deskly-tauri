import { useEffect, useState } from "react";
import { getPaymentReceipts, type Receipt } from "@/lib/features";
import { 
  ReceiptText, 
  Calendar, 
  IndianRupee, 
  MapPin, 
  Search,
  FileDown
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Loader from "@/components/Loader";

export default function PaymentReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const res = await getPaymentReceipts();
      if (res.success && res.data) {
        // Filter out any header-like rows or empty rows
        setReceipts(res.data.filter(r => 
          r.receiptNumber && 
          r.receiptNumber.toUpperCase() !== "RECEIPT NUMBER"
        ));
      } else {
        setError(res.error ?? "Failed to fetch payment receipts");
      }
      setLoading(false);
    };

    void run();
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <div className="p-6 space-y-8 pb-20 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payment Receipts</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Detailed history of your fee payments and official receipts.
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="outline" className="px-3 py-1 bg-primary/5 text-primary border-primary/20 rounded-full">
            {receipts.length} Total Receipts
           </Badge>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-destructive flex items-center gap-3">
          <div className="p-2 rounded-full bg-destructive/10">
            <Search className="w-5 h-5" />
          </div>
          <span className="font-medium text-sm">{error}</span>
        </div>
      ) : (
        <Card className="border-border bg-card/40 backdrop-blur-sm shadow-xl desktop-shadow rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="hover:bg-transparent border-border/50">
                  <TableHead className="w-[150px] py-4 pl-6">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                      <ReceiptText className="w-4 h-4" />
                      Receipt No
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      Date
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                      <IndianRupee className="w-4 h-4" />
                      Amount
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      Campus
                    </div>
                  </TableHead>
                  <TableHead className="text-right pr-6">
                    <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Action</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receipts.map((r) => (
                  <TableRow
                    key={`${r.receiptId}-${r.receiptNumber}`}
                    className="border-border/40 hover:bg-muted/30 transition-colors group"
                  >
                    <TableCell className="font-mono text-sm py-4 pl-6 font-medium">
                      {r.receiptNumber}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.date}
                    </TableCell>
                    <TableCell className="text-sm font-semibold">
                      ₹{r.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-primary/10 text-primary font-bold text-[10px] rounded-md border-primary/10">
                        {r.campusCode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <button className="p-2 rounded-lg hover:bg-primary/10 text-primary transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 flex ml-auto">
                        <FileDown className="w-4 h-4" />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {receipts.length === 0 && (
              <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
                <ReceiptText className="w-10 h-10 text-muted-foreground/30" />
                <div className="space-y-1">
                  <p className="font-semibold text-muted-foreground">No receipts found</p>
                  <p className="text-sm text-muted-foreground/60 text-balance px-4">You haven't made any fee payments that generate receipts yet.</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
