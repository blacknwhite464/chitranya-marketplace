"use client";

import { useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";

const ADMIN_UID = "28jNe77DmcY7fgGrKhKNgwubDCa2";

type Product = {
  docId: string;
  id: number;
  name: string;
  category: string;
  price: number;
  emoji: string;
  description: string;
  specifications: string[];
  stock: number;
  active: boolean;
};

const emptyForm = {
  name: "",
  category: "Electronics",
  price: "",
  emoji: "📦",
  description: "",
  specifications: "",
  stock: "10",
  active: true,
};

const money = (value: number) => "NPR " + value.toLocaleString("en-IN");

export default function AdminProductsPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let unsubscribeProducts: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user || user.uid !== ADMIN_UID) {
        if (user) void signOut(auth);
        router.replace("/admin/login/index.html");
        setChecking(false);
        return;
      }

      setChecking(false);
      unsubscribeProducts = onSnapshot(
        collection(db, "products"),
        (snapshot) => {
          const list = snapshot.docs.map((item) => {
            const data = item.data();
            return {
              docId: item.id,
              id: Number(data.id ?? item.id),
              name: String(data.name ?? ""),
              category: String(data.category ?? "Electronics"),
              price: Number(data.price ?? 0),
              emoji: String(data.emoji ?? "📦"),
              description: String(data.description ?? ""),
              specifications: Array.isArray(data.specifications) ? data.specifications : [],
              stock: Number(data.stock ?? 0),
              active: data.active !== false,
            } as Product;
          });
          list.sort((a, b) => a.id - b.id);
          setProducts(list);
          setError("");
        },
        (snapshotError) => {
          console.error(snapshotError);
          setError("Could not load products. Check your Firestore rules.");
        }
      );
    });

    return () => {
      unsubscribeAuth();
      unsubscribeProducts?.();
    };
  }, [router]);

  function resetForm() {
    setForm(emptyForm);
    setEditingDocId(null);
  }

  function startEdit(product: Product) {
    setEditingDocId(product.docId);
    setForm({
      name: product.name,
      category: product.category,
      price: String(product.price),
      emoji: product.emoji,
      description: product.description,
      specifications: product.specifications.join("\n"),
      stock: String(product.stock),
      active: product.active,
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    const price = Number(form.price);
    const stock = Number(form.stock);
    if (!form.name.trim() || !form.description.trim() || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0) {
      setError("Enter a product name, description, valid price and valid stock quantity.");
      return;
    }

    setSaving(true);
    const productData = {
      name: form.name.trim(),
      category: form.category,
      price,
      emoji: form.emoji.trim() || "📦",
      description: form.description.trim(),
      specifications: form.specifications.split("\n").map((line) => line.trim()).filter(Boolean),
      stock,
      active: form.active,
    };

    try {
      if (editingDocId) {
        await updateDoc(doc(db, "products", editingDocId), productData);
        setMessage("Product updated successfully.");
      } else {
        const nextId = products.reduce((highest, product) => Math.max(highest, product.id), 0) + 1;
        await addDoc(collection(db, "products"), { id: nextId, ...productData });
        setMessage("Product added successfully.");
      }
      resetForm();
    } catch (saveError) {
      console.error(saveError);
      setError("Could not save the product. Please check your internet connection and Firestore rules.");
    } finally {
      setSaving(false);
    }
  }

  async function removeProduct(product: Product) {
    const confirmed = window.confirm(`Delete "${product.name}"? This cannot be undone.`);
    if (!confirmed) return;
    setError("");
    setMessage("");
    try {
      await deleteDoc(doc(db, "products", product.docId));
      if (editingDocId === product.docId) resetForm();
      setMessage("Product deleted.");
    } catch (deleteError) {
      console.error(deleteError);
      setError("Could not delete this product. Check your Firestore rules.");
    }
  }

  if (checking) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Checking admin access...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-slate-950 px-5 py-5 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold tracking-[0.2em] text-orange-400">CHITRANYA</p>
            <h1 className="text-2xl font-black">Product Management</h1>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/index.html" className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold hover:bg-slate-800">Orders Dashboard</Link>
            <button onClick={async () => { await signOut(auth); router.replace("/admin/login/index.html"); }} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold hover:bg-slate-800">Sign out</button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[380px_1fr]">
        <div>
          <form onSubmit={saveProduct} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xl font-black text-slate-900">{editingDocId ? "Edit Product" : "Add Product"}</h2>
              {editingDocId && <button type="button" onClick={resetForm} className="text-sm font-semibold text-blue-700">Cancel edit</button>}
            </div>

            <label className="block text-sm font-semibold text-slate-700">Product name
              <input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="Product name" />
            </label>

            <label className="block text-sm font-semibold text-slate-700">Category
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="mt-1 w-full rounded-lg border bg-white px-3 py-2">
                <option>Electronics</option>
                <option>Hardware</option>
                <option>Services</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-semibold text-slate-700">Price (NPR)
                <input required type="number" min="1" step="1" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="45000" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">Stock
                <input required type="number" min="0" step="1" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
            </div>

            <label className="block text-sm font-semibold text-slate-700">Emoji
              <input value={form.emoji} onChange={(event) => setForm({ ...form, emoji: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="📺" />
            </label>

            <label className="block text-sm font-semibold text-slate-700">Description
              <textarea required rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="Describe this product" />
            </label>

            <label className="block text-sm font-semibold text-slate-700">Specifications (one per line)
              <textarea rows={3} value={form.specifications} onChange={(event) => setForm({ ...form, specifications: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder={"Smart TV functionality\nHigh-quality display"} />
            </label>

            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} />
              Visible in store
            </label>

            <button disabled={saving} className="w-full rounded-lg bg-blue-800 px-4 py-3 font-bold text-white hover:bg-blue-900 disabled:opacity-60">
              {saving ? "Saving..." : editingDocId ? "Save Changes" : "Add Product"}
            </button>
          </form>
          {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
          {message && <p role="status" className="mt-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">{message}</p>}
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Products</h2>
              <p className="text-sm text-slate-600">{products.length} products in Firestore</p>
            </div>
          </div>
          {products.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-slate-600">No products found. Add your first product using the form.</p>
          ) : (
            <div className="space-y-3">
              {products.map((product) => (
                <article key={product.docId} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-3xl">{product.emoji}</span>
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-slate-900">{product.name}</h3>
                      <p className="text-sm text-slate-500">{product.category} · {money(product.price)} · Stock: {product.stock}</p>
                      <p className={product.active ? "text-xs font-semibold text-green-700" : "text-xs font-semibold text-slate-500"}>{product.active ? "Visible in store" : "Hidden from store"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(product)} className="rounded-lg border border-blue-700 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">Edit</button>
                    <button onClick={() => void removeProduct(product)} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
