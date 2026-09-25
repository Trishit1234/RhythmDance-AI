"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  GraduationCap,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  MessageSquare,
  BarChart3,
  LogOut,
  LayoutDashboard,
  Settings,
  Menu,
  UserPlus,
  Plus,
  ArrowRight,
  Activity,
  Video,
} from "lucide-react";

import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";

import {
  collection,
  getCountFromServer,
} from "firebase/firestore";

type Section =
  | "dashboard"
  | "students"
  | "tutors"
  | "courses"
  | "classes"
  | "assignments"
  | "attendance"
  | "progress"
  | "feedback"
  | "settings";

function AdminDashboardContent() {
  const router = useRouter();

  const { profile, logout } = useAuth();

  const [activeSection, setActiveSection] =
    useState<Section>("dashboard");

  const [mobileMenu, setMobileMenu] =
    useState(false);

  const [stats, setStats] = useState({
    students: 0,
    tutors: 0,
    courses: 0,
    classes: 0,
    assignments: 0,
    feedback: 0,
  });

  const [statsLoading, setStatsLoading] =
    useState(true);

  /*
   * =========================================================
   * LOGOUT
   * =========================================================
   */

  const handleLogout = async () => {
    await logout();

    router.replace("/");
  };

  /*
   * =========================================================
   * LOAD ADMIN STATISTICS
   * =========================================================
   */

  const loadStats = async () => {
    setStatsLoading(true);

    try {
      const [
        studentsSnapshot,
        tutorsSnapshot,
        coursesSnapshot,
        classesSnapshot,
        assignmentsSnapshot,
        feedbackSnapshot,
      ] = await Promise.all([
        getCountFromServer(
          collection(db, "students")
        ),

        getCountFromServer(
          collection(db, "tutors")
        ),

        getCountFromServer(
          collection(db, "courses")
        ),

        getCountFromServer(
          collection(db, "classes")
        ),

        getCountFromServer(
          collection(db, "assignments")
        ),

        getCountFromServer(
          collection(db, "feedback")
        ),
      ]);

      setStats({
        students:
          studentsSnapshot.data().count,

        tutors:
          tutorsSnapshot.data().count,

        courses:
          coursesSnapshot.data().count,

        classes:
          classesSnapshot.data().count,

        assignments:
          assignmentsSnapshot.data().count,

        feedback:
          feedbackSnapshot.data().count,
      });
    } catch (error) {
      console.error(
        "Failed to load admin statistics:",
        error
      );
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  /*
   * =========================================================
   * SIDEBAR MENU
   * =========================================================
   */

  const menuItems: {
    id: Section;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: (
        <LayoutDashboard size={18} />
      ),
    },

    {
      id: "students",
      label: "Students",
      icon: <Users size={18} />,
    },

    {
      id: "tutors",
      label: "Tutors",
      icon: (
        <GraduationCap size={18} />
      ),
    },

    {
      id: "courses",
      label: "Courses",
      icon: (
        <BookOpen size={18} />
      ),
    },

    {
      id: "classes",
      label: "Classes",
      icon: (
        <CalendarDays size={18} />
      ),
    },

    {
      id: "assignments",
      label: "Assignments",
      icon: (
        <ClipboardCheck size={18} />
      ),
    },

    {
      id: "attendance",
      label: "Attendance",
      icon: <Activity size={18} />,
    },

    {
      id: "progress",
      label: "Progress",
      icon: (
        <BarChart3 size={18} />
      ),
    },

    {
      id: "feedback",
      label: "Feedback",
      icon: (
        <MessageSquare size={18} />
      ),
    },

    {
      id: "settings",
      label: "Settings",
      icon: (
        <Settings size={18} />
      ),
    },
  ];

  /*
   * =========================================================
   * SECTION NAVIGATION
   * =========================================================
   */

  const navigateTo = (
    section: Section
  ) => {
    setActiveSection(section);

    setMobileMenu(false);
  };

  /*
   * =========================================================
   * REFERENCE VIDEO NAVIGATION
   * =========================================================
   *
   * This is intentionally separate from the dashboard
   * section system because Reference Videos has its own
   * dedicated page.
   */

  const openReferenceVideos = () => {
    setMobileMenu(false);

    router.push(
      "/admin/reference-videos"
    );
  };

  return (
    <div className="min-h-screen bg-[#F8F1E6] text-[#111111]">
      <div className="flex min-h-screen">

        {/* ===================================================== */}
        {/* SIDEBAR                                               */}
        {/* ===================================================== */}

        <aside
          className={`fixed md:static z-50 inset-y-0 left-0 w-72 md:w-64 bg-[#111111] text-white flex flex-col transform transition-transform duration-300 ${
            mobileMenu
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }`}
        >
          <div className="p-6 border-b border-white/10">
            <p className="text-[#B42318] text-xs font-black tracking-[0.2em]">
              RHYTHM OF INDIA
            </p>

            <h1 className="text-xl font-black font-mono mt-2">
              ADMIN PANEL
            </h1>

            <p className="text-white/40 text-[10px] mt-2 uppercase tracking-wider">
              Academy Control Center
            </p>
          </div>

          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">

            {menuItems.map(
              (item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    navigateTo(
                      item.id
                    )
                  }
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-left ${
                    activeSection ===
                    item.id
                      ? "bg-[#B42318] text-white"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.icon}

                  <span className="text-sm font-bold">
                    {item.label}
                  </span>
                </button>
              )
            )}

            {/* ================================================= */}
            {/* REFERENCE VIDEOS SIDEBAR BUTTON                  */}
            {/* ================================================= */}

            <button
              type="button"
              onClick={
                openReferenceVideos
              }
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-left text-white/60 hover:bg-white/10 hover:text-white"
            >
              <Video size={18} />

              <span className="text-sm font-bold">
                Reference Videos
              </span>
            </button>
          </nav>

          <div className="p-4 border-t border-white/10">
            <button
              onClick={
                handleLogout
              }
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 text-white/60 hover:text-white transition"
            >
              <LogOut size={18} />

              <span className="text-sm font-bold">
                Logout
              </span>
            </button>
          </div>
        </aside>

        {/* ===================================================== */}
        {/* MOBILE OVERLAY                                        */}
        {/* ===================================================== */}

        {mobileMenu && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() =>
              setMobileMenu(false)
            }
          />
        )}

        {/* ===================================================== */}
        {/* MAIN                                                  */}
        {/* ===================================================== */}

        <main className="flex-1 min-w-0">

          {/* ================================================= */}
          {/* HEADER                                            */}
          {/* ================================================= */}

          <header className="bg-white border-b border-black/10 px-5 md:px-6 py-4 flex items-center justify-between sticky top-0 z-30">

            <div className="flex items-center gap-3">

              <button
                onClick={() =>
                  setMobileMenu(
                    true
                  )
                }
                className="md:hidden w-10 h-10 rounded-xl bg-[#F8F1E6] flex items-center justify-center"
              >
                <Menu size={20} />
              </button>

              <div>
                <p className="text-xs text-black/40 font-bold uppercase tracking-wider">
                  Administration
                </p>

                <h2 className="text-xl md:text-2xl font-black font-mono">
                  {activeSection ===
                  "dashboard"
                    ? "Dashboard"
                    : menuItems.find(
                        (
                          item
                        ) =>
                          item.id ===
                          activeSection
                      )?.label}
                </h2>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <p className="font-bold text-sm">
                {
                  profile?.displayName ||
                  "Administrator"
                }
              </p>

              <p className="text-xs text-black/40">
                Administrator
              </p>
            </div>

          </header>

          {/* ================================================= */}
          {/* CONTENT                                           */}
          {/* ================================================= */}

          <div className="p-5 md:p-10 max-w-7xl mx-auto">

            {activeSection ===
              "dashboard" && (
              <DashboardHome
                profileName={
                  profile?.displayName ||
                  "Administrator"
                }
                stats={stats}
                statsLoading={
                  statsLoading
                }
                onNavigate={
                  navigateTo
                }
                onReferenceVideos={
                  openReferenceVideos
                }
              />
            )}

            {activeSection !==
              "dashboard" && (
              <ComingSection
                section={
                  activeSection
                }
                onBack={() =>
                  navigateTo(
                    "dashboard"
                  )
                }
              />
            )}

          </div>
        </main>
      </div>
    </div>
  );
}

