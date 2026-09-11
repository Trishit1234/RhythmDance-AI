"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import {
  Check,
  ShieldCheck,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

type PlanId = "monthly" | "yearly" | "lifetime";

interface Plan {
  id: PlanId;
  label: string;
  subtitle: string;
  tag: string;
  saveBadge?: string;
  priceINR: number;
  period: string;
  highlight: boolean;
  parentIncludedText?: string;
  features: string[];
}

const plans: Plan[] = [
  {
    id: "monthly",
    label: "Monthly",
    subtitle: "Start learning — pay as you learn, cancel anytime.",
    tag: "Flexible",
    priceINR: 199,
    period: "/ Monthly",
    highlight: false,
    features: [
      "Access to all 8 classical dance forms",
      "Real-time AI Dance Practice Studio",
      "HD video masterclasses & mudra drills",
      "Interactive knowledge quiz modules",
      "Instant progress tracking dashboard",
      "Basic certificate on completion",
    ],
  },
  {
    id: "yearly",
    label: "Yearly Pro",
    subtitle: "Best value for dedicated dancers & scholars.",
    tag: "Most Popular",
    saveBadge: "SAVE 58%",
    priceINR: 999,
    period: "/ Yearly",
    highlight: true,
    parentIncludedText: "Monthly package included +:",
    features: [
      "Everything in Monthly plan",
      "Save 58% compared to monthly (₹2,388 value)",
      "Unlimited AI Pose Accuracy assessments",
      "Cultural Natya Shastra research library",
      "Priority verified diploma generation",
      "Offline downloadable lesson summaries",
      "Early access to newly released dance forms",
    ],
  },
  {
    id: "lifetime",
    label: "Lifetime Heritage",
    subtitle: "One payment, lifetime access forever.",
    tag: "Lifetime Access",
    priceINR: 2499,
    period: "/ One-time",
    highlight: false,
    parentIncludedText: "Yearly package included +:",
    features: [
      "Lifetime access — zero renewals forever",
      "All future dance forms & masterclasses",
      "Gold-seal authenticated accredited diploma",
      "1-on-1 virtual guru consultation session",
      "Exclusive classical scholar community access",
      "Direct instructor Q&A forum privileges",
    ],
  },
];

export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  flag: string;
  rate: number;
}

export const currencies: CurrencyOption[] = [
  { code: "INR", symbol: "₹", name: "India (INR)", flag: "🇮🇳", rate: 1 },
  { code: "USD", symbol: "$", name: "United States (USD)", flag: "🇺🇸", rate: 0.012 },
  { code: "EUR", symbol: "€", name: "Eurozone (EUR)", flag: "🇪🇺", rate: 0.011 },
  { code: "GBP", symbol: "£", name: "United Kingdom (GBP)", flag: "🇬🇧", rate: 0.0095 },
  { code: "CAD", symbol: "CA$", name: "Canada (CAD)", flag: "🇨🇦", rate: 0.016 },
  { code: "AUD", symbol: "A$", name: "Australia (AUD)", flag: "🇦🇺", rate: 0.018 },
  { code: "AED", symbol: "AED ", name: "UAE (AED)", flag: "🇦🇪", rate: 0.044 },
  { code: "SGD", symbol: "S$", name: "Singapore (SGD)", flag: "🇸🇬", rate: 0.016 },
  { code: "JPY", symbol: "¥", name: "Japan (JPY)", flag: "🇯🇵", rate: 1.8 },
  { code: "MYR", symbol: "RM ", name: "Malaysia (MYR)", flag: "🇲🇾", rate: 0.053 },
];

