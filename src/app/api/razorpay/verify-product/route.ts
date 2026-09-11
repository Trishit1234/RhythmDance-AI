import { NextResponse } from "next/server";
import crypto from "crypto";

import {
  getProduct,
  type ProductSize,
} from "@/data/products";

import {
  getRazorpayCredentials,
  razorpayAuthHeader,
} from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const razorpayOrderId = String(
      body.razorpay_order_id || ""
    );

    const razorpayPaymentId = String(
      body.razorpay_payment_id || ""
    );

    const razorpaySignature = String(
      body.razorpay_signature || ""
    );

    const productId = String(
      body.productId || ""
    );

    const size = String(
      body.size || ""
    ) as ProductSize;

    const quantity = Number(
      body.quantity || 1
    );

    const customer = body.customer || {};

    if (
      !razorpayOrderId ||
      !razorpayPaymentId ||
      !razorpaySignature
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing Razorpay payment details.",
        },
        { status: 400 }
      );
    }

    const product = getProduct(productId);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found.",
        },
        { status: 400 }
      );
    }

    if (!product.sizes.includes(size)) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid product size.",
        },
        { status: 400 }
      );
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 10
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid quantity.",
        },
        { status: 400 }
      );
    }

    const { keyId, keySecret } =
      getRazorpayCredentials();

    /*
     * Verify Razorpay signature.
     */
    const generatedSignature =
      crypto
        .createHmac(
          "sha256",
          keySecret
        )
        .update(
          `${razorpayOrderId}|${razorpayPaymentId}`
        )
        .digest("hex");

    const signatureMatches =
      crypto.timingSafeEqual(
        Buffer.from(generatedSignature),
        Buffer.from(razorpaySignature)
      );

    if (!signatureMatches) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment signature verification failed.",
        },
        { status: 400 }
      );
    }

    /*
     * Fetch payment from Razorpay.
     */
    const paymentResponse = await fetch(
      `https://api.razorpay.com/v1/payments/${razorpayPaymentId}`,
      {
        method: "GET",
        headers: {
          Authorization:
            razorpayAuthHeader(
              keyId,
              keySecret
            ),
        },
      }
    );

    const payment =
      await paymentResponse.json();

    if (!paymentResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          error: "Unable to verify payment status.",
        },
        { status: 400 }
      );
    }

    /*
     * Only accept captured payments.
     */
    if (payment.status !== "captured") {
      return NextResponse.json(
        {
          success: false,
          error: `Payment status is ${payment.status}.`,
        },
        { status: 400 }
      );
    }

    /*
     * Verify amount against server-side
     * product pricing.
     */
    const subtotal =
      product.price * quantity;

    const shipping =
      subtotal >= 1499 ? 0 : 79;

    const expectedAmount =
      (subtotal + shipping) * 100;

    if (
      Number(payment.amount) !==
      expectedAmount
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment amount does not match the order.",
        },
        { status: 400 }
      );
    }

    /*
     * At this stage the payment is genuinely
     * verified by Razorpay.
     *
     * Later we can save the order to Firebase.
     */
    console.log(
      "RHYTHM OF INDIA PRODUCT ORDER",
      {
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        productId,
        productName: product.name,
        size,
        quantity,
        customer,
        amount: expectedAmount / 100,
      }
    );

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
      order: {
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        productId,
        productName: product.name,
        size,
        quantity,
        amount: expectedAmount / 100,
        customer,
      },
    });
  } catch (error) {
    console.error(
      "Product payment verification error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Payment verification failed.",
      },
      { status: 500 }
    );
  }
}