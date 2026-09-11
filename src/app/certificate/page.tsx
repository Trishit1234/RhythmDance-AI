"use client";

import { Suspense, useRef, useMemo, useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import {
  Download,
  ArrowLeft,
  Award,
  CheckCircle2,
  Loader2,
  Edit3,
  UserCheck,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

function CertificateContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  const danceName = searchParams.get("dance") || "Odissi";
  const [customName, setCustomName] = useState("");
  const [inputName, setInputName] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("roi_user_profile");
      if (stored) {
        const data = JSON.parse(stored);
        if (data.name) {
          setCustomName(data.name);
          setInputName(data.name);
        }
      }
    } catch (e) {}
  }, []);

  const defaultName = user?.isAnonymous
    ? "Guest Scholar"
    : user?.email?.split("@")[0] || "Classical Scholar";
  const userName = customName || defaultName;

  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Generate certId once per mount to avoid impure render calls
  const certId = useMemo(
    () =>
      `ROI-26-${danceName.toUpperCase().slice(0, 3)}-${Math.floor(1000 + Math.random() * 9000)}`,
    [danceName]
  );

  const handleSaveName = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputName.trim();
    if (trimmed) {
      setCustomName(trimmed);
      try {
        localStorage.setItem("roi_user_profile", JSON.stringify({ name: trimmed }));
      } catch (err) {}
    }
    setIsEditingName(false);
  };

  const handleDownloadPDF = async () => {
    if (!certRef.current) return;
    setDownloading(true);

    try {
      // Dynamically import html2pdf in the browser
      const html2pdf = (await import("html2pdf.js")).default;

      const opt = {
        margin:       [5, 5, 5, 5] as [number, number, number, number],
        filename:     `Rhythm-of-India-${danceName}-Certificate.pdf`,
        image:        { type: "jpeg" as const, quality: 1 },
        html2canvas:  {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          foreignObjectRendering: false,
        },
        jsPDF:        { unit: "mm" as const, format: "a4" as const, orientation: "landscape" as const },
      };

      await html2pdf().set(opt).from(certRef.current).save();
    } catch (err) {
      console.error("PDF generation failed:", err);
      // Fallback to print
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="pt-24 sm:pt-28 pb-20 px-3 sm:px-6 max-w-4xl mx-auto space-y-6 sm:space-y-8">
      {/* ── Top Header Bar with Breadcrumb & Edit Name Button ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E8DEC8] pb-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#777777]">
          <button
            onClick={() => router.push("/dashboard")}
            className="hover:text-[#B42318] transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft size={13} />
            <span>Dashboard</span>
          </button>
          <span>/</span>
          <span className="text-[#111111] font-mono uppercase">
            {danceName} · Accreditation Certificate
          </span>
        </div>

        {/* Edit Student Name Button */}
        <button
          onClick={() => {
            setInputName(userName);
            setIsEditingName(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-[#EFE7DA] border border-[#E8DEC8] rounded-full text-xs font-bold text-[#111111] transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-sm self-start sm:self-auto"
        >
          <Edit3 size={13} className="text-[#B42318]" />
          <span>Edit Student Name</span>
        </button>
      </div>

      {/* ── Clean Hero Banner (Replaced long repetitive uppercase text) ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2 max-w-2xl mx-auto"
      >
        <div className="inline-flex items-center gap-2 bg-[#EFE7DA] border border-[#E8DEC8] rounded-full px-3.5 py-1 text-[11px] font-bold text-[#111111]">
          <Award size={14} className="text-[#B42318]" />
          <span>OFFICIAL ACCREDITATION DIPLOMA</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black uppercase text-[#111111] font-mono tracking-tight">
          Verified Certificate of Mastery
        </h1>
        <p className="text-xs sm:text-sm text-[#777777] max-w-md mx-auto leading-relaxed">
          Awarded for successful completion of the <strong className="text-[#111111]">{danceName}</strong> classical curriculum and knowledge assessment.
        </p>
      </motion.div>

      {/* ── Official Diploma Certificate Document ── */}
      <div className="w-full overflow-x-auto pb-2">
        <motion.div
          ref={certRef}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="relative bg-white border-2 sm:border-4 border-[#111111] rounded-[24px] sm:rounded-[36px] p-6 sm:p-12 md:p-16 mx-auto max-w-3xl shadow-xl overflow-hidden print:border-2 print:m-0 print:shadow-none min-w-[300px]"
        >
          {/* Ornate Red Corner Accents */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 w-6 h-6 sm:w-12 sm:h-12 border-t-2 sm:border-t-4 border-l-2 sm:border-l-4 border-[#B42318] rounded-tl-lg sm:rounded-tl-xl pointer-events-none" />
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-6 h-6 sm:w-12 sm:h-12 border-t-2 sm:border-t-4 border-r-2 sm:border-r-4 border-[#B42318] rounded-tr-lg sm:rounded-tr-xl pointer-events-none" />
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 w-6 h-6 sm:w-12 sm:h-12 border-b-2 sm:border-b-4 border-l-2 sm:border-l-4 border-[#B42318] rounded-bl-lg sm:rounded-bl-xl pointer-events-none" />
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-6 h-6 sm:w-12 sm:h-12 border-b-2 sm:border-b-4 border-r-2 sm:border-r-4 border-[#B42318] rounded-br-lg sm:rounded-br-xl pointer-events-none" />

          <div className="text-center space-y-4 sm:space-y-6">
            {/* Header Mark */}
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[#111111] text-[#F8F1E6] flex items-center justify-center font-mono font-black text-lg sm:text-xl mb-2">
                ♫
              </div>
              <p className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] sm:tracking-[0.35em] text-[#777777] font-mono">
                RHYTHM OF INDIA ACADEMY
              </p>
              <p className="text-[9px] sm:text-[10px] font-bold tracking-wider sm:tracking-widest text-[#B42318] uppercase">
                NATIONAL HERITAGE PROTOCOL · CLASSICAL ARTS ACADEMY
              </p>
            </div>

            <div className="h-px w-20 sm:w-24 bg-[#B42318] mx-auto" />

            {/* Certificate Title */}
            <div>
              <h2 className="text-lg sm:text-2xl font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] text-[#111111] font-mono">
                CERTIFICATE OF MASTERY
              </h2>
              <p className="text-[11px] sm:text-xs text-[#777777] mt-1 italic">
                This is proudly presented to
              </p>
            </div>

            {/* Scholar Name (With responsive sizing and word-break) */}
            <div className="py-2 border-b-2 border-[#E5E5E5] max-w-lg mx-auto">
              <h3 className="text-xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight text-[#111111] font-mono break-words leading-tight">
                {userName}
              </h3>
            </div>

            {/* Body Text */}
            <p className="text-xs sm:text-sm text-[#252525] max-w-lg mx-auto leading-relaxed font-medium">
              for successfully completing all curriculum modules, demonstrating mastery of classical hand mudras, rhythmic footwork (Tala), and expressive storytelling (Abhinaya) in the sacred tradition of{" "}
              <strong className="text-[#B42318] font-bold uppercase">{danceName}</strong>.
            </p>

            {/* Metadata & Seal Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 sm:pt-6 border-t border-[#E8DEC8] items-center text-center text-xs">
              <div className="order-2 sm:order-1">
                <p className="font-mono font-bold text-[#111111]">{today}</p>
                <p className="text-[10px] text-[#777777] uppercase font-mono">DATE OF ISSUANCE</p>
              </div>

              {/* Red Digital Seal */}
              <div className="order-1 sm:order-2 flex flex-col items-center justify-center">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-[#B42318] bg-[#FDF2F2] flex flex-col items-center justify-center text-center p-1 shadow-sm">
                  <CheckCircle2 size={16} className="text-[#B42318]" />
                  <span className="text-[7px] sm:text-[8px] font-black uppercase text-[#B42318] font-mono leading-tight">
                    OFFICIAL SEAL
                  </span>
                </div>
              </div>

              <div className="order-3">
                <p className="font-mono font-bold text-[#111111] truncate">{certId}</p>
                <p className="text-[10px] text-[#777777] uppercase font-mono">CREDENTIAL ID</p>
              </div>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-4 sm:gap-8 pt-4 max-w-sm mx-auto text-center border-t border-[#F0EBE1]">
              <div>
                <p className="font-serif italic text-xs sm:text-sm font-bold text-[#111111]">Guru Mandali</p>
                <p className="text-[8px] sm:text-[9px] font-mono text-[#777777] uppercase">Lineage Academic Council</p>
              </div>
              <div>
                <p className="font-serif italic text-xs sm:text-sm font-bold text-[#111111]">Directorate</p>
                <p className="text-[8px] sm:text-[9px] font-mono text-[#777777] uppercase">Rhythm of India</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Action Buttons ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 print:hidden"
      >
        <button
          onClick={() => router.push("/dashboard")}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#EFE7DA] hover:bg-[#E8DEC8] text-[#111111] font-bold text-xs rounded-full transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span>Return to Dashboard</span>
        </button>

        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#B42318] hover:bg-[#C92A1E] text-white font-black uppercase tracking-wider text-xs rounded-full transition-all duration-300 hover:scale-105 active:scale-95 shadow-xl shadow-[#B42318]/30 cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        >
          {downloading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download size={16} />
              <span>Download Official PDF</span>
            </>
          )}
        </button>
      </motion.div>

      {/* ── Edit Student Name Modal ── */}
      {isEditingName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-[#E8DEC8] rounded-[28px] max-w-md w-full p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between border-b border-[#E8DEC8] pb-3">
              <div className="flex items-center gap-2">
                <UserCheck size={18} className="text-[#B42318]" />
                <h3 className="font-mono font-black uppercase text-sm text-[#111111]">
                  Edit Certificate Name
                </h3>
              </div>
              <button
                onClick={() => setIsEditingName(false)}
                className="p-1 rounded-full text-gray-400 hover:text-[#111111] hover:bg-[#EFE7DA] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveName} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#777777] uppercase font-mono mb-1.5">
                  Student Full Name:
                </label>
                <input
                  type="text"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  placeholder="e.g. Yash Chowdhury"
                  autoFocus
                  className="w-full px-4 py-3 bg-[#F8F1E6] border border-[#E8DEC8] rounded-xl text-sm font-bold text-[#111111] focus:outline-none focus:border-[#B42318]"
                />
                <p className="text-[11px] text-[#777777] mt-1.5">
                  This name will appear on your official certificate and downloaded PDF.
                </p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="flex-1 py-3 bg-[#EFE7DA] hover:bg-[#E8DEC8] text-[#111111] font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-[#B42318] hover:bg-[#C92A1E] text-white font-black uppercase text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Save Name
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </main>
  );
}

export default function CertificatePage() {
  return (
    <div className="min-h-screen bg-[#F8F1E6] text-[#111111] selection:bg-[#B42318] selection:text-white">
      <Navbar />
      <Suspense
        fallback={
          <div className="h-screen flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-[#B42318] border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <CertificateContent />
      </Suspense>
    </div>
  );
}
