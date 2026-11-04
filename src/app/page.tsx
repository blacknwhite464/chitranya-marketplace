"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";

const electronics = [
  { name: "Televisions & Smart TVs", image: "photo-1593359677879-a4bb92f829d1", description: "Smart entertainment for every room." },
  { name: "Refrigerators", image: "photo-1571175443880-49e1d5d85efb", description: "Freshness and storage made simple." },
  { name: "Washing Machines", image: "photo-1626806787461-102c1bfaaea1", description: "Everyday laundry made easier." },
  { name: "Kitchen Appliances", image: "photo-1556911220-bff31c812dba", description: "Practical appliances for your kitchen." },
  { name: "Computers & Accessories", image: "photo-1498049794561-7780e7231661", description: "Technology for work, study and play." },
  { name: "CCTV & Security", image: "photo-1558002038-1055907df827", description: "Security solutions for peace of mind." },
  { name: "Fans, Lights & Electrical", image: "photo-150 carve", description: "Lighting and electrical essentials." },
];

const hardware = [
  { name: "Hand Tools", image: "photo-158工具", description: "Reliable tools for everyday jobs." },
  { name: "Power Tools", image: "photo-1504148455328-c376907d081c", description: "Get more done with the right equipment." },
  { name: "Plumbing Materials", image: "photo-1607472586893-edb57bdc0e39", description: "Pipes, fittings and water system essentials." },
  { name: "Electrical Accessories", image: "photo-1621905251189-08b45d6a269e", description: "Quality electrical fittings and supplies." },
  { name: "Paint & Painting", image: "photo-1562259949-e8e7689d7828", description: "Finishing touches for every space." },
  { name: "Construction Materials", image: "photo-1503387762-592deb58ef4e", description: "Materials for building and renovation." },
  { name: "Bathroom Fittings", image: "photo-1620626011761-996317b8d101", description: "Fixtures for modern bathrooms." },
  { name: "Safety Equipment", image: "photo- safety", description: "Protective essentials for every project." },
];

const services = [
  { name: "Plumbing & Water Systems", description: "Pipe repairs, leak fixes, taps, pumps and bathroom plumbing.", image: "photo-1607472586893-edb57bdc0e39" },
  { name: "Electrical Installation & Repair", description: "Wiring, switches, lighting, power points and electrical fault repairs.", image: "photo-1621905251189-08b45d6a269e" },
  { name: "AC Installation & Servicing", description: "Air conditioner installation, cleaning, maintenance and repair.", image: "photo-1631545806609-7b5e6f3f8f6d" },
  { name: "Appliance Repair", description: "Support for televisions, refrigerators, washing machines and kitchen appliances.", image: "photo-1581091226825-a6a2a5aee158" },
  { name: "CCTV & Security Systems", description: "Camera installation, configuration, maintenance and troubleshooting.", image: "photo-1558002038-1055907df827" },
  { name: "Home & Office Cleaning", description: "Regular, deep and move-in/move-out cleaning support.", image: "photo-1581578731548-c64695cc6952" },
  { name: "Painting & Wall Finishing", description: "Interior and exterior painting, touch-ups and surface preparation.", image: "photo-1562259949-e8e7689d7828" },
  { name: "Home Renovation", description: "Room upgrades, repairs, remodeling and improvement projects.", image: "photo-1600607687939-ce8a6c25118c" },
  { name: "Hardware Installation", description: "Shelves, fittings, fixtures, locks and other hardware installation.", image: "photo-1504148455328-c376907d081c" },
  { name: "Carpentry & Furniture", description: "Door repairs, cabinet fitting, furniture assembly and woodwork.", image: "photo- woodworking" },
  { name: "Bathroom & Kitchen Fitting", description: "Sanitaryware, taps, sinks, showers and kitchen fixture installation.", image: "photo-1620626011761-996317b8d101" },
  { name: "TV & Wall Mounting", description: "Television mounting, bracket fitting and cable management.", image: "photo-1593359677879-a4bb92f829d1" },
  { name: "Office Maintenance", description: "Routine repairs and maintenance for shops, offices and workplaces.", image: "photo-1497366754035-f200968a6e72" },
  { name: "Networking & Wi-Fi Setup", description: "Router setup, network cabling and connectivity troubleshooting.", image: "photo-1518770660439-4636190af475" },
  { name: "Inverter & Backup Power", description: "Inverter, battery and backup power installation support.", image: "photo-1473341304170-971013b6b815" },
];

