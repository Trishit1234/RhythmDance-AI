"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Search,
  Bell,
  LogOut,
  User as UserIcon,
  CreditCard,
  Award,
  BookOpen,
  ChevronDown,
  Menu,
  X,
  Sparkles,
  Settings,
  MessageCircle,
} from "lucide-react";

interface NavbarProps {
  onSearch?: (query: string) => void;
}

export default function Navbar({ onSearch }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [customName, setCustomName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setProfileOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const handleLogout = useCallback(async () => {
    setProfileOpen(false);
    setMobileMenuOpen(false);
    await logout();
    router.push("/");
  }, [logout, router]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (onSearch) {
      onSearch(value);
    }
  };

  const loadProfile = useCallback(() => {
    try {
      const stored = localStorage.getItem("roi_user_profile");

      if (stored) {
        const data = JSON.parse(stored);

        if (data.name) {
          setCustomName(data.name);
        }

        if (data.avatarUrl) {
          setAvatarUrl(data.avatarUrl);
        }
      }
    } catch {
      // Ignore invalid local profile data.
    }
  }, []);

  useEffect(() => {
    loadProfile();

    window.addEventListener("roi_profile_updated", loadProfile);

    return () => {
      window.removeEventListener("roi_profile_updated", loadProfile);
    };
  }, [loadProfile]);

  const defaultName = user?.isAnonymous
    ? "Guest Explorer"
    : user?.email?.split("@")[0] || "Dancer";

  const displayName = customName || defaultName;
  const userInitial = displayName.trim().charAt(0).toUpperCase() || "U";

  const isHomeActive =
    pathname === "/dashboard" || pathname === "/";

  const isLessonsActive =
    pathname.startsWith("/learning") ||
    pathname.startsWith("/dance");

  const isPricingActive =
    pathname.startsWith("/pricing");

  const isCertificateActive =
    pathname.startsWith("/certificate");

  const isReviewsActive =
    pathname.startsWith("/reviews");

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#F8F1E6]/95 backdrop-blur-md border-b border-[#E8DEC8] transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-8 py-2.5">

        {/* LEFT — LOGO + SEARCH */}
        <div className="flex items-center gap-4 lg:gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-[#111111] text-[#F8F1E6] flex items-center justify-center font-black text-sm tracking-tighter group-hover:bg-[#B42318] transition-colors">
              ♫
            </div>

            <div className="flex flex-col">
              <span className="text-sm font-black tracking-tight text-[#111111] uppercase font-mono">
                RHYTHM
              </span>

              <span className="text-[10px] font-bold tracking-widest text-[#B42318] -mt-1 uppercase">
                OF INDIA
              </span>
            </div>
          </Link>

          {/* DESKTOP SEARCH */}
          <div className="hidden md:flex items-center bg-[#EFE7DA] border border-[#E8DEC8] rounded-full px-3.5 py-1.5 w-48 lg:w-64 focus-within:w-72 focus-within:border-[#B42318] focus-within:bg-white transition-all duration-300">
            <Search
              size={14}
              className="text-[#777777] mr-2 flex-shrink-0"
            />

            <input
              type="text"
              placeholder="Search dance, lessons..."
              value={searchQuery}
              onChange={handleSearchChange}
              aria-label="Search courses and lessons"
              className="bg-transparent text-xs text-[#111111] placeholder-[#777777] outline-none w-full font-medium"
            />
          </div>
        </div>

        {/* DESKTOP NAVIGATION */}
        <nav className="hidden md:flex items-center gap-6 lg:gap-7 text-xs font-bold tracking-wide text-[#252525]">

          <Link
            href="/dashboard"
            className={`relative py-1 transition-colors hover:text-[#111111] flex flex-col items-center ${
              isHomeActive
                ? "text-[#111111]"
                : "text-[#777777]"
            }`}
          >
            <span>Home</span>

            {isHomeActive && (
              <span className="absolute -bottom-1 h-0.5 w-5 rounded-full bg-[#B42318]" />
            )}
          </Link>

          <Link
            href="/learning"
            className={`relative py-1 transition-colors hover:text-[#111111] flex flex-col items-center ${
              isLessonsActive
                ? "text-[#111111]"
                : "text-[#777777]"
            }`}
          >
            <span>My Learning</span>

            {isLessonsActive && (
              <span className="absolute -bottom-1 h-0.5 w-5 rounded-full bg-[#B42318]" />
            )}
          </Link>

          <Link
            href="/dashboard#classical-forms"
            className="relative py-1 transition-colors hover:text-[#111111] text-[#777777] flex flex-col items-center"
          >
            <span>Classical Dances</span>
          </Link>

          <Link
            href="/certificate"
            className={`relative py-1 transition-colors hover:text-[#111111] flex flex-col items-center ${
              isCertificateActive
                ? "text-[#111111]"
                : "text-[#777777]"
            }`}
          >
            <span>Certificates</span>

            {isCertificateActive && (
              <span className="absolute -bottom-1 h-0.5 w-5 rounded-full bg-[#B42318]" />
            )}
          </Link>

          <Link
            href="/pricing"
            className={`relative py-1 transition-colors hover:text-[#111111] flex flex-col items-center ${
              isPricingActive
                ? "text-[#111111]"
                : "text-[#777777]"
            }`}
          >
            <span>Pricing</span>

            {isPricingActive && (
              <span className="absolute -bottom-1 h-0.5 w-5 rounded-full bg-[#B42318]" />
            )}
          </Link>

          {/* REVIEWS */}
          <Link
            href="/reviews"
            className={`relative py-1 transition-colors hover:text-[#111111] flex flex-col items-center ${
              isReviewsActive
                ? "text-[#111111]"
                : "text-[#777777]"
            }`}
          >
            <span>Reviews</span>

            {isReviewsActive && (
              <span className="absolute -bottom-1 h-0.5 w-5 rounded-full bg-[#B42318]" />
            )}
          </Link>
        </nav>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2.5 sm:gap-3">

          {/* NOTIFICATIONS */}
          <button
            onClick={() => router.push("/notifications")}
            className="p-2 text-[#252525] hover:text-[#B42318] rounded-full hover:bg-[#EFE7DA] transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={16} />

            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#B42318] rounded-full animate-pulse" />
          </button>

          {/* USER */}
          {user ? (
            <div
              className="relative"
              ref={profileRef}
            >
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                aria-label="User profile"
                aria-expanded={profileOpen}
                className="flex items-center gap-1.5 cursor-pointer group"
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-[#111111] text-white flex items-center justify-center text-base sm:text-lg font-black uppercase ring-2 ring-transparent group-hover:ring-[#B42318] transition-all shadow-md overflow-hidden">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    userInitial
                  )}
                </div>

                <ChevronDown
                  size={14}
                  className="text-[#777777] group-hover:text-[#111111] transition-colors hidden sm:block"
                />
              </button>

              {/* PROFILE DROPDOWN */}
              {profileOpen && (
                <div className="absolute right-0 mt-2.5 w-60 bg-white border border-[#E8DEC8] rounded-2xl shadow-2xl p-2 z-50 animate-fade-slide-up">

                  {/* USER IDENTITY */}
                  <div className="p-3.5 bg-[#F8F1E6] rounded-xl mb-1.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#111111] text-white flex items-center justify-center text-base font-black uppercase flex-shrink-0 overflow-hidden">
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          userInitial
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-black text-[#111111] truncate capitalize">
                          {displayName}
                        </p>

                        <p className="text-[10px] text-[#777777] truncate">
                          {user.email || "guest@rhythmofindia.org"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 inline-flex items-center gap-1 bg-[#B42318]/10 text-[#B42318] px-2 py-0.5 rounded-md text-[10px] font-bold">
                      <Sparkles size={10} />
                      Classical Scholar
                    </div>
                  </div>

                  {/* PROFILE MENU */}
                  <Link
                    href="/profile"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-[#252525] hover:bg-[#F8F1E6] rounded-lg transition-colors"
                  >
                    <UserIcon
                      size={14}
                      className="text-[#B42318]"
                    />
                    My Profile
                  </Link>

                  <Link
                    href="/learning"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-[#252525] hover:bg-[#F8F1E6] rounded-lg transition-colors"
                  >
                    <BookOpen
                      size={14}
                      className="text-[#B42318]"
                    />
                    My Learning
                  </Link>

                  <Link
                    href="/certificate"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-[#252525] hover:bg-[#F8F1E6] rounded-lg transition-colors"
                  >
                    <Award
                      size={14}
                      className="text-[#B42318]"
                    />
                    Certificates
                  </Link>

                  <Link
                    href="/reviews"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-[#252525] hover:bg-[#F8F1E6] rounded-lg transition-colors"
                  >
                    <MessageCircle
                      size={14}
                      className="text-[#B42318]"
                    />
                    Reviews
                  </Link>

                  <Link
                    href="/subscription"
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-[#252525] hover:bg-[#F8F1E6] rounded-lg transition-colors"
                  >
                    <CreditCard
                      size={14}
                      className="text-[#B42318]"
                    />
                    My Subscription
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-[#252525] hover:bg-[#F8F1E6] rounded-lg transition-colors cursor-pointer"
                  >
                    <Settings
                      size={14}
                      className="text-[#B42318]"
                    />
                    Settings
                  </Link>

                  <div className="my-1.5 border-t border-[#E8DEC8]" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-[#B42318] hover:bg-[#FDF2F2] rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/"
              className="bg-[#B42318] hover:bg-[#C92A1E] text-white px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm"
            >
              Sign In
            </Link>
          )}

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 text-[#111111] hover:bg-[#EFE7DA] rounded-lg transition-colors"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X size={20} />
            ) : (
              <Menu size={20} />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#F8F1E6] border-b border-[#E8DEC8] px-4 py-4 space-y-3 animate-fade-slide-up">

          {/* MOBILE SEARCH */}
          <div className="flex items-center bg-[#EFE7DA] border border-[#E8DEC8] rounded-full px-3 py-2">
            <Search
              size={14}
              className="text-[#777777] mr-2"
            />

            <input
              type="text"
              placeholder="Search dance, lessons..."
              value={searchQuery}
              onChange={handleSearchChange}
              aria-label="Search courses and lessons"
              className="bg-transparent text-xs text-[#111111] placeholder-[#777777] outline-none w-full font-medium"
            />
          </div>

          {/* MOBILE NAVIGATION */}
          <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-bold">

            <Link
              href="/dashboard"
              onClick={closeMobileMenu}
              className={`p-3 rounded-xl text-center border ${
                isHomeActive
                  ? "bg-[#111111] text-white border-[#111111]"
                  : "bg-white text-[#252525] border-[#E8DEC8]"
              }`}
            >
              Home
            </Link>

            <Link
              href="/learning"
              onClick={closeMobileMenu}
              className={`p-3 rounded-xl text-center border ${
                isLessonsActive
                  ? "bg-[#111111] text-white border-[#111111]"
                  : "bg-white text-[#252525] border-[#E8DEC8]"
              }`}
            >
              My Learning
            </Link>

            <Link
              href="/dashboard#classical-forms"
              onClick={closeMobileMenu}
              className="p-3 bg-white rounded-xl text-center border border-[#E8DEC8]"
            >
              Classical Dances
            </Link>

            <Link
              href="/pricing"
              onClick={closeMobileMenu}
              className={`p-3 rounded-xl text-center border ${
                isPricingActive
                  ? "bg-[#111111] text-white border-[#111111]"
                  : "bg-white text-[#252525] border-[#E8DEC8]"
              }`}
            >
              Pricing
            </Link>

            <Link
              href="/certificate"
              onClick={closeMobileMenu}
              className={`p-3 rounded-xl text-center border ${
                isCertificateActive
                  ? "bg-[#111111] text-white border-[#111111]"
                  : "bg-white text-[#252525] border-[#E8DEC8]"
              }`}
            >
              Certificates
            </Link>

            <Link
              href="/reviews"
              onClick={closeMobileMenu}
              className={`p-3 rounded-xl text-center border ${
                isReviewsActive
                  ? "bg-[#B42318] text-white border-[#B42318]"
                  : "bg-white text-[#252525] border-[#E8DEC8]"
              }`}
            >
              Reviews
            </Link>
          </div>

          {/* MOBILE LOGOUT */}
          {user && (
            <button
              onClick={handleLogout}
              className="w-full p-3 bg-[#FDF2F2] text-[#B42318] rounded-xl text-center border border-red-200 text-xs font-bold"
            >
              Logout
            </button>
          )}
        </div>
      )}
    </header>
  );
}
