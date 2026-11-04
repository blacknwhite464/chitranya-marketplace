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
  imageUrl?: string;
  description: string;
  specifications: string[];
  stock: number;
  active: boolean;
  mainCategory?: string;
  subCategory?: string;
  unit?: string;
};

const emptyForm = {
  name: "",
  category: "Electronics",
  subCategory: "",
  price: "",
  unit: "pcs",
  emoji: "📦",
  description: "",
  specifications: "",
  stock: "10",
  active: true,
  imageUrl: "",
};

const money = (value: number) => "NPR " + value.toLocaleString("en-IN");

export default function AdminProductsPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [availableSubcategories, setAvailableSubcategories] = useState<{ id: string; mainCategory: string; name: string; active: boolean }[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    let unsubscribeProducts: (() => void) | undefined;
    let unsubscribeCategories: (() => void) | undefined;
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user || user.uid !== ADMIN_UID) {
        if (user) void signOut(auth);
        router.replace("/admin/login/");
        setChecking(false);
        return;
      }

      setChecking(false);
      unsubscribeCategories = onSnapshot(collection(db, "categories"), (snapshot) => {
        setAvailableSubcategories(snapshot.docs.map((entry) => {
          const data = entry.data();
          return { id: entry.id, mainCategory: String(data.mainCategory ?? ""), name: String(data.name ?? ""), active: data.active !== false };
        }).filter((item) => item.active));
      }, (categoryError) => { console.error(categoryError); });
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
              mainCategory: typeof data.mainCategory === "string" ? data.mainCategory : undefined,
              subCategory: typeof data.subCategory === "string" ? data.subCategory : undefined,
              price: Number(data.price ?? 0),
              emoji: String(data.emoji ?? ""),
              imageUrl: String(data.imageUrl ?? ""),
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
      unsubscribeCategories?.();
    };
  }, [router]);

  function resetForm() {
    setForm(emptyForm);
    setSelectedImage(null);
    setImagePreview("");
    setEditingDocId(null);
  }

  function startEdit(product: Product) {
    setEditingDocId(product.docId);
    setForm({
      name: product.name,
      category: product.mainCategory || (product.category === "Services" ? "Home Services" : product.category),
      subCategory: product.subCategory ?? "",
      price: String(product.price),
      unit: product.unit || "pcs",
      emoji: product.emoji,
      imageUrl: product.imageUrl ?? "",
      description: product.description,
      specifications: product.specifications.join("\n"),
      stock: String(product.stock),
      active: product.active,
    });
    setSelectedImage(null);
    setImagePreview(product.imageUrl ?? "");
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

    if (selectedImage && (!selectedImage.type.startsWith("image/") || selectedImage.size > 5 * 1024 * 1024)) {
      setError("Choose an image file smaller than 5 MB.");
      return;
    }

    setSaving(true);
    let imageUrl = form.imageUrl;
    try {
      if (selectedImage) {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
        if (!cloudName || !uploadPreset) throw new Error("Cloudinary is not configured. Add the cloud name and unsigned upload preset to .env.local.");
        const uploadData = new FormData();
        uploadData.append("file", selectedImage);
        uploadData.append("upload_preset", uploadPreset);
        const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: uploadData });
        const result = await response.json();
        if (!response.ok || !result.secure_url) throw new Error(result.error?.message || "Image upload failed.");
        imageUrl = result.secure_url;
      }
    } catch (uploadError) {
      console.error(uploadError);
      setError(uploadError instanceof Error ? uploadError.message : "Could not upload product photo.");
      setSaving(false);
      return;
    }

    if (!form.subCategory) {
      setError("Please select a subcategory. If the list is empty, add subcategories in Manage Categories first.");
      setSaving(false);
      return;
    }

    const productData = {
      name: form.name.trim(),
      category: form.category,
      mainCategory: form.category,
      subCategory: form.subCategory,
      price,
      unit: form.unit,
      emoji: "",
      imageUrl,
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
            <Link href="/admin/" className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold hover:bg-slate-800">Orders Dashboard</Link>
            <Link href="/admin/categories/" className="rounded-lg border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-300 hover:bg-slate-800">Manage Categories</Link>
            <Link href="/admin/pricing/" className="rounded-lg border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-300 hover:bg-slate-800">Pricing & Discounts</Link>
            <Link href="/admin/quotations/" className="rounded-lg border border-orange-500 px-4 py-2 text-sm font-semibold text-orange-300 hover:bg-slate-800">Quotations</Link>
            <Link href="/" className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold hover:bg-slate-800">View Store</Link>
            <button onClick={async () => { await signOut(auth); router.replace("/admin/login/"); }} className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold hover:bg-slate-800">Sign out</button>
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
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value, subCategory: "" })} className="mt-1 w-full rounded-lg border bg-white px-3 py-2">
                <option>Electronics</option>
                <option>Hardware</option>
                <option>Home Services</option>
              </select>
            </label>

            <label className="block text-sm font-semibold text-slate-700">Subcategory
              <select required value={form.subCategory} onChange={(event) => setForm({ ...form, subCategory: event.target.value })} className="mt-1 w-full rounded-lg border bg-white px-3 py-2">
                <option value="">Select a subcategory</option>
                {availableSubcategories.filter((item) => item.mainCategory === form.category).sort((x, y) => x.name.localeCompare(y.name)).map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
              </select>
              {!availableSubcategories.some((item) => item.mainCategory === form.category && item.active) && <span className="mt-1 block text-xs font-medium text-amber-700">No subcategories found. Open Manage Categories and add some first.</span>}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm font-semibold text-slate-700">Price (NPR)
                <input required type="number" min="1" step="1" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="45000" />
              </label>
              <label className="block text-sm font-semibold text-slate-700">Unit
                <select value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} className="mt-1 w-full rounded-lg border bg-white px-3 py-2"><option value="pcs">Piece (pcs)</option><option value="set">Set</option><option value="box">Box</option><option value="pair">Pair</option><option value="kg">Kilogram (kg)</option><option value="g">Gram (g)</option><option value="meter">Meter (m)</option><option value="feet">Feet (ft)</option><option value="litre">Litre (L)</option><option value="roll">Roll</option><option value="pack">Pack</option><option value="unit">Unit</option><option value="service">Service</option></select>
              </label>
              <label className="col-span-2 block text-sm font-semibold text-slate-700">Stock
                <input required type="number" min="0" step="1" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Product photo (JPG, PNG or WebP · max 5 MB)
                <input type="file" accept="image/*" onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedImage(file);
                  if (file) setImagePreview(URL.createObjectURL(file));
                }} className="mt-1 block w-full rounded-lg border bg-white px-3 py-2 text-sm" />
              </label>
              <div className="flex flex-wrap items-end gap-3"><div className="flex h-60 w-60 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-3">{imagePreview ? <img src={imagePreview} alt="Product preview" className="h-full w-full object-contain" /> : <div className="text-center"><span className="block text-lg font-black tracking-widest text-blue-950">CHITRANYA</span><span className="mt-2 block text-xs font-bold uppercase tracking-wider text-slate-400">No Product Photo</span></div>}</div>{imagePreview && <button type="button" onClick={() => { setSelectedImage(null); setImagePreview(""); setForm({ ...form, imageUrl: "" }); }} className="text-sm font-semibold text-red-600">Remove photo</button>}</div>
              <p className="text-xs text-slate-500">Upload a clear product photo. It will appear on the shop and product details page.</p>
            </div>

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
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-slate-50 p-1">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain" /> : <span className="text-center text-[8px] font-black uppercase leading-tight tracking-wide text-blue-950">CHITRANYA<br/><span className="font-semibold text-slate-400">No Product Photo</span></span>}</div>
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-slate-900">{product.name}</h3>
                      <p className="text-sm text-slate-500">{product.mainCategory || product.category}{product.subCategory ? " / " + product.subCategory : ""} · {money(product.price)} / {product.unit || "pcs"} · Stock: {product.stock}</p>
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
