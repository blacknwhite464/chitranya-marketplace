
"use client";

import { useState, type FormEvent } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useCart } from "@/context/CartContext";

const formatPrice = (price: number) =>
  "NPR " + price.toLocaleString("en-IN");

export default function CheckoutPage() {
  const { items, itemCount, removeFromCart } = useCart();

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  async function placeOrder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting) return;

    setError("");

    if (items.length === 0) {
      setError("Your cart is empty. Please add a product before placing an order.");
      return;
    }

    setSubmitting(true);

    const orderId = "CHT-" + Date.now();

    const order = {
      orderId,
      customerName: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      notes: notes.trim(),
      paymentMethod: "Cash on Delivery",
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        imageUrl: item.imageUrl ?? "",
        quantity: item.quantity,
      })),
      itemCount,
      total,
      status: "Pending",
      ...(auth.currentUser ? { userId: auth.currentUser.uid } : {}),
    };

    try {
      await addDoc(collection(db, "orders"), {
        ...order,
        createdAt: serverTimestamp(),
      });

      try {
        localStorage.setItem(
          "chitranya-last-order",
          JSON.stringify({
            ...order,
            placedAt: new Date().toISOString(),
          })
        );
      } catch {
        // The Firestore order has already been saved.
      }

      items.forEach((item) => removeFromCart(item.id));

      window.location.href = "/order-confirmation/";
    } catch (err) {
      console.error("Order submission failed:", err);

      setError(
        "We could not submit your order. Please check your internet connection and try again. If the problem continues, contact CHITRANYA."
      );

      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-orange-50 text-6xl">
          🛒
        </div>

        <h1 className="mt-6 text-3xl font-black text-slate-900">
          Your Cart is Empty
        </h1>

        <p className="mt-3 text-slate-600">
          Add products before proceeding to checkout.
        </p>

        <a
          href="/products/"
          className="mt-7 rounded-xl bg-orange-500 px-7 py-4 font-bold text-white transition hover:bg-orange-600"
        >
          Explore Products →
        </a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* Announcement */}
      <div className="bg-slate-950 px-4 py-2.5 text-center text-xs font-medium text-white sm:text-sm">
        Welcome to CHITRANYA — Your Shopping Destination
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">

          <a href="/" className="text-2xl font-black tracking-tight text-blue-950 sm:text-3xl">
            CHITRANYA<span className="text-orange-500">.</span>
            <span className="ml-1 block text-[9px] font-bold tracking-[0.28em] text-slate-500">
              SHOP • SERVICES • SOLUTIONS
            </span>
          </a>

          <nav className="order-3 flex w-full gap-6 overflow-x-auto whitespace-nowrap text-sm font-semibold text-slate-600 md:order-2 md:w-auto">
            <a href="/" className="hover:text-orange-500">Home</a>
            <a href="/products/" className="hover:text-orange-500">Products</a>
            <a href="/#electronics" className="hover:text-orange-500">Electronics</a>
            <a href="/#hardware" className="hover:text-orange-500">Hardware</a>
            <a href="/#services" className="hover:text-orange-500">Services</a>
          </nav>

          <a
            href="/cart/"
            className="order-2 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white md:order-3"
          >
            🛒 Cart ({itemCount})
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-950 via-slate-900 to-slate-950 px-6 py-14 text-white sm:py-16">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-400">
            CHITRANYA Marketplace
          </p>

          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Secure Your Order
          </h1>

          <p className="mt-4 max-w-xl leading-7 text-slate-300">
            Almost there! Enter your delivery details and review your
            order before placing it.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="mx-auto max-w-7xl px-6 pt-7 text-sm text-slate-500">
        <a href="/" className="hover:text-orange-600">Home</a>
        <span className="mx-2">/</span>
        <a href="/cart/" className="hover:text-orange-600">Cart</a>
        <span className="mx-2">/</span>
        <span className="font-semibold text-slate-900">Checkout</span>
      </div>

      {/* Checkout content */}
      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-3">

        {/* Customer form */}
        <form
          onSubmit={placeOrder}
          className="space-y-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 lg:col-span-2"
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">
              Step 1
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Delivery Information
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Please provide accurate information so we can deliver your order.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">

            {/* Full name */}
            <div className="sm:col-span-2">
              <label htmlFor="customerName" className="mb-2 block text-sm font-bold">
                Full Name *
              </label>

              <input
                id="customerName"
                type="text"
                required
                maxLength={100}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-blue-700 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Phone */}
            <div className="sm:col-span-2">
              <label htmlFor="phone" className="mb-2 block text-sm font-bold">
                Phone Number *
              </label>

              <input
                id="phone"
                type="tel"
                required
                pattern="[0-9]{7,20}"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="98XXXXXXXX"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-blue-700 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-2 text-xs text-slate-500">
                Enter a phone number where our team can contact you.
              </p>
            </div>

            {/* Address */}
            <div className="sm:col-span-2">
              <label htmlFor="address" className="mb-2 block text-sm font-bold">
                Delivery Address *
              </label>

              <textarea
                id="address"
                required
                maxLength={500}
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="House number, street, area or landmark"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-blue-700 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* City */}
            <div className="sm:col-span-2">
              <label htmlFor="city" className="mb-2 block text-sm font-bold">
                City / Municipality *
              </label>

              <input
                id="city"
                type="text"
                required
                maxLength={100}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Kathmandu"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-blue-700 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Notes */}
            <div className="sm:col-span-2">
              <label htmlFor="notes" className="mb-2 block text-sm font-bold">
                Order Notes
                <span className="ml-2 font-normal text-slate-400">
                  (Optional)
                </span>
              </label>

              <textarea
                id="notes"
                maxLength={1000}
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any delivery instructions?"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 outline-none transition focus:border-blue-700 focus:bg-white focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Payment method */}
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">
              Step 2
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Payment Method
            </h2>

            <div className="mt-5 rounded-2xl border-2 border-green-200 bg-green-50 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                  💵
                </div>

                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-black text-slate-900">
                      Cash on Delivery
                    </p>

                    <span className="rounded-full bg-green-100 px-3 py-1 text-[10px] font-black uppercase text-green-800">
                      Available
                    </span>
                  </div>

                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Pay when your order is delivered. Our team will
                    contact you to confirm your order.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              Online payment options are not enabled yet.
            </p>
          </div>

          {/* Error */}
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700"
            >
              {error}
            </p>
          )}

          {/* Submit */}
          <div className="border-t border-slate-100 pt-6">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-orange-500 px-6 py-4 font-black text-white shadow-md transition hover:-translate-y-0.5 hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting
                ? "Submitting Your Order..."
                : `Place Order — ${formatPrice(total)}`}
            </button>

            <p className="mt-4 text-center text-xs leading-5 text-slate-500">
              By placing your order, you confirm that your delivery
              information is correct.
            </p>
          </div>
        </form>

        {/* Order summary */}
        <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-28">

          <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">
            Step 3
          </p>

          <h2 className="mt-2 text-2xl font-black">
            Order Summary
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Review your selected products.
          </p>

          <div className="mt-7 space-y-5">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-3xl">
                  {item.emoji}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-bold text-slate-900">
                    {item.name}
                  </p>

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

          <div className="my-6 border-t border-dashed border-slate-300" />

          <div className="space-y-4">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Total Items</span>
              <span className="font-bold text-slate-900">{itemCount}</span>
            </div>

            <div className="flex justify-between text-sm text-slate-600">
              <span>Subtotal</span>
              <span className="font-bold text-slate-900">
                {formatPrice(total)}
              </span>
            </div>

            <div className="flex justify-between text-sm text-slate-600">
              <span>Delivery</span>
              <span className="font-semibold text-orange-600">
                To be confirmed
              </span>
            </div>
          </div>

          <div className="my-6 border-t border-slate-200" />

          <div className="flex items-center justify-between gap-3">
            <span className="text-lg font-black">Order Total</span>
            <span className="text-xl font-black text-blue-950">
              {formatPrice(total)}
            </span>
          </div>

          <p className="mt-3 text-xs leading-5 text-slate-500">
            Delivery charges, if any, will be confirmed by our team.
          </p>

          <a
            href="/cart/"
            className="mt-7 block rounded-xl border border-slate-200 px-5 py-3.5 text-center text-sm font-bold text-blue-950 transition hover:bg-slate-50"
          >
            ← Back to Cart
          </a>

          <div className="mt-6 space-y-3 border-t border-slate-100 pt-6 text-xs text-slate-500">
            <p>✓ Convenient shopping experience</p>
            <p>✓ Cash on Delivery available</p>
            <p>✓ Order confirmation after submission</p>
          </div>
        </aside>
      </section>

      {/* Footer */}
      <footer className="mt-10 bg-slate-950 px-6 py-10 text-center text-slate-400">
        <a href="/" className="text-2xl font-black text-white">
          CHITRANYA<span className="text-orange-500">.</span>
        </a>

        <p className="mt-3 text-sm">
          Electronics • Hardware • Home Services
        </p>

        <div className="mt-6 flex justify-center gap-6 text-sm">
          <a href="/" className="hover:text-orange-400">Home</a>
          <a href="/products/" className="hover:text-orange-400">Products</a>
          <a href="/cart/" className="hover:text-orange-400">Cart</a>
        </div>

        <p className="mt-8 border-t border-white/10 pt-6 text-xs text-slate-500">
          © 2026 CHITRANYA. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
