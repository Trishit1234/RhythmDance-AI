"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const { loginWithRole } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await loginWithRole(email.trim(), password, "admin");

      router.replace("/admin/dashboard");
    } catch (error: unknown) {
      console.error(error);

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Invalid admin credentials.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#111111] text-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-8 transition"
        >
          <ArrowLeft size={16} />
          Back to Rhythm of India
        </Link>

        <div className="bg-[#181818] border border-white/10 rounded-[28px] p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#B42318] flex items-center justify-center">
              <ShieldCheck size={32} />
            </div>
          </div>

          <div className="text-center mb-8">
            <p className="text-[#B42318] text-xs font-black tracking-[0.25em] mb-2">
              RHYTHM OF INDIA
            </p>

            <h1 className="text-3xl font-black font-mono uppercase">
              Admin Login
            </h1>

            <p className="text-white/50 text-sm mt-2">
              Authorized administrators only
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white/60">
                Admin Email
              </label>

              <div className="relative mt-2">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                />

                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@rhythmofindia.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-11 py-3.5 outline-none focus:border-[#B42318] transition"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-white/60">
                Password
              </label>

              <div className="relative mt-2">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30"
                />

                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-11 py-3.5 outline-none focus:border-[#B42318] transition"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#B42318] hover:bg-[#C92A1E] disabled:opacity-50 rounded-xl py-4 font-black uppercase tracking-wider transition"
            >
              {loading ? "Authenticating..." : "Enter Admin Panel"}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-white/30">
            This portal is restricted to authorized Rhythm of India
            administrators.
          </div>
        </div>
      </div>
    </main>
  );
}