import { useState, useMemo } from "react";
import {
  ScheduleEntry,
  getGoogleCalendarLink,
} from "@/lib/calendar-export-utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  CalendarPlus,
  CalendarDays,
  ExternalLink,
  X,
  MapPin,
  User,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SingleCourseExportModalProps {
  entry: ScheduleEntry;
  dayDate: Date;
}

export default function SingleCourseExportModal({
  entry,
  dayDate,
}: SingleCourseExportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // Set default recurrence end date to 4 months from now
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 4);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  });

  const parsedEndDate = useMemo(() => new Date(endDate), [endDate]);

  const gCalLink = useMemo(() => {
    return getGoogleCalendarLink(entry, dayDate, parsedEndDate);
  }, [entry, dayDate, parsedEndDate]);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/5 transition-colors cursor-pointer shrink-0"
        title="Export this course to your calendar"
      >
        <CalendarPlus className="w-4 h-4" />
      </button>

      {/* Modal Dialog */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop Overlay */}
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
              className="relative w-full max-w-md max-h-[85vh] overflow-y-auto no-scrollbar rounded-2xl bg-card border border-border/40 shadow-2xl p-6 flex flex-col gap-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border/10 pb-3">
                <div className="flex items-center gap-2">
                  <CalendarPlus className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-bold text-foreground">Export Course Event</h3>
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

              {/* Course Info Card */}
              <div className="p-3.5 rounded-xl bg-muted/5 border border-border/10 space-y-1.5">
                <span className="text-[10px] font-bold text-primary tracking-wider uppercase bg-primary/10 px-2 py-0.5 rounded-full">
                  {entry.courseCode} · Slot {entry.slot}
                </span>
                <h4 className="text-sm font-bold text-foreground mt-1">{entry.courseTitle}</h4>
                <div className="flex flex-col gap-1 mt-2 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                    <span>{entry.startTime} – {entry.endTime}</span>
                  </div>
                  {entry.venue && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                      <span>{entry.venue}</span>
                    </div>
                  )}
                  {entry.faculty && (
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                      <span className="truncate">{entry.faculty}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Date Input using shadcn Calendar */}
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
                  This weekly class will repeat in your calendar until this chosen end date.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-1">
                <a
                  href={gCalLink}
                  target="_blank"
                  rel="noreferrer"
                  className="block w-full"
                >
                  <Button
                    className="w-full rounded-xl h-9 text-xs font-semibold gap-1.5 cursor-pointer bg-primary text-primary-foreground hover:bg-primary/95"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Add to Google Calendar</span>
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
