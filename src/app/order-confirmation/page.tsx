"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type SavedOrder = {
  orderId: string;
  customerName: string;
  phone: string;
  address: string;
  city: string;
  paymentMethod: string;
  total: number;
  itemCount: number;
  items: { id: number; name: string; quantity: number; price: number }[];
};

const formatPrice = (price: number) => "NPR " + price.toLocaleString("en-IN");

export default function OrderConfirmationPage() {
  const [order, setOrder] = useState<SavedOrder | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("chitranya-last-order");
      if (saved) setOrder(JSON.parse(saved) as SavedOrder);
    } catch {
      setOrder(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <section className="w-full max-w-2xl rounded-2xl border bg-white p-8 text-center shadow-sm md:p-12">
        {!loaded ? <p className="text-slate-500">Loading your order...</p> : order ? (
          <>
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl text-green-700">✓</div>
            <p className="mt-6 font-bold uppercase tracking-widest text-green-700">Order placed</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">Thank you, {order.customerName}!</h1>
            <p className="mt-3 text-slate-600">Your order details have been saved on this device.</p>
            <div className="mt-8 rounded-xl bg-slate-50 p-6 text-left">
              <div className="flex justify-between gap-4"><span className="text-slate-500">Order reference</span><strong>{order.orderId}</strong></div>
              <div className="mt-3 flex justify-between gap-4"><span className="text-slate-500">Items</span><strong>{order.itemCount}</strong></div>
              <div className="mt-3 flex justify-between gap-4"><span className="text-slate-500">Payment</span><strong>{order.paymentMethod}</strong></div>
              <div className="mt-3 flex justify-between gap-4"><span className="text-slate-500">Total</span><strong className="text-blue-900">{formatPrice(order.total)}</strong></div>
              <div className="mt-4 border-t pt-4">
                <p className="font-bold">Delivery to</p>
                <p className="mt-1 text-sm text-slate-600">{order.customerName} · {order.phone}</p>
                <p className="text-sm text-slate-600">{order.address}, {order.city}</p>
              </div>
              <div className="mt-4 border-t pt-4">
                <p className="font-bold">Products</p>
                {order.items.map((item) => <div key={item.id} className="mt-2 flex justify-between gap-3 text-sm"><span>{item.name} × {item.quantity}</span><span className="font-semibold">{formatPrice(item.price * item.quantity)}</span></div>)}
              </div>
            </div>
            <p className="mt-5 text-sm text-amber-700">Demo order only: CHITRANYA has not received this order yet. A live order system will be connected to a database in a later step.</p>
            <Link href="/products/" className="mt-8 inline-block rounded-lg bg-blue-800 px-6 py-3 font-bold text-white hover:bg-blue-900">Continue Shopping</Link>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-black">No order found</h1>
            <p className="mt-3 text-slate-600">Please add products and complete checkout first.</p>
            <Link href="/products/" className="mt-6 inline-block rounded-lg bg-blue-800 px-6 py-3 font-bold text-white">Explore Products</Link>
          </>
        )}
      </section>
    </main>
  );
}
