"use client";

import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { User, Award, Shield, MapPin, Sparkles, Edit2, Check, Upload, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";

export default function ProfilePage() {
  const { user } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [customName, setCustomName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("roi_user_profile");
      if (stored) {
        const data = JSON.parse(stored);
        if (data.name) setCustomName(data.name);
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl);
        if (data.bannerUrl) setBannerUrl(data.bannerUrl);
      }
    } catch(e) {}
  }, []);

  const handleSave = () => {
    localStorage.setItem("roi_user_profile", JSON.stringify({
      name: customName,
      avatarUrl,
      bannerUrl
    }));
    // Dispatch a custom event to notify other components (like Navbar)
    window.dispatchEvent(new Event('roi_profile_updated'));
    setIsEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (type === 'avatar') setAvatarUrl(result);
      if (type === 'banner') setBannerUrl(result);
    };
    reader.readAsDataURL(file);
  };
  
  const defaultName = user?.isAnonymous
    ? "Guest Explorer"
    : user?.email?.split("@")[0] || "Classical Scholar";
    
  const displayName = customName || defaultName;
  const userInitial = displayName.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-[#F8F1E6] text-[#111111] selection:bg-[#B42318] selection:text-white">
      <Navbar />
      
      <main className="pt-32 pb-20 px-4 sm:px-6 max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-end max-w-2xl mx-auto"
        >
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-black uppercase text-[#111111] font-mono tracking-tight">
              My Profile
            </h1>
            <p className="text-sm text-[#777777]">Manage your scholar identity</p>
          </div>
          <button 
            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase transition-all shadow-sm ${isEditing ? 'bg-[#111111] text-white hover:bg-[#222]' : 'bg-white border border-[#E8DEC8] hover:bg-[#EFE7DA]'}`}
          >
            {isEditing ? <><Check size={14} /> Save</> : <><Edit2 size={14} /> Edit</>}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-[32px] border border-[#E8DEC8] shadow-sm max-w-2xl mx-auto overflow-hidden relative"
        >
          {/* Banner */}
          <div className="relative h-48 bg-[#EFE7DA] border-b border-[#E8DEC8] flex items-center justify-center overflow-hidden">
            {bannerUrl ? (
              <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
            ) : (
              <div className="text-[#B42318]/20 flex items-center justify-center w-full h-full">
                <ImageIcon size={64} />
              </div>
            )}
            
            {isEditing && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                <input type="file" accept="image/*" className="hidden" ref={bannerInputRef} onChange={(e) => handleFileChange(e, 'banner')} />
                <button onClick={() => bannerInputRef.current?.click()} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white border border-white/40 px-4 py-2 rounded-full text-xs font-bold uppercase transition-colors">
                  <Upload size={14} /> Update Banner
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center px-8 pb-12">
            {/* Avatar */}
            <div className="relative -mt-16 mb-4">
              <div className="w-32 h-32 rounded-full bg-[#111111] text-white flex items-center justify-center text-5xl font-black uppercase shadow-xl border-4 border-white overflow-hidden">
                {avatarUrl ? (
                   <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                   userInitial
                )}
              </div>
              
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-[1px] cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <input type="file" accept="image/*" className="hidden" ref={avatarInputRef} onChange={(e) => handleFileChange(e, 'avatar')} />
                  <Upload size={20} className="text-white" />
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="text-center space-y-1 w-full">
              {isEditing ? (
                <input 
                  type="text"
                  value={customName || defaultName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="text-2xl font-black text-center text-[#111111] font-mono border-b-2 border-[#B42318] outline-none bg-transparent w-full max-w-xs mx-auto mb-2 px-2 py-1"
                  placeholder="Your Name"
                />
              ) : (
                <h2 className="text-2xl font-black capitalize text-[#111111] font-mono">
                  {displayName}
                </h2>
              )}
              
              <p className="text-sm text-[#777777]">
                {user?.email || "guest@rhythmofindia.org"}
              </p>
              
              <div className="pt-3 flex items-center justify-center gap-2">
                <span className="inline-flex items-center gap-1.5 bg-[#B42318]/10 text-[#B42318] px-3 py-1 rounded-full text-xs font-bold">
                  <Sparkles size={12} />
                  Classical Scholar
                </span>
                <span className="inline-flex items-center gap-1.5 bg-[#EFE7DA] text-[#777777] px-3 py-1 rounded-full text-xs font-bold">
                  <MapPin size={12} />
                  India
                </span>
              </div>
            </div>
            
            <div className="w-full h-px bg-[#E8DEC8] my-8" />
            
            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 w-full text-center">
              <div className="p-4 bg-[#F8F1E6] rounded-2xl border border-[#E8DEC8]">
                <Shield size={24} className="text-[#B42318] mx-auto mb-2" />
                <p className="text-2xl font-black font-mono">0</p>
                <p className="text-[10px] font-bold text-[#777777] uppercase tracking-wider">Lessons Finished</p>
              </div>
              <div className="p-4 bg-[#F8F1E6] rounded-2xl border border-[#E8DEC8]">
                <Award size={24} className="text-[#B42318] mx-auto mb-2" />
                <p className="text-2xl font-black font-mono">0</p>
                <p className="text-[10px] font-bold text-[#777777] uppercase tracking-wider">Certificates</p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
