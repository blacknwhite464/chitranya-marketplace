"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCart } from "@/context/CartContext";

type StoreProduct = {
  id: number;
  name: string;
  category: string;
  price: number;
  emoji: string;
  imageUrl?: string;
  description: string;
  specifications: string[];
  stock: number;
  active: boolean;
};

const money = (value: number) => "NPR " + value.toLocaleString("en-IN");

export default function ProductDetailsClient({ id }: { id: string }) {
  const [product, setProduct] = useState<StoreProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart, itemCount } = useCart();

  useEffect(() => {
    if (!id) return;

    const unsubscribe = onSnapshot(
      collection(db, "products"),
      (snapshot) => {
        const matchingProduct = snapshot.docs
          .map((productDoc) => {
            const data = productDoc.data();
            const productId = Number(data.id ?? productDoc.id);

            if (!Number.isFinite(productId)) return null;

            return {
              id: productId,
              name: String(data.name ?? ""),
              category: String(data.category ?? "Other"),
              price: Number(data.price ?? 0),
              emoji: "",
              imageUrl: String(data.imageUrl ?? ""),
              description: String(data.description ?? ""),
              specifications: Array.isArray(data.specifications)
                ? data.specifications.map(String)
                : [],
              stock: Number(data.stock ?? 0),
              active: data.active === true,
            } satisfies StoreProduct;
          })
          .find((item) => item !== null && item.id === Number(id) && item.active);

        setProduct(matchingProduct ?? null);
        setLoadError("");
        setLoading(false);
      },
      (error) => {
        console.error("Unable to load product details:", error);
        setLoadError("We couldn't load this product. Please refresh and try again.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        Loading product details...
      </main>
    );
  }

  if (loadError || !product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <h1 className="text-3xl font-black text-slate-900">
          {loadError ? "Unable to Load Product" : "Product Not Found"}
        </h1>
        <p className="mt-3 max-w-lg text-slate-600">
          {loadError || "This product may have been removed or is not currently available."}
        </p>
        <Link href="/products/" className="mt-5 rounded-lg bg-blue-800 px-5 py-3 font-bold text-white">
          Back to Products
        </Link>
      </main>
    );
  }

  const outOfStock = product.stock <= 0;

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-50 bg-slate-950 px-6 py-5 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <a href="/" className="text-2xl font-black">CHITRANYA<span className="text-orange-500">.</span></a>
          <nav className="flex flex-wrap gap-5 text-sm font-semibold">
            <a href="/" className="hover:text-orange-400">Home</a>
            <a href="/products/" className="text-orange-400">Products</a>
            <a href="/#electronics" className="hover:text-orange-400">Electronics</a>
            <a href="/#hardware" className="hover:text-orange-400">Hardware</a>
            <a href="/#services" className="hover:text-orange-400">Services</a>
            <a href="/#contact" className="hover:text-orange-400">Contact</a>
          </nav>
          <Link href="/cart/" className="rounded-lg bg-orange-500 px-4 py-2 font-bold text-white hover:bg-orange-600">
            Cart: {itemCount}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <Link href="/products/" className="font-semibold text-blue-700">← Back to Products</Link>
        <div className="mt-8 grid gap-12 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2 md:p-12">
          <div className="flex aspect-square w-full max-w-[520px] items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100 p-6">
            {product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain" /> : <div className="text-center"><span className="block text-3xl font-black tracking-[0.18em] text-blue-950">CHITRANYA</span><span className="mt-3 block text-xs font-bold uppercase tracking-[0.2em] text-slate-400">No Product Photo</span></div>}
          </div>
          <div>
            <p className="font-bold uppercase tracking-widest text-blue-700">{product.category}</p>
            <h1 className="mt-3 text-3xl font-black md:text-4xl">{product.name}</h1>
            <p className="mt-5 text-3xl font-black text-blue-900">{money(product.price)}</p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              {outOfStock ? "Currently out of stock" : "In stock: " + product.stock}
            </p>
            <p className="mt-6 leading-7 text-slate-600">{product.description}</p>

            {product.specifications.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold">Product Specifications</h2>
                <ul className="mt-4 space-y-3">
                  {product.specifications.map((specification, index) => (
                    <li key={index} className="flex gap-3 text-slate-600">
                      <span className="font-bold text-green-600">✓</span>{specification}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-8 flex items-center gap-4">
              <span className="font-bold">Quantity:</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="rounded-lg border px-4 py-2"
                aria-label="Decrease quantity"
              >−</button>
              <span className="font-bold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={outOfStock || quantity >= product.stock}
                className="rounded-lg border px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Increase quantity"
              >+</button>
            </div>

            <button
              type="button"
              disabled={outOfStock}
              onClick={() => {
                addToCart({
                  id: product.id,
                  name: product.name,
                  category: product.category,
                  price: product.price,
                  emoji: "",
                  imageUrl: product.imageUrl,
                  stock: product.stock,
                }, quantity);
                setAdded(true);
              }}
              className="mt-8 w-full rounded-lg bg-blue-800 px-6 py-4 font-bold text-white hover:bg-blue-900 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {outOfStock ? "Out of Stock" : "Add to Cart — " + money(product.price * quantity)}
            </button>
            {added && (
              <p role="status" className="mt-4 rounded-lg bg-green-50 p-4 font-semibold text-green-700">
                ✓ Product added to your shopping cart!
              </p>
            )}
          </div>
        </div>
      </div>
      <footer className="mt-16 bg-slate-950 px-6 py-8 text-center text-slate-400">
        © 2026 CHITRANYA. All rights reserved.
      </footer>
    </main>
  );
}
