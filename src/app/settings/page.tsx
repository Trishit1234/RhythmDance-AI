"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Moon, Sun, Bell, Shield, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [notifications, setNotifications] = useState(true);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === "light" ? "bg-[#F8F1E6] text-[#111111]" : "bg-[#111111] text-[#F8F1E6]"}`}>
      <Navbar />
      
      <main className="pt-32 pb-20 px-4 sm:px-6 max-w-3xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h1 className="text-3xl sm:text-5xl font-black uppercase font-mono tracking-tight">
            Settings
          </h1>
          <p className={`text-sm ${theme === "light" ? "text-[#777777]" : "text-gray-400"}`}>
            Manage your app preferences and profile settings.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className={`rounded-[32px] p-6 sm:p-10 border shadow-sm ${theme === "light" ? "bg-white border-[#E8DEC8]" : "bg-[#1A1A1A] border-[#333333]"}`}
        >
          <div className="space-y-8">
            
            {/* Theme Toggle */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest font-mono mb-4 flex items-center gap-2">
                <Sun size={16} className="text-[#B42318]" /> Appearance
              </h3>
              <div className="flex bg-[#EFE7DA] dark:bg-[#252525] rounded-xl p-1 w-full max-w-xs">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    theme === "light"
                      ? "bg-white text-[#111111] shadow-sm"
                      : "text-[#777777] hover:text-[#111111]"
                  }`}
                >
                  <Sun size={14} /> Light
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex-1 py-2.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                    theme === "dark"
                      ? "bg-[#111111] text-white shadow-sm"
                      : "text-[#777777] hover:text-[#111111]"
                  }`}
                >
                  <Moon size={14} /> Dark
                </button>
              </div>
            </div>

            <div className={`w-full h-px ${theme === "light" ? "bg-[#E8DEC8]" : "bg-[#333333]"}`} />

            {/* Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest font-mono mb-1 flex items-center gap-2">
                  <Bell size={16} className="text-[#B42318]" /> Notifications
                </h3>
                <p className={`text-xs ${theme === "light" ? "text-[#777777]" : "text-gray-400"}`}>
                  Receive updates about new courses and diplomas.
                </p>
              </div>
              <button 
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full transition-colors relative ${notifications ? "bg-[#B42318]" : "bg-gray-300 dark:bg-gray-600"}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${notifications ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </div>

            <div className={`w-full h-px ${theme === "light" ? "bg-[#E8DEC8]" : "bg-[#333333]"}`} />

            {/* Security */}
            <div>
              <h3 className="text-sm font-black uppercase tracking-widest font-mono mb-1 flex items-center gap-2">
                <Shield size={16} className="text-[#B42318]" /> Security & Privacy
              </h3>
              <p className={`text-xs mb-4 ${theme === "light" ? "text-[#777777]" : "text-gray-400"}`}>
                Manage your account security and data privacy settings.
              </p>
              <button className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${theme === "light" ? "bg-[#EFE7DA] hover:bg-[#E8DEC8] text-[#111111]" : "bg-[#252525] hover:bg-[#333333] text-white"}`}>
                Change Password
              </button>
            </div>

          </div>
        </motion.div>
      </main>
    </div>
  );
}
