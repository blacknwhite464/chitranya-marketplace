"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";

const ADMIN_UID = "28jNe77DmcY7fgGrKhKNgwubDCa2";
const MAIN_CATEGORIES = ["Electronics", "Hardware", "Home Services"] as const;
const DEFAULT_SUBCATEGORIES: Record<string, string[]> = {
  Electronics: ["Televisions & Smart TVs", "Refrigerators", "Washing Machines", "Kitchen Appliances", "Computers & Accessories", "CCTV & Security Systems", "Fans & Cooling Appliances", "Lights & Lighting", "Electrical Appliances", "Audio & Speakers", "Mobile Accessories"],
  Hardware: ["Hand Tools", "Power Tools", "Plumbing Materials", "Electrical Accessories", "Paint & Painting Equipment", "Construction Materials", "Bathroom Fittings", "Door & Window Fittings", "Safety Equipment", "Nuts, Bolts & Fasteners", "Adhesives & Sealants"],
  "Home Services": ["Plumbing Services", "Electrical Repair", "AC Installation & Servicing", "Appliance Repair", "CCTV Installation", "Home Cleaning", "Painting Services", "Home Renovation", "Hardware Installation", "Bathroom Installation", "Carpenter Services", "TV & Wall Mounting"],
};
type CategoryItem = { id: string; mainCategory: string; name: string; active: boolean };

