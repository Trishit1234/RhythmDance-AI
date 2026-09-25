"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Mail,
  BookOpen,
  Search,
  UserRound,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import RoleGuard from "@/components/RoleGuard";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

type TutorStudent = {
  id: string;
  tutorId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  course?: string;
  danceForm?: string;
  status?: string;
  assignedAt?: unknown;
};

function MyStudentsContent() {
  const router = useRouter();

  const { user, profile } = useAuth();

  const [students, setStudents] = useState<TutorStudent[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<
    TutorStudent[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const loadStudents = async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError("");

    try {
      const studentsQuery = query(
        collection(db, "tutorStudents"),
        where("tutorId", "==", user.uid)
      );

      const snapshot = await getDocs(studentsQuery);

      const data: TutorStudent[] = snapshot.docs.map((doc) => {
        const item = doc.data();

        return {
          id: doc.id,
          tutorId: item.tutorId || "",
          studentId: item.studentId || "",
          studentName:
            item.studentName || "Unnamed Student",
          studentEmail:
            item.studentEmail || "No email available",
          course: item.course || "",
          danceForm: item.danceForm || "",
          status: item.status || "active",
          assignedAt: item.assignedAt,
        };
      });

      setStudents(data);
      setFilteredStudents(data);
    } catch (err) {
      console.error("Error loading students:", err);

      setError(
        "Unable to load your students. Please check your Firebase connection and permissions."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [user?.uid]);

  useEffect(() => {
    const value = search.toLowerCase().trim();

    if (!value) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter((student) => {
      return (
        student.studentName
          .toLowerCase()
          .includes(value) ||
        student.studentEmail
          .toLowerCase()
          .includes(value) ||
        student.course
          ?.toLowerCase()
          .includes(value) ||
        student.danceForm
          ?.toLowerCase()
          .includes(value)
      );
    });

    setFilteredStudents(filtered);
  }, [search, students]);

  return (
    <div className="min-h-screen bg-[#F8F1E6] text-[#111111]">

      {/* HEADER */}

      <header className="bg-white border-b border-black/10 px-5 md:px-8 py-5">

        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

          <div className="flex items-center gap-4">

            <button
              onClick={() => router.push("/tutor/dashboard")}
              className="w-10 h-10 rounded-xl bg-[#F8F1E6] hover:bg-[#E8DEC8] flex items-center justify-center transition"
            >
              <ArrowLeft size={19} />
            </button>

            <div>

              <p className="text-[#B42318] text-xs font-black tracking-[0.18em] uppercase">
                Tutor Portal
              </p>

              <h1 className="text-2xl md:text-3xl font-black font-mono uppercase">
                My Students
              </h1>

            </div>

          </div>

          <div className="hidden sm:block text-right">

            <p className="font-bold text-sm">
              {profile?.displayName || "Tutor"}
            </p>

            <p className="text-xs text-black/40">
              Dance Tutor
            </p>

          </div>

        </div>

      </header>

      {/* CONTENT */}

      <main className="max-w-7xl mx-auto p-5 md:p-8">

        {/* INTRO */}

        <section className="mb-8">

          <p className="text-[#B42318] text-sm font-black">
            YOUR STUDENTS
          </p>

          <h2 className="text-3xl md:text-4xl font-black font-mono uppercase mt-1">
            Teaching Roster
          </h2>

          <p className="text-black/50 mt-2">
            Students assigned to you by the academy administrator.
          </p>

        </section>

        {/* TOP CARDS */}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">

          <div className="bg-white rounded-2xl border border-black/10 p-6">

            <div className="w-11 h-11 rounded-xl bg-[#B42318]/10 text-[#B42318] flex items-center justify-center">
              <Users size={22} />
            </div>

            <p className="text-xs font-black uppercase tracking-wider text-black/40 mt-5">
              Total Students
            </p>

            <p className="text-4xl font-black font-mono mt-1">
              {loading ? "..." : students.length}
            </p>

            <p className="text-sm text-black/40 mt-1">
              Assigned to you
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-black/10 p-6">

            <div className="w-11 h-11 rounded-xl bg-[#B42318]/10 text-[#B42318] flex items-center justify-center">
              <BookOpen size={22} />
            </div>

            <p className="text-xs font-black uppercase tracking-wider text-black/40 mt-5">
              Active Students
            </p>

            <p className="text-4xl font-black font-mono mt-1">
              {loading
                ? "..."
                : students.filter(
                    (student) =>
                      student.status === "active"
                  ).length}
            </p>

            <p className="text-sm text-black/40 mt-1">
              Currently learning
            </p>

          </div>

          <div className="bg-white rounded-2xl border border-black/10 p-6">

            <div className="w-11 h-11 rounded-xl bg-[#B42318]/10 text-[#B42318] flex items-center justify-center">
              <UserRound size={22} />
            </div>

            <p className="text-xs font-black uppercase tracking-wider text-black/40 mt-5">
              Tutor
            </p>

            <p className="text-xl font-black mt-2">
              {profile?.displayName || "Tutor"}
            </p>

            <p className="text-sm text-black/40 mt-1">
              Your teaching account
            </p>

          </div>

        </div>

        {/* STUDENT LIST */}

        <section className="bg-white rounded-[28px] border border-black/10 overflow-hidden">

          {/* LIST HEADER */}

          <div className="p-5 md:p-6 border-b border-black/10 flex flex-col md:flex-row md:items-center justify-between gap-4">

            <div>

              <h3 className="font-black font-mono text-xl">
                STUDENT ROSTER
              </h3>

              <p className="text-sm text-black/40 mt-1">
                Manage and review your assigned students.
              </p>

            </div>

            <div className="flex gap-2">

              {/* SEARCH */}

              <div className="relative">

                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30"
                />

                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  className="w-full md:w-64 pl-9 pr-4 py-2.5 rounded-xl bg-[#F8F1E6] border border-[#E8DEC8] outline-none focus:border-[#B42318] text-sm"
                />

              </div>

              {/* REFRESH */}

              <button
                onClick={loadStudents}
                disabled={loading}
                className="w-11 h-11 rounded-xl bg-[#111111] text-white flex items-center justify-center hover:bg-black disabled:opacity-50 transition"
                title="Refresh students"
              >

                <RefreshCw
                  size={17}
                  className={
                    loading
                      ? "animate-spin"
                      : ""
                  }
                />

              </button>

            </div>

          </div>

          {/* ERROR */}

          {error && (
            <div className="m-5 bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">

              <AlertCircle
                size={19}
                className="text-[#B42318] mt-0.5 shrink-0"
              />

              <div>

                <p className="font-bold text-[#B42318] text-sm">
                  Unable to load students
                </p>

                <p className="text-red-700/70 text-xs mt-1">
                  {error}
                </p>

              </div>

            </div>
          )}

          {/* LOADING */}

          {loading && (
            <div className="py-20 flex flex-col items-center justify-center">

              <Loader2
                size={32}
                className="animate-spin text-[#B42318]"
              />

              <p className="text-sm font-bold text-black/40 mt-4">
                Loading your students...
              </p>

            </div>
          )}

          {/* EMPTY */}

          {!loading &&
            !error &&
            filteredStudents.length === 0 && (
              <div className="py-20 px-6 text-center">

                <div className="w-16 h-16 rounded-2xl bg-[#F8F1E6] flex items-center justify-center mx-auto">
                  <Users
                    size={28}
                    className="text-[#B42318]"
                  />
                </div>

                <h3 className="font-black font-mono text-xl mt-5">
                  {search
                    ? "NO STUDENTS FOUND"
                    : "NO STUDENTS ASSIGNED"}
                </h3>

                <p className="text-black/40 text-sm max-w-md mx-auto mt-2">
                  {search
                    ? "Try a different student name, email or course."
                    : "Your administrator has not assigned any students to you yet."}
                </p>

              </div>
            )}

          {/* DESKTOP TABLE */}

          {!loading &&
            filteredStudents.length > 0 && (
              <div className="hidden md:block overflow-x-auto">

                <table className="w-full">

                  <thead>

                    <tr className="bg-[#F8F1E6] text-left">

                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-black/40">
                        Student
                      </th>

                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-black/40">
                        Course
                      </th>

                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-black/40">
                        Dance Form
                      </th>

                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-black/40">
                        Status
                      </th>

                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-wider text-black/40">
                        Action
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {filteredStudents.map(
                      (student) => (
                        <tr
                          key={student.id}
                          className="border-t border-black/5 hover:bg-[#F8F1E6]/60 transition"
                        >

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-3">

                              <div className="w-10 h-10 rounded-xl bg-[#111111] text-white flex items-center justify-center font-black">
                                {student.studentName
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <div>

                                <p className="font-black text-sm">
                                  {student.studentName}
                                </p>

                                <p className="text-xs text-black/40 flex items-center gap-1 mt-1">
                                  <Mail size={12} />
                                  {student.studentEmail}
                                </p>

                              </div>

                            </div>

                          </td>

                          <td className="px-6 py-5 text-sm font-bold">
                            {student.course || "—"}
                          </td>

                          <td className="px-6 py-5 text-sm">
                            {student.danceForm || "—"}
                          </td>

                          <td className="px-6 py-5">

                            <span
                              className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                                student.status ===
                                "active"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-black/5 text-black/50"
                              }`}
                            >
                              {student.status ||
                                "active"}
                            </span>

                          </td>

                          <td className="px-6 py-5">

                            <button
                              onClick={() =>
                                router.push(
                                  `/tutor/students/${student.studentId}`
                                )
                              }
                              className="text-[#B42318] text-xs font-black hover:underline"
                            >
                              VIEW STUDENT →
                            </button>

                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}

          {/* MOBILE CARDS */}

          {!loading &&
            filteredStudents.length > 0 && (
              <div className="md:hidden divide-y divide-black/5">

                {filteredStudents.map(
                  (student) => (
                    <div
                      key={student.id}
                      className="p-5"
                    >

                      <div className="flex items-start gap-3">

                        <div className="w-11 h-11 shrink-0 rounded-xl bg-[#111111] text-white flex items-center justify-center font-black">
                          {student.studentName
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0 flex-1">

                          <p className="font-black">
                            {student.studentName}
                          </p>

                          <p className="text-xs text-black/40 flex items-center gap-1 mt-1 break-all">
                            <Mail
                              size={12}
                              className="shrink-0"
                            />
                            {student.studentEmail}
                          </p>

                        </div>

                        <span
                          className={`shrink-0 px-2.5 py-1 rounded-full text-[9px] font-black uppercase ${
                            student.status ===
                            "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-black/5 text-black/50"
                          }`}
                        >
                          {student.status ||
                            "active"}
                        </span>

                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-4">

                        <div className="bg-[#F8F1E6] rounded-xl p-3">

                          <p className="text-[9px] font-black uppercase text-black/30">
                            Course
                          </p>

                          <p className="text-xs font-bold mt-1">
                            {student.course || "—"}
                          </p>

                        </div>

                        <div className="bg-[#F8F1E6] rounded-xl p-3">

                          <p className="text-[9px] font-black uppercase text-black/30">
                            Dance Form
                          </p>

                          <p className="text-xs font-bold mt-1">
                            {student.danceForm || "—"}
                          </p>

                        </div>

                      </div>

                      <button
                        onClick={() =>
                          router.push(
                            `/tutor/students/${student.studentId}`
                          )
                        }
                        className="w-full mt-4 bg-[#111111] text-white py-3 rounded-xl text-xs font-black"
                      >
                        VIEW STUDENT
                      </button>

                    </div>
                  )
                )}

              </div>
            )}

        </section>

      </main>

    </div>
  );
}

export default function TutorStudentsPage() {
  return (
    <RoleGuard allowedRole="tutor">
      <MyStudentsContent />
    </RoleGuard>
  );
}