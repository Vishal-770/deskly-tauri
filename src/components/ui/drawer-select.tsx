import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

export interface DrawerSelectOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

interface DrawerSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: DrawerSelectOption[];
  placeholder?: string;
  title?: string;
  disabled?: boolean;
  /** Classes for the trigger button */
  triggerClassName?: string;
}

export function DrawerSelect({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  title,
  disabled = false,
  triggerClassName,
}: DrawerSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selected = options.find((o) => o.value === value);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        className={cn(
          "inline-flex items-center justify-between gap-1.5 rounded-xl border border-border/10 bg-muted/20 px-3 text-xs font-medium text-foreground transition-colors cursor-pointer select-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          triggerClassName
        )}
      >
        <span className="truncate">
          {selected ? selected.label : <span className="text-muted-foreground/60">{placeholder}</span>}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
      </button>

      {/* Drawer */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="pb-8 max-h-[70vh]">
          <div className="flex flex-col h-full">
            {/* Drawer handle & title */}
            {title && (
              <div className="px-5 pt-4 pb-3 border-b border-border/10 shrink-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 leading-none">
                  {title}
                </p>
              </div>
            )}

            {/* Options list */}
            <div className="overflow-y-auto no-scrollbar px-3 py-2 space-y-1">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl text-sm font-medium text-left transition-colors cursor-pointer border-0",
                      isSelected
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-muted/20",
                      option.disabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
