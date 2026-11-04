"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart, type CartProduct } from "@/context/CartContext";

type MainCategory = "Electronics" | "Hardware" | "Home Services";
type Subcategory = { id: string; mainCategory: MainCategory; name: string; active: boolean };
type StoreProduct = CartProduct & {
  description: string;
  mainCategory: MainCategory;
  subCategory: string;
};

const MAIN_CATEGORIES: MainCategory[] = ["Electronics", "Hardware", "Home Services"];
const EMOJIS: Record<string, string> = {
  "Televisions & Smart TVs": "📺", "Refrigerators": "🧊", "Washing Machines": "🧺",
  "Kitchen Appliances": "🍳", "Computers & Accessories": "💻", "CCTV & Security Systems": "📹",
  "Hand Tools": "🔧", "Power Tools": "🛠️", "Plumbing Materials": "🚿",
  "Electrical Accessories": "🔌", "Paint & Painting Equipment": "🎨",
  "Construction Materials": "🧱", "Bathroom Fittings": "🚽", "Safety Equipment": "🦺",
  "Plumbing Services": "🔧", "Plumbing": "🔧", "Electrical Repair": "⚡",
  "AC Installation & Servicing": "❄️", "Appliance Repair": "🛠️",
  "CCTV Installation": "📹", "Home Cleaning": "🧹", "Painting Services": "🎨",
  "Painting": "🎨", "Home Renovation": "🏠", "Renovation": "🏠",
  "Hardware Installation": "🔩",
};
const money = (value: number) => "NPR " + value.toLocaleString("en-IN");

function normalizeMain(value: unknown): MainCategory | null {
  const text = String(value ?? "").trim().toLowerCase();
  if (text === "electronics") return "Electronics";
  if (text === "hardware") return "Hardware";
  if (text === "services" || text === "home services" || text === "homeservices") return "Home Services";
  return null;
}

