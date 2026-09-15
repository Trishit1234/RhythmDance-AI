"use client";

import {
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  Award,
  CheckCircle2,
  Download,
  Lock,
  ShieldCheck,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useProgress } from "@/context/ProgressContext";
import { danceStyles } from "@/data/danceData";

import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firestore";

type CertificateRecord = {
  credentialId: string;
  studentName: string;
  course: string;
  danceSlug: string;
  completion: number;
  issuedAt: string;
  userId: string;
};

const CERTIFICATES_KEY =
  "roi_certificates";

function createCredentialId(
  userId: string,
  danceSlug: string,
  danceName: string
) {
  const source =
    `${userId}:${danceSlug}:rhythm-of-india-2026`;

  let hash = 0;

  for (let i = 0; i < source.length; i++) {
    hash =
      (hash << 5) -
      hash +
      source.charCodeAt(i);

    hash |= 0;
  }

  const number =
    1000 +
    (Math.abs(hash) % 9000);

  const code =
    danceName
      .replace(/[^a-zA-Z]/g, "")
      .slice(0, 3)
      .toUpperCase()
      .padEnd(3, "X");

  return `ROI-26-${code}-${number}`;
}

function CertificateContent() {
  const searchParams =
    useSearchParams();

  const { user } = useAuth();

  const {
    completedLessons,
  } = useProgress();

  const certificateRef =
    useRef<HTMLDivElement>(null);

  const danceParam =
    searchParams.get("dance") ||
    "odissi";

  const dance =
    danceStyles.find(
      (item) =>
        item.slug.toLowerCase() ===
          danceParam.toLowerCase() ||
        item.name.toLowerCase() ===
          danceParam.toLowerCase()
    ) || danceStyles[0];

  const completedCount =
    completedLessons[dance.slug]
      ?.length || 0;

  const totalLessons =
    dance.lessons.length;

  const completion =
    Math.round(
      Math.min(
        100,
        (completedCount /
          Math.max(1, totalLessons)) *
          100
      )
    );

  const courseCompleted =
    completedCount >= totalLessons;

  const fallbackName =
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Dance Student";

  const [studentName, setStudentName] =
    useState(fallbackName);

  const [savedCertificate, setSavedCertificate] =
    useState<CertificateRecord | null>(null);

  const [downloading, setDownloading] =
    useState(false);

  const credentialId = useMemo(() => {
    if (!user) return "";

    return createCredentialId(
      user.uid,
      dance.slug,
      dance.name
    );
  }, [user, dance.slug, dance.name]);

  useEffect(() => {
    if (!user) return;

    const savedProfile =
      localStorage.getItem(
        "roi_user_profile"
      );

    if (savedProfile) {
      try {
        const parsed =
          JSON.parse(savedProfile);

        if (
          typeof parsed.name === "string" &&
          parsed.name.trim()
        ) {
          setStudentName(
            parsed.name.trim()
          );
          return;
        }
      } catch {}
    }

    setStudentName(fallbackName);
  }, [user, fallbackName]);

  useEffect(() => {
    if (!user || !courseCompleted) return;

    const saveCertificate =
      async () => {
        const certificate: CertificateRecord =
          {
            credentialId,
            studentName,
            course: dance.name,
            danceSlug: dance.slug,
            completion: 100,
            issuedAt:
              new Date().toISOString(),
            userId: user.uid,
          };

        try {
          const certificateRef =
            doc(
              db,
              "certificates",
              credentialId
            );

          const existing =
            await getDoc(
              certificateRef
            );

          if (existing.exists()) {
            const existingData =
              existing.data();

            const existingCertificate =
              existingData as CertificateRecord;

            setSavedCertificate(
              existingCertificate
            );

            return;
          }

          await setDoc(
            certificateRef,
            {
              ...certificate,
              createdAt:
                serverTimestamp(),
            }
          );

          setSavedCertificate(
            certificate
          );

          const existingLocal =
            localStorage.getItem(
              CERTIFICATES_KEY
            );

          let certificates: CertificateRecord[] =
            [];

          try {
            certificates =
              existingLocal
                ? JSON.parse(
                    existingLocal
                  )
                : [];
          } catch {}

          const withoutDuplicate =
            certificates.filter(
              (item) =>
                item.credentialId !==
                credentialId
            );

          localStorage.setItem(
            CERTIFICATES_KEY,
            JSON.stringify([
              ...withoutDuplicate,
              certificate,
            ])
          );
        } catch (error) {
          console.error(
            "Certificate save failed:",
            error
          );
        }
      };

    saveCertificate();
  }, [
    user,
    courseCompleted,
    credentialId,
    studentName,
    dance.name,
    dance.slug,
  ]);

  const downloadCertificate =
    async () => {
      if (
        !courseCompleted ||
        downloading
      ) {
        return;
      }

      setDownloading(true);

      try {
        const html2pdf =
          (
            await import(
              "html2pdf.js"
            )
          ).default;

        if (!certificateRef.current)
          return;

        await html2pdf()
          .set({
            margin: 0,
            filename:
              `${dance.name}-Certificate-${credentialId}.pdf`,
            image: {
              type: "jpeg",
              quality: 0.98,
            },
            html2canvas: {
              scale: 2,
              useCORS: true,
            },
            jsPDF: {
              unit: "mm",
              format: "a4",
              orientation:
                "landscape",
            },
          })
          .from(certificateRef.current)
          .save();
      } catch (error) {
        console.error(
          "Certificate download failed:",
          error
        );
      } finally {
        setDownloading(false);
      }
    };

  return (
    <div className="min-h-screen bg-[#F8F1E6] text-[#111111]">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 mb-10">
          <div>
            <p className="text-xs font-black tracking-[0.25em] text-[#B42318] font-mono">
              RHYTHM OF INDIA ACADEMY
            </p>

            <h1 className="mt-2 text-4xl sm:text-6xl font-black uppercase font-mono tracking-tight">
              Certificate
            </h1>

            <p className="mt-3 text-sm text-gray-600">
              {dance.name} course achievement
            </p>
          </div>

          {courseCompleted && (
            <div className="inline-flex items-center gap-2 rounded-full bg-green-100 border border-green-200 px-4 py-2 text-xs font-black text-green-700">
              <CheckCircle2 size={15} />
              COURSE COMPLETED
            </div>
          )}
        </div>

        {!courseCompleted && (
          <div className="mb-8 rounded-3xl bg-[#111111] text-white p-6 sm:p-8 border border-white/10">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#B42318] flex items-center justify-center shrink-0">
                <Lock size={20} />
              </div>

              <div>
                <p className="font-black uppercase font-mono">
                  Certificate Locked
                </p>

                <p className="mt-2 text-sm text-gray-400">
                  Complete all {totalLessons} lessons
                  of {dance.name} to unlock your
                  official certificate.
                </p>

                <div className="mt-4 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full bg-[#E3B23C] rounded-full"
                    style={{
                      width: `${completion}%`,
                    }}
                  />
                </div>

                <p className="mt-2 text-xs text-gray-500 font-mono">
                  {completedCount}/{totalLessons} lessons
                  • {completion}% complete
                </p>
              </div>
            </div>
          </div>
        )}

        <div
          ref={certificateRef}
          className={`relative bg-white shadow-2xl overflow-hidden ${
            !courseCompleted
              ? "opacity-90"
              : ""
          }`}
          style={{
            aspectRatio: "1.414 / 1",
          }}
        >
          <div className="absolute inset-5 border-[3px] border-[#B42318]" />

          <div className="absolute inset-7 border border-[#E3B23C]" />

          <div className="relative h-full flex flex-col items-center justify-center text-center px-10 sm:px-20">
            {!courseCompleted && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/55 backdrop-blur-[2px]">
                <div className="rotate-[-12deg] border-4 border-[#B42318] px-8 py-4 text-[#B42318] font-black text-xl sm:text-3xl tracking-widest uppercase">
                  PREVIEW
                  <br />
                  <span className="text-sm sm:text-base">
                    COMPLETE COURSE TO UNLOCK
                  </span>
                </div>
              </div>
            )}

            <div className="text-[#B42318] text-4xl">
              ♫
            </div>

            <p className="mt-3 text-xs sm:text-sm font-black tracking-[0.35em] font-mono">
              RHYTHM OF INDIA ACADEMY
            </p>

            <p className="mt-7 text-[10px] sm:text-xs tracking-[0.35em] text-gray-500 font-bold">
              CERTIFICATE OF MASTERY
            </p>

            <h2 className="mt-5 text-4xl sm:text-6xl lg:text-7xl font-black font-serif text-[#111111]">
              {studentName}
            </h2>

            <p className="mt-4 text-sm sm:text-base text-gray-500">
              has successfully completed the
            </p>

            <p className="mt-2 text-2xl sm:text-4xl font-black uppercase font-mono text-[#B42318]">
              {dance.name}
            </p>

            <div className="mt-6 flex items-center gap-3 text-[#E3B23C]">
              <div className="w-16 h-px bg-[#E3B23C]" />
              <Award size={22} />
              <div className="w-16 h-px bg-[#E3B23C]" />
            </div>

            <p className="mt-5 text-xs sm:text-sm text-gray-500 max-w-xl">
              Demonstrating dedication to learning,
              practice and the traditions of Indian
              classical dance.
            </p>

            <div className="absolute bottom-12 left-12 right-12 flex flex-col sm:flex-row justify-between items-end gap-6 text-left">
              <div>
                <p className="text-[9px] text-gray-400 uppercase tracking-widest">
                  Credential ID
                </p>

                <p className="mt-1 text-xs font-black font-mono">
                  {credentialId}
                </p>
              </div>

              <div className="text-center">
                <div className="w-24 h-px bg-gray-300 mb-2" />
                <p className="text-[9px] text-gray-400 uppercase tracking-widest">
                  Academy Director
                </p>
              </div>

              <div className="text-right">
                <p className="text-[9px] text-gray-400 uppercase tracking-widest">
                  Completion
                </p>

                <p className="mt-1 text-xs font-black">
                  {courseCompleted
                    ? "100%"
                    : `${completion}%`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
          <button
            onClick={downloadCertificate}
            disabled={
              !courseCompleted ||
              downloading
            }
            className={`inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-xs font-black uppercase tracking-wider transition ${
              courseCompleted
                ? "bg-[#B42318] text-white hover:bg-[#D4492F]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {courseCompleted ? (
              <Download size={16} />
            ) : (
              <Lock size={16} />
            )}

            {downloading
              ? "Generating..."
              : courseCompleted
              ? "Download Official PDF"
              : "Complete Course to Download"}
          </button>

          {courseCompleted && (
            <Link
              href={`/verify?id=${encodeURIComponent(
                credentialId
              )}`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white border border-[#E8DEC8] px-7 py-4 text-xs font-black uppercase tracking-wider hover:bg-[#EFE7DA]"
            >
              <ShieldCheck size={16} />
              Verify Certificate
            </Link>
          )}
        </div>

        {savedCertificate && (
          <p className="mt-5 text-center text-xs text-gray-500 font-mono">
            Credential ID:{" "}
            {savedCertificate.credentialId}
          </p>
        )}
      </main>
    </div>
  );
}

export default function CertificatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F8F1E6]">
          Loading certificate...
        </div>
      }
    >
      <CertificateContent />
    </Suspense>
  );
}