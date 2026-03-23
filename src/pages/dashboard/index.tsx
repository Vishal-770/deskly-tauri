import { useEffect, useState } from 'react'
import { useNavigate } from '@/router'
import { useAuth } from '@/hooks/useAuth'
import { getCGPAPage, CGPAData, getContentPage, CourseAttendance } from '@/lib/vtop'
import { getFeedbackStatus, FeedbackStatus } from '@/lib/features'
import { motion, AnimatePresence } from 'framer-motion'
import Loader from '@/components/Loader'
import { CheckCircle2, AlertCircle, Smile, Frown } from 'lucide-react'

export default function DashBoardPage() {
  const navigate = useNavigate()
  const { authState, loading } = useAuth()


  
  // CGPA State
  const [cgpaData, setCgpaData] = useState<CGPAData | null>(null)
  const [cgpaLoading, setCgpaLoading] = useState(false)
  const [cgpaError, setCgpaError] = useState<string | null>(null)

  // Attendance State
  const [courses, setCourses] = useState<CourseAttendance[]>([])
  const [semester, setSemester] = useState<string | null>(null)
  const [attendanceLoading, setAttendanceLoading] = useState(false)
  const [attendanceError, setAttendanceError] = useState<string | null>(null)

  // Feedback State
  const [feedback, setFeedback] = useState<FeedbackStatus[]>([])
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !authState?.loggedIn) {
      navigate('/')
    }
  }, [authState, loading, navigate])


  useEffect(() => {
    const loadData = async () => {
      if (!authState?.loggedIn) return

      
      // Load CGPA
      setCgpaLoading(true)
      const cgpaRes = await getCGPAPage()
      if (cgpaRes.success && cgpaRes.cgpaData) {
        setCgpaData(cgpaRes.cgpaData)
        setCgpaError(null)
      } else {
        setCgpaError(cgpaRes.error || "Failed to fetch CGPA Data")
      }
      setCgpaLoading(false)

      // Load Attendance
      setAttendanceLoading(true)
      const attRes = await getContentPage()
      if (attRes.success && attRes.courses) {
        setCourses(attRes.courses)
        setSemester(attRes.semester || null)
        setAttendanceError(null)
      } else {
        setAttendanceError(attRes.error || "Failed to fetch attendance data")
      }
      setAttendanceLoading(false)

      // Load Feedback
      setFeedbackLoading(true)
      const feedRes = await getFeedbackStatus()
      if (feedRes.success && feedRes.data) {
        setFeedback(feedRes.data)
        setFeedbackError(null)
      } else {
        setFeedbackError(feedRes.error || "Failed to fetch feedback status")
      }
      setFeedbackLoading(false)
    }

    loadData()
  }, [authState?.loggedIn])



  if (loading || !authState?.loggedIn) {
    return (
      <main className="p-6 h-full flex items-center justify-center">
        <Loader />
      </main>
    )
  }

  const isInitialLoading = cgpaLoading && attendanceLoading && feedbackLoading;

  return (
    <div className="w-full px-6 lg:px-10 py-10 space-y-16 pb-20 overflow-y-auto no-scrollbar h-full">
      <AnimatePresence mode="wait">
        {isInitialLoading ? (
          <motion.div 
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center pt-20"
          >
            <Loader />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-16"
          >
            <header className="flex items-start justify-between">
                <div>
                  <h1 className="text-4xl md:text-6xl font-black tracking-tightest leading-none">
                    Academic Dashboard
                  </h1>
                  <p className="text-sm text-muted-foreground mt-4 font-bold opacity-60 uppercase tracking-[0.3em] flex items-center gap-3">
                    <span className="w-8 h-[2px] bg-primary/40" />
                    {semester ? `Semester: ${semester}` : `Welcome back, ${authState.userId}`}
                  </p>
                </div>
            </header>

            {/* Stats Section */}
            <section>
              {cgpaError ? (
                  <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-6 text-destructive font-medium">
                    We encountered an issue fetching your CGPA: {cgpaError}
                  </div>
              ) : cgpaData ? (
                 <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
                   <StatItem label="Current CGPA" value={cgpaData.currentCgpa?.toFixed(2) || "0.00"} />
                   <StatItem label="Earned Credits" value={cgpaData.earnedCredits} />
                   <StatItem label="Total Credits" value={cgpaData.totalCreditsRequired} />
                   <StatItem label="Non-graded Core" value={cgpaData.nonGradedCore} danger={cgpaData.nonGradedCore < 1} />
                 </div>
              ) : null}
            </section>

            {/* Attendance Section */}
            <section className="space-y-10">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight">Course Attendance</h2>
                  <p className="text-sm text-muted-foreground font-medium opacity-50 tracking-wide">
                    Overview of attendance across all enrolled courses
                  </p>
                </div>
              </div>

              {attendanceError ? (
                <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-6 text-destructive font-bold uppercase tracking-widest text-[10px] text-center">
                   {attendanceError}
                </div>
              ) : courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-12 gap-y-10">
                  {courses.map((c, idx) => (
                    <motion.div 
                      key={c.code} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="group flex flex-col gap-3 pb-6 border-b border-border hover:border-primary transition-colors"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">{c.code}</span>
                          <h3 className="font-bold text-base leading-tight mt-1 group-hover:text-primary transition-colors truncate">{c.name}</h3>
                        </div>
                        <span className={`font-black text-2xl tracking-tighter ${
                          c.attendance >= 75 ? "text-primary" : "text-destructive"
                        }`}>
                          {c.attendance}%
                        </span>
                      </div>
                      <div className="h-[2px] w-full bg-muted rounded-full overflow-hidden">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${c.attendance}%` }}
                           transition={{ duration: 0.8, ease: "circOut" }}
                           className={`h-full rounded-full ${
                             c.attendance >= 75 ? "bg-primary" : "bg-destructive"
                           }`}
                         />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-muted-foreground border-2 border-dashed border-border rounded-[3rem]">
                  No courses found for the current semester.
                </div>
              )}
            </section>

            {/* Feedback Status Section */}
            <section className="space-y-10 pb-10">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight">Feedback Status</h2>
                  <p className="text-sm text-muted-foreground font-medium opacity-50 tracking-wide">
                    Status of mandatory feedback for the current semester
                  </p>
                </div>
              </div>

              {feedbackError ? (
                <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-destructive font-bold uppercase tracking-widest text-[10px] text-center">
                   {feedbackError}
                </div>
              ) : feedback.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {feedback.map((f, i) => (
                    <motion.div 
                      key={i} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="space-y-6"
                    >
                      <h3 className="font-black text-xl tracking-tighter flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        {f.type}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <FeedbackItem label="Mid Semester" status={f.midSemester} />
                        <FeedbackItem label="TEE Semester" status={f.teeSemester} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-muted-foreground border-2 border-dashed border-border rounded-[3rem]">
                  No feedback entries found.
                </div>
              )}
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function StatItem({ label, value, danger }: { label: string, value: string | number, danger?: boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">{label}</p>
      <p className={`text-4xl md:text-5xl font-black tracking-tightest ${danger ? 'text-destructive' : 'text-foreground'}`}>
        {value}
      </p>
    </div>
  )
}

function FeedbackItem({ label, status }: { label: string, status: string }) {
  const isGiven = status.toLowerCase().includes("given") && !status.toLowerCase().includes("not")
  
  return (
    <div className={`p-6 rounded-[2rem] border transition-all duration-300 flex flex-col gap-4 relative overflow-hidden ${
      isGiven 
        ? "bg-primary/5 border-primary text-primary" 
        : "bg-destructive/5 border-destructive text-destructive"
    }`}>
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-widest font-black opacity-40">{label}</span>
          <p className="text-sm font-bold leading-tight max-w-[150px]">{status}</p>
        </div>
        
        <div className={`p-2 rounded-2xl ${isGiven ? 'bg-primary/10' : 'bg-destructive/10'}`}>
          {isGiven ? (
            <Smile className="w-5 h-5 text-primary" />
          ) : (
            <Frown className="w-5 h-5 text-destructive" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-auto">
        {isGiven ? (
          <CheckCircle2 className="w-3.5 h-3.5 opacity-60" />
        ) : (
          <AlertCircle className="w-3.5 h-3.5 opacity-60" />
        )}
        <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">
          {isGiven ? "Completed" : "Action Required"}
        </span>
      </div>

      {/* Subtle indicator bar */}
      <div className={`absolute bottom-0 left-0 w-full h-1 ${isGiven ? 'bg-primary' : 'bg-destructive'}`} />
    </div>
  )
}