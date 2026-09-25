"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  MessageSquare,
  LogOut,
  LayoutDashboard,
  BarChart3,
  Activity,
  Menu,
  ArrowRight,
  Plus,
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
  | "classes"
  | "lessons"
  | "assignments"
  | "attendance"
  | "practice"
  | "feedback";

function TutorDashboardContent() {
  const router = useRouter();

  const { profile } = useAuth();

  const [activeSection, setActiveSection] =
    useState<Section>("dashboard");

  const [mobileMenu, setMobileMenu] = useState(false);

  const [stats, setStats] = useState({
    students: 0,
    classes: 0,
    lessons: 0,
    assignments: 0,
    attendance: 0,
    feedback: 0,
  });

  const [statsLoading, setStatsLoading] = useState(true);

  /*
   * ============================================================
   * LOAD DASHBOARD STATISTICS
   * ============================================================
   */

  const loadStats = async () => {
    setStatsLoading(true);

    try {
      const [
        studentsSnapshot,
        classesSnapshot,
        lessonsSnapshot,
        assignmentsSnapshot,
        attendanceSnapshot,
        feedbackSnapshot,
      ] = await Promise.all([
        getCountFromServer(
          collection(db, "tutorStudents")
        ),

        getCountFromServer(
          collection(db, "classes")
        ),

        getCountFromServer(
          collection(db, "lessons")
        ),

        getCountFromServer(
          collection(db, "assignments")
        ),

        getCountFromServer(
          collection(db, "attendance")
        ),

        getCountFromServer(
          collection(db, "feedback")
        ),
      ]);

      setStats({
        students: studentsSnapshot.data().count,
        classes: classesSnapshot.data().count,
        lessons: lessonsSnapshot.data().count,
        assignments: assignmentsSnapshot.data().count,
        attendance: attendanceSnapshot.data().count,
        feedback: feedbackSnapshot.data().count,
      });
    } catch (error) {
      console.error(
        "Failed to load tutor statistics:",
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
   * ============================================================
   * LOGOUT
   * ============================================================
   */

  const handleLogout = async () => {
    const { logout } = useAuth();

    await logout();

    router.replace("/");
  };

  /*
   * ============================================================
   * NAVIGATION
   * ============================================================
   */

  const navigateTo = (section: Section) => {
    setMobileMenu(false);

    /*
     * REAL PAGES
     */

    if (section === "students") {
      router.push("/tutor/students");
      return;
    }

    if (section === "classes") {
      router.push("/tutor/classes");
      return;
    }

    if (section === "lessons") {
      router.push("/tutor/lessons");
      return;
    }

    if (section === "assignments") {
      router.push("/tutor/assignments");
      return;
    }

    if (section === "attendance") {
      router.push("/tutor/attendance");
      return;
    }

    if (section === "practice") {
      router.push("/tutor/practice");
      return;
    }

    if (section === "feedback") {
      router.push("/tutor/feedback");
      return;
    }

    setActiveSection(section);
  };

  /*
   * ============================================================
   * SIDEBAR MENU
   * ============================================================
   */

  const menuItems: {
    id: Section;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: "students",
      label: "My Students",
      icon: <Users size={18} />,
    },
    {
      id: "classes",
      label: "My Classes",
      icon: <CalendarDays size={18} />,
    },
    {
      id: "lessons",
      label: "Lessons",
      icon: <BookOpen size={18} />,
    },
    {
      id: "assignments",
      label: "Assignments",
      icon: <ClipboardCheck size={18} />,
    },
    {
      id: "attendance",
      label: "Attendance",
      icon: <Activity size={18} />,
    },
    {
      id: "practice",
      label: "Practice Reviews",
      icon: <BarChart3 size={18} />,
    },
    {
      id: "feedback",
      label: "Feedback",
      icon: <MessageSquare size={18} />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F1E6] text-[#111111]">

      <div className="flex min-h-screen">

        {/* ==================================================== */}
        {/* SIDEBAR                                              */}
        {/* ==================================================== */}

        <aside
          className={`fixed md:static z-50 inset-y-0 left-0 w-72 md:w-64 bg-[#111111] text-white flex flex-col transform transition-transform duration-300 ${
            mobileMenu
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0"
          }`}
        >

          {/* LOGO */}

          <div className="p-6 border-b border-white/10">

            <p className="text-[#B42318] text-xs font-black tracking-[0.2em]">
              RHYTHM OF INDIA
            </p>

            <h1 className="text-xl font-black font-mono mt-2">
              TUTOR PORTAL
            </h1>

            <p className="text-white/40 text-[10px] mt-2 uppercase tracking-wider">
              Teaching Workspace
            </p>

          </div>

          {/* NAVIGATION */}

          <nav className="p-4 space-y-1 flex-1 overflow-y-auto">

            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  navigateTo(item.id)
                }
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition text-left ${
                  activeSection === item.id
                    ? "bg-[#B42318] text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }`}
              >

                {item.icon}

                <span className="text-sm font-bold">
                  {item.label}
                </span>

              </button>
            ))}

          </nav>

          {/* LOGOUT */}

          <div className="p-4 border-t border-white/10">

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/20 text-white/60 hover:text-white transition"
            >

              <LogOut size={18} />

              <span className="text-sm font-bold">
                Logout
              </span>

            </button>

          </div>

        </aside>

        {/* ==================================================== */}
        {/* MOBILE OVERLAY                                       */}
        {/* ==================================================== */}

        {mobileMenu && (
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() =>
              setMobileMenu(false)
            }
          />
        )}

        {/* ==================================================== */}
        {/* MAIN                                                  */}
        {/* ==================================================== */}

        <main className="flex-1 min-w-0">

          {/* HEADER */}

          <header className="bg-white border-b border-black/10 px-5 md:px-6 py-4 flex items-center justify-between sticky top-0 z-30">

            <div className="flex items-center gap-3">

              <button
                onClick={() =>
                  setMobileMenu(true)
                }
                className="md:hidden w-10 h-10 rounded-xl bg-[#F8F1E6] flex items-center justify-center"
              >
                <Menu size={20} />
              </button>

              <div>

                <p className="text-xs text-black/40 font-bold uppercase tracking-wider">
                  Teaching Portal
                </p>

                <h2 className="text-xl md:text-2xl font-black font-mono">
                  Tutor Dashboard
                </h2>

              </div>

            </div>

            {/* PROFILE */}

            <div className="text-right hidden sm:block">

              <p className="font-bold text-sm">
                {profile?.displayName || "Tutor"}
              </p>

              <p className="text-xs text-black/40">
                Dance Tutor
              </p>

            </div>

          </header>

          {/* ================================================= */}
          {/* DASHBOARD CONTENT                                  */}
          {/* ================================================= */}

          <div className="p-5 md:p-10 max-w-7xl mx-auto">

            {/* WELCOME */}

            <div className="mb-8">

              <p className="text-[#B42318] text-sm font-black">
                NAMASTE 👋
              </p>

              <h1 className="text-4xl md:text-5xl font-black font-mono uppercase mt-1">
                Your Teaching Space
              </h1>

              <p className="text-black/50 mt-3">
                Welcome,{" "}
                {profile?.displayName || "Tutor"}.
                Teach, guide and track your
                students' dance journey.
              </p>

            </div>

            {/* ================================================= */}
            {/* STATS                                             */}
            {/* ================================================= */}

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">

              <StatCard
                icon={<Users size={22} />}
                label="Students"
                value={
                  statsLoading
                    ? "..."
                    : String(stats.students)
                }
                description="Assigned students"
              />

              <StatCard
                icon={<CalendarDays size={22} />}
                label="Classes"
                value={
                  statsLoading
                    ? "..."
                    : String(stats.classes)
                }
                description="Scheduled classes"
              />

              <StatCard
                icon={<BookOpen size={22} />}
                label="Lessons"
                value={
                  statsLoading
                    ? "..."
                    : String(stats.lessons)
                }
                description="Teaching material"
              />

              <StatCard
                icon={<ClipboardCheck size={22} />}
                label="Assignments"
                value={
                  statsLoading
                    ? "..."
                    : String(stats.assignments)
                }
                description="Created assignments"
              />

            </div>

            {/* SECONDARY STATS */}

            <div className="grid sm:grid-cols-2 gap-5 mt-5">

              <StatCard
                icon={<Activity size={22} />}
                label="Attendance"
                value={
                  statsLoading
                    ? "..."
                    : String(stats.attendance)
                }
                description="Attendance records"
              />

              <StatCard
                icon={<MessageSquare size={22} />}
                label="Feedback"
                value={
                  statsLoading
                    ? "..."
                    : String(stats.feedback)
                }
                description="Feedback given"
              />

            </div>

            {/* ================================================= */}
            {/* QUICK ACTIONS                                     */}
            {/* ================================================= */}

            <section className="mt-10">

              <p className="text-[#B42318] text-xs font-black tracking-[0.2em]">
                TEACHING TOOLS
              </p>

              <h2 className="text-2xl font-black font-mono mt-1">
                QUICK ACTIONS
              </h2>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">

                <QuickAction
                  icon={<Users size={20} />}
                  title="My Students"
                  text="View students assigned to you."
                  onClick={() =>
                    navigateTo("students")
                  }
                />

                <QuickAction
                  icon={<CalendarDays size={20} />}
                  title="Schedule Class"
                  text="Create and manage live classes."
                  onClick={() =>
                    navigateTo("classes")
                  }
                />

                <QuickAction
                  icon={<BookOpen size={20} />}
                  title="Create Lesson"
                  text="Prepare teaching material."
                  onClick={() =>
                    navigateTo("lessons")
                  }
                />

                <QuickAction
                  icon={<Plus size={20} />}
                  title="Assignment"
                  text="Give students practice work."
                  onClick={() =>
                    navigateTo("assignments")
                  }
                />

              </div>

            </section>

            {/* ================================================= */}
            {/* TEACHING WORKFLOW                                 */}
            {/* ================================================= */}

            <section className="mt-10 bg-white rounded-[28px] border border-black/10 p-7 md:p-10">

              <p className="text-[#B42318] text-xs font-black tracking-[0.2em]">
                TEACHING SYSTEM
              </p>

              <h2 className="text-2xl md:text-3xl font-black font-mono mt-2">
                TEACH • TRACK • GUIDE
              </h2>

              <p className="text-black/50 mt-3 max-w-2xl">
                Your tutor portal is designed around
                the complete student learning cycle.
                Teach lessons, conduct classes,
                assign practice, review performance
                and provide personal feedback.
              </p>

              <div className="grid md:grid-cols-3 gap-4 mt-7">

                <Feature
                  number="01"
                  title="Teach"
                  text="Create lessons and schedule live classes."
                />

                <Feature
                  number="02"
                  title="Track"
                  text="Monitor attendance, assignments and progress."
                />

                <Feature
                  number="03"
                  title="Guide"
                  text="Review practice and provide personal feedback."
                />

              </div>

            </section>

            {/* ================================================= */}
            {/* MODULE STATUS                                     */}
            {/* ================================================= */}

            <section className="mt-8 grid md:grid-cols-2 gap-5">

              <ModuleCard
                title="Student Management"
                description="View your assigned students and their learning information."
                button="OPEN STUDENTS"
                onClick={() =>
                  navigateTo("students")
                }
              />

              <ModuleCard
                title="Class Management"
                description="Schedule and manage your upcoming live dance classes."
                button="OPEN CLASSES"
                onClick={() =>
                  navigateTo("classes")
                }
              />

            </section>

          </div>

        </main>

      </div>

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
/* MODULE CARD                                                   */
/* ============================================================= */

function ModuleCard({
  title,
  description,
  button,
  onClick,
}: {
  title: string;
  description: string;
  button: string;
  onClick: () => void;
}) {
  return (
    <div className="bg-[#111111] text-white rounded-[24px] p-7">

      <p className="text-[#B42318] text-xs font-black tracking-[0.15em]">
        TUTOR MODULE
      </p>

      <h3 className="text-xl font-black font-mono mt-2">
        {title}
      </h3>

      <p className="text-white/50 text-sm mt-2">
        {description}
      </p>

      <button
        onClick={onClick}
        className="mt-5 inline-flex items-center gap-2 bg-white text-[#111111] px-5 py-2.5 rounded-full text-xs font-black hover:bg-[#F8F1E6] transition"
      >
        {button}
        <ArrowRight size={14} />
      </button>

    </div>
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
    <div className="bg-[#F8F1E6] rounded-2xl p-5">

      <p className="text-[#B42318] text-xs font-black">
        {number}
      </p>

      <h3 className="font-black mt-3">
        {title}
      </h3>

      <p className="text-black/50 text-sm mt-1">
        {text}
      </p>

    </div>
  );
}

/* ============================================================= */
/* ROLE GUARD                                                    */
/* ============================================================= */

export default function TutorDashboardPage() {
  return (
    <RoleGuard allowedRole="tutor">
      <TutorDashboardContent />
    </RoleGuard>
  );
}