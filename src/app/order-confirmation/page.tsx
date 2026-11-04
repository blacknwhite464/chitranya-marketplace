
"use client";

import { useEffect, useState } from "react";

type SavedOrder = {
  orderId: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  paymentMethod: string;
  total: number;
  itemCount: number;
  items: {
    id: number;
    name: string;
    quantity: number;
    price: number;
    emoji?: string;
    category?: string;
  }[];
};

const formatPrice = (price: number) =>
  "NPR " + price.toLocaleString("en-IN");

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<SavedOrder | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("chitranya-last-order");

      if (saved) {
        setOrder(JSON.parse(saved) as SavedOrder);
      }
    } catch {
      setOrder(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* Header */}
      <header className="border-b border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="/" className="text-2xl font-black tracking-tight text-blue-950 sm:text-3xl">
            CHITRANYA<span className="text-orange-500">.</span>
            <span className="ml-1 block text-[9px] font-bold tracking-[0.28em] text-slate-500">
              SHOP • SERVICES • SOLUTIONS
            </span>
          </a>

          <a
            href="/products/"
            className="text-sm font-bold text-blue-900 transition hover:text-orange-500"
          >
            Continue Shopping →
          </a>
        </div>
      </header>

      {!loaded ? (
        <div className="flex min-h-[70vh] items-center justify-center px-6">
          <p className="font-semibold text-slate-500">
            Loading your order...
          </p>
        </div>
      ) : order ? (
        <section className="mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-16">

          {/* Success message */}
          <div className="text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-8 border-green-50 bg-green-100 text-5xl text-green-700">
              ✓
            </div>

            <p className="mt-7 text-xs font-black uppercase tracking-[0.25em] text-green-700">
              Order Successfully Placed
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-blue-950 sm:text-5xl">
              Thank You, {order.customerName}!
            </h1>

            <p className="mx-auto mt-4 max-w-xl leading-7 text-slate-500">
              Your order has been submitted successfully to CHITRANYA.
              Our team can now review your order and contact you.
            </p>
          </div>

          {/* Order reference */}
          <div className="mt-10 rounded-3xl bg-gradient-to-r from-blue-950 to-slate-900 p-7 text-white shadow-lg sm:p-9">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-400">
                  Your Order Reference
                </p>

                <h2 className="mt-3 break-all text-2xl font-black sm:text-3xl">
                  {order.orderId}
                </h2>

                <p className="mt-2 text-sm text-slate-300">
                  Please keep this reference for future communication.
                </p>
              </div>

              <div className="w-fit rounded-xl border border-green-400/30 bg-green-400/10 px-5 py-3">
                <p className="text-xs font-bold uppercase text-green-300">
                  Order Status
                </p>
                <p className="mt-1 font-black text-white">
                  Pending Review
                </p>
              </div>
            </div>
          </div>

          {/* Order information */}
          <div className="mt-8 grid gap-6 md:grid-cols-2">

            {/* Delivery details */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-xl">
                  📍
                </div>

                <h2 className="text-lg font-black">
                  Delivery Information
                </h2>
              </div>

              <div className="mt-6 space-y-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Customer Name
                  </p>
                  <p className="mt-1 font-bold">{order.customerName}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Phone Number
                  </p>
                  <p className="mt-1 font-bold">{order.phone}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Delivery Address
                  </p>
                  <p className="mt-1 leading-6 text-slate-700">
                    {order.address}, {order.city}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment information */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-xl">
                  💵
                </div>

                <h2 className="text-lg font-black">
                  Payment Information
                </h2>
              </div>

              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Payment Method
                  </p>
                  <p className="mt-1 font-bold">
                    {order.paymentMethod}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Payment Status
                  </p>
                  <span className="mt-2 inline-block rounded-full bg-amber-100 px-4 py-2 text-xs font-bold text-amber-800">
                    Payment Pending
                  </span>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase text-slate-400">
                    Total Order Amount
                  </p>
                  <p className="mt-1 text-2xl font-black text-blue-950">
                    {formatPrice(order.total)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Product list */}
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black">
                Ordered Products
              </h2>

              <span className="rounded-full bg-blue-50 px-4 py-2 text-xs font-bold text-blue-900">
                {order.itemCount} Items
              </span>
            </div>

            <div className="mt-6 space-y-5">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 border-b border-slate-100 pb-5 last:border-0 last:pb-0"
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-3xl">
                    {item.emoji || "📦"}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900">
                      {item.name}
                    </p>

                    {item.category && (
                      <p className="mt-1 text-xs text-slate-500">
                        {item.category}
                      </p>
                    )}

                    <p className="mt-1 text-xs text-slate-500">
                      Quantity: {item.quantity}
                    </p>
                  </div>

                  <p className="shrink-0 text-sm font-black text-blue-950">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-7 border-t border-dashed border-slate-300 pt-6">
              <div className="flex justify-between gap-4 text-sm text-slate-500">
                <span>Total Items</span>
                <span className="font-bold text-slate-900">
                  {order.itemCount}
                </span>
              </div>

              <div className="mt-4 flex justify-between gap-4">
                <span className="text-lg font-black">Order Total</span>
                <span className="text-2xl font-black text-blue-950">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-black text-amber-900">
              What happens next?
            </p>

            <p className="mt-2 text-sm leading-7 text-amber-800">
              Our team will review your order and contact you using
              the phone number you provided. For Cash on Delivery,
              payment is collected when your order is delivered.
            </p>
          </div>

          {/* Action buttons */}
          <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/products/"
              className="rounded-xl bg-orange-500 px-8 py-4 text-center font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-orange-600"
            >
              Continue Shopping →
            </a>

            <a
              href="/"
              className="rounded-xl border border-slate-200 bg-white px-8 py-4 text-center font-bold text-blue-950 transition hover:bg-slate-100"
            >
              Back to Home
            </a>
          </div>
        </section>
      ) : (
        <section className="flex min-h-[70vh] items-center justify-center px-6 py-16">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-4xl">
              📦
            </div>

            <h1 className="mt-6 text-3xl font-black text-blue-950">
              No Recent Order Found
            </h1>

            <p className="mt-3 leading-7 text-slate-500">
              We couldn't find a recent order on this device.
              Please explore our products and complete checkout first.
            </p>

            <a
              href="/products/"
              className="mt-7 inline-block rounded-xl bg-orange-500 px-8 py-4 font-bold text-white transition hover:bg-orange-600"
            >
              Explore Products →
            </a>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-slate-950 px-6 py-10 text-center text-slate-400">
        <a href="/" className="text-2xl font-black text-white">
          CHITRANYA<span className="text-orange-500">.</span>
        </a>

        <p className="mt-3 text-sm">
          Electronics • Hardware • Home Services
        </p>

        <p className="mt-7 border-t border-white/10 pt-6 text-xs text-slate-500">
          © 2026 CHITRANYA. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
