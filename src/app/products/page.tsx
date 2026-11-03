
"use client";

import { useMemo, useState } from "react";

const products = [
  { id: 1, name: "Smart LED Television", category: "Electronics", price: 45000, emoji: "📺", description: "Modern smart television for your home." },
  { id: 2, name: "Double Door Refrigerator", category: "Electronics", price: 65000, emoji: "🧊", description: "Spacious and energy-efficient refrigerator." },
  { id: 3, name: "Automatic Washing Machine", category: "Electronics", price: 55000, emoji: "🧺", description: "Convenient automatic washing machine." },
  { id: 4, name: "Laptop Computer", category: "Electronics", price: 85000, emoji: "💻", description: "Reliable computer for work and study." },
  { id: 5, name: "CCTV Security Camera", category: "Electronics", price: 7500, emoji: "📹", description: "Security camera for home and business." },
  { id: 6, name: "Electric Drill Machine", category: "Hardware", price: 8500, emoji: "🔩", description: "Powerful drill for everyday projects." },
  { id: 7, name: "Professional Tool Kit", category: "Hardware", price: 4500, emoji: "🧰", description: "Essential tools for repairs and maintenance." },
  { id: 8, name: "Water Tap Set", category: "Hardware", price: 2500, emoji: "🚰", description: "Quality bathroom and kitchen fittings." },
  { id: 9, name: "LED Ceiling Light", category: "Hardware", price: 1800, emoji: "💡", description: "Energy-saving lighting for your home." },
  { id: 10, name: "Safety Helmet", category: "Hardware", price: 1200, emoji: "⛑️", description: "Protective equipment for construction work." },
];

const formatPrice = (price: number) =>
  "NPR " + price.toLocaleString("en-IN");

export default function ProductsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [cart, setCart] = useState<number[]>([]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || product.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [search, category]);

  function addToCart(id: number) {
    setCart((current) => [...current, id]);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 px-6 py-5 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <a href="/" className="text-2xl font-black text-white">
            CHITRANYA<span className="text-orange-500">.</span>
          </a>
          <div className="flex gap-5 text-sm font-semibold">
            <a href="/" className="hover:text-orange-400">Home</a>
            <a href="/#electronics" className="hover:text-orange-400">Electronics</a>
            <a href="/#hardware" className="hover:text-orange-400">Hardware</a>
          </div>
          <div className="rounded-lg bg-white/10 px-4 py-2">
            🛒 Cart: {cart.length}
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-r from-blue-950 to-blue-800 px-6 py-16 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="font-bold uppercase tracking-widest text-orange-400">
            CHITRANYA Marketplace
          </p>
          <h1 className="mt-3 text-4xl font-black md:text-5xl">
            Explore Our Products
          </h1>
          <p className="mt-4 text-slate-300">
            Quality electronics and hardware for your home and business.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 flex flex-col gap-4 md:flex-row">
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border bg-white px-5 py-4 outline-none focus:border-blue-600"
          />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="rounded-lg border bg-white px-5 py-4"
          >
            <option value="All">All Categories</option>
            <option value="Electronics">Electronics</option>
            <option value="Hardware">Hardware</option>
          </select>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black">Our Products</h2>
          <span className="text-sm text-slate-500">
            {filteredProducts.length} products found
          </span>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {filteredProducts.map((product) => (
            <article key={product.id} className="overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="flex h-48 items-center justify-center bg-slate-100 text-7xl">
                {product.emoji}
              </div>

              <div className="p-5">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
                  {product.category}
                </span>
                <h3 className="mt-2 text-lg font-bold">{product.name}</h3>
                <p className="mt-2 min-h-10 text-sm text-slate-500">
                  {product.description}
                </p>
                <p className="mt-4 text-xl font-black text-blue-900">
                  {formatPrice(product.price)}
                </p>
                <a
                  href={`/products/${product.id}/`}
                  className="mt-4 block w-full rounded-lg border border-blue-800 px-4 py-3 text-center font-bold text-blue-800 hover:bg-blue-50"
                >
                  View Details
                </a>
                <button
                  onClick={() => addToCart(product.id)}
                  className="mt-3 w-full rounded-lg bg-blue-800 px-4 py-3 font-bold text-white hover:bg-blue-900"
                >
                  + Add to Cart
                </button>
              </div>
            </article>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <p className="py-16 text-center text-slate-500">
            No products found. Try another search.
          </p>
        )}
      </section>

      <footer className="bg-slate-950 px-6 py-8 text-center text-sm text-slate-400">
        © 2026 CHITRANYA. All rights reserved.
      </footer>
    </main>
  );
}
