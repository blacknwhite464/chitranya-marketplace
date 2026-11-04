"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

const serviceGroups = [
  { title: "Home repairs & installation", items: ["Plumbing & Water Systems", "Electrical Installation & Repair", "AC Installation & Servicing", "Appliance Repair", "Hardware Installation", "TV & Wall Mounting"] },
  { title: "Home improvement", items: ["Home & Office Cleaning", "Painting & Wall Finishing", "Home Renovation", "Carpentry & Furniture", "Bathroom & Kitchen Fitting"] },
  { title: "Security & business support", items: ["CCTV & Security Systems", "Office Maintenance", "Networking & Wi-Fi Setup", "Inverter & Backup Power"] },
];

export default function ServicesPage() {
  const services = useMemo(() => serviceGroups.flatMap((group) => group.items), []);
  const [form, setForm] = useState({ customerName: "", phone: "", email: "", service: "", address: "", city: "Banepa", preferredDate: "", preferredTime: "Morning (9 AMâ€“12 PM)", details: "" });
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("service");
    if (requested && services.includes(requested)) {
      setForm((current) => ({ ...current, service: requested }));
    }
  }, [services]);

  async function submitBooking(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage("");
    if (!/^\+?[0-9\s-]{7,15}$/.test(form.phone.trim())) { setError("Please enter a valid contact number."); return; }
    setSending(true);
    try {
      const booking = await addDoc(collection(db, "serviceBookings"), {
        ...form,
        ...(auth.currentUser ? { userId: auth.currentUser.uid } : {}),
        status: "Pending",
        source: "website",
        createdAt: serverTimestamp(),
      });
      setMessage("Your service request has been received. Reference: " + booking.id);
      setForm({ customerName: "", phone: "", email: "", service: "", address: "", city: "Banepa", preferredDate: "", preferredTime: "Morning (9 AMâ€“12 PM)", details: "" });
    } catch (err) {
      console.error("Service booking submission failed:", err);
      setError("We could not submit your request. Please contact CHITRANYA directly or try again later.");
    } finally { setSending(false); }
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="bg-slate-950 px-4 py-2 text-center text-xs font-bold tracking-wide text-white">CHITRANYA â€¢ HOME & OFFICE SERVICES</div>
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="text-2xl font-black text-blue-950">CHITRANYA<span className="text-orange-500">.</span></Link>
          <nav className="flex flex-wrap items-center gap-5 text-sm font-bold"><Link href="/electronics/">Electronics</Link><Link href="/hardware/">Hardware</Link><Link href="/services/" className="text-orange-600">Services</Link><Link href="/products/">Shop</Link><Link href="/cart/">Cart</Link><Link href="/account/">Account</Link></nav>
        </div>
      </header>

      <section className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-800 px-5 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-orange-300">One place for home and business</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-black leading-tight md:text-5xl">Reliable help for repairs, installation and improvement.</h1>
          <p className="mt-5 max-w-2xl leading-7 text-blue-100">Tell us what you need. CHITRANYA will review your request and contact you to confirm availability, scope and pricing before work begins.</p>
          <a href="#book-service" className="mt-7 inline-block rounded-lg bg-orange-500 px-6 py-3 font-bold text-white hover:bg-orange-600">Request a service</a>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-8"><p className="text-xs font-extrabold uppercase tracking-widest text-orange-600">Our services</p><h2 className="mt-2 text-3xl font-black">What can we help you with?</h2><p className="mt-2 text-slate-600">Choose a service to include it in your request.</p></div>
        <div className="grid gap-6 lg:grid-cols-3">
          {serviceGroups.map((group) => <article key={group.title} className="rounded-2xl border bg-white p-6 shadow-sm"><h3 className="mb-4 text-lg font-black text-blue-950">{group.title}</h3><ul className="space-y-3">{group.items.map((item) => <li key={item}><button onClick={() => { setForm((current) => ({ ...current, service: item })); document.getElementById("book-service")?.scrollIntoView({ behavior: "smooth" }); }} className="flex w-full items-center justify-between gap-3 rounded-lg border border-slate-100 px-3 py-3 text-left text-sm font-semibold hover:border-orange-300 hover:bg-orange-50"><span>{item}</span><span className="text-orange-600">Select +</span></button></li>)}</ul></article>)}
        </div>
      </section>

      <section id="book-service" className="bg-white px-5 py-14">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div><p className="text-xs font-extrabold uppercase tracking-widest text-orange-600">Service request</p><h2 className="mt-2 text-3xl font-black">Book a service</h2><p className="mt-4 leading-7 text-slate-600">Submit your preferred date and time. This is a request, not a confirmed appointment. Our team will contact you to confirm details and any applicable charges.</p><div className="mt-7 rounded-xl bg-blue-50 p-5"><h3 className="font-black text-blue-950">How it works</h3><ol className="mt-3 list-inside list-decimal space-y-2 text-sm leading-6 text-slate-700"><li>Choose the service and share the issue.</li><li>Our team reviews your request.</li><li>We contact you to confirm price and schedule.</li><li>Service is arranged after your confirmation.</li></ol></div></div>
          <form onSubmit={submitBooking} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            {message && <p role="status" className="break-words rounded-lg bg-green-50 p-3 text-sm text-green-800">{message}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold">Full name<input required maxLength={100} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} className="mt-1 w-full rounded-lg border bg-white px-3 py-3" /></label>
              <label className="text-sm font-semibold">Phone number<input required maxLength={20} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="mt-1 w-full rounded-lg border bg-white px-3 py-3" placeholder="98XXXXXXXX" /></label>
              <label className="text-sm font-semibold">Email (optional)<input type="email" maxLength={150} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-1 w-full rounded-lg border bg-white px-3 py-3" /></label>
              <label className="text-sm font-semibold">Service required<select required value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} className="mt-1 w-full rounded-lg border bg-white px-3 py-3"><option value="">Select a service</option>{services.map((service) => <option key={service}>{service}</option>)}</select></label>
              <label className="text-sm font-semibold">City / area<input required maxLength={100} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="mt-1 w-full rounded-lg border bg-white px-3 py-3" /></label>
              <label className="text-sm font-semibold">Full address<input required maxLength={300} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="mt-1 w-full rounded-lg border bg-white px-3 py-3" /></label>
              <label className="text-sm font-semibold">Preferred date<input required type="date" min={new Date().toISOString().slice(0, 10)} value={form.preferredDate} onChange={(e) => setForm({ ...form, preferredDate: e.target.value })} className="mt-1 w-full rounded-lg border bg-white px-3 py-3" /></label>
              <label className="text-sm font-semibold">Preferred time<select value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })} className="mt-1 w-full rounded-lg border bg-white px-3 py-3"><option>Morning (9 AMâ€“12 PM)</option><option>Afternoon (12 PMâ€“4 PM)</option><option>Evening (4 PMâ€“7 PM)</option><option>Flexible</option></select></label>
            </div>
            <label className="block text-sm font-semibold">Describe the work needed<textarea required maxLength={1500} rows={4} value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} placeholder="Describe the problem, product or work area..." className="mt-1 w-full rounded-lg border bg-white px-3 py-3" /></label>
            <button disabled={sending} className="w-full rounded-lg bg-orange-500 px-6 py-4 font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60">{sending ? "Submitting request..." : "Submit service request"}</button>
            <p className="text-xs leading-5 text-slate-500">By submitting, you agree that CHITRANYA may contact you about this service request. Appointment and price are confirmed separately.</p>
          </form>
        </div>
      </section>
      <footer className="bg-slate-950 px-5 py-8 text-center text-sm text-slate-400">Â© {new Date().getFullYear()} CHITRANYA. Electronics | Hardware | Home Services</footer>
    </main>
  );
}
