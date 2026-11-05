"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart, type CartProduct } from "@/context/CartContext";
import { useSiteContent } from "@/lib/siteContent";

type MainCategory = "Electronics" | "Hardware" | "Home Services";
type Subcategory = { id: string; mainCategory: MainCategory; name: string; active: boolean };
type StoreProduct = Omit<CartProduct, "stock"> & {
  stock: number;
  description: string;
  mainCategory: MainCategory;
  subCategory: string;
  imageUrl?: string;
};

const MAIN_CATEGORIES: MainCategory[] = ["Electronics", "Hardware", "Home Services"];
const money = (value: number) => "NPR " + value.toLocaleString("en-IN");
const categoryKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "").replace(/s$/, "");

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
  const [sortBy, setSortBy] = useState("featured");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addedId, setAddedId] = useState<number | null>(null);
  const { addToCart, itemCount } = useCart();
  const content = useSiteContent();

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
          emoji: "",
          imageUrl: String(data.imageUrl ?? ""),
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requested = params.get("category");
    const requestedSearch = params.get("search");
    if (requestedSearch) setSearch(requestedSearch);
    if (!requested) return;
    const match = visibleSubcategories.find((item) => categoryKey(item.name) === categoryKey(requested));
    if (match) setSelectedSubcategory(match.name);
  }, [visibleSubcategories]);
  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesMain = mainCategory === "All" || product.mainCategory === mainCategory;
    const matchesSub = selectedSubcategory === "All" || product.subCategory === selectedSubcategory;
    const term = search.trim().toLowerCase();
    const searchable = `${product.name} ${product.subCategory} ${product.description} ${product.mainCategory}`.toLowerCase();
    const matchesSearch = !term || searchable.includes(term);
    const matchesStock = !inStockOnly || product.stock > 0;
    return matchesMain && matchesSub && matchesSearch && matchesStock;
  }).sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    if (sortBy === "stock") return b.stock - a.stock;
    return a.id - b.id;
  }), [products, mainCategory, selectedSubcategory, search, inStockOnly, sortBy]);

  const heading = mainCategory === "All" ? content.productsTitle : mainCategory === "Electronics" ? content.electronicsPageTitle : mainCategory === "Hardware" ? content.hardwarePageTitle : "Home Services";
  const intro = mainCategory === "All" ? content.productsDescription : mainCategory === "Electronics" ? content.electronicsPageDescription : mainCategory === "Hardware" ? content.hardwarePageDescription : "Find trusted services for your home and business.";

  const isShopCategory = mainCategory === "Electronics" || mainCategory === "Hardware";
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="bg-slate-950 px-4 py-2 text-center text-xs font-bold text-white">{content.announcement}</div>
      <header className="sticky top-0 z-40 border-b bg-white shadow-sm">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 items-center gap-4 px-4 py-4 md:grid-cols-[auto_minmax(260px,1fr)_auto] md:px-6">
          <Link href="/" className="text-2xl font-black text-blue-950">CHITRANYA<span className="text-orange-500">.</span></Link>
          <form action="/products/" method="get" className="order-3 col-span-2 flex min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 md:order-none md:col-span-1">
            <input name="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products, brands and more..." className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none" />
            <button type="submit" className="bg-orange-500 px-5 py-3 font-bold text-white">Search</button>
          </form>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/account/" className="hidden rounded-lg border border-slate-200 px-3 py-3 text-sm font-bold text-blue-950 hover:bg-slate-50 sm:inline-flex">My Account</Link>
            <Link href="/cart/" className="rounded-lg bg-blue-950 px-4 py-3 text-sm font-bold text-white">Cart ({itemCount})</Link>
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1440px] items-center gap-7 overflow-x-auto border-t border-slate-100 px-4 py-3 text-sm font-bold text-slate-700 md:px-6">
          <Link href="/" className="whitespace-nowrap hover:text-orange-600">Home</Link>
          <Link href="/products/" className={mainCategory==="All"?"text-orange-600":"hover:text-orange-600"}>Shop All</Link>
          <Link href="/electronics/" className={mainCategory==="Electronics"?"text-orange-600":"hover:text-orange-600"}>Electronics</Link>
          <Link href="/hardware/" className={mainCategory==="Hardware"?"text-orange-600":"hover:text-orange-600"}>Hardware</Link>
          <Link href="/services/" className="hover:text-orange-600">Home Services</Link>
          <Link href="/quotation/" className="whitespace-nowrap text-orange-600 hover:text-orange-700">Build a Quotation</Link>
          
        </nav>
      </header>
      <section className="relative isolate overflow-hidden bg-[#071a3a] px-5 py-14 text-white md:py-16">
        <div className="absolute -right-24 -top-32 -z-10 h-96 w-96 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 -z-10 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="mx-auto grid max-w-[1440px] items-center gap-10 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.2em] text-orange-200"><span className="h-2 w-2 rounded-full bg-orange-400" /> CHITRANYA Online Store</div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight tracking-tight md:text-6xl">{heading}<span className="text-orange-400">.</span></h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100 md:text-lg">{intro}</p>
            <div className="mt-7 flex flex-wrap gap-3 text-xs font-bold text-white/90"><span className="rounded-full border border-white/15 bg-white/10 px-4 py-2.5">Quality products</span><span className="rounded-full border border-white/15 bg-white/10 px-4 py-2.5">Trusted local store</span><span className="rounded-full border border-white/15 bg-white/10 px-4 py-2.5">Easy ordering</span></div>
          </div>
          <div className="hidden rounded-3xl border border-white/15 bg-white/[0.08] p-6 shadow-2xl backdrop-blur-sm lg:block">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-orange-300">Shop with confidence</p>
            <p className="mt-3 text-2xl font-black leading-snug">Everything you need, in one place.</p>
            <p className="mt-3 text-sm leading-6 text-blue-100">Explore electronics, hardware essentials and helpful home solutions from CHITRANYA.</p>
            <Link href="/account/" className="mt-6 inline-flex items-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-orange-400">View your account <span className="ml-3">→</span></Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1600px] px-4 py-8">
        <div className="mb-5"><p className="text-xs font-extrabold uppercase tracking-widest text-orange-600">Shop by department</p><h2 className="mt-1 text-2xl font-black">Explore Categories</h2></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {visibleSubcategories.map(item=><button key={item.id} onClick={()=>{setSelectedSubcategory(item.name);document.getElementById("shop-products")?.scrollIntoView({behavior:"smooth"});}} className={selectedSubcategory===item.name?"rounded-2xl border-2 border-orange-500 bg-orange-50 p-4 text-left shadow-sm":"rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg"}>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-950 to-blue-700 text-xs font-black tracking-wide text-white shadow-sm">{item.name.split(/\s+/).slice(0,2).map((word)=>word[0]).join("").toUpperCase()}</span><span className="mt-3 block text-sm font-extrabold">{item.name}</span><span className="mt-1 block text-xs text-slate-500">{products.filter(p=>p.mainCategory===item.mainCategory&&p.subCategory===item.name).length} products</span>
          </button>)}
        </div>
        <div className="mt-8 grid items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          {isShopCategory&&<aside className="overflow-hidden rounded-xl border bg-white"><div className="bg-blue-950 px-5 py-4 text-sm font-extrabold uppercase text-white">Shop {mainCategory}</div><button onClick={()=>setSelectedSubcategory("All")} className="w-full border-b px-5 py-3 text-left text-sm font-bold hover:bg-orange-50">All {mainCategory}</button>{visibleSubcategories.map(item=><button key={item.id} onClick={()=>setSelectedSubcategory(item.name)} className={selectedSubcategory===item.name?"w-full border-b bg-orange-50 px-5 py-3 text-left text-sm font-bold text-orange-700":"w-full border-b px-5 py-3 text-left text-sm hover:bg-slate-50"}>{item.name} <span className="float-right">â€º</span></button>)}</aside>}
          <div id="shop-products" className="min-w-0">
            <div className="mb-6 grid gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_20px_rgba(15,23,42,0.04)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:gap-8 lg:p-6"><div><p className="text-xs font-extrabold uppercase tracking-widest text-orange-600">CHITRANYA Collection</p><h2 className="mt-1 text-2xl font-black">{selectedSubcategory==="All"?"Featured "+(mainCategory==="All"?"Products & Services":mainCategory):selectedSubcategory}</h2><p className="mt-1 text-sm text-slate-500">{loading?"Loading...":visibleProducts.length+" matching products"}</p></div><div className="flex flex-wrap items-center gap-3 lg:justify-end"><label className="flex items-center gap-2 text-sm font-semibold text-slate-600"><input type="checkbox" checked={inStockOnly} onChange={(e)=>setInStockOnly(e.target.checked)} className="h-4 w-4 accent-orange-500"/> In stock only</label><label className="flex items-center gap-2 text-sm font-semibold text-slate-600">Sort by<select value={sortBy} onChange={(e)=>setSortBy(e.target.value)} className="max-w-[180px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-orange-500"><option value="featured">Featured</option><option value="price-low">Price: Low to High</option><option value="price-high">Price: High to Low</option><option value="name">Name: A to Z</option><option value="stock">Availability</option></select></label></div></div>
            {error&&<p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
            {loading?<p className="rounded-xl bg-white py-16 text-center text-slate-500">Loading CHITRANYA collection...</p>:visibleProducts.length?<div className="store-product-grid">
              {visibleProducts.map(product=><article key={product.id} className="store-product-card group flex min-w-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg">
                <Link href={"/product/?id="+product.id} aria-label={"View "+product.name} className="relative block aspect-square overflow-hidden bg-white p-2 sm:p-3">
                  {product.imageUrl?<img src={product.imageUrl} alt={product.name} loading="lazy" className="h-full w-full object-contain transition duration-300 group-hover:scale-105"/>:<div className="flex h-full items-center justify-center text-xs font-extrabold tracking-widest text-slate-300">CHITRANYA</div>}
                  {product.stock<=0&&<span className="absolute bottom-2 left-2 rounded bg-slate-900/80 px-2 py-1 text-[10px] font-bold text-white">Out of stock</span>}
                </Link>
                <div className="flex min-w-0 flex-1 flex-col p-2.5 sm:p-3">
                  <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-400">{product.subCategory||product.mainCategory}</p>
                  <h3 className="mt-1 min-h-10 line-clamp-2 text-xs font-medium leading-5 text-slate-800 sm:text-sm"><Link href={"/product/?id="+product.id} className="hover:text-orange-600">{product.name}</Link></h3>
                  <p className="mt-2 text-sm font-extrabold text-orange-600 sm:text-base">{money(product.price)}</p>
                  <button onClick={()=>{addToCart(product);setAddedId(product.id);}} disabled={product.stock<=0} className="mt-2 w-full rounded-md bg-orange-500 px-2 py-2 text-xs font-bold text-white transition hover:bg-orange-600 disabled:bg-slate-300 sm:text-sm">{addedId===product.id?"Added to Cart":product.stock>0?"Add to Cart":"Out of Stock"}</button>
                </div>
              </article>)}
            </div>:<p className="rounded-xl bg-white py-16 text-center text-slate-500">No active items found. Please check back soon.</p>}
          </div>
        </div>
      </section>
      <footer className="mt-10 bg-slate-950 px-6 py-9 text-center text-sm text-slate-400">Â© {new Date().getFullYear()} {content.footerText}</footer>
    </main>
  );

}
