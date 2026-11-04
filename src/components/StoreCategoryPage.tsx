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
      const rows: StoreProduct[] = snapshot.docs.flatMap((entry) => {
        const data = entry.data();
        const id = Number(data.id ?? entry.id);
        const main = normalizeMain(data.mainCategory ?? data.category);
        if (!Number.isFinite(id) || !main || data.active !== true) return [];
        return [{
          id,
          name: String(data.name ?? ""),
          category: main,
          price: Number(data.price ?? 0),
          emoji: String(data.emoji ?? "📦"),
          stock: Number(data.stock ?? 0),
          description: String(data.description ?? ""),
          mainCategory: main,
          subCategory: String(data.subCategory ?? ""),
        }];
      });
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

  const isShopCategory = mainCategory === "Electronics" || mainCategory === "Hardware";
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="bg-slate-950 px-4 py-2 text-center text-xs font-bold text-white">CHITRANYA • ELECTRONICS • HARDWARE • HOME SOLUTIONS</div>
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-4 px-4 py-4">
          <Link href="/" className="text-2xl font-black text-blue-950">CHITRANYA<span className="text-orange-500">.</span></Link>
          <div className="order-3 flex w-full overflow-hidden rounded-lg border bg-slate-50 md:order-2 md:mx-5 md:flex-1">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products, brands and more..." className="w-full bg-transparent px-4 py-3 text-sm outline-none" />
            <span className="bg-orange-500 px-5 py-3 font-bold text-white">Search</span>
          </div>
          <Link href="/cart/" className="ml-auto rounded-lg bg-blue-950 px-4 py-3 text-sm font-bold text-white">🛒 Cart ({itemCount})</Link>
        </div>
        <nav className="mx-auto flex max-w-[1440px] gap-7 overflow-x-auto border-t px-4 py-3 text-sm font-bold">
          <Link href="/electronics/" className={mainCategory==="Electronics"?"text-orange-600":"hover:text-orange-600"}>Electronics</Link>
          <Link href="/hardware/" className={mainCategory==="Hardware"?"text-orange-600":"hover:text-orange-600"}>Hardware</Link>
          <Link href="/services/" className="hover:text-orange-600">Home Services</Link>
          <Link href="/products/" className="hover:text-orange-600">Shop All</Link>
        </nav>
      </header>
      <section className="bg-gradient-to-r from-blue-950 to-blue-700 px-5 py-12 text-white">
        <div className="mx-auto max-w-[1440px]">
          <p className="text-xs font-extrabold uppercase tracking-[0.25em] text-orange-300">CHITRANYA Online Store</p>
          <h1 className="mt-3 text-4xl font-black md:text-5xl">{heading}</h1>
          <p className="mt-3 max-w-2xl text-blue-100">{intro}</p>
          <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold"><span className="rounded-full bg-white/10 px-4 py-2">✓ Quality Products</span><span className="rounded-full bg-white/10 px-4 py-2">✓ Trusted Local Store</span><span className="rounded-full bg-white/10 px-4 py-2">✓ Easy Ordering</span></div>
        </div>
      </section>
      <section className="mx-auto max-w-[1440px] px-4 py-8">
        <div className="mb-5"><p className="text-xs font-extrabold uppercase tracking-widest text-orange-600">Shop by department</p><h2 className="mt-1 text-2xl font-black">Explore Categories</h2></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {visibleSubcategories.map(item=><button key={item.id} onClick={()=>{setSelectedSubcategory(item.name);document.getElementById("shop-products")?.scrollIntoView({behavior:"smooth"});}} className={selectedSubcategory===item.name?"rounded-xl border-2 border-orange-500 bg-orange-50 p-4 text-left":"rounded-xl border bg-white p-4 text-left transition hover:-translate-y-1 hover:shadow-md"}>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">{EMOJIS[item.name]||"📦"}</span><span className="mt-3 block text-sm font-extrabold">{item.name}</span><span className="mt-1 block text-xs text-slate-500">{products.filter(p=>p.mainCategory===item.mainCategory&&p.subCategory===item.name).length} products</span>
          </button>)}
        </div>
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          {isShopCategory&&<aside className="overflow-hidden rounded-xl border bg-white"><div className="bg-blue-950 px-5 py-4 text-sm font-extrabold uppercase text-white">Shop {mainCategory}</div><button onClick={()=>setSelectedSubcategory("All")} className="w-full border-b px-5 py-3 text-left text-sm font-bold hover:bg-orange-50">All {mainCategory}</button>{visibleSubcategories.map(item=><button key={item.id} onClick={()=>setSelectedSubcategory(item.name)} className={selectedSubcategory===item.name?"w-full border-b bg-orange-50 px-5 py-3 text-left text-sm font-bold text-orange-700":"w-full border-b px-5 py-3 text-left text-sm hover:bg-slate-50"}>{item.name} <span className="float-right">›</span></button>)}</aside>}
          <div id="shop-products" className="min-w-0">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-extrabold uppercase tracking-widest text-orange-600">CHITRANYA Collection</p><h2 className="mt-1 text-2xl font-black">{selectedSubcategory==="All"?"Featured "+(mainCategory==="All"?"Products & Services":mainCategory):selectedSubcategory}</h2></div><span className="rounded-full bg-white px-4 py-2 text-sm text-slate-500 shadow-sm">{loading?"Loading...":visibleProducts.length+" products found"}</span></div>
            {error&&<p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
            {loading?<p className="rounded-xl bg-white py-16 text-center text-slate-500">Loading CHITRANYA collection...</p>:visibleProducts.length?<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visibleProducts.map(product=><article key={product.id} className="group overflow-hidden rounded-xl border bg-white transition hover:-translate-y-1 hover:shadow-xl">
                <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100"><span className="text-7xl transition group-hover:scale-110">{product.emoji}</span><span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[10px] font-extrabold uppercase text-blue-900 shadow">{product.mainCategory}</span>{product.stock>0&&<span className="absolute right-3 top-3 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">In stock</span>}</div>
                <div className="p-4"><p className="text-[11px] font-bold uppercase text-slate-400">{product.subCategory||product.mainCategory}</p><h3 className="mt-2 min-h-10 font-extrabold">{product.name}</h3><p className="mt-2 min-h-10 text-sm text-slate-500">{product.description}</p><p className="mt-4 text-xl font-black text-blue-950">{money(product.price)}</p><Link href={"/product/?id="+product.id} className="mt-4 block rounded-lg border border-blue-950 px-4 py-2.5 text-center text-sm font-bold text-blue-950 hover:bg-blue-50">View Details</Link><button onClick={()=>{addToCart(product);setAddedId(product.id);}} disabled={product.stock<=0} className="mt-2 w-full rounded-lg bg-orange-500 px-4 py-3 text-sm font-extrabold text-white hover:bg-orange-600 disabled:bg-slate-300">{addedId===product.id?"✓ Added to Cart":product.stock>0?"Add to Cart":"Out of Stock"}</button></div>
              </article>)}
            </div>:<p className="rounded-xl bg-white py-16 text-center text-slate-500">No active items found. Please check back soon.</p>}
          </div>
        </div>
      </section>
      <footer className="mt-10 bg-slate-950 px-6 py-9 text-center text-sm text-slate-400">© {new Date().getFullYear()} CHITRANYA. All rights reserved.</footer>
    </main>
  );

}
