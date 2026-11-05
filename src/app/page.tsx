"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart, type CartProduct } from "@/context/CartContext";
import { useSiteContent } from "@/lib/siteContent";

const electronics = [
  { name: "Television & Smart TV", image: "photo-1593359677879-a4bb92f829d1", description: "Smart entertainment for every room." },
  { name: "Refrigerator", image: "photo-1571175443880-49e1d5d85efb", description: "Freshness and storage made simple." },
  { name: "Washing Machine", image: "photo-1626806787461-102c1bfaaea1", description: "Everyday laundry made easier." },
  { name: "Kitchen Appliances", image: "photo-1556911220-bff31c812dba", description: "Practical appliances for your kitchen." },
  { name: "Computer & Accessories", image: "photo-1498049794561-7780e7231661", description: "Technology for work, study and play." },
  { name: "CCTV & Security Systems", image: "photo-1558002038-1055907df827", description: "Security solutions for peace of mind." },
  { name: "Fans/Lights/Electrical Appliances", image: "photo-1507473885765-e6ed057f782c", description: "Lighting and electrical essentials." },
];

const hardware = [
  { name: "Hand Tools", image: "photo-1581244277943-fe4a9c777189", description: "Reliable tools for everyday jobs." },
  { name: "Power Tools", image: "photo-1504148455328-c376907d081c", description: "Get more done with the right equipment." },
  { name: "Plumbing Materials", image: "photo-1607472586893-edb57bdc0e39", description: "Pipes, fittings and water system essentials." },
  { name: "Electrical Accessories", image: "photo-1621905251189-08b45d6a269e", description: "Quality electrical fittings and supplies." },
  { name: "Paint & Painting Equipment", image: "photo-1562259949-e8e7689d7828", description: "Finishing touches for every space." },
  { name: "Construction Materials", image: "photo-1503387762-592deb58ef4e", description: "Materials for building and renovation." },
  { name: "Bathroom Fittings", image: "photo-1620626011761-996317b8d101", description: "Fixtures for modern bathrooms." },
  { name: "Safety Equipment", image: "photo-1504307651254-35680f356dfd", description: "Protective essentials for every project." },
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
  { name: "Carpentry & Furniture", description: "Door repairs, cabinet fitting, furniture assembly and woodwork.", image: "photo-1530124566582-a618bc2615dc" },
  { name: "Bathroom & Kitchen Fitting", description: "Sanitaryware, taps, sinks, showers and kitchen fixture installation.", image: "photo-1620626011761-996317b8d101" },
  { name: "TV & Wall Mounting", description: "Television mounting, bracket fitting and cable management.", image: "photo-1593359677879-a4bb92f829d1" },
  { name: "Office Maintenance", description: "Routine repairs and maintenance for shops, offices and workplaces.", image: "photo-1497366754035-f200968a6e72" },
  { name: "Networking & Wi-Fi Setup", description: "Router setup, network cabling and connectivity troubleshooting.", image: "photo-1518770660439-4636190af475" },
  { name: "Inverter & Backup Power", description: "Inverter, battery and backup power installation support.", image: "photo-1473341304170-971013b6b815" },
];

