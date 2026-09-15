"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";

import { products } from "@/data/products";

export default function MerchSection() {
  return (
    <section
      id="costume-shop"
      className="relative overflow-hidden rounded-[36px] border border-[#E8DEC8] bg-[#F8F1E6] p-6 text-[#111111] shadow-sm sm:p-10 lg:p-12"
    >
      <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#B42318]/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-[#D65A1F]/10 blur-3xl" />

      <div className="relative">
        <div className="flex flex-col gap-6 border-b border-[#D8CBB7] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#B42318]/20 bg-[#B42318]/10 px-3 py-1.5 font-mono text-[10px] font-black tracking-[0.2em] text-[#B42318]">
              <ShoppingBag size={13} />
              COSTUME SHOP
            </div>

            <h2 className="max-w-3xl text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-6xl">
              Wear the tradition.
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-black/55 sm:text-base">
              Authentic dance attire for Rhythm of India academy learners,
              designed for training, rehearsals and performances across
              India&apos;s classical dance traditions.
            </p>
          </div>

          <Link
            href="/products"
            className="group inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#B42318] px-6 py-3.5 text-sm font-black text-white transition duration-300 hover:-translate-y-1 hover:bg-[#921C14]"
          >
            Shop Costumes
            <ArrowRight
              size={17}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {products.map((product) => (
            <article
              key={product.id}
              className="group overflow-hidden rounded-[28px] border border-[#E0D4C1] bg-white transition duration-300 hover:-translate-y-2 hover:shadow-xl"
            >
              <Link href={`/products?product=${product.id}`} className="block">
                <div className="relative aspect-[4/4.7] overflow-hidden bg-[#EEE5D7]">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />

                  {product.badge && (
                    <span
                      className="absolute left-4 top-4 rounded-full px-3 py-1.5 text-[9px] font-black tracking-[0.15em] text-white"
                      style={{ backgroundColor: product.accent }}
                    >
                      {product.badge}
                    </span>
                  )}
                </div>
              </Link>

              <div className="p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#777777]">
                  {product.category}
                </p>

                <div className="mt-2 flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight">
                      {product.name}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-black/50">
                      {product.description}
                    </p>
                  </div>

                  <span className="shrink-0 text-lg font-black text-[#B42318]">
                    ₹{product.price.toLocaleString("en-IN")}
                  </span>
                </div>

                <Link
                  href={`/products?product=${product.id}`}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-full border border-[#B42318]/20 bg-[#B42318]/5 px-5 py-3 text-xs font-black uppercase tracking-wider text-[#B42318] transition hover:bg-[#B42318] hover:text-white"
                >
                  View Costume
                  <ArrowRight size={14} />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-7 flex flex-col gap-3 border-t border-[#D8CBB7] pt-6 text-xs font-bold text-black/45 sm:flex-row sm:items-center sm:justify-between">
          <span>
            AUTHENTIC ATTIRE · PERFORMANCE READY · CLASSICAL ROOTS
          </span>

          <Link
            href="/products"
            className="font-black text-[#B42318] transition hover:text-[#921C14]"
          >
            Explore the costume collection →
          </Link>
        </div>
      </div>
    </section>
  );
}
