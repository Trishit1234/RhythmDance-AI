"use client";

import { Suspense, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";

import Navbar from "@/components/Navbar";

import {
  products,
  productSizes,
  type ProductSize,
} from "@/data/products";

import { useCart } from "@/context/CartContext";

const categories = [
  "All",
  "Bharatanatyam",
  "Kathak",
  "Odissi",
  "Kuchipudi",
  "Accessories",
] as const;

type ShopCategory = (typeof categories)[number];

function ProductsContent() {
  const searchParams = useSearchParams();

  const {
    items,
    itemCount,
    subtotal,
    addToCart,
    removeFromCart,
    updateQuantity,
  } = useCart();

  const initialProductId = searchParams.get("product");

  const [activeCategory, setActiveCategory] =
    useState<ShopCategory>("All");

  const [selectedSizes, setSelectedSizes] = useState<
    Record<string, ProductSize>
  >(
    Object.fromEntries(
      products.map((product) => [product.id, "M"])
    ) as Record<string, ProductSize>
  );

  const [cartOpen, setCartOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    if (activeCategory === "All") {
      return products;
    }

    return products.filter(
      (product) => product.category === activeCategory
    );
  }, [activeCategory]);

  const selectProduct = initialProductId
    ? products.find(
        (product) => product.id === initialProductId
      )
    : null;

  const chooseSize = (
    productId: string,
    size: ProductSize
  ) => {
    setSelectedSizes((current) => ({
      ...current,
      [productId]: size,
    }));
  };

  const handleAdd = (productId: string) => {
    const product = products.find(
      (item) => item.id === productId
    );

    if (!product) return;

    addToCart(
      product,
      selectedSizes[product.id] || "M",
      1
    );

    setCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8F1E6] text-[#111111]">
      <Navbar />

      <main className="pt-24">

        {/* =====================================================
            COSTUME SHOP HERO
        ====================================================== */}

        <section className="relative overflow-hidden border-b border-[#E8DEC8] bg-[#EFE7DA]">

          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(180,35,24,0.12),transparent_30%),radial-gradient(circle_at_20%_100%,rgba(214,90,31,0.08),transparent_35%)]" />

          <div className="relative mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.15fr_.85fr] lg:px-10 lg:py-20">

            {/* LEFT CONTENT */}

            <div className="flex flex-col justify-center">

              <p className="font-mono text-xs font-black uppercase tracking-[0.25em] text-[#B42318]">
                Dance with tradition
              </p>

              <h1 className="mt-4 max-w-3xl text-5xl font-black uppercase leading-[0.88] tracking-tight sm:text-7xl">
                Costume
                <span className="text-[#B42318]">
                  {" "}Shop
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-black/60 sm:text-lg">
                Authentic dance attire for every classical form.
                Get the right costume for academy training,
                rehearsals and performances.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">

                {[
                  "Authentic Designs",
                  "Performance Ready",
                  "Pan India Delivery",
                ].map((item) => (

                  <span
                    key={item}
                    className="rounded-full border border-[#D8CBB7] bg-white/70 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-[#111111]"
                  >
                    ✓ {item}
                  </span>

                ))}

              </div>

            </div>

            {/* =================================================
                BANNER IMAGE
            ================================================== */}

            <div className="relative min-h-[320px] overflow-hidden rounded-[32px] border border-[#E0D4C1] bg-[#DCCFBD] sm:min-h-[380px]">

              <Image
                src="/products/BANNER-1.JPEG"
                alt="Classical Indian dance costume"
                fill
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover object-center"
                priority
              />

              {/* IMAGE OVERLAY */}

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

              {/* QUOTE */}

              <div className="absolute bottom-6 left-6 max-w-xs text-white sm:bottom-8 sm:left-8">

                <p className="font-serif text-2xl italic leading-tight sm:text-3xl">
                  “Wear the tradition.
                  <br />
                  Dance the legacy.”
                </p>

              </div>

            </div>

          </div>

        </section>

        {/* =====================================================
            PRODUCTS
        ====================================================== */}

        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">

          {/* CATEGORY FILTERS */}

          <div className="flex gap-2 overflow-x-auto pb-2">

            {categories.map((category) => (

              <button
                key={category}
                type="button"
                onClick={() =>
                  setActiveCategory(category)
                }
                className={`shrink-0 rounded-full border px-5 py-2.5 text-xs font-black transition ${
                  activeCategory === category
                    ? "border-[#B42318] bg-[#B42318] text-white"
                    : "border-[#D8CBB7] bg-white text-[#111111] hover:border-[#B42318]"
                }`}
              >
                {category}
              </button>

            ))}

          </div>

          {/* SELECTED PRODUCT MESSAGE */}

          {selectProduct && (

            <div className="mt-5 rounded-2xl border border-[#B42318]/20 bg-[#FFF7F2] px-5 py-4 text-sm">

              <span className="font-black">
                Selected costume:
              </span>{" "}

              {selectProduct.name}.

              {" "}Choose your size below and add it to your cart.

            </div>

          )}

          {/* PRODUCT GRID */}

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {filteredProducts.map((product) => {

              const selectedSize =
                selectedSizes[product.id] || "M";

              return (

                <article
                  key={product.id}
                  className="overflow-hidden rounded-[28px] border border-[#E0D4C1] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                >

                  {/* PRODUCT IMAGE */}

                  <Link
                    href={`/products?product=${product.id}`}
                    className="group block"
                  >

                    <div className="relative aspect-[4/4.7] overflow-hidden bg-[#EEE5D7]">

                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition duration-700 group-hover:scale-105"
                      />

                      {product.badge && (

                        <span
                          className="absolute left-4 top-4 rounded-full px-3 py-1.5 text-[9px] font-black tracking-[0.15em] text-white"
                          style={{
                            backgroundColor:
                              product.accent,
                          }}
                        >
                          {product.badge}
                        </span>

                      )}

                    </div>

                  </Link>

                  {/* PRODUCT INFORMATION */}

                  <div className="p-5">

                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#777777]">
                      {product.category}
                    </p>

                    <div className="mt-2 flex items-start justify-between gap-3">

                      <h2 className="text-xl font-black uppercase leading-tight tracking-tight">
                        {product.name}
                      </h2>

                      <span className="shrink-0 text-lg font-black text-[#B42318]">
                        ₹
                        {product.price.toLocaleString(
                          "en-IN"
                        )}
                      </span>

                    </div>

                    <p className="mt-3 text-sm leading-6 text-black/50">
                      {product.description}
                    </p>

                    {/* SIZE SELECTOR */}

                    <div className="mt-5">

                      <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-[#777777]">
                        Select Size
                      </p>

                      <div className="flex flex-wrap gap-2">

                        {productSizes.map((size) => (

                          <button
                            key={size}
                            type="button"
                            onClick={() =>
                              chooseSize(
                                product.id,
                                size
                              )
                            }
                            className={`grid h-9 min-w-9 place-items-center rounded-full border px-2 text-[11px] font-black transition ${
                              selectedSize === size
                                ? "border-[#B42318] bg-[#B42318] text-white"
                                : "border-[#D8CBB7] bg-[#FDFBF7] hover:border-[#B42318]"
                            }`}
                          >
                            {size}
                          </button>

                        ))}

                      </div>

                    </div>

                    {/* ADD TO CART */}

                    <button
                      type="button"
                      onClick={() =>
                        handleAdd(product.id)
                      }
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-[#111111] px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#B42318]"
                    >
                      <ShoppingBag size={15} />
                      Add to Cart
                    </button>

                  </div>

                </article>

              );

            })}

          </div>

          {/* =================================================
              SHOP FEATURES
          ================================================== */}

          <div className="mt-10 grid gap-3 rounded-[28px] border border-[#E8DEC8] bg-white/60 p-5 sm:grid-cols-3">

            {[
              [
                "Pan India Delivery",
                "Fast & reliable shipping",
              ],
              [
                "Secure Payments",
                "Safe Razorpay checkout",
              ],
              [
                "Premium Quality",
                "Dance-ready attire",
              ],
            ].map(([title, text]) => (

              <div
                key={title}
                className="rounded-2xl bg-[#F8F1E6] p-5 text-center"
              >

                <p className="text-sm font-black">
                  {title}
                </p>

                <p className="mt-1 text-xs text-[#777777]">
                  {text}
                </p>

              </div>

            ))}

          </div>

        </section>

      </main>

      {/* =====================================================
          FLOATING CART
      ====================================================== */}

      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-[#B42318] px-5 py-3.5 text-xs font-black text-white shadow-2xl transition hover:-translate-y-1"
      >
        <ShoppingBag size={16} />
        Cart ({itemCount})
      </button>

      {/* =====================================================
          CART DRAWER
      ====================================================== */}

      {cartOpen && (

        <div className="fixed inset-0 z-50">

          {/* BACKDROP */}

          <button
            type="button"
            aria-label="Close cart"
            onClick={() => setCartOpen(false)}
            className="absolute inset-0 bg-black/45"
          />

          {/* CART PANEL */}

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#FDFBF7] shadow-2xl">

            {/* CART HEADER */}

            <div className="flex items-center justify-between border-b border-[#E8DEC8] px-6 py-5">

              <div>

                <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#B42318]">
                  Rhythm Shop
                </p>

                <h2 className="mt-1 text-2xl font-black uppercase">
                  Your Cart
                </h2>

              </div>

              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-[#E8DEC8] hover:bg-[#F8F1E6]"
              >
                <X size={18} />
              </button>

            </div>

            {/* CART CONTENT */}

            <div className="flex-1 overflow-y-auto p-5">

              {items.length === 0 ? (

                <div className="rounded-2xl border border-dashed border-[#D8CBB7] p-8 text-center">

                  <ShoppingBag className="mx-auto text-[#B42318]" />

                  <p className="mt-3 font-black">
                    Your cart is empty.
                  </p>

                  <p className="mt-1 text-sm text-[#777777]">
                    Choose your academy costume to get
                    started.
                  </p>

                </div>

              ) : (

                <div className="space-y-4">

                  {items.map((item) => (

                    <div
                      key={`${item.product.id}-${item.size}`}
                      className="rounded-2xl border border-[#E8DEC8] bg-white p-4"
                    >

                      <div className="flex gap-4">

                        {/* CART PRODUCT IMAGE */}

                        <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-[#EEE5D7]">

                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />

                        </div>

                        {/* PRODUCT INFO */}

                        <div className="min-w-0 flex-1">

                          <p className="text-sm font-black leading-tight">
                            {item.product.name}
                          </p>

                          <p className="mt-1 text-xs text-[#777777]">
                            Size: {item.size}
                          </p>

                          <p className="mt-1 font-mono text-sm font-black text-[#B42318]">
                            ₹
                            {item.product.price.toLocaleString(
                              "en-IN"
                            )}
                          </p>

                        </div>

                        {/* REMOVE BUTTON */}

                        <button
                          type="button"
                          onClick={() =>
                            removeFromCart(
                              item.product.id,
                              item.size
                            )
                          }
                          className="self-start text-[#777777] hover:text-red-700"
                          aria-label={`Remove ${item.product.name}`}
                        >
                          <Trash2 size={15} />
                        </button>

                      </div>

                      {/* QUANTITY */}

                      <div className="mt-4 flex items-center justify-between">

                        <div className="flex items-center rounded-full border border-[#D8CBB7]">

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.size,
                                item.quantity - 1
                              )
                            }
                            className="grid h-8 w-8 place-items-center"
                          >
                            <Minus size={13} />
                          </button>

                          <span className="w-8 text-center text-xs font-black">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.product.id,
                                item.size,
                                item.quantity + 1
                              )
                            }
                            className="grid h-8 w-8 place-items-center"
                          >
                            <Plus size={13} />
                          </button>

                        </div>

                        <span className="text-sm font-black">
                          ₹
                          {(
                            item.product.price *
                            item.quantity
                          ).toLocaleString("en-IN")}
                        </span>

                      </div>

                    </div>

                  ))}

                </div>

              )}

            </div>

            {/* CART FOOTER */}

            <div className="border-t border-[#E8DEC8] bg-white p-5">

              <div className="flex items-center justify-between">

                <span className="text-sm font-bold text-[#777777]">
                  Subtotal
                </span>

                <span className="text-xl font-black">
                  ₹{subtotal.toLocaleString("en-IN")}
                </span>

              </div>

              <p className="mt-2 text-[10px] leading-5 text-[#777777]">
                Shipping is calculated securely at checkout.
                Free shipping on orders above ₹1,499.
              </p>

              <Link
                href="/product-checkout"
                onClick={() => setCartOpen(false)}
                className={`mt-4 flex items-center justify-center gap-2 rounded-full px-5 py-3.5 text-xs font-black uppercase tracking-wider ${
                  items.length
                    ? "bg-[#B42318] text-white hover:bg-[#921C14]"
                    : "pointer-events-none bg-[#E8DEC8] text-[#999999]"
                }`}
              >
                Checkout
                <ArrowRight size={15} />
              </Link>

            </div>

          </aside>

        </div>

      )}

      {/* =====================================================
          FOOTER
      ====================================================== */}

      <footer className="border-t border-[#E8DEC8] bg-[#111111] px-5 py-12 text-white sm:px-8">

        <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="font-black tracking-tight">
              RHYTHM OF INDIA
            </p>

            <p className="mt-1 font-mono text-[10px] font-bold tracking-[0.18em] text-white/35">
              CLASSICAL DANCE ACADEMY
            </p>

          </div>

          <p className="text-xs text-white/40">
            Tradition lives on you.
          </p>

        </div>

      </footer>

    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#F8F1E6] text-[#B42318]">
          Loading costume shop...
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  );
}