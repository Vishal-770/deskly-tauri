import { useState, useMemo } from "react";
import {
  WeeklySchedule,
  generateIcsFile,
} from "@/lib/calendar-export-utils";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Download,
  X,
  Info,
  CalendarRange,
  CalendarDays,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { openUrl } from "@tauri-apps/plugin-opener";

interface CalendarExportPopoverProps {
  schedule: WeeklySchedule;
  weekStartDate: Date;
}

export default function CalendarExportPopover({
  schedule,
  weekStartDate,
}: CalendarExportPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Set default recurrence end date to 4 months from now
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 4);
    // Format to YYYY-MM-DD for date input
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });

  const parsedEndDate = useMemo(() => new Date(endDate), [endDate]);

  const handleDownloadIcs = async () => {
    try {
      const icsContent = generateIcsFile(schedule, weekStartDate, parsedEndDate);
      await invoke("save_calendar_file", {
        content: icsContent,
        filename: "timetable_schedule.ics",
      });
    } catch (e) {
      console.error("Failed to save calendar file", e);
    }
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="rounded-xl h-8 text-xs font-semibold gap-1.5 cursor-pointer bg-muted/10 border-border/20"
      >
        <CalendarRange className="size-3.5 text-primary shrink-0" />
        <span>Export Schedule</span>
      </Button>

      {/* Modal Dialog */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsOpen(false);
                setShowCalendar(false);
              }}
              className="absolute inset-0 bg-background/60 backdrop-blur-sm cursor-pointer"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-md max-h-[85vh] overflow-y-auto no-scrollbar rounded-2xl bg-card border border-border/40 shadow-2xl p-6 flex flex-col gap-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/10 pb-4">
                <div className="flex items-center gap-2">
                  <CalendarRange className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Export Timetable Schedule</h3>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowCalendar(false);
                  }}
                  className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Recurrence End Date Selector */}
              <div className="space-y-2 p-3.5 rounded-xl bg-muted/5 border border-border/10">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                  Repeat Schedule Weekly Until:
                </label>
                <div className="relative mt-1">
                  <button
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full h-9 rounded-xl bg-background border border-border/20 px-3 text-xs text-foreground outline-none focus:border-primary/50 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <span>{format(parsedEndDate, "PPP")}</span>
                    <CalendarDays className="w-4 h-4 text-muted-foreground/60" />
                  </button>

                  <AnimatePresence>
                    {showCalendar && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-2 z-10 relative flex justify-center"
                      >
                        <Calendar
                          mode="single"
                          selected={parsedEndDate}
                          onSelect={(date) => {
                            if (date) {
                              const y = date.getFullYear();
                              const m = String(date.getMonth() + 1).padStart(2, "0");
                              const day = String(date.getDate()).padStart(2, "0");
                              setEndDate(`${y}-${m}-${day}`);
                              setShowCalendar(false);
                            }
                          }}
                          disabled={(date) => date < new Date()}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <p className="text-[10px] text-muted-foreground/60 leading-normal">
                  All weekly classes will repeat in your calendar until this chosen end date.
                </p>
              </div>

              {/* Batch Download .ics */}
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Export your entire weekly schedule at once. This file can be imported into Google Calendar, Apple Calendar, Outlook, and others.
                </p>

                <Button
                  onClick={handleDownloadIcs}
                  className="w-full rounded-xl h-9 text-xs font-semibold gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95"
                >
                  <Download className="w-4 h-4" />
                  <span>Download .ics File</span>
                </Button>

                {/* Guidelines */}
                <div className="p-3 rounded-xl bg-muted/10 border border-border/5 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-xs">
                    <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>How to import the downloaded file:</span>
                  </div>
                  <ul className="list-disc pl-4 text-[10px] text-muted-foreground/80 space-y-1.5">
                    <li>
                      <span className="font-bold text-foreground/95">Google Calendar:</span> Go to{" "}
                      <button
                        onClick={async () => {
                          try {
                            await openUrl("https://calendar.google.com");
                          } catch (err) {
                            console.error("Failed to open calendar link:", err);
                          }
                        }}
                        className="text-primary hover:underline cursor-pointer bg-transparent border-0 p-0 font-normal inline"
                      >
                        calendar.google.com
                      </button>
                      , open <span className="font-bold text-foreground/90">Settings</span> →{" "}
                      <span className="font-bold text-foreground/90">Import & Export</span>, and
                      upload the downloaded file.
                    </li>
                    <li>
                      <span className="font-bold text-foreground/95">Apple Calendar / Outlook:</span>{" "}
                      Simply double-click the downloaded file on your computer to add all recurring
                      events instantly.
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
