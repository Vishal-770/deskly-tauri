import { useEffect, useState } from "react";
import {
  Mail,
  Phone,
  Building2,
  BookOpen,
  Users,
  Home,
  Award,
  Code2,
} from "lucide-react";
import { getStudentProfile, type ProfileData } from "@/lib/features";
import Loader from "@/components/Loader";
import { ErrorDisplay } from "@/components/error-display";
import { cn } from "@/lib/utils";

/* -------------------- Info Display Component -------------------- */

const InfoField = ({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) => (
  <div className="flex items-start gap-3">
    <div className="flex-shrink-0 mt-1 text-muted-foreground">{Icon}</div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-foreground font-semibold truncate">{value || "-"}</p>
    </div>
  </div>
);

/* -------------------- Card Component -------------------- */

const InfoCard = ({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={cn("bg-card/30 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-border/50", className)}>
    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-6">
      {title}
    </h3>
    <div className="space-y-5">{children}</div>
  </div>
);

/* -------------------- Main Page Component -------------------- */

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getStudentProfile();
      if (res.success && res.data) {
        setProfileData(res.data);
      } else {
        setError(res.error ?? "Failed to load profile data");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) return <Loader />;

  if (error) {
    return (
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <ErrorDisplay
            title="Failed to Load Profile"
            message={error}
            onRetry={fetchProfile}
          />
        </div>
      </main>
    );
  }

  if (!profileData) return null;

  return (
    <div className="min-h-screen w-full bg-background pb-20">
      {/* Header Section */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-end">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {profileData.student.photoUrl ? (
                <img
                  src={profileData.student.photoUrl}
                  alt={profileData.student.name}
                  className="w-40 h-40 rounded-2xl border-2 border-primary/20 object-cover shadow-xl"
                />
              ) : (
                <div className="w-40 h-40 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white text-5xl font-bold shadow-xl">
                  {profileData.student.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Student Info */}
            <div className="flex-1 pb-2 space-y-3">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                  {profileData.student.name}
                </h1>
                <p className="text-base text-muted-foreground mt-1">
                  {profileData.student.registerNumber}
                </p>
              </div>
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Award size={18} />
                <span>{profileData.student.program}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12 space-y-8">
        {/* Primary Contact Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <InfoCard title="Contact Information">
            <InfoField
              icon={<Mail size={18} />}
              label="VIT Email"
              value={profileData.student.vitEmail}
            />
            <InfoField
              icon={<Phone size={18} />}
              label="Mobile"
              value={profileData.student.mobile}
            />
            <InfoField
              icon={<Mail size={18} />}
              label="Personal Email"
              value={profileData.student.personalEmail}
            />
          </InfoCard>

          <InfoCard title="Academic Details">
            <InfoField
              icon={<BookOpen size={18} />}
              label="Application Number"
              value={profileData.student.applicationNumber}
            />
            <InfoField
              icon={<Building2 size={18} />}
              label="School"
              value={profileData.proctor.school}
            />
            <InfoField
              icon={<Code2 size={18} />}
              label="Program & Branch"
              value={profileData.student.program}
            />
          </InfoCard>

          <InfoCard title="Personal Info">
            <InfoField
              icon={<Users size={18} />}
              label="Date of Birth"
              value={profileData.student.dob}
            />
            <InfoField
              icon={<Award size={18} />}
              label="Gender"
              value={profileData.student.gender}
            />
          </InfoCard>
        </div>

        {/* Proctor Section */}
        <div className="bg-card/30 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-border/50">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-8">
            Proctor
          </h2>

          <div className="flex flex-col sm:flex-row gap-8 items-start">
            {/* Proctor Image */}
            <div className="flex-shrink-0">
              {profileData.proctor.photoUrl ? (
                <img
                  src={profileData.proctor.photoUrl}
                  alt={profileData.proctor.name}
                  className="w-32 h-32 rounded-xl border border-border/30 object-cover shadow-md"
                />
              ) : (
                <div className="w-32 h-32 rounded-xl bg-muted flex items-center justify-center text-muted-foreground">
                  <User size={40} />
                </div>
              )}
            </div>

            {/* Proctor Info Grid */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <InfoField
                icon={<Award size={18} />}
                label="Faculty ID"
                value={profileData.proctor.facultyId}
              />
              <InfoField
                icon={<Users size={18} />}
                label="Name"
                value={profileData.proctor.name}
              />
              <InfoField
                icon={<Mail size={18} />}
                label="Email"
                value={profileData.proctor.email}
              />
              <InfoField
                icon={<Phone size={18} />}
                label="Mobile"
                value={profileData.proctor.mobile}
              />
              <InfoField
                icon={<Building2 size={18} />}
                label="Cabin"
                value={profileData.proctor.cabin}
              />
              <InfoField
                icon={<Building2 size={18} />}
                label="Designation"
                value={profileData.proctor.designation}
              />
            </div>
          </div>
        </div>

        {/* Hostel Section */}
        <div className="bg-card/30 backdrop-blur-sm p-8 rounded-2xl shadow-sm border border-border/50">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-8">
            Hostel Details
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-5 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Home size={16} className="text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Block
                </span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {profileData.hostel.blockName || "-"}
              </p>
            </div>

            <div className="p-5 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={16} className="text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Room
                </span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {profileData.hostel.roomNumber || "-"}
              </p>
            </div>

            <div className="p-5 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Bed Type
                </span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {profileData.hostel.bedType || "-"}
              </p>
            </div>

            <div className="p-5 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Users size={16} className="text-primary" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Mess
                </span>
              </div>
              <p className="text-lg font-semibold text-foreground">
                {profileData.hostel.messType || "-"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Minimal placeholder icons that were missing
const User = ({ size }: { size: number }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