/* ============================================================= */
/* DASHBOARD HOME                                                */
/* ============================================================= */

function DashboardHome({
  profileName,
  stats,
  statsLoading,
  onNavigate,
  onReferenceVideos,
}: {
  profileName: string;

  stats: {
    students: number;
    tutors: number;
    courses: number;
    classes: number;
    assignments: number;
    feedback: number;
  };

  statsLoading: boolean;

  onNavigate: (
    section: Section
  ) => void;

  onReferenceVideos: () => void;
}) {
  return (
    <>
      {/* ===================================================== */}
      {/* WELCOME                                               */}
      {/* ===================================================== */}

      <div className="mb-8">
        <p className="text-[#B42318] text-sm font-black">
          WELCOME BACK 👋
        </p>

        <h1 className="text-4xl md:text-5xl font-black font-mono uppercase mt-1">
          Rhythm Control Center
        </h1>

        <p className="text-black/50 mt-3">
          Welcome, {profileName}.
          Manage the entire academy
          from one place.
        </p>
      </div>

      {/* ===================================================== */}
      {/* STATS                                                  */}
      {/* ===================================================== */}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">

        <StatCard
          icon={
            <Users size={22} />
          }
          label="Students"
          value={
            statsLoading
              ? "..."
              : String(
                  stats.students
                )
          }
          description="Registered students"
        />

        <StatCard
          icon={
            <GraduationCap
              size={22}
            />
          }
          label="Tutors"
          value={
            statsLoading
              ? "..."
              : String(
                  stats.tutors
                )
          }
          description="Academy tutors"
        />

        <StatCard
          icon={
            <BookOpen size={22} />
          }
          label="Courses"
          value={
            statsLoading
              ? "..."
              : String(
                  stats.courses
                )
          }
          description="Dance courses"
        />

        <StatCard
          icon={
            <CalendarDays
              size={22}
            />
          }
          label="Classes"
          value={
            statsLoading
              ? "..."
              : String(
                  stats.classes
                )
          }
          description="Scheduled classes"
        />

      </div>

      {/* ===================================================== */}
      {/* SECONDARY STATS                                       */}
      {/* ===================================================== */}

      <div className="grid sm:grid-cols-2 gap-5 mt-5">

        <StatCard
          icon={
            <ClipboardCheck
              size={22}
            />
          }
          label="Assignments"
          value={
            statsLoading
              ? "..."
              : String(
                  stats.assignments
                )
          }
          description="Created assignments"
        />

        <StatCard
          icon={
            <MessageSquare
              size={22}
            />
          }
          label="Feedback"
          value={
            statsLoading
              ? "..."
              : String(
                  stats.feedback
                )
          }
          description="Tutor feedback entries"
        />

      </div>

      {/* ===================================================== */}
      {/* QUICK ACTIONS                                         */}
      {/* ===================================================== */}

      <section className="mt-10">

        <div className="flex items-center justify-between mb-5">

          <div>
            <p className="text-[#B42318] text-xs font-black tracking-[0.2em]">
              QUICK ACTIONS
            </p>

            <h2 className="text-2xl font-black font-mono mt-1">
              ACADEMY MANAGEMENT
            </h2>
          </div>

        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

          <QuickAction
            icon={
              <UserPlus size={20} />
            }
            title="Manage Students"
            text="View and manage academy students."
            onClick={() =>
              onNavigate(
                "students"
              )
            }
          />

          <QuickAction
            icon={
              <GraduationCap
                size={20}
              />
            }
            title="Manage Tutors"
            text="Manage your teaching team."
            onClick={() =>
              onNavigate(
                "tutors"
              )
            }
          />

          <QuickAction
            icon={
              <Plus size={20} />
            }
            title="Create Course"
            text="Build a new dance course."
            onClick={() =>
              onNavigate(
                "courses"
              )
            }
          />

          <QuickAction
            icon={
              <CalendarDays
                size={20}
              />
            }
            title="Schedule Class"
            text="Create a new academy class."
            onClick={() =>
              onNavigate(
                "classes"
              )
            }
          />

          {/* ================================================= */}
          {/* NEW REFERENCE VIDEO BUTTON                       */}
          {/* ================================================= */}

          <QuickAction
            icon={
              <Video size={20} />
            }
            title="Reference Videos"
            text="Upload and manage AI dance reference videos."
            onClick={
              onReferenceVideos
            }
          />

        </div>

      </section>

      {/* ===================================================== */}
      {/* AI REFERENCE VIDEO FEATURE                            */}
      {/* ===================================================== */}

      <section className="mt-10 rounded-[28px] bg-white border border-black/10 overflow-hidden">

        <div className="p-7 md:p-9">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">

            <div className="flex items-start gap-4">

              <div className="w-14 h-14 rounded-2xl bg-[#B42318]/10 text-[#B42318] flex items-center justify-center shrink-0">
                <Video size={26} />
              </div>

              <div>
                <p className="text-[#B42318] text-xs font-black tracking-[0.2em]">
                  AI PRACTICE SYSTEM
                </p>

                <h2 className="text-2xl md:text-3xl font-black font-mono mt-1">
                  REFERENCE VIDEOS
                </h2>

                <p className="text-black/50 text-sm mt-2 max-w-2xl">
                  Upload official dance demonstration
                  videos that the AI Practice system
                  uses to compare student movements
                  in real time.
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={
                onReferenceVideos
              }
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#B42318] px-6 py-3.5 text-sm font-black text-white transition hover:bg-[#8f1c13] hover:shadow-lg shrink-0"
            >
              <Video size={17} />

              Manage Reference Videos

              <ArrowRight
                size={17}
              />
            </button>

          </div>

        </div>

      </section>

      {/* ===================================================== */}
      {/* SYSTEM OVERVIEW                                       */}
      {/* ===================================================== */}

      <section className="mt-10 bg-[#111111] text-white rounded-[28px] p-7 md:p-10">

        <p className="text-[#B42318] text-xs font-black tracking-[0.2em]">
          ACADEMY SYSTEM
        </p>

        <h2 className="text-2xl md:text-3xl font-black font-mono mt-2">
          RHYTHM OF INDIA
        </h2>

        <p className="text-white/60 mt-3 max-w-2xl">
          Your administration system is
          connected to Firebase role-based
          authentication. The academy can
          manage students, tutors, courses,
          classes, assignments, attendance,
          progress, feedback and AI dance
          reference videos.
        </p>

        <div className="grid md:grid-cols-3 gap-4 mt-7">

          <Feature
            number="01"
            title="Students"
            text="Manage student accounts, enrollments and tutors."
          />

          <Feature
            number="02"
            title="Teaching"
            text="Manage tutors, lessons, classes and assignments."
          />

          <Feature
            number="03"
            title="AI Practice"
            text="Manage reference videos used for real-time dance movement comparison."
          />

        </div>

      </section>
    </>
  );
}

