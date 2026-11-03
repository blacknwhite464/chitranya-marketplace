"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

const formatPrice = (price: number) => "NPR " + price.toLocaleString("en-IN");

export default function CartPage() {
  const { items, updateQuantity, removeFromCart, itemCount } = useCart();
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-slate-950 px-6 py-5 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-black">CHITRANYA<span className="text-orange-500">.</span></Link>
          <nav className="flex flex-wrap gap-5 text-sm font-semibold">
            <Link href="/" className="hover:text-orange-400">Home</Link>
            <Link href="/products/" className="hover:text-orange-400">Products</Link>
            <Link href="/#electronics" className="hover:text-orange-400">Electronics</Link>
            <Link href="/#hardware" className="hover:text-orange-400">Hardware</Link>
            <Link href="/#services" className="hover:text-orange-400">Services</Link>
            <Link href="/#contact" className="hover:text-orange-400">Contact</Link>
          </nav>
          <span className="rounded-lg bg-white/10 px-4 py-2">🛒 Cart: {itemCount}</span>
        </div>
      </header>

      <section className="bg-gradient-to-r from-blue-950 to-blue-800 px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="font-bold uppercase tracking-widest text-orange-400">CHITRANYA Marketplace</p>
          <h1 className="mt-3 text-4xl font-black">Your Shopping Cart</h1>
          <p className="mt-3 text-slate-300">Review your selected products and quantities.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-12 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {items.length === 0 ? (
            <div className="rounded-2xl border bg-white p-10 text-center">
              <div className="text-6xl">🛒</div>
              <h2 className="mt-4 text-2xl font-black">Your cart is empty</h2>
              <p className="mt-2 text-slate-500">Add products to your cart to see them here.</p>
              <Link href="/products/" className="mt-6 inline-block rounded-lg bg-blue-800 px-6 py-3 font-bold text-white hover:bg-blue-900">Explore Products</Link>
            </div>
          ) : items.map((item) => (
            <article key={item.id} className="flex flex-col gap-5 rounded-2xl border bg-white p-5 sm:flex-row sm:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-5xl">{item.emoji}</div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-700">{item.category}</p>
                <h2 className="mt-1 text-lg font-bold">{item.name}</h2>
                <p className="mt-1 font-bold text-blue-900">{formatPrice(item.price)}</p>
              </div>
              <div className="flex items-center gap-3">
                <button aria-label={"Decrease quantity of " + item.name} onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="h-9 w-9 rounded-lg border font-bold disabled:opacity-40">−</button>
                <span className="min-w-6 text-center font-bold">{item.quantity}</span>
                <button aria-label={"Increase quantity of " + item.name} onClick={() => updateQuantity(item.id, item.quantity + 1)} className="h-9 w-9 rounded-lg border font-bold">+</button>
              </div>
              <div className="sm:text-right">
                <p className="font-black">{formatPrice(item.price * item.quantity)}</p>
                <button onClick={() => removeFromCart(item.id)} className="mt-2 text-sm font-semibold text-red-600 hover:text-red-800">Remove</button>
              </div>
            </article>
          ))}
        </div>

        <aside className="h-fit rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Order Summary</h2>
          <div className="mt-5 flex justify-between text-slate-600"><span>Items</span><span>{itemCount}</span></div>
          <div className="mt-3 flex justify-between text-slate-600"><span>Subtotal</span><span>{formatPrice(subtotal)}</span></div>
          <div className="my-5 border-t" />
          <div className="flex justify-between text-lg font-black"><span>Total</span><span className="text-blue-900">{formatPrice(subtotal)}</span></div>
          <p className="mt-3 text-xs text-slate-500">Delivery charges, if any, will be confirmed during checkout.</p>
          <button disabled className="mt-6 w-full cursor-not-allowed rounded-lg bg-slate-300 px-5 py-4 font-bold text-slate-600">Checkout — Coming Next</button>
          <Link href="/products/" className="mt-4 block text-center font-semibold text-blue-700 hover:text-blue-900">Continue Shopping</Link>
        </aside>
      </section>

      <footer className="bg-slate-950 px-6 py-8 text-center text-sm text-slate-400">© 2026 CHITRANYA. All rights reserved.</footer>
    </main>
  );
}
