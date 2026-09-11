import { NextResponse } from "next/server";

import {
  getPlan,
  getRazorpayCredentials,
  razorpayAuthHeader,
} from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const planId =
      typeof body?.planId === "string"
        ? body.planId
        : "";

    const plan = getPlan(planId);

    if (!plan) {
      return NextResponse.json(
        { error: "Invalid plan." },
        { status: 400 }
      );
    }

    const { keyId, keySecret } =
      getRazorpayCredentials();

    const closeBy =
      Math.floor(Date.now() / 1000) +
      30 * 60;

    const response = await fetch(
      "https://api.razorpay.com/v1/payments/qr_codes",
      {
        method: "POST",
        headers: {
          Authorization: razorpayAuthHeader(
            keyId,
            keySecret
          ),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "upi_qr",
          name: `Rhythm ${planId}`,
          usage: "single_use",
          fixed_amount: true,
          payment_amount: plan.amountINR * 100,
          description: `${plan.label} - Rhythm of India`,
          close_by: closeBy,
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
        "Razorpay QR creation failed:",
        data
      );

      return NextResponse.json(
        {
          error:
            data?.error?.description ||
            "Unable to create UPI QR code.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      qrId: data.id,
      imageUrl: data.image_url,
      shortUrl: data.image_url,
      amount: data.payment_amount,
      currency: "INR",
      expiresAt: data.close_by,
      planId,
      planLabel: plan.label,
    });
  } catch (error) {
    console.error(
      "Create Razorpay QR error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "UPI QR is not available until Razorpay QR Codes are enabled for this account.",
      },
      { status: 500 }
    );
  }
}