/* ============================================================= */
/* COMING SECTION                                                */
/* ============================================================= */

function ComingSection({
  section,
  onBack,
}: {
  section: string;
  onBack: () => void;
}) {
  const title =
    section.charAt(0).toUpperCase() +
    section.slice(1);

  return (
    <div className="bg-white rounded-[28px] border border-black/10 p-8 md:p-12">

      <div className="w-14 h-14 rounded-2xl bg-[#B42318]/10 text-[#B42318] flex items-center justify-center">
        <Settings size={26} />
      </div>

      <p className="text-[#B42318] text-xs font-black tracking-[0.2em] mt-7">
        ADMIN MODULE
      </p>

      <h1 className="text-4xl font-black font-mono uppercase mt-2">
        {title}
      </h1>

      <p className="text-black/50 mt-3 max-w-xl">
        The {title.toLowerCase()}
        management module is ready
        to be connected to Firestore.
      </p>

      <button
        onClick={onBack}
        className="mt-7 inline-flex items-center gap-2 bg-[#111111] text-white px-6 py-3 rounded-full font-black text-sm"
      >
        Back to Dashboard

        <ArrowRight
          size={16}
        />
      </button>

    </div>
  );
}

/* ============================================================= */
/* STAT CARD                                                     */
/* ============================================================= */

