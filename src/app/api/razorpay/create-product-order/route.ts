import { NextResponse } from "next/server";
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

    const productId = String(body.productId || "");
    const size = String(body.size || "M") as ProductSize;
    const quantity = Number(body.quantity || 1);

    const product = getProduct(productId);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: "Product not found.",
        },
        { status: 404 }
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

    const subtotal = product.price * quantity;

    const shipping = subtotal >= 1499 ? 0 : 79;

    const total = subtotal + shipping;

    const {
      keyId,
      keySecret,
    } = getRazorpayCredentials();

    const response = await fetch(
      "https://api.razorpay.com/v1/orders",
      {
        method: "POST",
        headers: {
          Authorization:
            razorpayAuthHeader(
              keyId,
              keySecret
            ),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: total * 100,
          currency: "INR",
          receipt: `rhythm_${Date.now()}`,
          notes: {
            productId: product.id,
            productName: product.name,
            size,
            quantity: String(quantity),
            shipping: String(shipping),
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "Razorpay order error:",
        data
      );

      return NextResponse.json(
        {
          success: false,
          error:
            data?.error?.description ||
            "Unable to create payment order.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
      keyId,
      product: {
        id: product.id,
        name: product.name,
        price: product.price,
        size,
        quantity,
        shipping,
        total,
      },
    });
  } catch (error) {
    console.error(
      "Create product order error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to create payment order.",
      },
      { status: 500 }
    );
  }
}