export default function StoreCategoryPage({ mainCategory }: { mainCategory: MainCategory | "All" }) {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedId, setAddedId] = useState<number | null>(null);
  const { addToCart, itemCount } = useCart();

  useEffect(() => {
    const stopProducts = onSnapshot(collection(db, "products"), (snapshot) => {
      const rows = snapshot.docs.map((entry) => {
        const data = entry.data();
        const id = Number(data.id ?? entry.id);
        const main = normalizeMain(data.mainCategory ?? data.category);
        if (!Number.isFinite(id) || !main) return null;
        return {
          id,
          name: String(data.name ?? ""),
          category: main,
          price: Number(data.price ?? 0),
          emoji: String(data.emoji ?? "📦"),
          description: String(data.description ?? ""),
          mainCategory: main,
          subCategory: String(data.subCategory ?? ""),
        };
      }).filter((item): item is StoreProduct => item !== null && snapshot.docs.some((d) => Number(d.data().id ?? d.id) === item.id && d.data().active === true));
      setProducts(rows.sort((a, b) => a.id - b.id));
      setLoading(false);
      setError("");
    }, (err) => {
      console.error(err);
      setError("We couldn't load products. Please refresh and try again.");
      setLoading(false);
    });
    const stopCategories = onSnapshot(collection(db, "categories"), (snapshot) => {
      const rows = snapshot.docs.map((entry) => {
        const data = entry.data();
        const main = normalizeMain(data.mainCategory);
        if (!main || !String(data.name ?? "").trim()) return null;
        return { id: entry.id, mainCategory: main, name: String(data.name).trim(), active: data.active !== false };
      }).filter((item): item is Subcategory => item !== null && item.active);
      setSubcategories(rows.sort((a, b) => a.name.localeCompare(b.name)));
    }, (err) => {
      console.error(err);
      setError("We couldn't load categories. Please refresh and try again.");
    });
    return () => { stopProducts(); stopCategories(); };
  }, []);

  const visibleSubcategories = useMemo(() => subcategories.filter((item) => mainCategory === "All" || item.mainCategory === mainCategory), [subcategories, mainCategory]);
  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesMain = mainCategory === "All" || product.mainCategory === mainCategory;
    const matchesSub = selectedSubcategory === "All" || product.subCategory === selectedSubcategory;
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || product.name.toLowerCase().includes(term) || product.subCategory.toLowerCase().includes(term);
    return matchesMain && matchesSub && matchesSearch;
  }), [products, mainCategory, selectedSubcategory, search]);

  const heading = mainCategory === "All" ? "Explore All Products" : mainCategory === "Home Services" ? "Home Services" : mainCategory;
  const intro = mainCategory === "All"
    ? "Browse every product and service category available at CHITRANYA."
    : mainCategory === "Electronics"
      ? "Explore electronics, appliances, computers and security products."
      : mainCategory === "Hardware"
        ? "Find tools, building materials, fittings and hardware essentials."
        : "Find trusted services for your home and business.";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 bg-slate-950 px-5 py-5 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-black">CHITRANYA<span className="text-orange-500">.</span></Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold">
            <Link href="/">Home</Link><Link className={mainCategory === "All" ? "text-orange-400" : ""} href="/products/">Products</Link>
            <Link className={mainCategory === "Electronics" ? "text-orange-400" : ""} href="/electronics/">Electronics</Link>
            <Link className={mainCategory === "Hardware" ? "text-orange-400" : ""} href="/hardware/">Hardware</Link>
            <Link className={mainCategory === "Home Services" ? "text-orange-400" : ""} href="/services/">Services</Link>
            <Link href="/cart/" className="rounded-lg bg-orange-500 px-4 py-2">🛒 Cart ({itemCount})</Link>
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-r from-blue-950 to-blue-800 px-6 py-14 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="font-bold uppercase tracking-widest text-orange-400">CHITRANYA Marketplace</p>
          <h1 className="mt-3 text-4xl font-black md:text-5xl">{heading}</h1>
          <p className="mt-3 max-w-2xl text-slate-300">{intro}</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="text-2xl font-black">Browse Subcategories</h2><p className="mt-1 text-sm text-slate-500">Choose a category to see matching products below.</p></div>
          <button onClick={() => setSelectedSubcategory("All")} className={selectedSubcategory === "All" ? "rounded-full bg-blue-800 px-4 py-2 text-sm font-bold text-white" : "rounded-full border bg-white px-4 py-2 text-sm font-bold"}>All {mainCategory === "All" ? "Categories" : "Items"}</button>
        </div>
        {visibleSubcategories.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {visibleSubcategories.map((item) => (
              <button key={item.id} onClick={() => { setSelectedSubcategory(item.name); document.getElementById("store-products")?.scrollIntoView({ behavior: "smooth" }); }}
                className={selectedSubcategory === item.name ? "rounded-2xl border-2 border-orange-500 bg-orange-50 p-5 text-left shadow-sm" : "rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md"}>
                <span className="text-3xl">{EMOJIS[item.name] || "📦"}</span>
                <span className="mt-3 block font-bold">{item.name}</span>
                <span className="mt-1 block text-xs text-slate-500">{products.filter((p) => p.mainCategory === item.mainCategory && p.subCategory === item.name).length} items</span>
              </button>
            ))}
          </div>
        ) : <p className="rounded-xl bg-white p-6 text-slate-500">No active subcategories have been added yet.</p>}

        <div id="store-products" className="mb-6 mt-12 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-sm font-bold uppercase tracking-widest text-blue-700">CHITRANYA Collection</p><h2 className="mt-1 text-2xl font-black">{selectedSubcategory === "All" ? "All " + (mainCategory === "All" ? "Products & Services" : mainCategory) : selectedSubcategory}</h2></div>
          <div className="flex flex-wrap items-center gap-3">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="rounded-lg border bg-white px-4 py-3 text-sm outline-none focus:border-blue-700" />
            <span className="text-sm text-slate-500">{loading ? "Loading..." : visibleProducts.length + " found"}</span>
          </div>
        </div>

        {error && <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
        {loading ? <p className="py-16 text-center text-slate-500">Loading CHITRANYA collection...</p> : visibleProducts.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {visibleProducts.map((product) => <article key={product.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex h-44 items-center justify-center bg-slate-100 text-7xl">{product.emoji}</div>
              <div className="p-5"><p className="text-xs font-bold uppercase tracking-wide text-blue-700">{product.mainCategory}{product.subCategory ? " / " + product.subCategory : ""}</p>
                <h3 className="mt-2 font-bold">{product.name}</h3><p className="mt-2 min-h-10 text-sm text-slate-500">{product.description}</p>
                <p className="mt-4 text-xl font-black text-blue-950">{money(product.price)}</p>
                <Link href={"/product/?id=" + product.id} className="mt-4 block rounded-lg border border-blue-800 px-4 py-3 text-center font-bold text-blue-800 hover:bg-blue-50">View Details</Link>
                <button onClick={() => { addToCart(product); setAddedId(product.id); }} className="mt-2 w-full rounded-lg bg-blue-800 px-4 py-3 font-bold text-white hover:bg-blue-900">{addedId === product.id ? "✓ Added to Cart" : "+ Add to Cart"}</button>
              </div>
            </article>)}
          </div>
        ) : <p className="rounded-xl bg-white py-16 text-center text-slate-500">No active items found in this category yet.</p>}
      </section>
      <footer className="bg-slate-950 px-6 py-8 text-center text-sm text-slate-400">© {new Date().getFullYear()} CHITRANYA. All rights reserved.</footer>
    </main>
  );
}