export default function PricingPage() {
  const router = useRouter();
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyOption>(currencies[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getPrice = (inrPrice: number) => {
    const converted = inrPrice * selectedCurrency.rate;
    if (selectedCurrency.code === "INR" || selectedCurrency.code === "JPY") {
      return Math.round(converted).toLocaleString("en-IN");
    }
    return converted.toFixed(2);
  };

  const handleCheckout = (planId: PlanId) => {
    router.push(`/checkout?plan=${planId}&currency=${selectedCurrency.code}`);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#111111] selection:bg-[#B42318] selection:text-white relative overflow-hidden">
      {/* Background Architectural Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] pointer-events-none" />

      <Navbar />

      <main className="pt-28 sm:pt-32 pb-24 px-4 sm:px-8 max-w-6xl mx-auto space-y-10 relative z-10">
        {/* Top Header & Global Pay Dropdown Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 bg-white border border-neutral-200/80 shadow-xs rounded-full px-3.5 py-1 text-xs font-semibold text-neutral-700 mb-2">
              <span className="w-2 h-2 rounded-full bg-[#B42318] animate-pulse" />
              <span>GLOBAL HERITAGE ACCREDITATION</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-neutral-900 tracking-tight font-mono">
              Rhythm Pricing Plans
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600 max-w-xl mt-1">
              Select a flexible plan to master Indian classical dance traditions with real-time AI practice studio feedback.
            </p>
          </div>

          {/* Right-Aligned Global Pay Currency Dropdown */}
          <div className="relative self-start sm:self-center">
            <label className="text-[10px] font-bold font-mono text-neutral-500 uppercase block mb-1">
              Global Pay Currency:
            </label>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center gap-2.5 px-4 py-2.5 bg-white hover:bg-neutral-50 border border-neutral-200 rounded-2xl text-xs font-bold text-neutral-900 shadow-sm transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <span className="text-base leading-none">{selectedCurrency.flag}</span>
              <span className="font-mono font-black">{selectedCurrency.code} ({selectedCurrency.symbol.trim()})</span>
              <span className="text-neutral-400 text-[10px]">▼</span>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 max-h-72 overflow-y-auto bg-white border border-neutral-200 rounded-2xl shadow-2xl p-1.5 z-40 space-y-0.5">
                  <div className="px-3 py-1.5 text-[10px] font-bold font-mono text-neutral-400 uppercase border-b border-neutral-100 mb-1">
                    Select Global Currency
                  </div>
                  {currencies.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => {
                        setSelectedCurrency(c);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                        selectedCurrency.code === c.code
                          ? "bg-neutral-900 text-white font-bold"
                          : "text-neutral-700 hover:bg-neutral-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base leading-none">{c.flag}</span>
                        <span>{c.code}</span>
                      </div>
                      <span className={`font-mono text-xs ${selectedCurrency.code === c.code ? "text-neutral-300" : "text-neutral-500"}`}>
                        {c.symbol}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Pricing Cards Grid (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto items-stretch pt-4">
          {plans.map((plan, idx) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + idx * 0.08 }}
              className={`rounded-[32px] p-7 sm:p-8 flex flex-col justify-between relative transition-all duration-300 ${
                plan.highlight
                  ? "bg-white border-2 border-neutral-900 shadow-2xl scale-[1.03] z-20"
                  : "bg-white/90 backdrop-blur-xs border border-neutral-200/90 shadow-md hover:shadow-lg hover:border-neutral-300"
              }`}
            >
              {/* Floating Most Popular Badge on Center Card */}
              {plan.highlight && (
                <>
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[11px] font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-lg z-30 flex items-center gap-1.5">
                    <Sparkles size={11} className="text-yellow-300" />
                    <span>{plan.tag}</span>
                  </div>

                  {/* Soft Iridescent Glowing Mesh Accent in Top-Right */}
                  <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-purple-200/60 via-indigo-100/40 to-transparent rounded-tr-[30px] rounded-bl-full blur-xl pointer-events-none" />
                </>
              )}

              <div>
                {/* Header & Subtitle */}
                <div className="mb-5 relative z-10">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h3 className="text-2xl font-black text-neutral-900 tracking-tight">
                      {plan.label}
                    </h3>
                    {plan.saveBadge && (
                      <span className="bg-[#B42318]/10 text-[#B42318] border border-[#B42318]/25 text-[10px] font-mono font-black px-2 py-0.5 rounded-md uppercase">
                        {plan.saveBadge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 font-medium leading-snug">
                    {plan.subtitle}
                  </p>
                </div>

                {/* Price Display */}
                <div className="mb-6 pb-6 border-b border-neutral-100 relative z-10">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-4xl sm:text-5xl font-black text-neutral-900 font-mono tracking-tight">
                      {selectedCurrency.symbol}
                      {getPrice(plan.priceINR)}
                    </span>
                    <span className="text-xs font-semibold text-neutral-500 font-mono">
                      {plan.period}
                    </span>
                  </div>
                </div>

                {/* Parent inclusion label if applicable */}
                {plan.parentIncludedText && (
                  <p className="text-xs font-bold text-neutral-700 mb-3 font-mono">
                    {plan.parentIncludedText}
                  </p>
                )}

                {/* Feature List */}
                <ul className="space-y-3 mb-8 relative z-10">
                  {plan.features.map((feat, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-xs text-neutral-700 font-medium"
                    >
                      <div className="w-4 h-4 rounded-full bg-neutral-100 border border-neutral-200 flex items-center justify-center flex-shrink-0 mt-0.5 text-neutral-700">
                        <Check size={10} strokeWidth={3} />
                      </div>
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="relative z-10 pt-2">
                <button
                  onClick={() => handleCheckout(plan.id)}
                  className={`w-full py-3.5 rounded-full font-bold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 active:scale-95 ${
                    plan.highlight
                      ? "bg-neutral-900 hover:bg-neutral-800 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]"
                      : "bg-neutral-100 hover:bg-neutral-200 text-neutral-900 hover:scale-[1.02]"
                  }`}
                >
                  <span>Get Started</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Security / Quality Guarantee Footer */}
        <div className="max-w-xl mx-auto text-center space-y-2 pt-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-500">
            <ShieldCheck size={16} className="text-green-600" />
            <span>Secure 256-bit Encrypted Checkout · Cancel Anytime</span>
          </div>
          <p className="text-[11px] text-neutral-400">
            All plans include instant access to Indian classical dance modules, AI practice studio feedback, and verified diploma accreditations.
          </p>
        </div>
      </main>
    </div>
  );
}

