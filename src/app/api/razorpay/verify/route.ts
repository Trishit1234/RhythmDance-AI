import { NextResponse } from "next/server";
import crypto from "node:crypto";

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

    const paymentId =
      typeof body?.razorpay_payment_id === "string"
        ? body.razorpay_payment_id
        : "";

    const clientOrderId =
      typeof body?.razorpay_order_id === "string"
        ? body.razorpay_order_id
        : "";

    const signature =
      typeof body?.razorpay_signature === "string"
        ? body.razorpay_signature
        : "";

    const plan = getPlan(planId);

    if (
      !plan ||
      !paymentId ||
      !clientOrderId ||
      !signature
    ) {
      return NextResponse.json(
        {
          verified: false,
          error: "Incomplete payment details.",
        },
        { status: 400 }
      );
    }

    const { keyId, keySecret } =
      getRazorpayCredentials();

    const orderResponse = await fetch(
      `https://api.razorpay.com/v1/orders/${encodeURIComponent(
        clientOrderId
      )}`,
      {
        headers: {
          Authorization: razorpayAuthHeader(
            keyId,
            keySecret
          ),
        },
        cache: "no-store",
      }
    );

    const order = await orderResponse.json();

    if (!orderResponse.ok) {
      return NextResponse.json(
        {
          verified: false,
          error:
            "Razorpay order could not be verified.",
        },
        { status: 400 }
      );
    }

    if (
      order.amount !== plan.amountINR * 100 ||
      order.currency !== "INR"
    ) {
      return NextResponse.json(
        {
          verified: false,
          error:
            "Payment amount does not match the selected plan.",
        },
        { status: 400 }
      );
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${order.id}|${paymentId}`)
      .digest("hex");

    const expectedBuffer = Buffer.from(
      expectedSignature,
      "utf8"
    );

    const signatureBuffer = Buffer.from(
      signature,
      "utf8"
    );

    const signatureMatches =
      expectedBuffer.length ===
        signatureBuffer.length &&
      crypto.timingSafeEqual(
        expectedBuffer,
        signatureBuffer
      );

    if (!signatureMatches) {
      return NextResponse.json(
        {
          verified: false,
          error:
            "Payment signature verification failed.",
        },
        { status: 400 }
      );
    }

    const paymentResponse = await fetch(
      `https://api.razorpay.com/v1/payments/${encodeURIComponent(
        paymentId
      )}`,
      {
        headers: {
          Authorization: razorpayAuthHeader(
            keyId,
            keySecret
          ),
        },
        cache: "no-store",
      }
    );

    const payment = await paymentResponse.json();

    if (
      !paymentResponse.ok ||
      payment.order_id !== order.id ||
      payment.amount !== order.amount
    ) {
      return NextResponse.json(
        {
          verified: false,
          error:
            "Payment details could not be verified.",
        },
        { status: 400 }
      );
    }

    if (payment.status !== "captured") {
      return NextResponse.json(
        {
          verified: false,
          error: `Payment status is ${payment.status}.`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      verified: true,
      paymentId,
      orderId: order.id,
      planId,
      amount: order.amount,
      currency: order.currency,
      status: payment.status,
    });
  } catch (error) {
    console.error(
      "Razorpay verification error:",
      error
    );

    return NextResponse.json(
      {
        verified: false,
        error: "Unable to verify payment.",
      },
      { status: 500 }
    );
  }
}