function categoryEmoji(value: string) {
  const name = value.toLowerCase();
  if (name.includes("television") || name.includes("tv")) return "📺";
  if (name.includes("refrigerator")) return "🧊";
  if (name.includes("washing")) return "🧺";
  if (name.includes("kitchen")) return "🍳";
  if (name.includes("computer") || name.includes("network") || name.includes("wi-fi")) return "💻";
  if (name.includes("cctv") || name.includes("security")) return "📹";
  if (name.includes("fan") || name.includes("light") || name.includes("electrical")) return "💡";
  if (name.includes("tool")) return "🛠️";
  if (name.includes("plumbing") || name.includes("water")) return "🚿";
  if (name.includes("paint")) return "🎨";
  if (name.includes("construction") || name.includes("renovation")) return "🏗️";
  if (name.includes("bathroom")) return "🛁";
  if (name.includes("safety")) return "🦺";
  if (name.includes("clean")) return "🧹";
  if (name.includes("ac")) return "❄️";
  if (name.includes("appliance")) return "🔧";
  if (name.includes("carpentry") || name.includes("furniture")) return "🪚";
  if (name.includes("office")) return "🏢";
  if (name.includes("inverter") || name.includes("power")) return "🔋";
  return "✨";
}

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
        <h3 className="font-extrabold text-slate-900"><span className="mr-2 text-xl" aria-hidden="true">{categoryEmoji(item.name)}</span>{item.name}</h3>
        <p className="mt-2 min-h-10 text-sm leading-6 text-slate-500">{item.description}</p>
        <span className={accent === "orange" ? "mt-4 inline-flex text-sm font-extrabold text-orange-600" : "mt-4 inline-flex text-sm font-extrabold text-blue-800"}>Explore collection <span className="ml-2 transition-transform group-hover:translate-x-1">→</span></span>
      </div>
    </Link>
  );
}

type HomeProduct = CartProduct & {
  stock: number;
  subCategory: string;
  description: string;
  discountMode: string;
  discountPercent: number;
};

