export const RAZORPAY_PLANS = {
  monthly: {
    label: "Monthly Plan",
    amountINR: 199,
  },
  yearly: {
    label: "Yearly Pro Plan",
    amountINR: 999,
  },
  lifetime: {
    label: "Lifetime Heritage Plan",
    amountINR: 2499,
  },
} as const;

export type RazorpayPlanId = keyof typeof RAZORPAY_PLANS;

export function getPlan(planId: string) {
  if (!(planId in RAZORPAY_PLANS)) {
    return null;
  }

  return RAZORPAY_PLANS[planId as RazorpayPlanId];
}

export function getRazorpayCredentials() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "Razorpay environment variables are not configured."
    );
  }

  return {
    keyId,
    keySecret,
  };
}

export function razorpayAuthHeader(
  keyId: string,
  keySecret: string
) {
  return `Basic ${Buffer.from(
    `${keyId}:${keySecret}`
  ).toString("base64")}`;
}