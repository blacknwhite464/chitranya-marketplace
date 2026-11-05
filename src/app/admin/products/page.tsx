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
  writeBatch,
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

type BulkProductForm = { name: string; category: string; subCategory: string; price: string; unit: string; stock: string; description: string; };
type ImportProductRow = { name: string; category: string; subCategory: string; price: string; unit: string; stock: string; description: string; };
function parseProductCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (char === '"') {
      if (quoted && text[i + 1] === '"') { cell += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { row.push(cell.trim()); cell = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && text[i + 1] === "\n") i += 1;
      row.push(cell.trim()); cell = "";
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

const emptyBulkProduct = (): BulkProductForm => ({ name: "", category: "Electronics", subCategory: "", price: "", unit: "pcs", stock: "10", description: "" });
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
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [showImportForm, setShowImportForm] = useState(false);
  const [importRows, setImportRows] = useState<ImportProductRow[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [importSaving, setImportSaving] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkProductForm[]>([emptyBulkProduct(), emptyBulkProduct()]);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [bulkRateOpen, setBulkRateOpen] = useState<string | null>(null);
  const [bulkRateSelected, setBulkRateSelected] = useState<Record<string, boolean>>({});
  const [bulkRateDrafts, setBulkRateDrafts] = useState<Record<string, string>>({});
  const [bulkRateSaving, setBulkRateSaving] = useState(false);

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

  async function saveBulkSubcategoryRates(items: Product[]) {
    const selected = items.filter((product) => bulkRateSelected[product.docId]);
    if (selected.length === 0) {
      setError("Select at least one product to update its rate.");
      return;
    }
    const invalid = selected.find((product) => {
      const value = Number(bulkRateDrafts[product.docId] ?? product.price);
      return !Number.isFinite(value) || value <= 0;
    });
    if (invalid) {
      setError("Enter a valid rate greater than zero for " + invalid.name + ".");
      return;
    }
    setBulkRateSaving(true);
    setError("");
    setMessage("");
    try {
      const batch = writeBatch(db);
      selected.forEach((product) => {
        batch.update(doc(db, "products", product.docId), {
          price: Number(bulkRateDrafts[product.docId] ?? product.price),
        });
      });
      await batch.commit();
      setMessage("Updated rates for " + selected.length + " products in " + (items[0]?.subCategory || "this subcategory") + ".");
      setBulkRateSelected((old) => {
        const next = { ...old };
        selected.forEach((product) => { delete next[product.docId]; });
        return next;
      });
      setBulkRateOpen(null);
    } catch (rateError) {
      console.error(rateError);
      setError("Could not update the selected product rates. Please try again.");
    } finally {
      setBulkRateSaving(false);
    }
  }

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
      stock: product.stock > 0 ? "10" : "0",
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
    const stock = form.stock === "0" ? 0 : 10;
    if (!form.name.trim() || !form.description.trim() || !Number.isFinite(price) || price <= 0) {
      setError("Enter a product name, description and valid price.");
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

  function updateBulkRow(index: number, field: keyof BulkProductForm, value: string) {
    setBulkRows((rows) => rows.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value, ...(field === "category" ? { subCategory: "" } : {}) } : row));
  }

  async function saveBulkProducts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (bulkRows.length === 0) { setError("Add at least one product row."); return; }
    for (let index = 0; index < bulkRows.length; index += 1) {
      const row = bulkRows[index];
      const price = Number(row.price);
      if (!row.name.trim() || !row.description.trim() || !row.subCategory || !Number.isFinite(price) || price <= 0) {
        setError("Please complete the name, subcategory, description and valid price for product row " + (index + 1) + ".");
        return;
      }
    }
    if (bulkRows.length > 400) { setError("You can create up to 400 products at one time."); return; }
    setBulkSaving(true);
    try {
      const batch = writeBatch(db);
      const firstId = products.reduce((highest, product) => Math.max(highest, product.id), 0) + 1;
      bulkRows.forEach((row, index) => {
        const productRef = doc(collection(db, "products"));
        batch.set(productRef, {
          id: firstId + index, name: row.name.trim(), category: row.category,
          mainCategory: row.category, subCategory: row.subCategory, price: Number(row.price),
          unit: row.unit, emoji: "", imageUrl: "", description: row.description.trim(),
          specifications: [], stock: row.stock === "0" ? 0 : 10, active: true,
        });
      });
      await batch.commit();
      setMessage(bulkRows.length + " products created successfully.");
      setBulkRows([emptyBulkProduct(), emptyBulkProduct()]);
      setShowBulkForm(false);
    } catch (bulkError) {
      console.error(bulkError);
      setError("Could not create the products. Check your internet connection and Firestore rules, then try again.");
    } finally { setBulkSaving(false); }
  }


  function downloadImportTemplate() {
    const csv = "name,category,subcategory,price,unit,availability,description\\nExample Smart TV,Electronics,Televisions & Smart TVs,45000,pcs,Stock,43 inch smart television\\nExample Drill Machine,Hardware,Power Tools,6500,pcs,Out of Stock,Heavy duty drill machine";
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url; link.download = "chitranya-product-import-template.csv"; link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File | undefined) {
    if (!file) return;
    setError(""); setMessage(""); setImportFileName(file.name);
    try {
      const parsed = parseProductCsv(await file.text());
      if (parsed.length < 2) throw new Error("The file has no product rows. Use the CSV template and add your products below the heading row.");
      const headers = parsed[0].map((value) => value.toLowerCase().replace(/\s+/g, "").replace(/_/g, ""));
      const column = (names: string[]) => headers.findIndex((header) => names.includes(header));
      const indexes = {
        name: column(["name", "product", "productname"]),
        category: column(["category", "maincategory"]),
        subCategory: column(["subcategory", "subcategoryname"]),
        price: column(["price", "sellingprice", "rate"]),
        unit: column(["unit"]),
        stock: column(["availability", "status", "stock", "quantity", "qty"]),
        description: column(["description", "details"]),
      };
      if (indexes.name < 0 || indexes.category < 0 || indexes.subCategory < 0 || indexes.price < 0) {
        throw new Error("Missing required columns. Include: name, category, subcategory, price. Optional: unit, availability and description.");
      }
      const rows = parsed.slice(1).map((cells) => ({
        name: cells[indexes.name] ?? "",
        category: cells[indexes.category] ?? "",
        subCategory: cells[indexes.subCategory] ?? "",
        price: cells[indexes.price] ?? "",
        unit: indexes.unit >= 0 ? (cells[indexes.unit] || "pcs") : "pcs",
        stock: (() => { const value = indexes.stock >= 0 ? (cells[indexes.stock] || "Stock") : "Stock"; const normalized = value.trim().toLowerCase(); return normalized === "0" || normalized === "out of stock" || normalized === "out-of-stock" || normalized === "unavailable" ? "0" : "10"; })(),
        description: indexes.description >= 0 ? (cells[indexes.description] || "") : "",
      }));
      if (rows.length > 400) throw new Error("Please import up to 400 products per file.");
      const problems: string[] = [];
      rows.forEach((row, index) => {
        const category = row.category.trim();
        const price = Number(row.price);
        const subExists = availableSubcategories.some((item) => item.active && item.mainCategory === category && item.name.toLowerCase() === row.subCategory.trim().toLowerCase());
        if (!row.name.trim()) problems.push("Row " + (index + 2) + ": product name is missing.");
        else if (!["Electronics", "Hardware", "Home Services"].includes(category)) problems.push("Row " + (index + 2) + ": category must be Electronics, Hardware or Home Services.");
        else if (!subExists) problems.push("Row " + (index + 2) + ": subcategory does not match " + category + ".");
        else if (!Number.isFinite(price) || price <= 0) problems.push("Row " + (index + 2) + ": enter a valid price.");
        
      });
      if (problems.length) throw new Error(problems.slice(0, 8).join(" ") + (problems.length > 8 ? " And " + (problems.length - 8) + " more error(s)." : ""));
      setImportRows(rows);
      setMessage("Ready to import " + rows.length + " products. Review the preview before saving.");
    } catch (err) {
      setImportRows([]);
      setError(err instanceof Error ? err.message : "Could not read this CSV file.");
    }
  }

  async function saveImportedProducts() {
    if (!importRows.length) return;
    setImportSaving(true); setError(""); setMessage("");
    try {
      const batch = writeBatch(db);
      const firstId = products.reduce((highest, product) => Math.max(highest, product.id), 0) + 1;
      importRows.forEach((row, index) => {
        const productRef = doc(collection(db, "products"));
        const category = row.category.trim();
        const subCategory = availableSubcategories.find((item) => item.active && item.mainCategory === category && item.name.toLowerCase() === row.subCategory.trim().toLowerCase())?.name ?? row.subCategory.trim();
        batch.set(productRef, {
          id: firstId + index, name: row.name.trim(), category, mainCategory: category,
          subCategory, price: Number(row.price), unit: row.unit.trim() || "pcs",
          emoji: "", imageUrl: "", description: row.description.trim() || row.name.trim(),
          specifications: [], stock: row.stock === "0" ? 0 : 10, active: true,
        });
      });
      await batch.commit();
      setMessage(importRows.length + " products imported successfully.");
      setImportRows([]); setImportFileName(""); setShowImportForm(false);
    } catch (err) {
      console.error(err);
      setError("Import failed. Check your internet connection and Firestore rules, then try again.");
    } finally { setImportSaving(false); }
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

  const filteredProducts = products.filter((product) => {
    const search = productSearch.trim().toLowerCase();
    if (!search) return true;
    return [product.name, product.mainCategory || product.category, product.subCategory || "", String(product.price), product.description]
      .some((value) => value.toLowerCase().includes(search));
  });

  const groupedProducts = (() => {
    const groups = new Map<string, Map<string, Product[]>>();
    filteredProducts.forEach((product) => {
      const main = product.mainCategory || product.category || "Uncategorized";
      const sub = product.subCategory || "Other / No Subcategory";
      if (!groups.has(main)) groups.set(main, new Map());
      const subgroups = groups.get(main)!;
      if (!subgroups.has(sub)) subgroups.set(sub, []);
      subgroups.get(sub)!.push(product);
    });
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([main, subgroups]) => ({
        main,
        count: Array.from(subgroups.values()).reduce((total, items) => total + items.length, 0),
        subgroups: Array.from(subgroups.entries()).sort(([a], [b]) => a.localeCompare(b)),
      }));
  })();

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
          <div className="mb-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => { setShowBulkForm(false); setShowImportForm(false); setError(""); }} className={!showBulkForm && !showImportForm ? "rounded-lg bg-blue-800 px-4 py-2 text-sm font-bold text-white" : "rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700"}>Add One</button>
            <button type="button" onClick={() => { setShowBulkForm(true); setShowImportForm(false); setError(""); setMessage(""); }} className={showBulkForm ? "rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white" : "rounded-lg border border-orange-300 bg-white px-4 py-2 text-sm font-bold text-orange-700"}>Bulk Entry</button>
            <button type="button" onClick={() => { setShowImportForm(true); setShowBulkForm(false); setError(""); setMessage(""); }} className={showImportForm ? "rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white" : "rounded-lg border border-green-300 bg-white px-4 py-2 text-sm font-bold text-green-700"}>Import Excel / CSV</button>
          </div>
          {showImportForm ? (
            <section className="space-y-5 rounded-2xl bg-white p-5 shadow-sm">
              <div>
                <h2 className="text-xl font-black text-slate-900">Import many products at once</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">Prepare your product list in Excel, save it as CSV, then upload it here. You can import up to 400 products at a time.</p>
              </div>
              <button type="button" onClick={downloadImportTemplate} className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-800">Download Excel / CSV Template</button>
              <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5">
                <label className="block cursor-pointer text-center">
                  <span className="block text-sm font-bold text-slate-800">Choose your completed CSV file</span>
                  <span className="mt-1 block text-xs text-slate-500">Export your Excel sheet as CSV (Comma delimited)</span>
                  <input type="file" accept=".csv,text/csv" onChange={(event) => void handleImportFile(event.target.files?.[0])} className="mt-4 block w-full text-sm" />
                </label>
                {importFileName && <p className="mt-3 text-center text-xs font-semibold text-slate-600">{importFileName}</p>}
              </div>
              <div className="rounded-xl bg-amber-50 p-4 text-xs leading-5 text-amber-900">
                <strong>Required columns:</strong> name, category, subcategory, price. Optional: unit, availability, description. Set availability to <b>Stock</b> or <b>Out of Stock</b>. If omitted, products default to Stock. Category must match Electronics, Hardware or Home Services, and the subcategory must already exist in Manage Categories. Missing description defaults to the product name.
              </div>
              {importRows.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <h3 className="font-bold text-slate-900">Preview ({importRows.length} products)</h3>
                    <button type="button" onClick={() => { setImportRows([]); setImportFileName(""); }} className="text-xs font-semibold text-red-600">Clear file</button>
                  </div>
                  <div className="max-h-80 overflow-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[620px] text-left text-xs">
                      <thead className="sticky top-0 bg-slate-100 text-slate-600"><tr><th className="p-2">#</th><th className="p-2">Product</th><th className="p-2">Category / Subcategory</th><th className="p-2">Price</th><th className="p-2">Availability</th></tr></thead>
                      <tbody>{importRows.map((row, index) => <tr key={index} className="border-t"><td className="p-2">{index + 1}</td><td className="p-2 font-semibold">{row.name}</td><td className="p-2">{row.category} / {row.subCategory}</td><td className="p-2">{money(Number(row.price))}</td><td className="p-2">{row.stock === "0" ? "Out of Stock" : "Stock"}</td></tr>)}</tbody>
                    </table>
                  </div>
                  <button type="button" disabled={importSaving} onClick={() => void saveImportedProducts()} className="mt-4 w-full rounded-xl bg-green-700 px-4 py-3 font-bold text-white hover:bg-green-800 disabled:opacity-60">{importSaving ? "Importing products..." : "Confirm & Import " + importRows.length + " Products"}</button>
                </div>
              )}
            </section>
          ) : showBulkForm ? (
            <form onSubmit={saveBulkProducts} className="space-y-5 rounded-2xl bg-white p-5 shadow-sm">
              <div><h2 className="text-xl font-black text-slate-900">Bulk Add Products</h2><p className="mt-1 text-sm text-slate-600">Enter products under each main category. Select the matching subcategory for every product, then save all rows together.</p></div>
              {(["Electronics", "Hardware", "Home Services"] as const).map((mainCategory) => {
                const categoryRows = bulkRows.map((row, index) => ({ row, index })).filter(({ row }) => row.category === mainCategory);
                return (
                  <section key={mainCategory} className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 px-4 py-3">
                      <h3 className="font-black text-slate-900">{mainCategory}</h3>
                      <button type="button" onClick={() => setBulkRows((rows) => [...rows, { ...emptyBulkProduct(), category: mainCategory }])} className="rounded-lg bg-blue-800 px-3 py-2 text-xs font-bold text-white">+ Add {mainCategory} Product</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[1000px] border-collapse text-left text-sm">
                        <thead className="bg-white text-xs uppercase tracking-wide text-slate-600">
                          <tr><th className="p-3">S.N.</th><th className="p-3">Product name</th><th className="p-3">Subcategory</th><th className="p-3">Price (NPR)</th><th className="p-3">Unit</th><th className="p-3">Availability</th><th className="p-3">Description</th><th className="p-3">Action</th></tr>
                        </thead>
                        <tbody>
                          {categoryRows.length ? categoryRows.map(({ row, index }, categoryIndex) => (
                            <tr key={index} className="border-t border-slate-200 align-top">
                              <td className="p-3 font-bold text-slate-500">{categoryIndex + 1}</td>
                              <td className="p-2"><input required aria-label={mainCategory + " product " + (categoryIndex + 1) + " name"} value={row.name} onChange={(event) => updateBulkRow(index, "name", event.target.value)} className="w-40 rounded-lg border px-2 py-2" placeholder="Product name" /></td>
                              <td className="p-2"><select required aria-label="Subcategory" value={row.subCategory} onChange={(event) => updateBulkRow(index, "subCategory", event.target.value)} className="w-44 rounded-lg border bg-white px-2 py-2"><option value="">Select subcategory</option>{availableSubcategories.filter((item) => item.mainCategory === mainCategory).sort((a, b) => a.name.localeCompare(b.name)).map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></td>
                              <td className="p-2"><input required type="number" min="1" step="1" aria-label="Price in NPR" value={row.price} onChange={(event) => updateBulkRow(index, "price", event.target.value)} className="w-28 rounded-lg border px-2 py-2" placeholder="Price" /></td>
                              <td className="p-2"><select aria-label="Unit" value={row.unit} onChange={(event) => updateBulkRow(index, "unit", event.target.value)} className="w-28 rounded-lg border bg-white px-2 py-2"><option value="pcs">Piece</option><option value="set">Set</option><option value="box">Box</option><option value="pair">Pair</option><option value="kg">Kg</option><option value="meter">Meter</option><option value="feet">Feet</option><option value="litre">Litre</option><option value="roll">Roll</option><option value="pack">Pack</option><option value="unit">Unit</option><option value="service">Service</option></select></td>
                              <td className="p-2"><select aria-label="Availability" value={row.stock} onChange={(event) => updateBulkRow(index, "stock", event.target.value)} className="w-32 rounded-lg border bg-white px-2 py-2"><option value="10">Stock</option><option value="0">Out of Stock</option></select></td>
                              <td className="p-2"><input required aria-label="Description" value={row.description} onChange={(event) => updateBulkRow(index, "description", event.target.value)} className="w-44 rounded-lg border px-2 py-2" placeholder="Description" /></td>
                              <td className="p-2"><button type="button" onClick={() => setBulkRows((rows) => rows.filter((_, rowIndex) => rowIndex !== index))} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600">Remove</button></td>
                            </tr>
                          )) : <tr><td colSpan={8} className="p-4 text-center text-sm text-slate-500">No products added in this category yet. Use the button above.</td></tr>}
                        </tbody>
                      </table>
                    </div>
                  </section>
                );
              })}
              <button disabled={bulkSaving || bulkRows.length === 0} className="w-full rounded-lg bg-orange-500 px-4 py-3 font-bold text-white hover:bg-orange-600 disabled:opacity-60">{bulkSaving ? "Creating Products..." : "Save All " + bulkRows.length + " Products"}</button>
            </form>
          ) : (
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
              <label className="col-span-2 block text-sm font-semibold text-slate-700">Product Availability
                <select value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} className="mt-1 w-full rounded-lg border bg-white px-3 py-2"><option value="10">Stock</option><option value="0">Out of Stock</option></select>
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
          )}
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
          <label className="mb-4 block">
            <span className="mb-1 block text-sm font-semibold text-slate-700">Search product to edit its rate / price</span>
            <input type="search" value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Search by product name, category, subcategory or current price..." className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" />
          </label>
          {products.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-slate-600">No products found. Add your first product using the form.</p>
          ) : (
            <div className="space-y-4">
              {filteredProducts.length === 0 ? (
                <p className="rounded-2xl bg-white p-6 text-slate-600">No matching products found. Try another product name or category.</p>
              ) : groupedProducts.map((group) => (
                <details key={group.main} open={Boolean(productSearch.trim())} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-slate-900 px-4 py-4 text-white">
                    <span className="font-black">{group.main}</span>
                    <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">{group.count} products</span>
                  </summary>
                  <div className="space-y-4 p-3 sm:p-4">
                    {group.subgroups.map(([subcategory, items]) => (
                      <section key={subcategory} className="overflow-hidden rounded-xl border border-slate-200">
                        <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100 px-3 py-3">
                          <h3 className="font-bold text-slate-800">{subcategory}</h3>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500">{items.length} products</span>
                            <button type="button" onClick={() => {
                              const key = group.main + "::" + subcategory;
                              setBulkRateOpen((current) => current === key ? null : key);
                              setBulkRateSelected((old) => {
                                const next = { ...old };
                                items.forEach((product) => { next[product.docId] = false; });
                                return next;
                              });
                              setBulkRateDrafts((old) => ({ ...old, ...Object.fromEntries(items.map((product) => [product.docId, String(product.price)])) }));
                            }} className="rounded-lg bg-blue-800 px-3 py-2 text-xs font-bold text-white hover:bg-blue-900">{bulkRateOpen === group.main + "::" + subcategory ? "Close rate editor" : "Bulk edit rates"}</button>
                          </div>
                        </div>
                        {bulkRateOpen === group.main + "::" + subcategory && (
                          <div className="space-y-3 border-b border-blue-100 bg-blue-50 p-3">
                            <p className="text-xs leading-5 text-blue-900">Select the products you want to change, enter each new selling rate, then save them together.</p>
                            {items.map((product) => (
                              <div key={product.docId} className="grid grid-cols-[auto_1fr_125px] items-center gap-2">
                                <input type="checkbox" checked={Boolean(bulkRateSelected[product.docId])} onChange={(event) => setBulkRateSelected((old) => ({ ...old, [product.docId]: event.target.checked }))} aria-label={"Select " + product.name} className="h-4 w-4" />
                                <label className="min-w-0 text-xs font-semibold text-slate-700">{product.name}<span className="block font-normal text-slate-500">Current: {money(product.price)}</span></label>
                                <input type="number" min="1" step="1" value={bulkRateDrafts[product.docId] ?? String(product.price)} onChange={(event) => setBulkRateDrafts((old) => ({ ...old, [product.docId]: event.target.value }))} aria-label={"New rate for " + product.name} className="w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm" />
                              </div>
                            ))}
                            <button type="button" disabled={bulkRateSaving || !items.some((product) => bulkRateSelected[product.docId])} onClick={() => void saveBulkSubcategoryRates(items)} className="w-full rounded-lg bg-green-700 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{bulkRateSaving ? "Saving rates..." : "Save selected product rates"}</button>
                          </div>
                        )}
                        <div className="space-y-2 p-2">
                          {items.map((product) => (
                            <article key={product.docId} className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-50 p-3">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-white p-1">{product.imageUrl ? <img src={product.imageUrl} alt={product.name} className="h-full w-full object-contain" /> : <span className="text-center text-[8px] font-black uppercase leading-tight tracking-wide text-blue-950">CHITRANYA<br/><span className="font-semibold text-slate-400">No Product Photo</span></span>}</div>
                                <div className="min-w-0">
                                  <h4 className="truncate font-bold text-slate-900">{product.name}</h4>
                                  <p className="text-sm text-slate-500">{money(product.price)} / {product.unit || "pcs"} · {product.stock > 0 ? "Stock" : "Out of Stock"}</p>
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
                      </section>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
