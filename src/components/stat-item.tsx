import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatItemProps {
  label: string;
  value: string | number;
  subValue?: string;
  icon?: LucideIcon;
  critical?: boolean;
}

export function StatItem({ label, value, subValue, icon: Icon, critical = false }: StatItemProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {Icon && <Icon className={cn("w-3.5 h-3.5", critical ? "text-destructive" : "text-muted-foreground")} />}
        <p className={cn("text-[10px] font-black uppercase tracking-widest leading-none", critical ? "text-destructive" : "text-muted-foreground")}>{label}</p>
      </div>
      <div className="flex items-baseline gap-2">
        <p className={cn("text-4xl md:text-5xl lg:text-6xl font-black tracking-tightest leading-none", critical ? "text-destructive" : "text-foreground")}>
          {value}
        </p>
        {subValue && (
          <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">{subValue}</p>
        )}
      </div>
    </div>
  );
}
