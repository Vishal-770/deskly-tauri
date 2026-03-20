import { useEffect, useState } from 'react'
import { useNavigate } from '@/router'
import { useAuth } from '@/hooks/useAuth'
import { Stat } from '@/components/Stat'
import { Divider } from '@/components/Divider'
import { getCGPAPage, CGPAData, getContentPage, CourseAttendance } from '@/lib/vtop'
import { getFeedbackStatus, FeedbackStatus } from '@/lib/features'
import { Skeleton } from '@/components/ui/skeleton'


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
    return <main className="p-6 h-full flex items-center justify-center">Loading dashboard...</main>
  }

  return (
    <div className="w-full px-6 lg:px-10 py-10 space-y-12 pb-20">
      <header className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Academic Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {semester ? `Semester: ${semester}` : `Welcome back, ${authState.userId}`}
            </p>
          </div>

      </header>

      {/* Stats Section */}
      <section>
        {cgpaLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
        ) : cgpaError ? (
            <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-5 text-destructive font-medium">
              We encountered an issue fetching your CGPA: {cgpaError}
            </div>
        ) : cgpaData ? (
           <div className="grid grid-cols-2 sm:grid-cols-4 gap-y-8 gap-x-6">
             <Stat label="Current CGPA" value={cgpaData.currentCgpa?.toFixed(2) || "0.00"} />
             <Stat label="Earned Credits" value={cgpaData.earnedCredits} />
             <Stat label="Total Credits" value={cgpaData.totalCreditsRequired} />
             <Stat label="Non-graded Core" value={cgpaData.nonGradedCore} danger={cgpaData.nonGradedCore < 1} />
           </div>
        ) : null}
      </section>

      <Divider />

      {/* Attendance Section */}
      <section className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <h2 className="text-2xl font-semibold">Course Attendance</h2>
          <p className="text-sm text-muted-foreground">
            Overview of attendance across all enrolled courses
          </p>
        </div>

        {attendanceLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : attendanceError ? (
          <div className="rounded-xl border border-destructive/50 bg-destructive/10 p-5 text-destructive font-medium">
             {attendanceError}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-10 gap-y-6 text-sm">
            {courses.map((c) => (
              <div key={c.index} className="flex justify-between border-b border-border/50 pb-2 hover:bg-muted/30 transition-colors px-1 rounded-sm">
                <span className="truncate pr-4 flex flex-col">
                  <span className="font-semibold text-foreground/90">{c.code}</span>
                  <span className="text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">{c.name}</span>
                </span>
                <span
                  className={`font-bold shrink-0 text-base self-center ${
                    c.attendance >= 90
                      ? "text-green-500"
                      : c.attendance >= 75
                        ? "text-blue-500"
                        : c.attendance >= 65
                          ? "text-yellow-500"
                          : "text-red-500"
                  }`}
                >
                  {c.attendance}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-muted-foreground border rounded-xl bg-card/50">
            No courses found for the current semester.
          </div>
        )}
      </section>

      <Divider />

      {/* Feedback Status Section */}
      <section className="space-y-8 pb-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <h2 className="text-2xl font-semibold font-outfit tracking-tight">Feedback Status</h2>
          <p className="text-sm text-muted-foreground font-inter">
            Status of mandatory feedback for the current semester
          </p>
        </div>

        {feedbackLoading ? (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <Skeleton className="h-32 w-full rounded-2xl" />
             <Skeleton className="h-32 w-full rounded-2xl" />
           </div>
        ) : feedbackError ? (
          <div className="rounded-2xl border border-destructive/50 bg-destructive/10 p-6 text-destructive font-medium font-inter">
             {feedbackError}
          </div>
        ) : feedback.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {feedback.map((f, i) => (
              <div key={i} className="group p-6 rounded-3xl bg-card border border-border/50 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md space-y-6">
                <h3 className="font-bold text-lg text-foreground/90 group-hover:text-primary transition-colors font-outfit">{f.type}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-2xl border flex flex-col gap-2 transition-colors ${
                    f.midSemester.includes("Given") 
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600" 
                      : "bg-amber-500/5 border-amber-500/20 text-amber-600"
                  }`}>
                    <span className="text-[10px] uppercase tracking-[0.1em] font-bold opacity-60 font-inter">Mid Semester</span>
                    <span className="text-xs font-medium font-inter leading-relaxed">{f.midSemester}</span>
                  </div>
                  <div className={`p-4 rounded-2xl border flex flex-col gap-2 transition-colors ${
                    f.teeSemester.includes("Given") 
                      ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-600" 
                      : "bg-amber-500/5 border-amber-500/20 text-amber-600"
                  }`}>
                    <span className="text-[10px] uppercase tracking-[0.1em] font-bold opacity-60 font-inter">TEE Semester</span>
                    <span className="text-xs font-medium font-inter leading-relaxed">{f.teeSemester}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-muted-foreground border rounded-2xl bg-card/50 font-inter">
            No feedback entries found.
          </div>
        )}
      </section>

    </div>
  )
}