function StatCard({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-black/10 p-6 shadow-sm">

      <div className="w-11 h-11 rounded-xl bg-[#B42318]/10 text-[#B42318] flex items-center justify-center">
        {icon}
      </div>

      <p className="text-xs font-black uppercase tracking-wider text-black/40 mt-5">
        {label}
      </p>

      <p className="text-4xl font-black font-mono mt-1">
        {value}
      </p>

      <p className="text-sm text-black/40 mt-1">
        {description}
      </p>

    </div>
  );
}

/* ============================================================= */
/* QUICK ACTION                                                  */
/* ============================================================= */

function QuickAction({
  icon,
  title,
  text,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-black/10 rounded-2xl p-5 text-left hover:border-[#B42318]/40 hover:shadow-md transition group"
    >

      <div className="w-10 h-10 rounded-xl bg-[#F8F1E6] text-[#B42318] flex items-center justify-center">
        {icon}
      </div>

      <h3 className="font-black mt-4">
        {title}
      </h3>

      <p className="text-black/40 text-sm mt-1">
        {text}
      </p>

      <div className="mt-4 text-[#B42318]">
        <ArrowRight
          size={17}
          className="group-hover:translate-x-1 transition-transform"
        />
      </div>

    </button>
  );
}

/* ============================================================= */
/* FEATURE                                                       */
/* ============================================================= */

function Feature({
  number,
  title,
  text,
}: {
  number: string;
  title: string;
  text: string;
}) {
  return (
    <div className="border border-white/10 rounded-2xl p-5">

      <p className="text-[#B42318] text-xs font-black">
        {number}
      </p>

      <h3 className="font-black mt-3">
        {title}
      </h3>

      <p className="text-white/50 text-sm mt-1">
        {text}
      </p>

    </div>
  );
}

/* ============================================================= */
/* ROLE GUARD                                                    */
/* ============================================================= */

export default function AdminDashboardPage() {
  return (
    <RoleGuard allowedRole="admin">
      <AdminDashboardContent />
    </RoleGuard>
  );
}