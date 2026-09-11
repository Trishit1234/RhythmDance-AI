"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { Bell, Sparkles, Tag, ArrowRight, CheckCircle2 } from "lucide-react";

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F8F1E6]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#B42318] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#111111] font-bold font-mono text-sm tracking-wider animate-pulse">
            LOADING NOTIFICATIONS...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F1E6] text-[#111111] selection:bg-[#B42318] selection:text-white">
      <Navbar />

      <main className="pt-24 pb-20 px-4 sm:px-8 max-w-3xl mx-auto space-y-10">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#E8DEC8] pb-6">
          <div className="w-12 h-12 rounded-full bg-[#111111] text-white flex items-center justify-center">
            <Bell size={20} />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase font-mono tracking-tight text-[#111111]">
              Notifications
            </h1>
            <p className="text-sm font-medium text-[#777777]">
              Updates, announcements, and exclusive offers.
            </p>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-6">
          
          {/* Welcome & Discount Notification (Unread state) */}
          <div className="relative overflow-hidden rounded-[24px] bg-white border border-[#B42318]/20 shadow-xl shadow-[#B42318]/5 group hover:border-[#B42318]/40 transition-colors">
            {/* Unread dot */}
            <div className="absolute top-6 right-6 w-3 h-3 rounded-full bg-[#B42318] animate-pulse" />
            
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
              <div className="w-14 h-14 rounded-2xl bg-[#B42318]/10 text-[#B42318] flex items-center justify-center flex-shrink-0">
                <Sparkles size={28} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs font-bold text-[#B42318] uppercase tracking-widest font-mono mb-2">
                  <span>SPECIAL OFFER</span>
                  <span>·</span>
                  <span>Just now</span>
                </div>
                
                <h2 className="text-2xl font-black text-[#111111] uppercase tracking-tight font-mono mb-3">
                  Welcome to Rhythm of India!
                </h2>
                
                <p className="text-[#252525] font-medium leading-relaxed mb-6">
                  We are thrilled to have you join our classical dance academy. To help you begin your journey, we are offering an exclusive <span className="font-bold text-[#B42318]">15% discount</span> on your first Lifetime Pass purchase.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-[#F8F1E6] p-4 rounded-xl border border-[#E8DEC8]">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-[#111111] text-[#F8F1E6] flex items-center justify-center">
                      <Tag size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-[#777777] uppercase tracking-wider font-mono">Use Code at Checkout</p>
                      <p className="text-lg font-black text-[#111111] font-mono tracking-tight">WELCOME15</p>
                    </div>
                  </div>
                  
                  <Link 
                    href="/pricing"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#B42318] hover:bg-[#C92A1E] text-white px-6 py-3 rounded-full text-xs font-bold transition-all shadow-md shadow-[#B42318]/20"
                  >
                    <span>Claim Offer Now</span>
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Previous Notification (Read state) */}
          <div className="relative overflow-hidden rounded-[24px] bg-white border border-[#E8DEC8] opacity-75 hover:opacity-100 transition-opacity">
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row gap-6">
              <div className="w-14 h-14 rounded-2xl bg-[#EFE7DA] text-[#777777] flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={28} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs font-bold text-[#777777] uppercase tracking-widest font-mono mb-2">
                  <span>ACCOUNT</span>
                  <span>·</span>
                  <span>1 day ago</span>
                </div>
                
                <h2 className="text-xl font-black text-[#111111] uppercase tracking-tight font-mono mb-2">
                  Account successfully created
                </h2>
                
                <p className="text-[#555555] font-medium leading-relaxed">
                  Your Rhythm of India account has been verified and is ready to use. You can now access all free lessons and track your progress across different dance forms.
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
