"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";

const ADMIN_UID = "28jNe77DmcY7fgGrKhKNgwubDCa2";
const MAIN_CATEGORIES = ["Electronics", "Hardware", "Home Services"];
type Subcategory = { id: string; name: string; mainCategory: string; active: boolean };
type Product = { docId: string; name: string; mainCategory: string; subCategory: string; price: number; discountMode: string; discountPercent: number };
const subRuleId = (main: string, sub: string) => "subcategory:" + main + "::" + sub;
const money = (value: number) => "NPR " + value.toLocaleString("en-IN");

export default function AdminPricingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [rules, setRules] = useState<Record<string, number>>({});
  const [draftRules, setDraftRules] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<Product[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [draftSubRules, setDraftSubRules] = useState<Record<string, string>>({});
  const [draftProducts, setDraftProducts] = useState<Record<string, { mode: string; percent: string }>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [hiddenPricingEntries, setHiddenPricingEntries] = useState<Record<string, boolean>>({});
  const [visibilityLoaded, setVisibilityLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("chitranya-admin-hidden-pricing-categories");
      if (saved) setHiddenPricingEntries(JSON.parse(saved) as Record<string, boolean>);
    } catch (err) {
      console.error("Could not load admin pricing visibility preferences:", err);
    } finally {
      setVisibilityLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!visibilityLoaded) return;
    try {
      window.localStorage.setItem("chitranya-admin-hidden-pricing-categories", JSON.stringify(hiddenPricingEntries));
    } catch (err) {
      console.error("Could not save admin pricing visibility preferences:", err);
    }
  }, [hiddenPricingEntries, visibilityLoaded]);

  function togglePricingEntry(key: string) {
    setHiddenPricingEntries((old) => {
      const next = { ...old };
      if (next[key]) delete next[key];
      else next[key] = true;
      return next;
    });
  }

  useEffect(() => {
    let stopRules: (() => void) | undefined;
    let stopProducts: (() => void) | undefined;
    let stopCategories: (() => void) | undefined;
    const stopAuth = onAuthStateChanged(auth, (user) => {
      stopRules?.(); stopProducts?.(); stopCategories?.();
      if (!user || user.uid !== ADMIN_UID) {
        if (user) void signOut(auth);
        router.replace("/admin/login/"); setChecking(false); return;
      }
      setChecking(false);
      stopRules = onSnapshot(collection(db, "pricingRules"), (snapshot) => {
        const next: Record<string, number> = {};
        snapshot.docs.forEach((entry) => { next[entry.id] = Number(entry.data().discountPercent ?? 0); });
        setRules(next);
        setDraftRules(Object.fromEntries(MAIN_CATEGORIES.map((category) => [category, String(next[category] ?? 0)])));
        setDraftSubRules((old) => ({ ...old, ...Object.fromEntries(Object.entries(next).filter(([id]) => id.startsWith("subcategory:")).map(([id, value]) => [id, String(value)])) }));
      }, (err) => { console.error(err); setError("Could not load category pricing rules."); });
      stopCategories = onSnapshot(collection(db, "categories"), (snapshot) => {
        const list = snapshot.docs.map((entry) => { const data = entry.data(); return { id: entry.id, name: String(data.name ?? ""), mainCategory: String(data.mainCategory ?? ""), active: data.active !== false }; }).filter((item) => item.active);
        setSubcategories(list);
        setDraftSubRules((old) => Object.fromEntries(list.map((item) => { const id = subRuleId(item.mainCategory, item.name); return [id, old[id] ?? String(rules[id] ?? 0)]; })));
      }, (err) => { console.error(err); setError("Could not load subcategories."); });
      stopProducts = onSnapshot(collection(db, "products"), (snapshot) => {
        const list = snapshot.docs.map((entry) => {
          const data = entry.data();
          return { docId: entry.id, name: String(data.name ?? ""), mainCategory: String(data.mainCategory ?? data.category ?? "Electronics"), subCategory: String(data.subCategory ?? ""), price: Number(data.price ?? 0), discountMode: String(data.discountMode ?? "inherit"), discountPercent: Number(data.discountPercent ?? 0) };
        });
        setProducts(list.sort((a,b) => a.name.localeCompare(b.name)));
        setDraftProducts(Object.fromEntries(list.map((p) => [p.docId, { mode: p.discountMode, percent: String(p.discountPercent) }])));
      }, (err) => { console.error(err); setError("Could not load products."); });
    });
    return () => { stopAuth(); stopRules?.(); stopProducts?.(); stopCategories?.(); };
  }, [router]);

  async function saveCategory(category: string) {
    const percent = Number(draftRules[category]);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) { setError("Discount must be between 0 and 100%."); return; }
    setBusy(category); setError(""); setNotice("");
    try {
      await setDoc(doc(db, "pricingRules", category), { mainCategory: category, discountPercent: percent, updatedAt: new Date() }, { merge: true });
      setNotice(category + " default discount saved.");
    } catch (err) { console.error(err); setError("Could not save category discount. Check Firestore rules."); }
    finally { setBusy(""); }
  }

  async function saveSubcategory(item: Subcategory) {
    const id = subRuleId(item.mainCategory, item.name);
    const percent = Number(draftSubRules[id] ?? 0);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) { setError("Discount must be between 0 and 100%."); return; }
    setBusy(id); setError(""); setNotice("");
    try {
      await setDoc(doc(db, "pricingRules", id), { ruleType: "subcategory", mainCategory: item.mainCategory, subCategory: item.name, discountPercent: percent, updatedAt: new Date() }, { merge: true });
      setNotice(item.name + " subcategory discount saved.");
    } catch (err) { console.error(err); setError("Could not save subcategory discount. Check Firestore rules."); }
    finally { setBusy(""); }
  }

  async function saveProduct(product: Product) {
    const draft = draftProducts[product.docId] ?? { mode: "inherit", percent: "0" };
    const percent = Number(draft.percent);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) { setError("Product discount must be between 0 and 100%."); return; }
    setBusy(product.docId); setError(""); setNotice("");
    try {
      await updateDoc(doc(db, "products", product.docId), { discountMode: draft.mode, discountPercent: draft.mode === "override" ? percent : 0 });
      setNotice(product.name + " pricing saved.");
    } catch (err) { console.error(err); setError("Could not save product pricing."); }
    finally { setBusy(""); }
  }

  if (checking) return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">Checking admin access...</main>;
  return <main className="min-h-screen bg-slate-100">
    <header className="bg-slate-950 px-5 py-5 text-white"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3"><div><p className="text-sm font-bold tracking-[0.2em] text-orange-400">CHITRANYA</p><h1 className="text-2xl font-black">Pricing & Discounts</h1></div><nav className="flex flex-wrap gap-2"><Link href="/admin/" className="rounded-lg border border-slate-600 px-3 py-2 text-sm">Orders</Link><Link href="/admin/products/" className="rounded-lg border border-slate-600 px-3 py-2 text-sm">Products</Link><Link href="/admin/categories/" className="rounded-lg border border-slate-600 px-3 py-2 text-sm">Categories</Link><Link href="/admin/quotations/" className="rounded-lg border border-orange-500 px-3 py-2 text-sm text-orange-300">Quotations</Link><button onClick={async()=>{await signOut(auth);router.replace("/admin/login/");}} className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-bold">Sign out</button></nav></div></header>
    <section className="mx-auto max-w-7xl space-y-8 px-5 py-8">
      <div><h2 className="text-xl font-black text-slate-900">Category default discounts</h2><p className="mt-1 text-sm text-slate-600">Set the default percentage for each main category. New and inherited products use this rate automatically.</p></div>
      <div className="grid gap-4 md:grid-cols-3">{MAIN_CATEGORIES.filter((category)=>!hiddenPricingEntries["main:"+category]).map((category)=><article key={category} className="rounded-2xl bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-2"><h3 className="font-black text-slate-900">{category}</h3><button type="button" onClick={()=>togglePricingEntry("main:"+category)} className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Hide</button></div><label className="mt-4 block text-sm font-semibold text-slate-600">Default discount (%)<input type="number" min="0" max="100" step="0.5" value={draftRules[category] ?? "0"} onChange={(e)=>setDraftRules((old)=>({...old,[category]:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-3 text-lg font-bold"/></label><button disabled={busy===category} onClick={()=>void saveCategory(category)} className="mt-3 w-full rounded-lg bg-blue-900 px-4 py-3 font-bold text-white disabled:opacity-50">{busy===category?"Saving...":"Save default discount"}</button><p className="mt-2 text-xs text-slate-500">Current saved rate: {rules[category] ?? 0}%</p></article>)}</div>
      {MAIN_CATEGORIES.some((category)=>hiddenPricingEntries["main:"+category])&&<div className="rounded-xl border border-dashed border-slate-300 bg-white p-4"><p className="mb-2 text-sm font-bold text-slate-700">Hidden main categories</p><div className="flex flex-wrap gap-2">{MAIN_CATEGORIES.filter((category)=>hiddenPricingEntries["main:"+category]).map((category)=><button key={category} type="button" onClick={()=>togglePricingEntry("main:"+category)} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">Unhide {category}</button>)}</div></div>}
      <div><h2 className="text-xl font-black text-slate-900">Subcategory default discounts</h2><p className="mt-1 text-sm text-slate-600">Set a discount for each subcategory. This overrides the main category default for products that inherit pricing.</p></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{subcategories.filter((item)=>!hiddenPricingEntries["sub:"+item.id]).map((item) => { const id = subRuleId(item.mainCategory, item.name); return <article key={item.id} className="rounded-2xl bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-2"><div><p className="text-xs font-bold uppercase tracking-wide text-slate-500">{item.mainCategory}</p><h3 className="mt-1 font-black text-slate-900">{item.name}</h3></div><button type="button" onClick={()=>togglePricingEntry("sub:"+item.id)} className="shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">Hide</button></div><label className="mt-3 block text-sm font-semibold text-slate-600">Default discount (%)<input type="number" min="0" max="100" step="0.5" value={draftSubRules[id] ?? String(rules[id] ?? 0)} onChange={(e)=>setDraftSubRules((old)=>({...old,[id]:e.target.value}))} className="mt-1 w-full rounded-lg border px-3 py-2 text-lg font-bold"/></label><button disabled={busy===id} onClick={()=>void saveSubcategory(item)} className="mt-2 w-full rounded-lg bg-blue-900 px-3 py-2 font-bold text-white disabled:opacity-50">{busy===id?"Saving...":"Save subcategory discount"}</button><p className="mt-2 text-xs text-slate-500">Saved rate: {rules[id] ?? 0}%</p></article>; })}</div>
      {subcategories.some((item)=>hiddenPricingEntries["sub:"+item.id])&&<div className="rounded-xl border border-dashed border-slate-300 bg-white p-4"><p className="mb-2 text-sm font-bold text-slate-700">Hidden subcategories</p><div className="flex flex-wrap gap-2">{subcategories.filter((item)=>hiddenPricingEntries["sub:"+item.id]).map((item)=><button key={item.id} type="button" onClick={()=>togglePricingEntry("sub:"+item.id)} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">Unhide {item.name} <span className="text-xs text-slate-500">({item.mainCategory})</span></button>)}</div></div>}
      <div><h2 className="text-xl font-black text-slate-900">Individual product pricing</h2><p className="mt-1 text-sm text-slate-600">Inherit category discount, set a product-specific discount, or keep the product at its fixed price.</p></div>
      {error&&<p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}{notice&&<p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-700">{notice}</p>}
      <div className="space-y-3">
        <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-300 px-3 py-2.5">
            <span aria-hidden="true" className="text-lg text-slate-400">⌕</span>
            <input type="search" value={productSearch} onChange={(event)=>setProductSearch(event.target.value)} placeholder="Search product name, category or subcategory..." aria-label="Search individual product pricing" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
            {productSearch && <button type="button" onClick={()=>setProductSearch("")} className="text-xs font-bold text-slate-500 hover:text-slate-900">Clear</button>}
          </label>
          <p className="shrink-0 text-sm font-semibold text-slate-500">{products.filter((product)=>[product.name,product.mainCategory,product.subCategory,String(product.price)].some((value)=>value.toLowerCase().includes(productSearch.trim().toLowerCase()))).length} of {products.length} products</p>
        </div>
        {products.filter((product)=>[product.name,product.mainCategory,product.subCategory,String(product.price)].some((value)=>value.toLowerCase().includes(productSearch.trim().toLowerCase()))).map((product)=>{const draft=draftProducts[product.docId]??{mode:"inherit",percent:"0"};const categoryRate=rules[subRuleId(product.mainCategory,product.subCategory)]??rules[product.mainCategory]??0;const rate=draft.mode==="override"?Number(draft.percent):draft.mode==="fixed"?0:categoryRate;return <article key={product.docId} className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_150px_auto] md:items-center"><div><h3 className="font-bold text-slate-900">{product.name}</h3><p className="text-sm text-slate-500">{product.mainCategory}{product.subCategory ? " · " + product.subCategory : ""} · Base price {money(product.price)}</p><p className="mt-1 text-sm font-semibold text-emerald-700">{rate}% off · {money(Math.round(product.price*(1-rate/100)))} final</p></div><label className="text-xs font-bold text-slate-600">Pricing rule<select value={draft.mode} onChange={(e)=>setDraftProducts((old)=>({...old,[product.docId]:{...draft,mode:e.target.value}}))} className="mt-1 w-full rounded-lg border bg-white px-2 py-2 text-sm"><option value="inherit">Use category default</option><option value="override">Custom discount</option><option value="fixed">Fixed price (no discount)</option></select></label><label className="text-xs font-bold text-slate-600">Product discount (%)<input type="number" min="0" max="100" step="0.5" disabled={draft.mode!=="override"} value={draft.percent} onChange={(e)=>setDraftProducts((old)=>({...old,[product.docId]:{...draft,percent:e.target.value}}))} className="mt-1 w-full rounded-lg border px-2 py-2 text-sm disabled:bg-slate-100"/></label><button disabled={busy===product.docId} onClick={()=>void saveProduct(product)} className="rounded-lg bg-orange-500 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{busy===product.docId?"Saving...":"Save"}</button></article>})}
        {products.length>0 && !products.some((product)=>[product.name,product.mainCategory,product.subCategory,String(product.price)].some((value)=>value.toLowerCase().includes(productSearch.trim().toLowerCase()))) && <p className="rounded-xl bg-white p-6 text-center text-sm text-slate-500">No products match “{productSearch}”. Try another name or category.</p>}
      </div>
    </section>
  </main>;
}
