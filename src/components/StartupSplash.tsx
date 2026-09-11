"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

const DANCES = [
  "BHARATANATYAM",
  "KATHAK",
  "KATHAKALI",
  "KUCHIPUDI",
  "ODISSI",
  "MANIPURI",
  "MOHINIYATTAM",
  "SATTRIYA",
];

export default function StartupSplash({ children }: { children: React.ReactNode }) {
  const { loading: authLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);
  const [sequenceStep, setSequenceStep] = useState<"init" | "dances" | "final">("init");
  const [currentDanceIndex, setCurrentDanceIndex] = useState(0);
  const shouldReduceMotion = useReducedMotion();
  
  // Track if min duration has passed
  const [minDurationMet, setMinDurationMet] = useState(false);

  useEffect(() => {
    // Check session storage to see if we've already shown the splash
    const hasSeenSplash = sessionStorage.getItem("hasSeenSplash");
    
    if (hasSeenSplash) {
      setShowSplash(false);
      return;
    }

    // Sequence timing
    let timer1: NodeJS.Timeout;
    let timer2: NodeJS.Timeout;
    let danceInterval: NodeJS.Timeout;

    if (shouldReduceMotion) {
      // Very fast transition if reduced motion
      timer1 = setTimeout(() => {
        setMinDurationMet(true);
        sessionStorage.setItem("hasSeenSplash", "true");
      }, 500);
    } else {
      // Normal cinematic sequence
      // 1. Initial "RHYTHM OF INDIA" briefly
      timer1 = setTimeout(() => {
        setSequenceStep("dances");
        
        // 2. Rapid dance reveal
        let index = 0;
        danceInterval = setInterval(() => {
          index++;
          if (index < DANCES.length) {
            setCurrentDanceIndex(index);
          } else {
            clearInterval(danceInterval);
            setSequenceStep("final");
            
            // 3. Final reveal & minimum duration met
            timer2 = setTimeout(() => {
              setMinDurationMet(true);
              sessionStorage.setItem("hasSeenSplash", "true");
            }, 800); // Hold final reveal for 800ms
          }
        }, 120); // 120ms per dance
      }, 500); // 500ms initial logo hold
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearInterval(danceInterval);
    };
  }, [shouldReduceMotion]);

  // Dismiss splash only when auth is loaded AND minimum animation duration is met
  useEffect(() => {
    if (!authLoading && (minDurationMet || !showSplash)) {
      setShowSplash(false);
    }
  }, [authLoading, minDurationMet, showSplash]);

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[9999] bg-[#0A0A0A] flex flex-col items-center justify-center overflow-hidden"
          >
            {shouldReduceMotion ? (
              // Simplified reduced motion view
              <div className="flex flex-col items-center">
                <div className="text-3xl font-black tracking-tight text-white uppercase font-mono">
                  RHYTHM
                </div>
                <div className="text-sm font-bold tracking-widest text-[#B42318] uppercase mt-1">
                  OF INDIA
                </div>
              </div>
            ) : (
              // Full animation sequence
              <div className="relative w-full h-full flex flex-col items-center justify-center">
                {sequenceStep === "init" && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex flex-col items-center"
                  >
                    <div className="text-3xl md:text-5xl font-black tracking-tight text-white uppercase font-mono">
                      RHYTHM
                    </div>
                    <div className="text-sm md:text-xl font-bold tracking-widest text-[#B42318] uppercase mt-1">
                      OF INDIA
                    </div>
                  </motion.div>
                )}

                {sequenceStep === "dances" && (
                  <div className="flex items-center justify-center h-24">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={currentDanceIndex}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.1 }}
                        className="text-2xl md:text-4xl font-black tracking-widest text-gray-200 uppercase font-mono"
                      >
                        {DANCES[currentDanceIndex]}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                )}

                {sequenceStep === "final" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex flex-col items-center"
                  >
                    <div className="flex flex-col items-center mb-6">
                      <div className="text-4xl md:text-6xl font-black tracking-tight text-white uppercase font-mono">
                        RHYTHM
                      </div>
                      <div className="text-lg md:text-2xl font-bold tracking-widest text-[#B42318] uppercase mt-1">
                        OF INDIA
                      </div>
                    </div>
                    <div className="text-[10px] md:text-xs font-bold tracking-[0.3em] text-gray-400 uppercase font-mono">
                      LEARN · DISCOVER · PRESERVE
                    </div>
                  </motion.div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {/* 
        We render children immediately so that data fetching, image preloading, 
        and auth initialization happen underneath the splash screen.
        We only want to prevent interaction if splash is visible. 
      */}
      <div className={showSplash ? "pointer-events-none h-screen overflow-hidden" : ""}>
        {children}
      </div>
    </>
  );
}
