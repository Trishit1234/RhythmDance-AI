"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingBag,
  ArrowRight,
  Check,
  Plus,
  Minus,
  X,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import Navbar from "@/components/Navbar";
import {
  products,
  productSizes,
  type ProductSize,
} from "@/data/products";
import { useCart } from "@/context/CartContext";

export default function ProductsPage() {
  const {
    items,
    itemCount,
    subtotal,
    addToCart,
    removeFromCart,
    updateQuantity,
  } = useCart();

  const [cartOpen, setCartOpen] =
    useState(false);

  const [selectedSizes, setSelectedSizes] =
    useState<Record<string, ProductSize>>(
      Object.fromEntries(
        products.map((product) => [
          product.id,
          "M",
        ])
      ) as Record<
        string,
        ProductSize
      >
    );

  const [addedProduct, setAddedProduct] =
    useState<string | null>(null);

  const handleAddToCart = (
    productId: string
  ) => {
    const product = products.find(
      (item) => item.id === productId
    );

    if (!product) {
      return;
    }

    addToCart(
      product,
      selectedSizes[product.id] || "M",
      1
    );

    setAddedProduct(product.id);
    setCartOpen(true);

    window.setTimeout(() => {
      setAddedProduct(null);
    }, 1400);
  };

  return (
    <main className="min-h-screen bg-[#F8F1E6] text-[#111111]">
      <Navbar />

      {/* HERO */}
      <section className="pt-32 pb-16 px-5">
        <div className="max-w-7xl mx-auto">

          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-end">

            <div>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#B42318] mb-5">
                Rhythm of India · Merch
              </p>

              <h1 className="text-5xl sm:text-6xl lg:text-8xl font-black uppercase tracking-[-0.05em] leading-[0.85]">
                Wear the
                <span className="block text-[#B42318]">
                  Rhythm.
                </span>
              </h1>

              <p className="max-w-xl mt-7 text-[#777777] text-base sm:text-lg leading-relaxed">
                Our first three Rhythm of India
                pieces — designed around Indian
                movement, heritage and the energy
                of performance.
              </p>

              <div className="flex flex-wrap gap-3 mt-8">
                <span className="px-4 py-2 rounded-full bg-[#111111] text-white text-xs font-black uppercase tracking-wider">
                  3 Designs
                </span>

                <span className="px-4 py-2 rounded-full border border-[#DCCFB8] text-xs font-black uppercase tracking-wider">
                  S — XXL
                </span>

                <span className="px-4 py-2 rounded-full border border-[#DCCFB8] text-xs font-black uppercase tracking-wider">
                  Made for Rhythm
                </span>
              </div>
            </div>

            <div className="lg:text-right">
              <p className="text-sm font-bold text-[#777777]">
                Rhythm of India
              </p>

              <p className="text-2xl font-black font-mono mt-2">
                THE MERCH EDIT
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="px-5 pb-24">
        <div className="max-w-7xl mx-auto">

          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] font-black text-[#B42318]">
                Collection 01
              </p>

              <h2 className="text-3xl sm:text-4xl font-black uppercase mt-2">
                The Rhythm Edit
              </h2>
            </div>

            <button
              onClick={() =>
                setCartOpen(true)
              }
              className="hidden sm:flex items-center gap-2 px-5 py-3 rounded-full bg-[#111111] text-white text-xs font-black uppercase tracking-wider hover:bg-[#B42318] transition-colors cursor-pointer"
            >
              <ShoppingBag size={15} />
              Cart · {itemCount}
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            {products.map((product, index) => (
              <motion.article
                key={product.id}
                initial={{
                  opacity: 0,
                  y: 24,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                  amount: 0.15,
                }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.08,
                }}
                className="group bg-white rounded-[28px] overflow-hidden border border-[#E8DEC8] shadow-sm hover:shadow-xl transition-shadow"
              >

                {/* PRODUCT IMAGE */}
                <div className="relative aspect-square bg-[#EEE5D6] overflow-hidden">

                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-[1.03] transition-transform duration-700"
                  />

                  {product.badge && (
                    <div className="absolute top-5 left-5 bg-[#B42318] text-white px-3 py-2 rounded-full text-[10px] font-black tracking-wider">
                      {product.badge}
                    </div>
                  )}
                </div>

                {/* DETAILS */}
                <div className="p-6">

                  <div className="flex items-start justify-between gap-4">

                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#777777]">
                        Rhythm of India
                      </p>

                      <h3 className="text-xl font-black uppercase mt-1">
                        {product.name}
                      </h3>
                    </div>

                    <p className="font-black font-mono text-lg whitespace-nowrap">
                      ₹
                      {product.price.toLocaleString(
                        "en-IN"
                      )}
                    </p>

                  </div>

                  <p className="text-sm text-[#777777] leading-relaxed mt-4">
                    {product.description}
                  </p>

                  {/* SIZE */}
                  <div className="mt-6">

                    <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#777777] mb-3">
                      Select Size
                    </p>

                    <div className="flex gap-2">
                      {productSizes.map(
                        (size) => (
                          <button
                            key={size}
                            type="button"
                            onClick={() =>
                              setSelectedSizes(
                                (current) => ({
                                  ...current,
                                  [product.id]:
                                    size,
                                })
                              )
                            }
                            className={`w-10 h-10 rounded-full text-xs font-black border transition-all cursor-pointer ${
                              selectedSizes[
                                product.id
                              ] === size
                                ? "bg-[#111111] text-white border-[#111111]"
                                : "bg-white border-[#DCCFB8] hover:border-[#B42318]"
                            }`}
                          >
                            {size}
                          </button>
                        )
                      )}
                    </div>

                  </div>

                  {/* ACTIONS */}
                  <div className="flex gap-2 mt-6">

                    <button
                      type="button"
                      onClick={() =>
                        handleAddToCart(
                          product.id
                        )
                      }
                      className="flex-1 py-3.5 rounded-xl bg-[#B42318] hover:bg-[#922018] text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      {addedProduct ===
                      product.id ? (
                        <>
                          <Check size={16} />
                          Added
                        </>
                      ) : (
                        <>
                          <ShoppingCart
                            size={16}
                          />
                          Add to Cart
                        </>
                      )}
                    </button>

                    <Link
                      href={`/product-checkout?product=${product.id}&size=${
                        selectedSizes[
                          product.id
                        ] || "M"
                      }`}
                      className="w-12 rounded-xl border border-[#DCCFB8] bg-[#FDFBF7] flex items-center justify-center hover:border-[#111111] transition-colors"
                    >
                      <ArrowRight
                        size={17}
                      />
                    </Link>

                  </div>

                </div>
              </motion.article>
            ))}

          </div>
        </div>
      </section>

      {/* MOBILE CART BUTTON */}
      <button
        type="button"
        onClick={() =>
          setCartOpen(true)
        }
        className="sm:hidden fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-[#B42318] text-white shadow-2xl flex items-center justify-center cursor-pointer"
      >
        <ShoppingBag size={21} />

        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#111111] text-white text-[10px] font-black flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </button>

      {/* CART OVERLAY */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              onClick={() =>
                setCartOpen(false)
              }
              className="fixed inset-0 bg-black/40 z-40"
            />

            <motion.aside
              initial={{
                x: "100%",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "100%",
              }}
              transition={{
                type: "spring",
                damping: 28,
                stiffness: 280,
              }}
              className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-[#FDFBF7] z-50 shadow-2xl flex flex-col"
            >

              {/* CART HEADER */}
              <div className="p-6 border-b border-[#E8DEC8] flex items-center justify-between">

                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#B42318]">
                    Rhythm of India
                  </p>

                  <h2 className="text-2xl font-black uppercase mt-1">
                    Your Cart
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCartOpen(false)
                  }
                  className="w-10 h-10 rounded-full border border-[#DCCFB8] flex items-center justify-center cursor-pointer hover:bg-[#111111] hover:text-white transition-colors"
                >
                  <X size={18} />
                </button>

              </div>

              {/* ITEMS */}
              <div className="flex-1 overflow-y-auto p-6">

                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">

                    <div className="w-16 h-16 rounded-full bg-[#EEE5D6] flex items-center justify-center mb-5">
                      <ShoppingBag
                        size={25}
                      />
                    </div>

                    <h3 className="font-black uppercase text-lg">
                      Your cart is empty
                    </h3>

                    <p className="text-sm text-[#777777] mt-2">
                      Pick a piece from the
                      collection.
                    </p>

                  </div>
                ) : (
                  <div className="space-y-5">

                    {items.map((item) => (
                      <div
                        key={`${item.product.id}-${item.size}`}
                        className="flex gap-4"
                      >

                        <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-[#EEE5D6] shrink-0">
                          <Image
                            src={
                              item.product.image
                            }
                            alt={
                              item.product.name
                            }
                            fill
                            className="object-cover"
                          />
                        </div>

                        <div className="flex-1 min-w-0">

                          <div className="flex justify-between gap-3">
                            <div>
                              <h3 className="font-black text-sm uppercase">
                                {
                                  item.product
                                    .name
                                }
                              </h3>

                              <p className="text-xs text-[#777777] mt-1">
                                Size:{" "}
                                <strong className="text-[#111111]">
                                  {item.size}
                                </strong>
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeFromCart(
                                  item.product
                                    .id,
                                  item.size
                                )
                              }
                              className="text-[#777777] hover:text-[#B42318] cursor-pointer"
                            >
                              <Trash2
                                size={15}
                              />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-4">

                            <div className="flex items-center border border-[#DCCFB8] rounded-lg">

                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.product
                                      .id,
                                    item.size,
                                    item.quantity -
                                      1
                                  )
                                }
                                className="w-8 h-8 flex items-center justify-center cursor-pointer"
                              >
                                <Minus
                                  size={13}
                                />
                              </button>

                              <span className="w-8 text-center text-xs font-black">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() =>
                                  updateQuantity(
                                    item.product
                                      .id,
                                    item.size,
                                    item.quantity +
                                      1
                                  )
                                }
                                className="w-8 h-8 flex items-center justify-center cursor-pointer"
                              >
                                <Plus
                                  size={13}
                                />
                              </button>

                            </div>

                            <p className="font-black font-mono text-sm">
                              ₹
                              {(
                                item.product
                                  .price *
                                item.quantity
                              ).toLocaleString(
                                "en-IN"
                              )}
                            </p>

                          </div>

                        </div>
                      </div>
                    ))}

                  </div>
                )}
              </div>

              {/* CART FOOTER */}
              {items.length > 0 && (
                <div className="border-t border-[#E8DEC8] p-6 bg-white">

                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-[#777777]">
                      Subtotal
                    </span>

                    <span className="font-black">
                      ₹
                      {subtotal.toLocaleString(
                        "en-IN"
                      )}
                    </span>
                  </div>

                  <p className="text-[10px] text-[#777777] mb-5">
                    Shipping calculated at
                    checkout.
                  </p>

                  <Link
                    href="/product-checkout"
                    onClick={() =>
                      setCartOpen(false)
                    }
                    className="w-full py-4 rounded-xl bg-[#B42318] hover:bg-[#922018] text-white flex items-center justify-center gap-2 font-black text-xs uppercase tracking-wider transition-colors"
                  >
                    Checkout
                    <ArrowRight size={16} />
                  </Link>

                </div>
              )}

            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}