function photoUrl(id: string, width = 900) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=82`;
}

function CategoryCard({ item, href, accent = "blue" }: { item: { name: string; image: string; description: string }; href: string; accent?: "blue" | "orange" }) {
  return (
    <Link href={href} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="relative h-44 overflow-hidden bg-slate-100">
        <img src={photoUrl(item.image)} alt={item.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/55 via-transparent to-transparent" />
        <span className="absolute bottom-3 left-4 rounded-full bg-white/95 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide text-slate-800">Explore category</span>
      </div>
      <div className="p-5">
        <h3 className="font-extrabold text-slate-900">{item.name}</h3>
        <p className="mt-2 min-h-10 text-sm leading-6 text-slate-500">{item.description}</p>
        <span className={accent === "orange" ? "mt-4 inline-flex text-sm font-extrabold text-orange-600" : "mt-4 inline-flex text-sm font-extrabold text-blue-800"}>Explore collection <span className="ml-2 transition-transform group-hover:translate-x-1">→</span></span>
      </div>
    </Link>
  );
}

export default function Home() {
  const { itemCount } = useCart();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="bg-slate-950 px-4 py-2 text-center text-xs font-semibold tracking-wide text-white">
        CHITRANYA — ELECTRONICS, HARDWARE & HOME SERVICES
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="text-3xl font-black tracking-tight text-blue-950">CHITRANYA<span className="text-orange-500">.</span></Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm font-bold text-slate-700">
            <Link href="/" className="hover:text-orange-600">Home</Link>
            <Link href="/products/" className="hover:text-orange-600">Products</Link>
            <Link href="/electronics/" className="hover:text-orange-600">Electronics</Link>
            <Link href="/hardware/" className="hover:text-orange-600">Hardware</Link>
            <Link href="/services/" className="hover:text-orange-600">Services</Link>
            <Link href="/account/" className="hover:text-orange-600">My Account</Link>
            <Link href="/cart/" className="rounded-lg bg-orange-500 px-4 py-2.5 font-extrabold text-white hover:bg-orange-600">Cart ({itemCount})</Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-5 py-4 text-center text-xs font-bold text-slate-600 sm:grid-cols-4 sm:text-sm">
          <div className="rounded-lg bg-slate-50 px-3 py-3">Trusted products</div>
          <div className="rounded-lg bg-slate-50 px-3 py-3">Delivery across Nepal</div>
          <div className="rounded-lg bg-slate-50 px-3 py-3">Convenient ordering</div>
          <div className="rounded-lg bg-slate-50 px-3 py-3">Customer support</div>
        </div>
      </section>

      <section className="relative isolate overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 -z-10">
          <img src={photoUrl("photo-1600607687939-ce8a6c25118c", 1800)} alt="" className="h-full w-full object-cover opacity-35" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-blue-950/90 to-blue-950/45" />
        </div>
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-24 md:grid-cols-[1.1fr_0.9fr] md:py-28">
          <div>
            <p className="mb-4 text-xs font-extrabold uppercase tracking-[0.25em] text-orange-300">Your complete home solution</p>
            <h1 className="max-w-2xl text-5xl font-black leading-tight md:text-6xl">Everything Your Home Needs. All in One Place.</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-200">Shop quality electronics and hardware, or book dependable help for repairs, installation and home improvement.</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/products/" className="rounded-lg bg-orange-500 px-7 py-4 font-extrabold text-white shadow-lg hover:bg-orange-600">Explore Products</Link>
              <Link href="/services/" className="rounded-lg border border-white/70 bg-white/10 px-7 py-4 font-extrabold text-white hover:bg-white hover:text-blue-950">Book a Service</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-2 backdrop-blur">
              <img src={photoUrl("photo-1498049794561-7780e7231661", 600)} alt="Electronics and computers" className="h-36 w-full rounded-xl object-cover sm:h-44" />
              <p className="px-2 py-3 font-extrabold">Electronics</p>
            </div>
            <div className="mt-8 overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-2 backdrop-blur">
              <img src={photoUrl("photo-1504148455328-c376907d081c", 600)} alt="Tools and hardware" className="h-36 w-full rounded-xl object-cover sm:h-44" />
              <p className="px-2 py-3 font-extrabold">Hardware</p>
            </div>
            <div className="col-span-2 overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-2 backdrop-blur">
              <img src={photoUrl("photo-1581578731548-c64695cc6952", 900)} alt="Professional home service" className="h-28 w-full rounded-xl object-cover sm:h-36" />
              <p className="px-2 py-3 font-extrabold">Professional Home Services</p>
            </div>
          </div>
        </div>
      </section>

      <section id="electronics" className="mx-auto max-w-7xl px-5 py-20">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">Shop products</p><h2 className="mt-2 text-3xl font-black md:text-4xl">Electronics</h2><p className="mt-3 text-slate-500">Technology and appliances for modern living.</p></div>
          <Link href="/electronics/" className="rounded-lg border border-blue-900 px-5 py-3 text-sm font-extrabold text-blue-900 hover:bg-blue-950 hover:text-white">View all electronics</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {electronics.map((item) => <CategoryCard key={item.name} item={item} href="/electronics/" />)}
        </div>
      </section>

      <section id="hardware" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-orange-600">Build with confidence</p><h2 className="mt-2 text-3xl font-black md:text-4xl">Hardware & Construction</h2><p className="mt-3 text-slate-500">Essential tools and materials for every project.</p></div>
            <Link href="/hardware/" className="rounded-lg border border-orange-600 px-5 py-3 text-sm font-extrabold text-orange-700 hover:bg-orange-600 hover:text-white">View all hardware</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {hardware.map((item) => <CategoryCard key={item.name} item={item} href="/hardware/" accent="orange" />)}
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-5 py-20">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">We are here to help</p><h2 className="mt-2 text-3xl font-black md:text-4xl">Professional Home Services</h2><p className="mt-3 max-w-2xl text-slate-500">Book trusted professionals for your home and business. Tell us what you need and our team will contact you to confirm the details.</p></div>
          <Link href="/services/" className="rounded-lg bg-blue-950 px-5 py-3 text-sm font-extrabold text-white hover:bg-blue-800">Explore all services</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <article key={service.name} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="h-48 overflow-hidden bg-slate-100"><img src={photoUrl(service.image)} alt={service.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>
              <div className="p-6">
                <h3 className="text-lg font-extrabold">{service.name}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{service.description}</p>
                <Link href="/services/" className="mt-5 inline-flex items-center font-extrabold text-blue-800 hover:text-orange-600">Enquire Now <span className="ml-2 transition-transform group-hover:translate-x-1">→</span></Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="bg-blue-950 px-6 py-16 text-center text-white">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-orange-300">CHITRANYA support</p>
        <h2 className="mt-3 text-3xl font-black">Need Something for Your Home?</h2>
        <p className="mt-4 text-slate-300">Contact CHITRANYA for products and professional services.</p>
        <a href="mailto:info@chitranya.com" className="mt-7 inline-block rounded-lg bg-orange-500 px-8 py-4 font-extrabold hover:bg-orange-600">Contact CHITRANYA</a>
      </section>

      <footer className="bg-slate-950 px-6 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} CHITRANYA. All rights reserved.
        <p className="mt-2">Electronics | Hardware | Home Services</p>
      </footer>
    </main>
  );
}
