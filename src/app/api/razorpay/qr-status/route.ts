import { NextResponse } from "next/server";

import {
  getPlan,
  getRazorpayCredentials,
  razorpayAuthHeader,
} from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const qrId =
      typeof body?.qrId === "string"
        ? body.qrId
        : "";

    const planId =
      typeof body?.planId === "string"
        ? body.planId
        : "";

    const plan = getPlan(planId);

    if (!qrId || !plan) {
      return NextResponse.json(
        {
          paid: false,
          error:
            "Invalid QR payment request.",
        },
        { status: 400 }
      );
    }

    const { keyId, keySecret } =
      getRazorpayCredentials();

    const auth = {
      Authorization: razorpayAuthHeader(
        keyId,
        keySecret
      ),
    };

    const qrResponse = await fetch(
      `https://api.razorpay.com/v1/payments/qr_codes/${encodeURIComponent(
        qrId
      )}`,
      {
        headers: auth,
        cache: "no-store",
      }
    );

    const qr = await qrResponse.json();

    if (!qrResponse.ok) {
      return NextResponse.json(
        {
          paid: false,
          error:
            "Unable to read QR payment status.",
        },
        { status: 400 }
      );
    }

    if (
      qr.payment_amount !==
      plan.amountINR * 100
    ) {
      return NextResponse.json(
        {
          paid: false,
          error:
            "QR amount does not match the selected plan.",
        },
        { status: 400 }
      );
    }

    const paymentsResponse = await fetch(
      `https://api.razorpay.com/v1/payments/qr_codes/${encodeURIComponent(
        qrId
      )}/payments?count=10`,
      {
        headers: auth,
        cache: "no-store",
      }
    );

    const payments =
      await paymentsResponse.json();

    if (!paymentsResponse.ok) {
      return NextResponse.json(
        {
          paid: false,
          error:
            "Unable to check QR payments.",
        },
        { status: 400 }
      );
    }

    const capturedPayment =
      Array.isArray(payments.items)
        ? payments.items.find(
            (payment: {
              status?: string;
              amount?: number;
              currency?: string;
            }) =>
              payment.status === "captured" &&
              payment.amount ===
                plan.amountINR * 100 &&
              payment.currency === "INR"
          )
        : null;

    if (!capturedPayment) {
      return NextResponse.json({
        paid: false,
        qrStatus: qr.status,
        expiresAt: qr.close_by ?? null,
      });
    }

    return NextResponse.json({
      paid: true,
      paymentId: capturedPayment.id,
      qrId,
      planId,
      amount: plan.amountINR * 100,
      currency: "INR",
      status: "captured",
    });
  } catch (error) {
    console.error(
      "QR status error:",
      error
    );

    return NextResponse.json(
      {
        paid: false,
        error:
          "Unable to check UPI QR status.",
      },
      { status: 500 }
    );
  }
}