"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart, type CartProduct } from "@/context/CartContext";

type StoreProduct = CartProduct & {
  description: string;
  active: boolean;
};

const formatPrice = (price: number) =>
  "NPR " + price.toLocaleString("en-IN");

export default function ProductsPage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");\n  const [subCategory, setSubCategory] = useState("All");\n  const [subcategories, setSubcategories] = useState<{ mainCategory: string; name: string }[]>([]);
  const [addedProductId, setAddedProductId] = useState<number | null>(null);
  const { addToCart, itemCount } = useCart();

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const activeProducts = snapshot.docs
          .map((productDoc) => {
            const data = productDoc.data();
            const id = Number(data.id ?? productDoc.id);

            if (!Number.isFinite(id)) return null;

            return {
              id,
              name: String(data.name ?? ""),
              category: String(data.category ?? "Other"),
              price: Number(data.price ?? 0),
              emoji: String(data.emoji ?? "📦"),
              description: String(data.description ?? ""),
              active: data.active === true,
            };
          })
          .filter((product): product is StoreProduct => product !== null && product.active)
          .sort((a, b) => a.id - b.id);

        setProducts(activeProducts);
        setLoadError("");
        setLoading(false);
      },
      (error) => {
        console.error("Unable to load products:", error);
        setLoadError("We couldn't load products. Please refresh the page and try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialSearch = params.get("search");
    if (initialSearch) setSearch(initialSearch);
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = category === "All" || product.category === category;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, category, subCategory]);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-slate-950 px-6 py-5 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <a href="/" className="text-2xl font-black text-white">
            CHITRANYA<span className="text-orange-500">.</span>
          </a>
          <nav className="flex flex-wrap gap-5 text-sm font-semibold">
            <a href="/" className="hover:text-orange-400">Home</a>
            <a href="/products/" className="text-orange-400">Products</a>
            <a href="/#electronics" className="hover:text-orange-400">Electronics</a>
            <a href="/#hardware" className="hover:text-orange-400">Hardware</a>
            <a href="/#services" className="hover:text-orange-400">Services</a>
            <a href="/#contact" className="hover:text-orange-400">Contact</a>
          </nav>
          <Link href="/cart/" className="rounded-lg bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600">
            🛒 Cart: {itemCount}
          </Link>
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
            <option value="Home Services">Home Services</option>
          </select>
        </div>

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-black">Our Products</h2>
          <span className="text-sm text-slate-500">
            {loading ? "Loading products..." : filteredProducts.length + " products found"}
          </span>
        </div>

        {loadError && (
          <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">
            {loadError}
          </p>
        )}

        {loading && (
          <p className="py-16 text-center text-slate-500">Loading products from CHITRANYA...</p>
        )}

        {!loading && !loadError && (
          <>
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
                    <Link
                      href={"/product/?id=" + product.id}
                      className="mt-4 block w-full rounded-lg border border-blue-800 px-4 py-3 text-center font-bold text-blue-800 hover:bg-blue-50"
                    >
                      View Details
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        addToCart(product);
                        setAddedProductId(product.id);
                      }}
                      className="mt-3 w-full rounded-lg bg-blue-800 px-4 py-3 font-bold text-white hover:bg-blue-900 active:scale-[0.99]"
                    >
                      {addedProductId === product.id ? "✓ Added to Cart" : "+ Add to Cart"}
                    </button>
                    {addedProductId === product.id && (
                      <p role="status" aria-live="polite" className="mt-2 text-center text-sm font-semibold text-green-700">
                        Added successfully. Your cart now has {itemCount} item{itemCount === 1 ? "" : "s"}.
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <p className="py-16 text-center text-slate-500">
                No active products found. Please check back soon.
              </p>
            )}
          </>
        )}
      </section>

      <footer className="bg-slate-950 px-6 py-8 text-center text-sm text-slate-400">
        © 2026 CHITRANYA. All rights reserved.
      </footer>
    </main>
  );
}
