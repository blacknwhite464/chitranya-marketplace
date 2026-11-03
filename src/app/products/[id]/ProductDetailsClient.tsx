"use client";

import { useState } from "react";

const products = [
  { id: 1, name: "Smart LED Television", category: "Electronics", price: 45000, emoji: "📺", description: "Modern smart television for your home with excellent picture quality and entertainment features.", specifications: ["Smart TV functionality", "High-quality display", "Multiple connectivity options", "Home entertainment"] },
  { id: 2, name: "Double Door Refrigerator", category: "Electronics", price: 65000, emoji: "🧊", description: "Spacious refrigerator designed for convenient food storage.", specifications: ["Double door design", "Spacious storage", "Energy-efficient design"] },
  { id: 3, name: "Automatic Washing Machine", category: "Electronics", price: 55000, emoji: "🧺", description: "Convenient automatic washing machine for everyday laundry.", specifications: ["Automatic washing", "Multiple wash programs", "Modern design"] },
  { id: 4, name: "Laptop Computer", category: "Electronics", price: 85000, emoji: "💻", description: "Reliable computer for work, study and entertainment.", specifications: ["Portable design", "Productivity focused", "Multiple connectivity options"] },
  { id: 5, name: "CCTV Security Camera", category: "Electronics", price: 7500, emoji: "📹", description: "Security camera for monitoring your home or business.", specifications: ["Security monitoring", "Indoor or outdoor options", "Installation available separately"] },
  { id: 6, name: "Electric Drill Machine", category: "Hardware", price: 8500, emoji: "🔩", description: "Powerful drill for everyday construction and repair projects.", specifications: ["Electric operation", "Multiple drilling applications", "Workshop and home use"] },
  { id: 7, name: "Professional Tool Kit", category: "Hardware", price: 4500, emoji: "🧰", description: "Essential tools for repairs and maintenance.", specifications: ["Multiple hand tools", "Organized storage", "Home maintenance"] },
  { id: 8, name: "Water Tap Set", category: "Hardware", price: 2500, emoji: "🚰", description: "Quality bathroom and kitchen fittings.", specifications: ["Modern design", "Water fitting", "Home installation"] },
  { id: 9, name: "LED Ceiling Light", category: "Hardware", price: 1800, emoji: "💡", description: "Energy-saving lighting for your home.", specifications: ["LED technology", "Low energy consumption", "Indoor lighting"] },
  { id: 10, name: "Safety Helmet", category: "Hardware", price: 1200, emoji: "⛑️", description: "Protective equipment for construction work.", specifications: ["Protective headwear", "Construction use", "Adjustable fit"] },
];

export default function ProductDetailsClient({ id }: { id: string }) {
  const product = products.find((item) => item.id === Number(id));
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center">
        <h1 className="text-3xl font-black">Product Not Found</h1>
        <a href="/products/" className="mt-5 font-bold text-blue-700">Back to Products</a>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-slate-950 px-6 py-5 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <a href="/" className="text-2xl font-black">CHITRANYA<span className="text-orange-500">.</span></a>
          <a href="/products/" className="font-semibold hover:text-orange-400">All Products</a>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <a href="/products/" className="font-semibold text-blue-700">← Back to Products</a>
        <div className="mt-8 grid gap-12 rounded-2xl bg-white p-6 shadow-sm md:grid-cols-2 md:p-12">
          <div className="flex min-h-80 items-center justify-center rounded-2xl bg-slate-100 text-9xl">{product.emoji}</div>
          <div>
            <p className="font-bold uppercase tracking-widest text-blue-700">{product.category}</p>
            <h1 className="mt-3 text-3xl font-black md:text-4xl">{product.name}</h1>
            <p className="mt-5 text-3xl font-black text-blue-900">NPR {product.price.toLocaleString("en-IN")}</p>
            <p className="mt-6 leading-7 text-slate-600">{product.description}</p>
            <div className="mt-8">
              <h2 className="text-xl font-bold">Product Specifications</h2>
              <ul className="mt-4 space-y-3">
                {product.specifications.map((specification) => (
                  <li key={specification} className="flex gap-3 text-slate-600"><span className="font-bold text-green-600">✓</span>{specification}</li>
                ))}
              </ul>
            </div>
            <div className="mt-8 flex items-center gap-4">
              <span className="font-bold">Quantity:</span>
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="rounded-lg border px-4 py-2">−</button>
              <span className="font-bold">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="rounded-lg border px-4 py-2">+</button>
            </div>
            <button onClick={() => setAdded(true)} className="mt-8 w-full rounded-lg bg-blue-800 px-6 py-4 font-bold text-white hover:bg-blue-900">
              Add to Cart — NPR {(product.price * quantity).toLocaleString("en-IN")}
            </button>
            {added && <p className="mt-4 rounded-lg bg-green-50 p-4 font-semibold text-green-700">✓ Product added successfully! (Demo only)</p>}
          </div>
        </div>
      </div>
      <footer className="mt-16 bg-slate-950 px-6 py-8 text-center text-slate-400">© 2026 CHITRANYA. All rights reserved.</footer>
    </main>
  );
}
