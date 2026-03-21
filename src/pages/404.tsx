import { useNavigate } from "@/router";
import { FileQuestion, AlertCircle } from "lucide-react";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-background text-foreground text-center p-6">
      <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mb-6 border border-border shadow-sm">
        <FileQuestion className="w-10 h-10 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-semibold mb-2 tracking-tight">View Not Found</h1>
      <p className="text-muted-foreground max-w-sm mb-8 leading-relaxed">
        The interface component you are trying to access doesn't exist or has been removed.
      </p>

      <button
        onClick={() => navigate("/")}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-medium rounded-md shadow hover:opacity-90 transition-opacity"
      >
        <AlertCircle className="w-4 h-4" />
        Return to Safety
      </button>
    </div>
  );
}