export default function AdminCategoriesPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [mainCategory, setMainCategory] = useState<string>("Electronics");
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let stopCategories: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(auth, (user) => {
      stopCategories?.();
      stopCategories = undefined;

      if (!user || user.uid !== ADMIN_UID) {
        if (user) void signOut(auth);
        setItems([]);
        router.replace("/admin/login/");
        setChecking(false);
        return;
      }

      setChecking(false);
      stopCategories = onSnapshot(collection(db, "categories"), (snapshot) => {
        setItems(snapshot.docs.map((entry) => {
          const data = entry.data();
          return { id: entry.id, mainCategory: String(data.mainCategory ?? ""), name: String(data.name ?? ""), active: data.active !== false };
        }).filter((item) => MAIN_CATEGORIES.includes(item.mainCategory as typeof MAIN_CATEGORIES[number])));
      }, (err) => {
        console.error(err);
        setError("Could not load categories. Check that your Firestore rules allow the administrator to read the categories collection.");
      });
    });

    return () => {
      stopAuth();
      stopCategories?.();
    };
  }, [router]);

  const grouped = useMemo(() => MAIN_CATEGORIES.map((main) => ({
    main,
    children: items.filter((item) => item.mainCategory === main).sort((a, b) => a.name.localeCompare(b.name)),
  })), [items]);

  async function seedDefaults() {
    if (items.length) return;
    setBusy(true); setError(""); setNotice("");
    try {
      for (const main of MAIN_CATEGORIES) {
        for (const sub of DEFAULT_SUBCATEGORIES[main]) {
          await addDoc(collection(db, "categories"), { mainCategory: main, name: sub, active: true });
        }
      }
      setNotice("Default subcategories added successfully.");
    } catch (err) {
      console.error(err);
      setError("Could not create default subcategories. Check Firestore permissions for the categories collection.");
    } finally { setBusy(false); }
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    if (items.some((item) => item.mainCategory === mainCategory && item.name.toLowerCase() === cleanName.toLowerCase() && item.id !== editingId)) {
      setError("This subcategory already exists under the selected main category.");
      return;
    }
    setBusy(true); setError(""); setNotice("");
    try {
      if (editingId) {
        const { updateDoc } = await import("firebase/firestore");
        await updateDoc(doc(db, "categories", editingId), { mainCategory, name: cleanName });
        setNotice("Subcategory updated.");
      } else {
        await addDoc(collection(db, "categories"), { mainCategory, name: cleanName, active: true });
        setNotice("Subcategory added.");
      }
      setName(""); setEditingId(null);
    } catch (err) {
      console.error(err);
      setError("Could not save the subcategory. Check Firestore permissions and try again.");
    } finally { setBusy(false); }
  }

  async function removeCategory(item: CategoryItem) {
    if (!window.confirm(`Delete "${item.name}" from ${item.mainCategory}? Products assigned to it should be reassigned first.`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const products = await getDocs(query(collection(db, "products"), where("subCategory", "==", item.name)));
      if (!products.empty) {
        setError(`Cannot delete: ${products.size} product(s) still use this subcategory. Reassign them first.`);
        return;
      }
      await deleteDoc(doc(db, "categories", item.id));
      if (editingId === item.id) { setEditingId(null); setName(""); }
      setNotice("Subcategory deleted.");
    } catch (err) {
      console.error(err);
      setError("Could not delete this subcategory. Check Firestore permissions and try again.");
    } finally { setBusy(false); }
  }

  if (checking) return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Checking admin access...</main>;

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="bg-slate-950 px-5 py-5 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div><p className="text-sm font-bold tracking-[0.2em] text-orange-400">CHITRANYA</p><h1 className="text-2xl font-black">Category Management</h1></div>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/" className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold">Orders</Link>
            <Link href="/admin/products/" className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold">Products</Link>
            <Link href="/" className="rounded-lg border border-slate-600 px-3 py-2 text-sm font-semibold">View Store</Link>
            <button onClick={async () => { await signOut(auth); router.replace("/admin/login/"); }} className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-bold">Sign out</button>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="mb-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-black">Three main categories</h2>
          <p className="mt-1 text-sm text-slate-600">Electronics, Hardware and Home Services are fixed. You can add, rename and remove their subcategories here.</p>
          {!items.length && <button disabled={busy} onClick={() => void seedDefaults()} className="mt-4 rounded-lg bg-blue-800 px-4 py-3 font-bold text-white disabled:opacity-50">{busy ? "Setting up..." : "Set up recommended subcategories"}</button>}
        </div>
        <form onSubmit={saveCategory} className="mb-8 grid gap-3 rounded-2xl bg-white p-5 shadow-sm md:grid-cols-[1fr_2fr_auto]">
          <label className="text-sm font-semibold text-slate-700">Main category<select value={mainCategory} onChange={(e) => setMainCategory(e.target.value)} className="mt-1 w-full rounded-lg border bg-white px-3 py-3">{MAIN_CATEGORIES.map((main) => <option key={main}>{main}</option>)}</select></label>
          <label className="text-sm font-semibold text-slate-700">Subcategory name<input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Smart Door Locks" className="mt-1 w-full rounded-lg border px-3 py-3"/></label>
          <div className="flex items-end gap-2"><button disabled={busy} className="rounded-lg bg-orange-500 px-5 py-3 font-bold text-white disabled:opacity-50">{editingId ? "Save changes" : "Add subcategory"}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setName(""); }} className="rounded-lg border px-4 py-3 font-semibold">Cancel</button>}</div>
        </form>
        {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="mb-4 rounded-xl bg-green-50 p-4 text-sm text-green-700">{notice}</p>}
        <div className="grid gap-5 lg:grid-cols-3">
          {grouped.map(({ main, children }) => <section key={main} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-black">{main}</h2><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">{children.length} subcategories</span></div>
            {children.length ? <ul className="space-y-2">{children.map((item) => <li key={item.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 p-3"><span className="text-sm font-medium text-slate-800">{item.name}</span><span className="flex shrink-0 gap-2"><button onClick={() => { setEditingId(item.id); setMainCategory(item.mainCategory); setName(item.name); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="text-xs font-bold text-blue-700">Edit</button><button disabled={busy} onClick={() => void removeCategory(item)} className="text-xs font-bold text-red-600 disabled:opacity-50">Delete</button></span></li>)}</ul> : <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No subcategories yet.</p>}
          </section>)}
        </div>
      </section>
    </main>
  );
}
