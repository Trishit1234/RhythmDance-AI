"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Typewriter from "@/components/Typewriter";
import { Mail, Lock, Eye, EyeOff, Sparkles, Users, ArrowRight } from "lucide-react";

export default function LandingPage() {
  const { user, loading, login, signup, guestLogin, googleLogin } = useAuth();
  const router = useRouter();

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message.replace("Firebase: ", "").replace(/\(auth\/.*\)/, "").trim());
    } finally {
      setSubmitting(false);
    }
  };

  const handleGuest = async () => {
    setError("");
    setSubmitting(true);
    try {
      await guestLogin();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setSubmitting(true);
    try {
      await googleLogin();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message.replace("Firebase: ", "").replace(/\(auth\/.*\)/, "").trim());
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8F1E6]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#B42318] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#111111] font-bold font-mono text-sm tracking-wider animate-pulse">
            LOADING RHYTHM OF INDIA...
          </p>
        </div>
      </div>
    );
  }

  if (user) return null;

  return (
    <section className="flex min-h-screen w-full flex-col lg:flex-row bg-[#F8F1E6] text-[#111111] selection:bg-[#B42318] selection:text-white">
      {/* ── Left Panel (Cinematic Classical Heritage Visual) ── */}
      <div
        className="relative flex-1 flex flex-col items-center justify-center px-6 py-16 lg:py-0 text-center min-h-[400px] lg:min-h-screen"
        style={{
          backgroundImage: `url('/images/landingpic.png')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Dark Editorial Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-black via-black/70 to-black/50" />

        <div className="relative z-10 max-w-lg space-y-6">
          {/* Micro badge */}
          <div className="inline-flex items-center gap-2 bg-black/60 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 text-xs font-bold text-[#F8F1E6]">
            <span className="w-2 h-2 rounded-full bg-[#B42318] animate-pulse" />
            <span>Classical Indian Dance Academy</span>
            <span className="text-[#B42318]">·</span>
            <span className="text-gray-300 font-mono">Est. 2026</span>
          </div>

          {/* Typewriter Title */}
          <div className="bg-black/70 backdrop-blur-md rounded-[32px] px-8 py-10 border border-white/10 shadow-2xl">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-tight uppercase font-mono tracking-tight">
              <Typewriter />
            </h1>
            <p className="mt-4 text-sm sm:text-base text-gray-300 font-medium tracking-wide">
              Sacred Movement • Classical Mudras • Certified Mastery
            </p>
          </div>

          {/* Dance Form Badges */}
          <div className="flex flex-wrap justify-center gap-2.5">
            {["Odissi", "Bharatanatyam", "Kathak", "Kuchipudi"].map((name) => (
              <span
                key={name}
                className="bg-black/50 backdrop-blur-md border border-white/15 rounded-full px-4 py-1 text-xs font-bold text-gray-200 hover:border-[#B42318] hover:text-white transition-colors"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel (Red & Cream Auth Gateway) ── */}
      <div className="flex-1 bg-[#F8F1E6] flex items-center justify-center px-6 py-12 lg:py-0">
        <div className="w-full max-w-md">
          {/* Auth Card */}
          <div className="bg-white rounded-[32px] shadow-xl p-8 sm:p-10 border border-[#E8DEC8]">
            {/* Toggle Tabs */}
            <div className="flex bg-[#EFE7DA] rounded-full p-1 mb-8 border border-[#E8DEC8]">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setError("");
                }}
                className={`flex-1 py-2.5 rounded-full text-xs font-black uppercase tracking-wider font-mono transition-all duration-300 cursor-pointer ${
                  isLogin
                    ? "bg-[#B42318] text-white shadow-md"
                    : "text-[#777777] hover:text-[#111111]"
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  setError("");
                }}
                className={`flex-1 py-2.5 rounded-full text-xs font-black uppercase tracking-wider font-mono transition-all duration-300 cursor-pointer ${
                  !isLogin
                    ? "bg-[#B42318] text-white shadow-md"
                    : "text-[#777777] hover:text-[#111111]"
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Heading */}
            <div className="text-center mb-6">
              <span className="text-[10px] font-black uppercase font-mono tracking-widest text-[#B42318] block mb-1">
                {isLogin ? "RETURNING SCHOLAR" : "NEW REGISTRATION"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-black uppercase text-[#111111] font-mono tracking-tight">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h2>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#777777]"
                />
                <input
                  id="authEmail"
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#F8F1E6]/50 border border-[#E8DEC8] focus:border-[#B42318] focus:bg-white outline-none text-xs font-medium transition-all text-[#111111]"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[#777777]"
                />
                <input
                  id="authPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-12 py-3 rounded-xl bg-[#F8F1E6]/50 border border-[#E8DEC8] focus:border-[#B42318] focus:bg-white outline-none text-xs font-medium transition-all text-[#111111]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#777777] hover:text-[#111111] cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Error message */}
              {error && (
                <p className="text-[#B42318] text-xs text-center font-bold bg-[#FDF2F2] rounded-xl p-3 border border-red-200">
                  {error}
                </p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className={`w-full py-3.5 rounded-full font-black uppercase tracking-wider text-xs text-white transition-all duration-300 shadow-lg cursor-pointer bg-[#B42318] hover:bg-[#C92A1E] ${
                  submitting
                    ? "opacity-60 cursor-not-allowed"
                    : "hover:scale-[1.02] active:scale-[0.98] shadow-[#B42318]/25"
                }`}
              >
                {submitting
                  ? "Authenticating..."
                  : isLogin
                  ? "Enter Academy →"
                  : "Begin Your Journey →"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-[#E8DEC8]" />
              <span className="text-[10px] text-[#777777] font-mono font-bold uppercase">
                OR CONTINUE WITH
              </span>
              <div className="flex-1 h-px bg-[#E8DEC8]" />
            </div>

            {/* Google Login */}
            <button
              onClick={handleGoogle}
              disabled={submitting}
              className="w-full mb-3 flex items-center justify-center gap-2.5 py-3 rounded-full font-bold text-xs bg-white text-[#111111] border border-[#E8DEC8] hover:bg-[#F8F1E6] hover:border-[#111111] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Guest Login */}
            <button
              onClick={handleGuest}
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full font-bold text-xs bg-[#EFE7DA] text-[#111111] border border-[#E8DEC8] hover:bg-[#E8DEC8] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <Users size={14} className="text-[#B42318]" />
              <span>Explore as Guest</span>
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-[11px] text-[#777777] mt-6 font-medium">
            Dedicated to Indian Classical Traditions · Rhythm of India Academy
          </p>
        </div>
      </div>
    </section>
  );
}