export default function Home() {
  const { itemCount, addToCart } = useCart();
  const content = useSiteContent();
  const [liveProducts, setLiveProducts] = useState<HomeProduct[]>([]);
  const [pricingRules, setPricingRules] = useState<Record<string, number>>({});
  const [homepageCategories, setHomepageCategories] = useState<{ id: string; mainCategory: string; name: string; image: string; description: string }[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [addedProductId, setAddedProductId] = useState<number | null>(null);

  useEffect(() => {
    const stop = onSnapshot(collection(db, "pricingRules"), (snapshot) => {
      const rules: Record<string, number> = {};
      snapshot.docs.forEach((entry) => {
        const percent = Number(entry.data().discountPercent ?? 0);
        rules[entry.id] = Number.isFinite(percent) ? Math.min(100, Math.max(0, percent)) : 0;
      });
      setPricingRules(rules);
    }, (error) => console.error("Homepage pricing rules could not be loaded:", error));
    return () => stop();
  }, []);

  useEffect(() => {
    const stop = onSnapshot(collection(db, "categories"), (snapshot) => {
      const rows = snapshot.docs.flatMap((entry) => {
        const data = entry.data();
        const mainCategory = String(data.mainCategory ?? "");
        const name = String(data.name ?? "");
        if (!name || !["Electronics", "Hardware"].includes(mainCategory) || data.active === false || data.showOnHomepage === false) return [];
        const presets = mainCategory === "Electronics" ? electronics : hardware;
        const preset = presets.find((item) => item.name.toLowerCase() === name.toLowerCase());
        return [{ id: entry.id, mainCategory, name, image: preset?.image ?? (mainCategory === "Electronics" ? "photo-1498049794561-7780e7231661" : "photo-1504148455328-c376907d081c"), description: preset?.description ?? "Explore quality products and essentials at CHITRANYA." }];
      });
      setHomepageCategories(rows.sort((a, b) => a.name.localeCompare(b.name)));
    }, (error) => console.error("Homepage categories could not be loaded:", error));
    return () => stop();
  }, []);

  useEffect(() => {
    const stop = onSnapshot(collection(db, "products"), (snapshot) => {
      const rows: HomeProduct[] = snapshot.docs.flatMap((entry) => {
        const data = entry.data();
        const id = Number(data.id ?? entry.id);
        const mainCategory = String(data.mainCategory ?? data.category ?? "");
        if (!Number.isFinite(id) || data.active !== true || !["electronics", "hardware"].includes(mainCategory.toLowerCase())) return [];
        return [{
          id,
          name: String(data.name ?? ""),
          category: mainCategory,
          price: Number(data.price ?? 0),
          emoji: "",
          imageUrl: String(data.imageUrl ?? ""),
          stock: Number(data.stock ?? 0),
          subCategory: String(data.subCategory ?? ""),
          description: String(data.description ?? ""),
          discountMode: String(data.discountMode ?? "inherit"),
          discountPercent: Number(data.discountPercent ?? 0),
        }];
      });
      setLiveProducts(rows.sort((a, b) => a.id - b.id));
      setProductsLoading(false);
    }, (error) => {
      console.error("Homepage products could not be loaded:", error);
      setProductsLoading(false);
    });
    return () => stop();
  }, []);

  const getDiscountPercent = (product: HomeProduct) => {
    if (product.discountMode === "fixed") return 0;
    if (product.discountMode === "override") return Math.min(100, Math.max(0, product.discountPercent || 0));
    const subcategoryRule = "subcategory:" + product.category + "::" + product.subCategory;
    return pricingRules[subcategoryRule] ?? pricingRules[product.category] ?? 0;
  };

  const flashSaleProducts = liveProducts
    .filter((product) => product.stock > 0 && getDiscountPercent(product) > 0)
    .sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a))
    .slice(0, 10);
  const justForYouProducts = liveProducts.filter((product) => product.stock > 0).slice(0, 10);

  const renderHomepageProductCards = (products: HomeProduct[]) => (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => {
        const discount = getDiscountPercent(product);
        return (
          <article key={product.id} className="group flex min-w-0 flex-col overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
            <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-50 p-5">
              {product.imageUrl ? <Link href={"/product/?id=" + product.id} aria-label={"View " + product.name} className="flex h-full w-full items-center justify-center"><img src={product.imageUrl} alt={product.name} loading="lazy" className="h-full w-full object-contain transition duration-300 group-hover:scale-105" /></Link> : <Link href={"/product/?id=" + product.id} className="text-sm font-extrabold tracking-widest text-slate-400">CHITRANYA</Link>}
              {discount > 0 && <span className="absolute left-3 top-3 rounded-md bg-red-600 px-2.5 py-1 text-[10px] font-black text-white">{discount}% OFF</span>}
              <span className={product.stock > 0 ? "absolute right-3 top-3 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700" : "absolute right-3 top-3 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600"}>{product.stock > 0 ? "In stock" : "Out of stock"}</span>
            </div>
            <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
              <p className="text-[11px] font-bold uppercase text-slate-400">{product.subCategory || product.category}</p>
              <h3 className="mt-2 min-h-12 line-clamp-2 font-extrabold text-slate-900"><Link href={"/product/?id=" + product.id} className="transition hover:text-orange-600">{product.name}</Link></h3>
              <div className="mt-3 flex flex-wrap items-baseline gap-2">
                <p className={discount > 0 ? "text-lg font-black text-red-600 sm:text-xl" : "text-lg font-black text-blue-950 sm:text-xl"}>NPR {Math.round(product.price * (1 - discount / 100)).toLocaleString("en-IN")}</p>
                {discount > 0 && <p className="text-sm font-semibold text-slate-400 line-through">NPR {product.price.toLocaleString("en-IN")}</p>}
              </div>
              <Link href={"/product/?id=" + product.id} className="mt-4 block rounded-xl border border-slate-200 px-3 py-2.5 text-center text-sm font-bold text-blue-950 hover:bg-blue-50">View Product Details</Link>
              <button onClick={() => { addToCart({ ...product, price: Math.round(product.price * (1 - discount / 100)) }); setAddedProductId(product.id); }} className="mt-2 w-full rounded-xl bg-orange-500 px-3 py-2.5 text-sm font-extrabold text-white transition hover:bg-orange-600">{addedProductId === product.id ? "Added to Cart" : "Add to Cart"}</button>
            </div>
          </article>
        );
      })}
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="bg-slate-950 px-4 py-2 text-center text-xs font-semibold tracking-wide text-white">
        {content.announcement}
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto grid max-w-[1440px] grid-cols-2 items-center gap-4 px-4 py-4 md:grid-cols-[auto_minmax(260px,1fr)_auto] md:px-6">
          <Link href="/" className="text-2xl font-black tracking-tight text-blue-950 md:text-3xl">CHITRANYA<span className="text-orange-500">.</span></Link>
          <form action="/products/" method="get" className="order-3 col-span-2 flex min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-inner md:order-none md:col-span-1">
            <input name="search" type="search" placeholder="Search electronics, tools, appliances..." className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none placeholder:text-slate-400" />
            <button type="submit" className="bg-orange-500 px-5 text-sm font-extrabold text-white transition hover:bg-orange-600">Search</button>
          </form>
          <div className="flex items-center justify-end gap-2">
            <Link href="/account/" className="hidden rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold text-blue-950 transition hover:bg-slate-50 sm:inline-flex">My Account</Link>
            <Link href="/cart/" className="rounded-xl bg-blue-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-blue-800">Cart ({itemCount})</Link>
          </div>
        </div>
        <nav className="mx-auto flex max-w-[1440px] items-center gap-7 overflow-x-auto border-t border-slate-100 px-4 py-3 text-sm font-bold text-slate-700 md:px-6">
          <Link href="/" className="whitespace-nowrap text-orange-600">Home</Link>
          <Link href="/products/" className="whitespace-nowrap hover:text-orange-600">Shop All</Link>
          <Link href="/quotation/" className="whitespace-nowrap hover:text-orange-600">Build a Quotation</Link>
          <Link href="/electronics/" className="whitespace-nowrap hover:text-orange-600">Electronics</Link>
          <Link href="/hardware/" className="whitespace-nowrap hover:text-orange-600">Hardware & Tools</Link>
          <Link href="/services/" className="whitespace-nowrap hover:text-orange-600">Home Services</Link>
          <Link href="/contact/" className="whitespace-nowrap hover:text-orange-600">Contact</Link>
          <span className="ml-auto hidden whitespace-nowrap text-xs font-semibold text-slate-400 lg:block">SHOP • SERVICES • SOLUTIONS</span>
        </nav>
      </header>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-3 px-5 py-4 text-center text-xs font-bold text-slate-600 sm:grid-cols-4 sm:text-sm">
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-4 transition hover:-translate-y-1 hover:shadow-md"><span className="mr-2 text-lg">⭐</span>Trusted products</div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-4 transition hover:-translate-y-1 hover:shadow-md"><span className="mr-2 text-lg">🚚</span>Delivery across Nepal</div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-4 transition hover:-translate-y-1 hover:shadow-md"><span className="mr-2 text-lg">🛒</span>Convenient ordering</div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-4 transition hover:-translate-y-1 hover:shadow-md"><span className="mr-2 text-lg">🤝</span>Customer support</div>
        </div>
      </section>

      <section className="bg-[#f4f5f8] py-4 md:py-6">
        <div className="mx-auto grid max-w-[1440px] gap-3 px-3 md:grid-cols-[250px_minmax(0,1fr)] lg:px-5">
          <aside className="hidden overflow-hidden rounded-sm bg-white shadow-sm md:block">
            <div className="bg-orange-500 px-4 py-3 text-sm font-extrabold text-white">SHOP BY CATEGORY</div>
            <div className="py-1">
              <Link href="/electronics/" className="flex items-center justify-between px-4 py-3 text-sm text-slate-700 transition hover:bg-orange-50 hover:text-orange-600"><span>📺 Electronics & Appliances</span><span>›</span></Link>
              <Link href="/hardware/" className="flex items-center justify-between px-4 py-3 text-sm text-slate-700 transition hover:bg-orange-50 hover:text-orange-600"><span>🛠️ Hardware & Tools</span><span>›</span></Link>
              <Link href="/services/" className="flex items-center justify-between px-4 py-3 text-sm text-slate-700 transition hover:bg-orange-50 hover:text-orange-600"><span>🏠 Home Services</span><span>›</span></Link>
              {homepageCategories.slice(0, 9).map((item) => (
                <Link key={item.id} href={`/${item.mainCategory.toLowerCase()}/?category=${encodeURIComponent(item.name)}`} className="block truncate px-4 py-2 text-[13px] text-slate-600 transition hover:bg-orange-50 hover:text-orange-600">{categoryEmoji(item.name)} {item.name}</Link>
              ))}
              <Link href="/products/" className="mt-1 block border-t px-4 py-3 text-sm font-bold text-orange-600 hover:bg-orange-50">View all categories →</Link>
            </div>
          </aside>
          <div className="relative min-h-[300px] overflow-hidden rounded-sm bg-[#092653] text-white shadow-sm md:min-h-[420px]">
            <img src={photoUrl("photo-1600607687939-ce8a6c25118c", 1800)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#061a3c] via-[#092653]/90 to-[#092653]/20" />
            <div className="relative flex min-h-[300px] flex-col justify-center px-6 py-10 sm:px-10 md:min-h-[420px] md:max-w-[68%] md:px-14">
              <span className="mb-4 inline-flex w-fit rounded-sm bg-orange-500 px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em]">CHITRANYA • SHOP ONLINE</span>
              <h1 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl md:text-6xl">{content.homeTitle}</h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-blue-50 sm:text-base">{content.homeDescription}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href="/products/" className="rounded-sm bg-orange-500 px-6 py-3.5 text-sm font-extrabold text-white shadow hover:bg-orange-600">SHOP NOW →</Link>
                <Link href="/services/" className="rounded-sm border border-white/70 bg-white/10 px-6 py-3.5 text-sm font-extrabold text-white hover:bg-white hover:text-blue-950">BOOK A SERVICE</Link>
              </div>
            </div>
            <div className="absolute bottom-4 right-5 hidden gap-2 sm:flex"><span className="h-2 w-7 rounded-full bg-orange-400"/><span className="h-2 w-2 rounded-full bg-white/70"/><span className="h-2 w-2 rounded-full bg-white/70"/></div>
          </div>
        </div>
        <div className="mx-auto mt-3 grid max-w-[1440px] grid-cols-2 gap-2 px-3 sm:grid-cols-4 lg:px-5">
          <div className="flex items-center gap-3 bg-white px-3 py-4 shadow-sm"><span className="text-2xl">🛡️</span><div><p className="text-xs font-extrabold text-slate-800">Trusted Store</p><p className="text-[11px] text-slate-500">Shop with confidence</p></div></div>
          <div className="flex items-center gap-3 bg-white px-3 py-4 shadow-sm"><span className="text-2xl">🚚</span><div><p className="text-xs font-extrabold text-slate-800">Nepal Delivery</p><p className="text-[11px] text-slate-500">Convenient ordering</p></div></div>
          <div className="flex items-center gap-3 bg-white px-3 py-4 shadow-sm"><span className="text-2xl">💳</span><div><p className="text-xs font-extrabold text-slate-800">Cash on Delivery</p><p className="text-[11px] text-slate-500">Pay when delivered</p></div></div>
          <div className="flex items-center gap-3 bg-white px-3 py-4 shadow-sm"><span className="text-2xl">🤝</span><div><p className="text-xs font-extrabold text-slate-800">Local Support</p><p className="text-[11px] text-slate-500">Here when you need us</p></div></div>
        </div>
      </section>

      <section id="featured-products" className="mx-auto max-w-[1440px] px-3 py-10 md:px-5 md:py-14">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-orange-600">⚡ {content.featuredEyebrow}</p>
            <h2 className="mt-2 text-3xl font-black md:text-4xl">{content.featuredTitle}</h2>
            <p className="mt-3 text-slate-500">{content.featuredDescription}</p>
          </div>
          <Link href="/products/" className="rounded-lg bg-blue-950 px-5 py-3 text-sm font-extrabold text-white hover:bg-blue-800">View all products</Link>
        </div>
        {productsLoading ? (
          <p className="rounded-xl border border-slate-200 bg-white py-14 text-center text-slate-500">Loading products...</p>
        ) : liveProducts.length === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-white py-14 text-center text-slate-500">New products are coming soon. Please check our full catalogue.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {liveProducts.slice(0, 8).map((product) => (
              <article key={product.id} className="group flex min-w-0 flex-col overflow-hidden rounded-sm border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-slate-50 p-6">
                  {product.imageUrl ? (
                    <Link href={"/product/?id=" + product.id} aria-label={"View " + product.name} className="flex h-full w-full items-center justify-center"><img src={product.imageUrl} alt={product.name} loading="lazy" className="h-full w-full object-contain transition duration-300 group-hover:scale-105" /></Link>
                  ) : (
                    <Link href={"/product/?id=" + product.id} className="text-sm font-extrabold tracking-widest text-slate-400">CHITRANYA</Link>
                  )}
                  <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-[10px] font-extrabold uppercase text-blue-900 shadow">{categoryEmoji(product.subCategory || product.category)} {product.category}</span>
                  <span className={product.stock > 0 ? "absolute right-3 top-3 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700" : "absolute right-3 top-3 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-600"}>{product.stock > 0 ? "In stock" : "Out of stock"}</span>
                  {getDiscountPercent(product) > 0 && <span className="absolute bottom-3 left-3 rounded-md bg-red-600 px-3 py-1.5 text-xs font-black text-white shadow">{getDiscountPercent(product)}% OFF</span>}
                </div>
                <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
                  <p className="text-[11px] font-bold uppercase text-slate-400">{product.subCategory || product.category}</p>
                  <h3 className="mt-2 min-h-12 line-clamp-2 font-extrabold text-slate-900"><Link href={"/product/?id=" + product.id} className="transition hover:text-orange-600">{product.name}</Link></h3>
                  <p className="mt-2 min-h-10 line-clamp-2 text-sm leading-5 text-slate-500">{product.description}</p>
                  <div className="mt-3 flex flex-wrap items-baseline gap-2">
                    {getDiscountPercent(product) > 0 ? <>
                      <p className="text-lg font-black text-red-600 sm:text-xl">NPR {Math.round(product.price * (1 - getDiscountPercent(product) / 100)).toLocaleString("en-IN")}</p>
                      <p className="text-sm font-semibold text-slate-400 line-through">NPR {product.price.toLocaleString("en-IN")}</p>
                    </> : <p className="text-lg font-black text-blue-950 sm:text-xl">NPR {product.price.toLocaleString("en-IN")}</p>}
                  </div>
                  <Link href={"/product/?id=" + product.id} className="mt-4 block rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-bold text-blue-950 hover:bg-blue-50">🔍 View Product Details</Link>{product.subCategory && <Link href={"/" + (product.category.toLowerCase() === "hardware" ? "hardware" : "electronics") + "/?category=" + encodeURIComponent(product.subCategory)} className="mt-2 text-center text-xs font-bold text-slate-500 hover:text-orange-600">More in {product.subCategory}</Link>}
                  <button onClick={() => { const discount = getDiscountPercent(product); addToCart({ ...product, price: Math.round(product.price * (1 - discount / 100)) }); setAddedProductId(product.id); }} disabled={product.stock <= 0} className="mt-2 w-full rounded-xl bg-orange-500 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-orange-600 disabled:bg-slate-300">{addedProductId === product.id ? "✓ Added to Cart" : product.stock > 0 ? "🛒 Add to Cart" : "Out of Stock"}</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {content.homeFlashSalesEnabled !== "false" && flashSaleProducts.length > 0 && (
        <section id="flash-sales" className="bg-red-50 py-12 md:py-16">
          <div className="mx-auto max-w-[1440px] px-3 md:px-5">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
              <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-red-600">Limited-time deals</p><h2 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">{content.flashSalesTitle}</h2><p className="mt-2 text-slate-600">{content.flashSalesDescription}</p></div>
              <Link href="/products/" className="rounded-lg bg-red-600 px-5 py-3 text-sm font-extrabold text-white hover:bg-red-700">Shop all deals</Link>
            </div>
            {renderHomepageProductCards(flashSaleProducts)}
          </div>
        </section>
      )}

      {content.homeJustForYouEnabled !== "false" && justForYouProducts.length > 0 && (
        <section id="just-for-you" className="mx-auto max-w-[1440px] px-3 py-12 md:px-5 md:py-16">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">Picked from our catalogue</p><h2 className="mt-2 text-3xl font-black text-slate-950 md:text-4xl">{content.justForYouTitle}</h2><p className="mt-2 text-slate-500">{content.justForYouDescription}</p></div>
            <Link href="/products/" className="rounded-lg border border-blue-900 px-5 py-3 text-sm font-extrabold text-blue-900 hover:bg-blue-950 hover:text-white">Explore all products</Link>
          </div>
          {renderHomepageProductCards(justForYouProducts)}
        </section>
      )}

      {content.homeElectronicsEnabled !== "false" && (
      <section id="electronics" className="mx-auto max-w-7xl px-5 py-20">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">⚡ Shop products</p><h2 className="mt-2 text-3xl font-black md:text-4xl">{content.electronicsTitle}</h2><p className="mt-3 text-slate-500">{content.electronicsDescription}</p></div>
          <Link href="/electronics/" className="rounded-lg border border-blue-900 px-5 py-3 text-sm font-extrabold text-blue-900 hover:bg-blue-950 hover:text-white">View all electronics</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {homepageCategories.filter((item) => item.mainCategory === "Electronics").map((item) => <CategoryCard key={item.id} item={item} href={`/electronics/?category=${encodeURIComponent(item.name)}`} />)}
        </div>
      </section>
      )}



      {content.homeHardwareEnabled !== "false" && (
      <section id="hardware" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-5">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-orange-600">🧰 Build with confidence</p><h2 className="mt-2 text-3xl font-black md:text-4xl">{content.hardwareTitle}</h2><p className="mt-3 text-slate-500">{content.hardwareDescription}</p></div>
            <Link href="/hardware/" className="rounded-lg border border-orange-600 px-5 py-3 text-sm font-extrabold text-orange-700 hover:bg-orange-600 hover:text-white">View all hardware</Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {homepageCategories.filter((item) => item.mainCategory === "Hardware").map((item) => <CategoryCard key={item.id} item={item} href={`/hardware/?category=${encodeURIComponent(item.name)}`} accent="orange" />)}
          </div>
        </div>
      </section>
      )}



      {content.homeServicesEnabled !== "false" && (
      <section id="services" className="mx-auto max-w-7xl px-5 py-20">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-extrabold uppercase tracking-[0.2em] text-blue-700">🏡 We are here to help</p><h2 className="mt-2 text-3xl font-black md:text-4xl">{content.servicesTitle}</h2><p className="mt-3 max-w-2xl text-slate-500">{content.servicesDescription}</p></div>
          <Link href="/services/" className="rounded-lg bg-blue-950 px-5 py-3 text-sm font-extrabold text-white hover:bg-blue-800">Explore all services</Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <article key={service.name} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className="h-48 overflow-hidden bg-slate-100"><img src={photoUrl(service.image)} alt={service.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>
              <div className="p-6">
                <h3 className="text-lg font-extrabold"><span className="mr-2" aria-hidden="true">{categoryEmoji(service.name)}</span>{service.name}</h3>
                <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{service.description}</p>
                <Link href={`/services/?service=${encodeURIComponent(service.name)}`} className="mt-5 inline-flex items-center font-extrabold text-blue-800 hover:text-orange-600">Enquire Now <span className="ml-2 transition-transform group-hover:translate-x-1">→</span></Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      )}

      <section id="contact" className="bg-blue-950 px-6 py-16 text-center text-white">
        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-orange-300">💬 CHITRANYA support</p>
        <h2 className="mt-3 text-3xl font-black">Need Something for Your Home?</h2>
        <p className="mt-4 text-slate-300">Contact CHITRANYA for products and professional services.</p>
        <a href={content.contactEmail ? "mailto:" + content.contactEmail : "mailto:info@chitranya.com"} className="mt-7 inline-block rounded-lg bg-orange-500 px-8 py-4 font-extrabold hover:bg-orange-600">✉️ Contact CHITRANYA</a>
      </section>

      <footer className="bg-slate-950 px-6 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} {content.footerText}
      </footer>
    </main>
  );
}
