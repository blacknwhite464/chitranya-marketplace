"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/context/CartContext";

const formatPrice = (price: number) => "NPR " + price.toLocaleString("en-IN");

export default function CheckoutPage() {
  const router = useRouter();
  const { items, itemCount, removeFromCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
        emoji: item.emoji,
        quantity: item.quantity,
      })),
      itemCount,
      total,
      status: "Pending",
    };

    try {
      await addDoc(collection(db, "orders"), {
        ...order,
        createdAt: serverTimestamp(),
      });

      try {
        localStorage.setItem(
          "chitranya-last-order",
          JSON.stringify({ ...order, placedAt: new Date().toISOString() })
        );
      } catch {
        // The Firestore order is already saved; confirmation can still proceed.
      }

      items.forEach((item) => removeFromCart(item.id));
      router.push("/order-confirmation/");
    } catch (err) {
      console.error("Order submission failed:", err);
      setError("We could not submit your order. Please check your internet connection and try again. If the problem continues, contact CHITRANYA.");
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <div className="text-6xl">🛒</div>
        <h1 className="mt-4 text-3xl font-black text-slate-900">Your cart is empty</h1>
        <p className="mt-2 text-slate-600">Add products before proceeding to checkout.</p>
        <Link href="/products/" className="mt-6 rounded-lg bg-blue-800 px-6 py-3 font-bold text-white">Explore Products</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 px-6 py-5 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-black">CHITRANYA<span className="text-orange-500">.</span></Link>
          <Link href="/cart/" className="font-semibold hover:text-orange-400">← Back to Cart ({itemCount})</Link>
        </div>
      </header>

      <section className="bg-gradient-to-r from-blue-950 to-blue-800 px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="font-bold uppercase tracking-widest text-orange-400">CHITRANYA Marketplace</p>
          <h1 className="mt-3 text-4xl font-black">Checkout</h1>
          <p className="mt-3 text-slate-300">Enter your delivery details to place your order.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-3">
        <form onSubmit={placeOrder} className="space-y-5 rounded-2xl border bg-white p-6 shadow-sm lg:col-span-2 md:p-8">
          <h2 className="text-2xl font-black">Delivery Information</h2>
          <div>
            <label htmlFor="customerName" className="mb-2 block text-sm font-bold">Full Name *</label>
            <input id="customerName" required maxLength={100} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Enter your full name" className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-700" />
          </div>
          <div>
            <label htmlFor="phone" className="mb-2 block text-sm font-bold">Phone Number *</label>
            <input id="phone" required type="tel" inputMode="tel" pattern="[0-9+() -]{7,20}" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="98XXXXXXXX" className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-700" />
            <p className="mt-1 text-xs text-slate-500">Enter a phone number where our team can contact you.</p>
          </div>
          <div>
            <label htmlFor="address" className="mb-2 block text-sm font-bold">Delivery Address *</label>
            <textarea id="address" required maxLength={500} rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="House number, street, area or landmark" className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-700" />
          </div>
          <div>
            <label htmlFor="city" className="mb-2 block text-sm font-bold">City / Municipality *</label>
            <input id="city" required maxLength={100} value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Kathmandu" className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-700" />
          </div>
          <div>
            <label htmlFor="notes" className="mb-2 block text-sm font-bold">Order Notes (Optional)</label>
            <textarea id="notes" maxLength={1000} rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any delivery instructions?" className="w-full rounded-lg border px-4 py-3 outline-none focus:border-blue-700" />
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-5">
            <p className="font-bold text-slate-900">Payment Method</p>
            <p className="mt-2 font-semibold text-green-800">Cash on Delivery (COD)</p>
            <p className="mt-1 text-sm text-slate-600">Pay when your order is delivered. Online payment is not enabled yet.</p>
          </div>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full rounded-lg bg-orange-500 px-6 py-4 font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">
            {submitting ? "Submitting Order..." : `Place Order — ${formatPrice(total)}`}
          </button>
          <p className="text-xs text-slate-500">Your order will be saved to CHITRANYA's Firestore database.</p>
        </form>

        <aside className="h-fit rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Your Order</h2>
          <div className="mt-5 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <div><p className="font-semibold">{item.name}</p><p className="text-slate-500">Qty: {item.quantity}</p></div>
                <p className="shrink-0 font-bold">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
          <div className="my-5 border-t" />
          <div className="flex justify-between text-slate-600"><span>Total items</span><span>{itemCount}</span></div>
          <div className="mt-3 flex justify-between text-lg font-black"><span>Total</span><span className="text-blue-900">{formatPrice(total)}</span></div>
          <p className="mt-3 text-xs text-slate-500">Delivery charges, if any, will be confirmed by our team.</p>
        </aside>
      </section>
      <footer className="bg-slate-950 px-6 py-8 text-center text-sm text-slate-400">© 2026 CHITRANYA. All rights reserved.</footer>
    </main>
  );
}
