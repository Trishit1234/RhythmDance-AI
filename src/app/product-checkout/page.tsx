"use client";

import {
  Suspense,
  useState,
} from "react";

import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  ShieldCheck,
  Truck,
  XCircle,
} from "lucide-react";

import {
  getProduct,
  productSizes,
  type ProductSize,
} from "@/data/products";

import { useCart } from "@/context/CartContext";

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (
      typeof window !== "undefined" &&
      (window as any).Razorpay
    ) {
      resolve(true);
      return;
    }

    const existingScript =
      document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );

    if (existingScript) {
      existingScript.addEventListener(
        "load",
        () => resolve(true)
      );

      existingScript.addEventListener(
        "error",
        () => resolve(false)
      );

      return;
    }

    const script =
      document.createElement("script");

    script.src =
      "https://checkout.razorpay.com/v1/checkout.js";

    script.async = true;

    script.onload = () =>
      resolve(true);

    script.onerror = () =>
      resolve(false);

    document.body.appendChild(script);
  });
}

function ProductCheckoutContent() {
  const searchParams =
    useSearchParams();

  const {
    items,
    updateQuantity,
    clearCart,
  } = useCart();

  const productId =
    searchParams.get("product");

  const rawSize =
    searchParams.get("size");

  const selectedSize: ProductSize =
    rawSize &&
    productSizes.includes(
      rawSize as ProductSize
    )
      ? (rawSize as ProductSize)
      : "M";

  const directProduct =
    productId
      ? getProduct(productId)
      : undefined;

  const [quantity, setQuantity] =
    useState(1);

  const [customer, setCustomer] =
    useState({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
    });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [order, setOrder] =
    useState<any>(null);

  const checkoutItems =
    directProduct
      ? [
          {
            product: directProduct,
            size: selectedSize,
            quantity,
          },
        ]
      : items;

  const isCartCheckout =
    !directProduct;

  const subtotal =
    checkoutItems.reduce(
      (total, item) =>
        total +
        item.product.price *
          item.quantity,
      0
    );

  const shipping =
    subtotal >= 1499 || subtotal === 0
      ? 0
      : 79;

  const total =
    subtotal + shipping;

  function updateCustomer(
    field: keyof typeof customer,
    value: string
  ) {
    setCustomer((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handlePayment(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (
      !customer.name.trim() ||
      !customer.email.trim() ||
      !customer.phone.trim() ||
      !customer.address.trim() ||
      !customer.city.trim() ||
      !customer.state.trim() ||
      !customer.pincode.trim()
    ) {
      setError(
        "Please fill all delivery details."
      );

      return;
    }

    /*
     * Current product payment API supports
     * one product per Razorpay order.
     */
    if (
      isCartCheckout &&
      checkoutItems.length !== 1
    ) {
      setError(
        "Please checkout one T-shirt at a time for now."
      );

      return;
    }

    const item =
      checkoutItems[0];

    if (!item) {
      setError(
        "No product selected."
      );

      return;
    }

    setLoading(true);

    try {
      /*
       * 1. Load Razorpay Checkout.
       */
      const razorpayLoaded =
        await loadRazorpayScript();

      if (!razorpayLoaded) {
        throw new Error(
          "Razorpay failed to load. Please check your internet connection."
        );
      }

      /*
       * 2. Create order on our server.
       */
      const orderResponse =
        await fetch(
          "/api/razorpay/create-product-order",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              productId:
                item.product.id,

              size:
                item.size,

              quantity:
                item.quantity,
            }),
          }
        );

      const orderData =
        await orderResponse.json();

      if (
        !orderResponse.ok ||
        !orderData.success
      ) {
        throw new Error(
          orderData.error ||
            "Could not create payment order."
        );
      }

      /*
       * 3. Get Razorpay constructor.
       *
       * We intentionally don't declare
       * window.Razorpay globally because
       * /checkout already has a declaration.
       */
      const RazorpayConstructor =
        (window as any).Razorpay;

      if (!RazorpayConstructor) {
        throw new Error(
          "Razorpay checkout is unavailable."
        );
      }

      /*
       * 4. Razorpay options.
       */
      const options = {
        key: orderData.keyId,

        amount:
          orderData.amount,

        currency:
          orderData.currency,

        name:
          "Rhythm of India",

        description:
          `${item.product.name} · Size ${item.size}`,

        order_id:
          orderData.orderId,

        prefill: {
          name:
            customer.name,

          email:
            customer.email,

          contact:
            customer.phone,
        },

        notes: {
          address:
            customer.address,

          city:
            customer.city,

          state:
            customer.state,

          pincode:
            customer.pincode,
        },

        theme: {
          color:
            "#B42318",
        },

        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },

        handler: async (
          response: any
        ) => {
          try {
            /*
             * 5. Verify payment on server.
             */
            const verifyResponse =
              await fetch(
                "/api/razorpay/verify-product",
                {
                  method: "POST",

                  headers: {
                    "Content-Type":
                      "application/json",
                  },

                  body: JSON.stringify({
                    razorpay_order_id:
                      response.razorpay_order_id,

                    razorpay_payment_id:
                      response.razorpay_payment_id,

                    razorpay_signature:
                      response.razorpay_signature,

                    productId:
                      item.product.id,

                    size:
                      item.size,

                    quantity:
                      item.quantity,

                    customer,
                  }),
                }
              );

            const verifyData =
              await verifyResponse.json();

            if (
              !verifyResponse.ok ||
              !verifyData.success
            ) {
              throw new Error(
                verifyData.error ||
                  "Payment verification failed."
              );
            }

            /*
             * Only clear cart after successful
             * server-side verification.
             */
            if (isCartCheckout) {
              clearCart();
            }

            setOrder(
              verifyData.order
            );

            setLoading(false);
          } catch (
            verificationError
          ) {
            console.error(
              verificationError
            );

            setError(
              verificationError instanceof
                Error
                ? verificationError.message
                : "Payment verification failed."
            );

            setLoading(false);
          }
        },
      };

      /*
       * 6. Open Razorpay popup.
       */
      const razorpay =
        new RazorpayConstructor(
          options
        );

      razorpay.on(
        "payment.failed",
        (response: any) => {
          console.error(
            "Razorpay payment failed:",
            response
          );

          setError(
            response?.error
              ?.description ||
              "Payment failed. Please try again."
          );

          setLoading(false);
        }
      );

      razorpay.open();
    } catch (paymentError) {
      console.error(
        paymentError
      );

      setError(
        paymentError instanceof
          Error
          ? paymentError.message
          : "Unable to start payment."
      );

      setLoading(false);
    }
  }

  /*
   * =========================
   * SUCCESS SCREEN
   * =========================
   */
  if (order) {
    return (
      <main className="min-h-screen bg-[#f7f0e5] px-6 py-20 text-[#17120f]">
        <div className="mx-auto max-w-2xl rounded-[32px] border border-black/10 bg-white p-10 text-center shadow-xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#b42318] text-white">
            <CheckCircle2
              size={42}
            />
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.25em] text-[#b42318]">
            Rhythm of India
          </p>

          <h1 className="mt-3 text-4xl font-black">
            Order Confirmed!
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-black/60">
            Your payment has been
            successfully verified.
            Thank you for shopping with
            Rhythm of India.
          </p>

          <div className="mx-auto mt-7 max-w-md rounded-2xl bg-[#f7f0e5] p-5 text-left">
            <div className="flex justify-between gap-4">
              <span className="text-black/50">
                Order ID
              </span>

              <span className="max-w-[220px] truncate font-bold">
                {order.orderId}
              </span>
            </div>

            <div className="mt-3 flex justify-between gap-4">
              <span className="text-black/50">
                Payment ID
              </span>

              <span className="max-w-[220px] truncate font-bold">
                {order.paymentId}
              </span>
            </div>

            <div className="mt-3 flex justify-between gap-4">
              <span className="text-black/50">
                Product
              </span>

              <span className="text-right font-bold">
                {order.productName}
              </span>
            </div>

            <div className="mt-3 flex justify-between">
              <span className="text-black/50">
                Size
              </span>

              <span className="font-bold">
                {order.size}
              </span>
            </div>

            <div className="mt-3 flex justify-between">
              <span className="text-black/50">
                Quantity
              </span>

              <span className="font-bold">
                {order.quantity}
              </span>
            </div>

            <div className="mt-4 border-t border-black/10 pt-4">
              <div className="flex justify-between">
                <span className="font-bold">
                  Total Paid
                </span>

                <span className="text-xl font-black text-[#b42318]">
                  ₹
                  {Number(
                    order.amount
                  ).toLocaleString(
                    "en-IN"
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/products"
              className="rounded-full bg-[#b42318] px-7 py-3 font-bold text-white transition hover:bg-[#921c14]"
            >
              Continue Shopping
            </Link>

            <Link
              href="/"
              className="rounded-full border border-black/15 px-7 py-3 font-bold transition hover:bg-black/5"
            >
              Back Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  /*
   * =========================
   * EMPTY CART
   * =========================
   */
  if (
    !directProduct &&
    items.length === 0
  ) {
    return (
      <main className="min-h-screen bg-[#f7f0e5] px-6 py-20 text-[#17120f]">
        <div className="mx-auto max-w-xl rounded-[32px] bg-white p-10 text-center shadow-xl">
          <ShoppingBag
            size={48}
            className="mx-auto text-[#b42318]"
          />

          <h1 className="mt-5 text-3xl font-black">
            Your cart is empty
          </h1>

          <p className="mt-3 text-black/60">
            Add a Rhythm of India
            T-shirt before checking out.
          </p>

          <Link
            href="/products"
            className="mt-7 inline-flex rounded-full bg-[#b42318] px-7 py-3 font-bold text-white"
          >
            Explore Products
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f0e5] text-[#17120f]">
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm font-bold text-black/60 transition hover:text-[#b42318]"
        >
          <ArrowLeft
            size={17}
          />

          Back to Products
        </Link>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* =========================
              LEFT CHECKOUT FORM
              ========================= */}
          <section>
            <div className="rounded-[32px] border border-black/10 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#b42318] text-white">
                  <ShoppingBag
                    size={20}
                  />
                </div>

                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b42318]">
                    Rhythm of India
                  </p>

                  <h1 className="text-2xl font-black">
                    Checkout
                  </h1>
                </div>
              </div>

              <form
                onSubmit={
                  handlePayment
                }
                className="mt-8 space-y-7"
              >
                {/* CONTACT */}
                <div>
                  <h2 className="text-lg font-black">
                    Contact Details
                  </h2>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <input
                      required
                      value={
                        customer.name
                      }
                      onChange={(event) =>
                        updateCustomer(
                          "name",
                          event.target.value
                        )
                      }
                      placeholder="Full Name"
                      className="rounded-2xl border border-black/10 bg-[#faf7f1] px-4 py-3 outline-none transition focus:border-[#b42318]"
                    />

                    <input
                      required
                      type="email"
                      value={
                        customer.email
                      }
                      onChange={(event) =>
                        updateCustomer(
                          "email",
                          event.target.value
                        )
                      }
                      placeholder="Email Address"
                      className="rounded-2xl border border-black/10 bg-[#faf7f1] px-4 py-3 outline-none transition focus:border-[#b42318]"
                    />

                    <input
                      required
                      type="tel"
                      value={
                        customer.phone
                      }
                      onChange={(event) =>
                        updateCustomer(
                          "phone",
                          event.target.value
                        )
                      }
                      placeholder="Phone Number"
                      className="rounded-2xl border border-black/10 bg-[#faf7f1] px-4 py-3 outline-none transition focus:border-[#b42318]"
                    />
                  </div>
                </div>

                {/* ADDRESS */}
                <div>
                  <h2 className="text-lg font-black">
                    Delivery Address
                  </h2>

                  <div className="mt-4 space-y-4">
                    <textarea
                      required
                      rows={3}
                      value={
                        customer.address
                      }
                      onChange={(event) =>
                        updateCustomer(
                          "address",
                          event.target.value
                        )
                      }
                      placeholder="House / Street / Area"
                      className="w-full resize-none rounded-2xl border border-black/10 bg-[#faf7f1] px-4 py-3 outline-none transition focus:border-[#b42318]"
                    />

                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        required
                        value={
                          customer.city
                        }
                        onChange={(event) =>
                          updateCustomer(
                            "city",
                            event.target.value
                          )
                        }
                        placeholder="City"
                        className="rounded-2xl border border-black/10 bg-[#faf7f1] px-4 py-3 outline-none transition focus:border-[#b42318]"
                      />

                      <input
                        required
                        value={
                          customer.state
                        }
                        onChange={(event) =>
                          updateCustomer(
                            "state",
                            event.target.value
                          )
                        }
                        placeholder="State"
                        className="rounded-2xl border border-black/10 bg-[#faf7f1] px-4 py-3 outline-none transition focus:border-[#b42318]"
                      />

                      <input
                        required
                        inputMode="numeric"
                        maxLength={6}
                        value={
                          customer.pincode
                        }
                        onChange={(event) =>
                          updateCustomer(
                            "pincode",
                            event.target.value
                          )
                        }
                        placeholder="Pincode"
                        className="rounded-2xl border border-black/10 bg-[#faf7f1] px-4 py-3 outline-none transition focus:border-[#b42318]"
                      />
                    </div>
                  </div>
                </div>

                {/* ERROR */}
                {error && (
                  <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <XCircle
                      size={20}
                      className="mt-0.5 shrink-0"
                    />

                    <span>
                      {error}
                    </span>
                  </div>
                )}

                {/* PAYMENT */}
                <div className="border-t border-black/10 pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#b42318] px-6 py-4 text-base font-black text-white transition hover:bg-[#921c14] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2
                          size={20}
                          className="animate-spin"
                        />

                        Opening Secure
                        Payment...
                      </>
                    ) : (
                      <>
                        Pay ₹
                        {total.toLocaleString(
                          "en-IN"
                        )}
                      </>
                    )}
                  </button>

                  <p className="mt-3 text-center text-xs text-black/45">
                    Secure payment powered by
                    Razorpay
                  </p>
                </div>
              </form>
            </div>
          </section>

          {/* =========================
              RIGHT ORDER SUMMARY
              ========================= */}
          <aside className="h-fit rounded-[32px] border border-black/10 bg-[#17120f] p-6 text-white shadow-xl sm:p-8 lg:sticky lg:top-8">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f0a27b]">
              Your Order
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Order Summary
            </h2>

            <div className="mt-7 space-y-5">
              {checkoutItems.map(
                (item) => (
                  <div
                    key={`${item.product.id}-${item.size}`}
                    className="flex gap-4 border-b border-white/10 pb-5"
                  >
                    <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-white/10">
                      <Image
                        src={
                          item.product
                            .image
                        }
                        alt={
                          item.product
                            .name
                        }
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold">
                        {
                          item.product
                            .name
                        }
                      </h3>

                      <p className="mt-1 text-sm text-white/50">
                        Size:{" "}
                        {item.size}
                      </p>

                      <div className="mt-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 rounded-full border border-white/15 px-2 py-1">
                          <button
                            type="button"
                            disabled={
                              loading
                            }
                            onClick={() => {
                              if (
                                directProduct
                              ) {
                                setQuantity(
                                  (current) =>
                                    Math.max(
                                      1,
                                      current -
                                        1
                                    )
                                );
                              } else {
                                updateQuantity(
                                  item.product.id,
                                  item.size,
                                  item.quantity -
                                    1
                                );
                              }
                            }}
                            className="p-1 text-white/70 hover:text-white"
                          >
                            <Minus
                              size={14}
                            />
                          </button>

                          <span className="min-w-5 text-center text-sm font-bold">
                            {
                              item.quantity
                            }
                          </span>

                          <button
                            type="button"
                            disabled={
                              loading
                            }
                            onClick={() => {
                              if (
                                directProduct
                              ) {
                                setQuantity(
                                  (current) =>
                                    Math.min(
                                      10,
                                      current +
                                        1
                                    )
                                );
                              } else {
                                updateQuantity(
                                  item.product.id,
                                  item.size,
                                  item.quantity +
                                    1
                                );
                              }
                            }}
                            className="p-1 text-white/70 hover:text-white"
                          >
                            <Plus
                              size={14}
                            />
                          </button>
                        </div>

                        <span className="font-black">
                          ₹
                          {(
                            item.product
                              .price *
                            item.quantity
                          ).toLocaleString(
                            "en-IN"
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* TOTALS */}
            <div className="mt-6 space-y-3 border-b border-white/10 pb-6 text-sm">
              <div className="flex justify-between text-white/60">
                <span>
                  Subtotal
                </span>

                <span>
                  ₹
                  {subtotal.toLocaleString(
                    "en-IN"
                  )}
                </span>
              </div>

              <div className="flex justify-between text-white/60">
                <span>
                  Shipping
                </span>

                <span>
                  {shipping === 0
                    ? "FREE"
                    : `₹${shipping}`}
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-end justify-between">
              <span className="text-white/60">
                Total
              </span>

              <span className="text-3xl font-black">
                ₹
                {total.toLocaleString(
                  "en-IN"
                )}
              </span>
            </div>

            {/* BENEFITS */}
            <div className="mt-7 grid gap-3">
              <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
                <ShieldCheck
                  size={20}
                  className="text-[#f0a27b]"
                />

                <span className="text-xs text-white/65">
                  Secure Razorpay
                  payment
                </span>
              </div>

              <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
                <Truck
                  size={20}
                  className="text-[#f0a27b]"
                />

                <span className="text-xs text-white/65">
                  Delivery across
                  India
                </span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function CheckoutFallback() {
  return (
    <main className="min-h-screen bg-[#f7f0e5] px-6 py-20">
      <div className="mx-auto max-w-xl rounded-[32px] bg-white p-10 text-center shadow-xl">
        <Loader2
          size={38}
          className="mx-auto animate-spin text-[#b42318]"
        />

        <p className="mt-5 font-bold">
          Loading checkout...
        </p>
      </div>
    </main>
  );
}

export default function ProductCheckoutPage() {
  return (
    <Suspense
      fallback={
        <CheckoutFallback />
      }
    >
      <ProductCheckoutContent />
    </Suspense>
  );
}