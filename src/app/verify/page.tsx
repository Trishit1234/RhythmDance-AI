"use client";

import {
  useEffect,
  useState,
} from "react";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  CheckCircle2,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";

import Navbar from "@/components/Navbar";

import {
  doc,
  getDoc,
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

function VerifyContent() {
  const searchParams =
    useSearchParams();

  const initialId =
    searchParams.get("id") || "";

  const [credentialId, setCredentialId] =
    useState(initialId);

  const [certificate, setCertificate] =
    useState<CertificateRecord | null>(
      null
    );

  const [searched, setSearched] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const verifyCertificate =
    async () => {
      const id =
        credentialId.trim().toUpperCase();

      if (!id) return;

      setLoading(true);
      setSearched(true);
      setCertificate(null);

      try {
        const certificateRef =
          doc(
            db,
            "certificates",
            id
          );

        const snapshot =
          await getDoc(
            certificateRef
          );

        if (snapshot.exists()) {
          setCertificate(
            snapshot.data() as CertificateRecord
          );
        }
      } catch (error) {
        console.error(
          "Certificate verification failed:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    if (initialId) {
      verifyCertificate();
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F1E6] text-[#111111]">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-16">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-[#B42318] text-white flex items-center justify-center">
            <ShieldCheck size={30} />
          </div>

          <p className="mt-6 text-xs font-black tracking-[0.3em] text-[#B42318] font-mono">
            RHYTHM OF INDIA ACADEMY
          </p>

          <h1 className="mt-3 text-4xl sm:text-6xl font-black uppercase font-mono">
            Certificate Verification
          </h1>

          <p className="mt-4 text-sm text-gray-600 max-w-xl mx-auto">
            Enter a Rhythm of India credential ID
            to verify the authenticity of a
            certificate.
          </p>
        </div>

        <div className="mt-12 rounded-[32px] bg-white border border-[#E8DEC8] shadow-xl p-6 sm:p-8">
          <label className="block text-xs font-black uppercase tracking-widest font-mono text-gray-500">
            Credential ID
          </label>

          <div className="mt-3 flex flex-col sm:flex-row gap-3">
            <input
              value={credentialId}
              onChange={(event) =>
                setCredentialId(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter"
                ) {
                  verifyCertificate();
                }
              }}
              placeholder="ROI-26-ODI-4821"
              className="flex-1 rounded-2xl border border-[#E8DEC8] bg-[#F8F1E6] px-5 py-4 font-mono text-sm uppercase outline-none focus:border-[#B42318]"
            />

            <button
              onClick={
                verifyCertificate
              }
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#B42318] hover:bg-[#D4492F] text-white px-7 py-4 text-xs font-black uppercase tracking-wider"
            >
              <Search size={16} />
              {loading
                ? "Checking..."
                : "Verify"}
            </button>
          </div>
        </div>

        {searched && !loading && (
          <>
            {certificate ? (
              <div className="mt-8 rounded-[32px] bg-white border border-green-200 shadow-xl overflow-hidden">
                <div className="bg-green-600 text-white px-6 sm:px-8 py-5 flex items-center gap-3">
                  <CheckCircle2
                    size={24}
                  />

                  <div>
                    <p className="font-black uppercase font-mono">
                      Certificate Verified
                    </p>

                    <p className="text-xs text-green-100 mt-1">
                      This credential is valid.
                    </p>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">
                      Student
                    </p>

                    <p className="mt-1 text-2xl font-black">
                      {certificate.studentName}
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">
                        Course
                      </p>

                      <p className="mt-1 font-black">
                        {certificate.course}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">
                        Completion
                      </p>

                      <p className="mt-1 font-black text-green-600">
                        {certificate.completion}%
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">
                        Issued By
                      </p>

                      <p className="mt-1 font-black">
                        Rhythm of India Academy
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">
                        Credential ID
                      </p>

                      <p className="mt-1 font-mono font-black">
                        {certificate.credentialId}
                      </p>
                    </div>
                  </div>

                  <div className="pt-5 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      This certificate was issued
                      after successful completion of
                      the required course lessons.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-8 rounded-[32px] bg-white border border-red-200 shadow-xl p-8 text-center">
                <div className="mx-auto w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                  <XCircle size={28} />
                </div>

                <h2 className="mt-5 text-2xl font-black uppercase font-mono">
                  Certificate Not Found
                </h2>

                <p className="mt-3 text-sm text-gray-500">
                  We could not find a certificate
                  matching this credential ID.
                  Please check the ID and try again.
                </p>
              </div>
            )}
          </>
        )}

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-xs font-black uppercase tracking-widest text-[#B42318] hover:underline"
          >
            Back to Rhythm of India
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function VerifyPage() {
  return <VerifyContent />;
}