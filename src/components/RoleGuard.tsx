"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types/auth";

interface RoleGuardProps {
  allowedRole: UserRole;
  children: ReactNode;
}

export default function RoleGuard({
  allowedRole,
  children,
}: RoleGuardProps) {
  const { user, role, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace(`/${allowedRole}/login`);
      return;
    }

    if (role !== allowedRole) {
      if (role === "admin") {
        router.replace("/admin/dashboard");
      } else if (role === "tutor") {
        router.replace("/tutor/dashboard");
      } else {
        router.replace("/dashboard");
      }
    }
  }, [user, role, loading, allowedRole, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F1E6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#B42318] border-t-transparent rounded-full animate-spin mx-auto mb-4" />

          <p className="font-mono text-sm font-bold tracking-wider text-[#111111]">
            LOADING RHYTHM OF INDIA...
          </p>
        </div>
      </div>
    );
  }

  if (!user || role !== allowedRole) {
    return (
      <div className="min-h-screen bg-[#F8F1E6] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#B42318] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-sm font-bold">
            Checking permissions...
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}