"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Check,
  ShieldCheck,
  CreditCard,
  Smartphone,
  Lock,
  RefreshCw,
  QrCode,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Copy,
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";

type PlanId = "monthly" | "yearly" | "lifetime";
type PaymentTab = "razorpay" | "qr";

declare global {
  interface Window {
    Razorpay?: new (
      options: RazorpayOptions
    ) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  handler: (
    response: RazorpaySuccessResponse
  ) => void | Promise<void>;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface Plan {
  id: PlanId;
  label: string;
  priceINR: number;
  period: string;
  features: string[];
}

const plans: Plan[] = [
  {
    id: "monthly",
    label: "Monthly Plan",
    priceINR: 199,
    period: "Month",
    features: [
      "Access to all classical dance courses",
      "Real-time AI Dance Practice Studio",
      "HD video lessons & tutorials",
      "Interactive quizzes after modules",
      "Progress tracking dashboard",
    ],
  },
  {
    id: "yearly",
    label: "Yearly Pro Plan",
    priceINR: 999,
    period: "Year",
    features: [
      "Everything in Monthly",
      "Save 58% compared to monthly",
      "Unlimited AI Pose assessments",
      "Priority certificate generation",
      "Offline lesson notes (PDF)",
    ],
  },
  {
    id: "lifetime",
    label: "Lifetime Heritage Plan",
    priceINR: 2499,
    period: "One-time",
    features: [
      "Everything in Yearly",
      "Lifetime access — zero renewals",
      "Gold-seal authenticated certificate",
      "1-on-1 virtual guru feedback session",
      "Exclusive premium community access",
    ],
  },
];

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const existing =
      document.querySelector<HTMLScriptElement>(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

    if (existing) {
      existing.addEventListener(
        "load",
        () => resolve(Boolean(window.Razorpay)),
        { once: true }
      );

      existing.addEventListener(
        "error",
        () => resolve(false),
        { once: true }
      );

      return;
    }

    const script = document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.onload = () => {
      resolve(Boolean(window.Razorpay));
    };

    script.onerror = () => {
      resolve(false);
    };

    document.body.appendChild(script);
  });
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const requestedPlan =
    searchParams.get("plan") as PlanId | null;

  const initialPlan: PlanId =
    requestedPlan &&
    plans.some((plan) => plan.id === requestedPlan)
      ? requestedPlan
      : "yearly";

  const [selectedPlan, setSelectedPlan] =
    useState<PlanId>(initialPlan);

  const [paymentTab, setPaymentTab] =
    useState<PaymentTab>("razorpay");

  const [billedTo, setBilledTo] = useState(
    user?.displayName || "Rhythm Learner"
  );

  const [processing, setProcessing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const activePlan = useMemo(
    () =>
      plans.find(
        (plan) => plan.id === selectedPlan
      ) || plans[1],
    [selectedPlan]
  );

  const upiId = "7980813490@ybl";

  useEffect(() => {
    if (
      user?.displayName &&
      billedTo === "Rhythm Learner"
    ) {
      setBilledTo(user.displayName);
    }
  }, [user?.displayName, billedTo]);

  useEffect(() => {
    loadRazorpayScript();
  }, []);

  useEffect(() => {
    setError(null);
    setCopied(false);
  }, [selectedPlan]);

  const saveSuccessfulPayment = (
    paymentId: string,
    method: string
  ) => {
    const now = new Date();

    const invoice = {
      id: `RZP-${paymentId}`,
      date: now.toLocaleDateString("en-IN"),
      plan: activePlan.label,
      amount: `₹${activePlan.priceINR.toLocaleString(
        "en-IN"
      )}`,
      method,
      merch: false,
      paymentId,
      status: "paid",
    };

    try {
      const stored = JSON.parse(
        localStorage.getItem("roi_invoices") ||
          "[]"
      );

      localStorage.setItem(
        "roi_invoices",
        JSON.stringify([
          invoice,
          ...stored,
        ])
      );

      const subscription = {
        planId: activePlan.id,
        plan: activePlan.label,
        status: "active",
        paymentId,
        activatedAt: now.toISOString(),
        expiresAt:
          activePlan.id === "lifetime"
            ? null
            : new Date(
                now.getTime() +
                  (activePlan.id === "monthly"
                    ? 30
                    : 365) *
                    24 *
                    60 *
                    60 *
                    1000
              ).toISOString(),
      };

      localStorage.setItem(
        "roi_subscription",
        JSON.stringify(subscription)
      );
    } catch {
      // Payment has already been verified server-side.
      // Local storage is only used for UI history.
    }
  };

  const completePayment = (
    paymentId: string,
    method: string
  ) => {
    saveSuccessfulPayment(
      paymentId,
      method
    );

    setProcessing(false);
    setSuccess(true);

    window.setTimeout(() => {
      router.push("/subscription");
    }, 1800);
  };

  const startRazorpayPayment = async () => {
    setError(null);
    setProcessing(true);

    try {
      const scriptReady =
        await loadRazorpayScript();

      if (
        !scriptReady ||
        !window.Razorpay
      ) {
        throw new Error(
          "Razorpay Checkout could not be loaded. Check your internet connection and try again."
        );
      }

      const orderResponse = await fetch(
        "/api/razorpay/create-order",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            planId: activePlan.id,
          }),
        }
      );

      const order =
        await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(
          order.error ||
            "Unable to create the Razorpay order."
        );
      }

      const razorpay =
        new window.Razorpay({
          key: order.keyId,
          amount: order.amount,
          currency: order.currency,
          name: "Rhythm of India",
          description:
            activePlan.label,
          order_id: order.orderId,

          prefill: {
            name:
              billedTo ||
              user?.displayName ||
              "Rhythm Learner",
            email:
              user?.email ||
              undefined,
          },

          notes: {
            plan_id: activePlan.id,
            product: "Rhythm of India",
          },

          theme: {
            color: "#B42318",
          },

          handler: async (
            response
          ) => {
            try {
              const verifyResponse =
                await fetch(
                  "/api/razorpay/verify",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type":
                        "application/json",
                    },
                    body: JSON.stringify({
                      planId:
                        activePlan.id,
                      razorpay_payment_id:
                        response.razorpay_payment_id,
                      razorpay_order_id:
                        response.razorpay_order_id,
                      razorpay_signature:
                        response.razorpay_signature,
                    }),
                  }
                );

              const verification =
                await verifyResponse.json();

              if (
                !verifyResponse.ok ||
                !verification.verified
              ) {
                throw new Error(
                  verification.error ||
                    "Payment verification failed."
                );
              }

              completePayment(
                response.razorpay_payment_id,
                "Razorpay Checkout"
              );
            } catch (
              verificationError
            ) {
              setProcessing(false);

              setError(
                verificationError instanceof
                  Error
                  ? verificationError.message
                  : "Payment was received but could not be verified. Please contact support before paying again."
              );
            }
          },

          modal: {
            ondismiss: () => {
              setProcessing(false);
            },
          },
        });

      razorpay.open();
    } catch (paymentError) {
      setProcessing(false);

      setError(
        paymentError instanceof Error
          ? paymentError.message
          : "Unable to start payment."
      );
    }
  };

  const copyUpiId = async () => {
    try {
      await navigator.clipboard.writeText(
        upiId
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      setCopied(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#F8F1E6] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 bg-[#111111] rounded-full flex items-center justify-center shadow-2xl mb-6 animate-pulse">
          <Check
            size={40}
            className="text-[#F8F1E6]"
          />
        </div>

        <p className="text-xs font-black uppercase tracking-[0.25em] text-[#B42318] mb-2">
          Payment verified
        </p>

        <h2 className="text-3xl sm:text-4xl font-black font-mono uppercase tracking-tight text-[#111111] mb-2">
          Welcome to Rhythm Pro
        </h2>

        <p className="text-[#777777]">
          Your access is being activated.
          Taking you to your subscription...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F1E6] text-[#111111] selection:bg-[#B42318] selection:text-white">
      <Navbar />

      <main className="pt-28 pb-20 px-4 max-w-6xl mx-auto">
        <div className="bg-white rounded-[32px] shadow-sm border border-[#E8DEC8] overflow-hidden">
          <div className="grid lg:grid-cols-2">

            {/* LEFT SIDE */}
            <div className="p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-[#E8DEC8] bg-[#FDFBF7]">

              <div className="mb-10">
                <p className="text-xs font-black uppercase tracking-[0.25em] text-[#B42318] mb-3">
                  Rhythm of India
                </p>

                <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-[#111111]">
                  Activate Your Pro
                </h1>

                <p className="text-sm text-[#777777] mt-2">
                  Secure checkout for your
                  dance-learning membership.
                </p>
              </div>

              <div className="space-y-4 mb-10">
                <h3 className="text-lg font-black font-mono uppercase tracking-tight">
                  Select Plan
                </h3>

                {plans.map((plan) => (
                  <label
                    key={plan.id}
                    className={`flex items-center justify-between gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      selectedPlan ===
                      plan.id
                        ? "border-[#B42318] bg-[#FFF7F2] shadow-sm"
                        : "border-[#E8DEC8] hover:border-[#111111] bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      className="sr-only"
                      checked={
                        selectedPlan ===
                        plan.id
                      }
                      onChange={() =>
                        setSelectedPlan(
                          plan.id
                        )
                      }
                    />

                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                          selectedPlan ===
                          plan.id
                            ? "border-[#B42318]"
                            : "border-[#777777]"
                        }`}
                      >
                        {selectedPlan ===
                          plan.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-[#B42318]" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="font-bold text-[#111111]">
                          {plan.label}
                        </p>

                        <p className="text-xs text-[#777777]">
                          {plan.id ===
                          "yearly"
                            ? "Best value for committed learners."
                            : plan.id ===
                              "lifetime"
                            ? "Pay once. Learn forever."
                            : "Flexible monthly learning."}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="font-black font-mono text-lg text-[#111111]">
                        ₹
                        {plan.priceINR.toLocaleString(
                          "en-IN"
                        )}
                      </p>

                      <p className="text-[10px] text-[#777777] uppercase font-bold tracking-wider">
                        / {plan.period}
                      </p>
                    </div>
                  </label>
                ))}
              </div>

              <div>
                <h3 className="text-lg font-black font-mono uppercase tracking-tight mb-4 flex items-center gap-2">
                  What you&apos;ll unlock
                  <ArrowRight className="w-4 h-4 text-[#B42318]" />
                </h3>

                <ul className="space-y-3">
                  {activePlan.features.map(
                    (feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2 text-sm text-[#111111] font-medium"
                      >
                        <Check
                          size={16}
                          className="text-[#B42318] shrink-0 mt-0.5"
                        />

                        <span>
                          {feature}
                        </span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="p-8 md:p-12">

              <div className="mb-7">
                <label className="block text-xs font-bold text-[#777777] mb-2 uppercase tracking-wider">
                  Billed To
                </label>

                <input
                  type="text"
                  value={billedTo}
                  onChange={(event) =>
                    setBilledTo(
                      event.target.value
                    )
                  }
                  className="w-full p-4 rounded-xl border border-[#E8DEC8] bg-white outline-none focus:border-[#B42318] focus:ring-1 focus:ring-[#B42318] transition-all text-sm font-medium"
                  placeholder="Enter full name"
                />
              </div>

              {/* PAYMENT TABS */}
              <div className="flex gap-2 p-1 bg-[#F8F1E6] rounded-xl mb-7 border border-[#E8DEC8]">

                <button
                  type="button"
                  onClick={() => {
                    setPaymentTab(
                      "razorpay"
                    );
                    setError(null);
                  }}
                  className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    paymentTab ===
                    "razorpay"
                      ? "bg-white shadow-sm text-[#111111]"
                      : "text-[#777777] hover:text-[#111111]"
                  }`}
                >
                  <CreditCard size={16} />
                  Razorpay
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPaymentTab("qr");
                    setError(null);
                  }}
                  className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                    paymentTab === "qr"
                      ? "bg-white shadow-sm text-[#111111]"
                      : "text-[#777777] hover:text-[#111111]"
                  }`}
                >
                  <QrCode size={16} />
                  UPI QR
                </button>

              </div>

              {error && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex gap-3">
                  <AlertCircle
                    size={18}
                    className="shrink-0 mt-0.5"
                  />

                  <span>{error}</span>
                </div>
              )}

              {/* RAZORPAY CHECKOUT */}
              {paymentTab ===
              "razorpay" ? (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="space-y-5"
                >

                  <div className="rounded-2xl border border-[#E8DEC8] bg-[#FDFBF7] p-5">
                    <div className="flex items-start gap-3">

                      <div className="w-10 h-10 rounded-xl bg-[#111111] text-white flex items-center justify-center shrink-0">
                        <ShieldCheck
                          size={20}
                        />
                      </div>

                      <div>
                        <h3 className="font-black text-[#111111]">
                          Secure Razorpay
                          Checkout
                        </h3>

                        <p className="text-xs text-[#777777] mt-1 leading-relaxed">
                          Razorpay handles
                          sensitive payment
                          details. You can
                          choose UPI, cards,
                          net banking and
                          other available
                          payment methods.
                        </p>
                      </div>

                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">

                    <div className="rounded-xl border border-[#E8DEC8] p-4 bg-white">
                      <Smartphone
                        size={19}
                        className="mx-auto mb-2 text-[#B42318]"
                      />

                      <p className="text-[10px] font-bold uppercase text-[#777777]">
                        UPI
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E8DEC8] p-4 bg-white">
                      <CreditCard
                        size={19}
                        className="mx-auto mb-2 text-[#B42318]"
                      />

                      <p className="text-[10px] font-bold uppercase text-[#777777]">
                        Cards
                      </p>
                    </div>

                    <div className="rounded-xl border border-[#E8DEC8] p-4 bg-white">
                      <Lock
                        size={19}
                        className="mx-auto mb-2 text-[#B42318]"
                      />

                      <p className="text-[10px] font-bold uppercase text-[#777777]">
                        Secure
                      </p>
                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={
                      startRazorpayPayment
                    }
                    disabled={processing}
                    className="w-full py-4 bg-[#B42318] hover:bg-[#922018] disabled:opacity-60 text-white font-black rounded-xl transition-all shadow-lg shadow-[#B42318]/20 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {processing ? (
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />
                    ) : (
                      <Lock size={16} />
                    )}

                    {processing
                      ? "VERIFYING PAYMENT..."
                      : `PAY ₹${activePlan.priceINR.toLocaleString(
                          "en-IN"
                        )} SECURELY`}
                  </button>

                  <p className="text-[10px] text-[#777777] leading-relaxed flex items-start gap-2">
                    <ShieldCheck
                      size={14}
                      className="shrink-0 mt-0.5"
                    />

                    Payment is verified
                    on the server before
                    your subscription is
                    marked active.
                  </p>

                </motion.div>
              ) : (

                /* STATIC UPI QR */
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="space-y-5"
                >

                  <div className="rounded-2xl border border-[#E8DEC8] bg-[#FDFBF7] p-6 text-center">

                    <p className="text-xs font-black uppercase tracking-[0.2em] text-[#B42318]">
                      Scan & Pay
                    </p>

                    <h3 className="text-xl font-black font-mono uppercase mt-2">
                      UPI QR · ₹
                      {activePlan.priceINR.toLocaleString(
                        "en-IN"
                      )}
                    </h3>

                    <p className="text-xs text-[#777777] mt-2">
                      Scan with Google Pay,
                      PhonePe, Paytm or
                      another supported UPI
                      app.
                    </p>

                    {/* YOUR ACTUAL QR IMAGE */}
                    <div className="mt-6 flex justify-center">
                      <div className="p-4 bg-white border-2 border-[#111111] rounded-2xl shadow-lg">

                        <img
                          src="/upi-qr.jpeg"
                          alt="Rhythm of India UPI payment QR code"
                          className="w-64 h-64 sm:w-72 sm:h-72 object-contain"
                        />

                      </div>
                    </div>

                    <p className="mt-4 text-sm font-bold text-[#111111]">
                      Scan this QR code
                      to make your payment
                    </p>

                    <p className="text-xs text-[#777777] mt-1">
                      Use any supported UPI
                      application on your phone.
                    </p>

                    {/* UPI ID */}
                    <div className="mt-5 rounded-xl border border-[#E8DEC8] bg-white p-4">

                      <p className="text-[10px] uppercase tracking-wider font-black text-[#777777] mb-2">
                        UPI ID
                      </p>

                      <div className="flex items-center justify-center gap-3">

                        <span className="font-mono font-bold text-sm text-[#111111] break-all">
                          {upiId}
                        </span>

                        <button
                          type="button"
                          onClick={
                            copyUpiId
                          }
                          className="shrink-0 w-9 h-9 rounded-lg border border-[#E8DEC8] flex items-center justify-center hover:border-[#B42318] hover:text-[#B42318] transition-colors cursor-pointer"
                          aria-label="Copy UPI ID"
                        >
                          {copied ? (
                            <Check
                              size={15}
                            />
                          ) : (
                            <Copy
                              size={15}
                            />
                          )}
                        </button>

                      </div>

                      {copied && (
                        <p className="text-[10px] text-[#B42318] font-bold mt-2">
                          UPI ID copied
                        </p>
                      )}

                    </div>

                    {/* AMOUNT */}
                    <div className="mt-5 rounded-xl border border-[#E8DEC8] bg-[#FFF7F2] p-4 text-left">

                      <div className="flex items-start gap-3">

                        <AlertCircle
                          size={17}
                          className="text-[#B42318] shrink-0 mt-0.5"
                        />

                        <div>

                          <p className="text-xs font-black text-[#111111]">
                            Pay the exact
                            selected amount
                          </p>

                          <p className="text-[11px] text-[#777777] mt-1 leading-relaxed">
                            Current selected
                            plan:
                            <strong className="text-[#111111]">
                              {" "}
                              ₹
                              {activePlan.priceINR.toLocaleString(
                                "en-IN"
                              )}
                            </strong>
                            .
                          </p>

                        </div>

                      </div>

                    </div>

                    {/* STATIC QR NOTICE */}
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-left">

                      <div className="flex items-start gap-3">

                        <ShieldCheck
                          size={17}
                          className="text-amber-700 shrink-0 mt-0.5"
                        />

                        <div>

                          <p className="text-xs font-black text-amber-900">
                            UPI QR payment
                            verification
                          </p>

                          <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                            This is a static UPI
                            QR. Payment through
                            this QR is not
                            automatically verified
                            by the website yet.
                            For automatic
                            verification and
                            instant activation,
                            use the Razorpay
                            checkout option.
                          </p>

                        </div>

                      </div>

                    </div>

                  </div>

                  <a
                    href="https://razorpay.com/docs/payments/qr-codes/"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#777777] hover:text-[#B42318]"
                  >
                    About Razorpay UPI QR
                    <ExternalLink
                      size={12}
                    />
                  </a>

                </motion.div>
              )}

              {/* TOTAL */}
              <div className="mt-10 pt-7 border-t border-[#E8DEC8]">

                <div className="flex items-end justify-between mb-5">

                  <span className="text-xl font-black font-mono tracking-tight text-[#111111]">
                    Total
                  </span>

                  <div className="text-right">

                    <span className="text-2xl font-black font-mono text-[#111111]">
                      ₹
                      {activePlan.priceINR.toLocaleString(
                        "en-IN"
                      )}
                    </span>

                    <span className="text-xs font-bold text-[#777777] uppercase tracking-wider ml-2">
                      / {activePlan.period}
                    </span>

                  </div>

                </div>

                <p className="text-[10px] text-[#777777] leading-relaxed">
                  Razorpay Checkout payments
                  are processed securely in INR
                  and verified on the server before
                  your subscription is activated.
                </p>

              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F1E6] flex items-center justify-center">
          <RefreshCw className="animate-spin text-[#B42318]" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}