"use client";

import { useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signOut, updateProfile, type User } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type HistoryItem = { id: string; orderId?: string; customerName?: string; total?: number; status?: string; createdAt?: { toDate?: () => Date }; service?: string; preferredDate?: string; preferredTime?: string; address?: string; city?: string; items?: { name: string; quantity: number }[] };
const money = (value = 0) => "NPR " + value.toLocaleString("en-IN");
const dateText = (value?: { toDate?: () => Date }) => value?.toDate ? value.toDate().toLocaleString() : "Date pending";

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [orders, setOrders] = useState<HistoryItem[]>([]);
  const [bookings, setBookings] = useState<HistoryItem[]>([]);

  useEffect(() => onAuthStateChanged(auth, (current) => { setUser(current); setChecking(false); }), []);

  useEffect(() => {
    if (!user) { setOrders([]); setBookings([]); return; }
    const stopOrders = onSnapshot(query(collection(db, "orders"), where("userId", "==", user.uid)), (snap) => setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as HistoryItem)).sort((a, b) => (b.createdAt?.toDate?.().getTime() || 0) - (a.createdAt?.toDate?.().getTime() || 0))), (err) => { console.error(err); setError("Could not load order history. Please check Firestore security rules and indexes."); });
    const stopBookings = onSnapshot(query(collection(db, "serviceBookings"), where("userId", "==", user.uid)), (snap) => setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as HistoryItem)).sort((a, b) => (b.createdAt?.toDate?.().getTime() || 0) - (a.createdAt?.toDate?.().getTime() || 0))), (err) => { console.error(err); setError("Could not load service history. Please check Firestore security rules and indexes."); });
    return () => { stopOrders(); stopBookings(); };
  }, [user]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setMessage(""); setBusy(true);
    try {
      if (mode === "register") {
        if (password.length < 6) throw new Error("Password must contain at least 6 characters.");
        const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await updateProfile(result.user, { displayName: name.trim() });
        setUser(result.user);
        await sendEmailVerification(result.user);
        setMessage("Account created. A verification email has been sent. You can now use your CHITRANYA account.");
        setPassword("");
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        setPassword("");
        setMessage("You are signed in.");
      }
    } catch (err) {
      const code = (err as { code?: string }).code;
      const messages: Record<string, string> = {
        "auth/email-already-in-use": "An account already exists with this email. Please sign in.",
        "auth/invalid-email": "Please enter a valid email address.",
        "auth/invalid-credential": "Email or password is incorrect.",
        "auth/weak-password": "Choose a stronger password with at least 6 characters.",
        "auth/too-many-requests": "Too many attempts. Please wait and try again.",
      };
      setError(messages[code || ""] || (err instanceof Error ? err.message : "We could not complete your request."));
    } finally { setBusy(false); }
  }

  async function resetPassword() {
    setError(""); setMessage("");
    if (!email.trim()) { setError("Enter your email address first, then choose Forgot password."); return; }
    try { await sendPasswordResetEmail(auth, email.trim()); setMessage("Password reset email sent. Check your inbox."); }
    catch { setError("Could not send a reset email. Check the email address and try again."); }
  }

  if (checking) return <main className="flex min-h-screen items-center justify-center bg-slate-50">Loading your account...</main>;

  return <main className="min-h-screen bg-slate-50 text-slate-900">
    <header className="border-b bg-white"><div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5"><a href="/" className="text-2xl font-black text-blue-950">CHITRANYA<span className="text-orange-500">.</span></a><nav className="flex gap-4 text-sm font-semibold"><a href="/products/">Shop</a><a href="/services/">Services</a><a href="/cart/">Cart</a></nav></div></header>
    <section className="mx-auto max-w-6xl px-5 py-10">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-600">Customer account</p><h1 className="mt-2 text-3xl font-black md:text-4xl">{user ? "Your CHITRANYA account" : "Welcome to CHITRANYA"}</h1>
      <p className="mt-2 text-slate-600">{user ? "Manage your profile and follow your orders and service requests." : "Sign in or create an account to keep your orders and service requests together."}</p>
      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="mt-5 rounded-xl bg-green-50 p-4 text-sm text-green-800">{message}</p>}
      {!user ? <div className="mx-auto mt-8 max-w-lg rounded-2xl border bg-white p-6 shadow-sm md:p-8">
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => {setMode("login");setError("");setMessage("");}} className={`rounded-lg py-2 text-sm font-bold ${mode === "login" ? "bg-white shadow" : "text-slate-500"}`}>Sign in</button><button type="button" onClick={() => {setMode("register");setError("");setMessage("");}} className={`rounded-lg py-2 text-sm font-bold ${mode === "register" ? "bg-white shadow" : "text-slate-500"}`}>Create account</button></div>
        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && <label className="block text-sm font-semibold">Full name<input required maxLength={100} value={name} onChange={(e)=>setName(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-3" autoComplete="name" /></label>}
          <label className="block text-sm font-semibold">Email address<input required type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-3" autoComplete="email" /></label>
          <label className="block text-sm font-semibold">Password<input required type="password" minLength={6} value={password} onChange={(e)=>setPassword(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-3" autoComplete={mode === "login" ? "current-password" : "new-password"} /></label>
          {mode === "login" && <div className="text-right"><button type="button" onClick={resetPassword} className="text-sm font-semibold text-blue-700 hover:underline">Forgot password?</button></div>}
          <button disabled={busy} className="w-full rounded-lg bg-orange-500 px-5 py-3.5 font-bold text-white hover:bg-orange-600 disabled:opacity-60">{busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create my account"}</button>
        </form>
        <p className="mt-5 text-xs leading-5 text-slate-500">Your account lets you view orders and service requests placed while signed in. Guest purchases remain available.</p>
      </div> : <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border bg-white p-5 shadow-sm"><div><p className="font-bold">{user.displayName || "CHITRANYA Customer"}</p><p className="text-sm text-slate-600">{user.email}</p><p className="mt-1 text-xs text-slate-500">{user.emailVerified ? "Email verified" : "Email not verified — check your inbox."}</p></div><button onClick={() => void signOut(auth)} className="rounded-lg border px-4 py-2 text-sm font-bold hover:bg-slate-50">Sign out</button></div>
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section><h2 className="mb-4 text-2xl font-black">My orders ({orders.length})</h2>{orders.length === 0 ? <p className="rounded-xl bg-white p-5 text-sm text-slate-600">No account-linked orders yet. Sign in before your next checkout to see it here.</p> : <div className="space-y-3">{orders.map((item)=><article key={item.id} className="rounded-xl border bg-white p-5"><div className="flex flex-wrap justify-between gap-2"><p className="font-black">{item.orderId || item.id}</p><span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">{item.status || "Pending"}</span></div><p className="mt-2 text-sm text-slate-500">{dateText(item.createdAt)}</p><p className="mt-3 text-lg font-black">{money(item.total)}</p><div className="mt-2 text-sm text-slate-600">{(item.items || []).map((p,i)=><p key={i}>{p.name} × {p.quantity}</p>)}</div></article>)}</div>}</section>
          <section><h2 className="mb-4 text-2xl font-black">My service requests ({bookings.length})</h2>{bookings.length === 0 ? <p className="rounded-xl bg-white p-5 text-sm text-slate-600">No account-linked service requests yet. Sign in before submitting a service request to see it here.</p> : <div className="space-y-3">{bookings.map((item)=><article key={item.id} className="rounded-xl border bg-white p-5"><div className="flex flex-wrap justify-between gap-2"><p className="font-black">{item.service || "Service request"}</p><span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-800">{item.status || "Pending"}</span></div><p className="mt-2 text-sm text-slate-500">Preferred: {item.preferredDate || "Not set"} · {item.preferredTime || "Flexible"}</p><p className="mt-1 text-sm text-slate-600">{item.address}, {item.city}</p><p className="mt-1 text-xs text-slate-500">Reference: {item.id}</p></article>)}</div>}</section>
        </div>
      </div>}
    </section>
    <footer className="mt-12 bg-slate-950 px-5 py-8 text-center text-sm text-slate-400">© {new Date().getFullYear()} CHITRANYA. Customer Account</footer>
  </main>;
}
