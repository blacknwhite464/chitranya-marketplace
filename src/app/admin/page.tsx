"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, onSnapshot, orderBy, query, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";

const ADMIN_UID = "28jNe77DmcY7fgGrKhKNgwubDCa2";
type Order = {
  id: string;
  orderId?: string;
  customerName?: string;
  phone?: string;
  address?: string;
  city?: string;
  notes?: string;
  paymentMethod?: string;
  total?: number;
  itemCount?: number;
  status?: string;
  items?: { name: string; quantity: number; price: number }[];
  createdAt?: { toDate?: () => Date };
};

const money = (value = 0) => "NPR " + value.toLocaleString("en-IN");

export default function AdminDashboardPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [checking, setChecking] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribeOrders: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user || user.uid !== ADMIN_UID) {
        if (user) void signOut(auth);
        router.replace("/admin/login/");
        setChecking(false);
        return;
      }

      setChecking(false);
      const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      unsubscribeOrders = onSnapshot(
        ordersQuery,
        (snapshot) => {
          setOrders(snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Order)));
          setLoadingOrders(false);
          setError("");
        },
        (snapshotError) => {
          console.error("Could not load orders:", snapshotError);
          setError("Could not load orders. Check your Firestore rules and internet connection.");
          setLoadingOrders(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeOrders?.();
    };
  }, [router]);

  async function changeStatus(orderId: string, status: string) {
    try {
      await updateDoc(doc(db, "orders", orderId), { status });
    } catch (updateError) {
      console.error("Could not update order:", updateError);
      setError("Could not update this order. Please try again.");
    }
  }

  async function logout() {
    await signOut(auth);
    router.replace("/admin/login/");
  }

  if (checking) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Checking admin access...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-slate-950 px-5 py-5 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div><p className="text-sm font-bold tracking-[0.2em] text-orange-400">CHITRANYA</p><h1 className="text-2xl font-black">Admin Dashboard</h1></div>
          <div className="flex flex-wrap gap-2"><a href="/admin/products/" className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold hover:bg-slate-800">Products</a><a href="/admin/categories/" className="rounded-lg border border-orange-500 px-3 py-2 text-sm font-semibold text-orange-300 hover:bg-slate-800">Categories</a><button onClick={logout} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold hover:bg-slate-800">Sign out</button></div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Total orders</p><p className="mt-1 text-3xl font-black text-slate-900">{orders.length}</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Pending orders</p><p className="mt-1 text-3xl font-black text-orange-600">{orders.filter((order) => order.status === "Pending").length}</p></div>
          <div className="rounded-2xl bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">Order value</p><p className="mt-1 text-3xl font-black text-slate-900">{money(orders.reduce((sum, order) => sum + (order.total || 0), 0))}</p></div>
        </div>

        <div className="mb-5"><h2 className="text-2xl font-black text-slate-900">Customer Orders</h2><p className="mt-1 text-sm text-slate-600">Orders are updated live from Firestore.</p></div>
        {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {loadingOrders ? <p className="rounded-xl bg-white p-6 text-slate-600">Loading orders...</p> : orders.length === 0 ? <p className="rounded-xl bg-white p-6 text-slate-600">No orders have been placed yet.</p> : (
          <div className="space-y-4">
            {orders.map((order) => (
              <article key={order.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div><p className="font-black text-slate-900">{order.orderId || order.id}</p><p className="mt-1 text-sm text-slate-500">{order.createdAt?.toDate ? order.createdAt.toDate().toLocaleString() : "Date unavailable"}</p></div>
                  <select aria-label="Order status" value={order.status || "Pending"} onChange={(event) => void changeStatus(order.id, event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800">
                    {["Pending", "Processing", "Shipped", "Delivered", "Cancelled"].map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div><h3 className="font-bold text-slate-800">Customer</h3><p className="mt-1 text-sm text-slate-700">{order.customerName || "—"} · {order.phone || "—"}</p><p className="text-sm text-slate-600">{order.address || ""}, {order.city || ""}</p>{order.notes && <p className="mt-1 text-sm text-slate-500">Note: {order.notes}</p>}</div>
                  <div><h3 className="font-bold text-slate-800">Items</h3><div className="mt-1 space-y-1 text-sm text-slate-700">{(order.items || []).map((item, index) => <p key={index}>{item.name} × {item.quantity} — {money(item.price * item.quantity)}</p>)}</div><p className="mt-2 font-black text-slate-900">Total: {money(order.total || 0)}</p></div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
