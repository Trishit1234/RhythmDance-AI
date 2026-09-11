import { NextResponse } from "next/server";
import {
  getPlan,
  getRazorpayCredentials,
  razorpayAuthHeader,
} from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const planId = typeof body?.planId === "string" ? body.planId : "";
    const plan = getPlan(planId);

    if (!plan) {
      return NextResponse.json(
        { error: "Invalid plan." },
        { status: 400 }
      );
    }

    const { keyId, keySecret } = getRazorpayCredentials();

    const receipt = `rhythm_${planId}_${Date.now()}`.slice(0, 40);

    const response = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",
        headers: {
          Authorization: razorpayAuthHeader(keyId, keySecret),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: plan.amountINR * 100,
          currency: "INR",
          receipt,
          notes: {
            plan_id: planId,
            product: "Rhythm of India",
          },
        }),
        cache: "no-store",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Razorpay order creation failed:",
        data
      );

      return NextResponse.json(
        {
          error:
            data?.error?.description ||
            "Unable to create Razorpay order.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId,
      planId,
      planLabel: plan.label,
    });
  } catch (error) {
    console.error(
      "Create Razorpay order error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Razorpay is not configured yet. Add the API keys to .env.local.",
      },
      { status: 500 }
    );
  }
}