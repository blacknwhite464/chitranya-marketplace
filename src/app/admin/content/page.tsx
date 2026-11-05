"use client";

import { useEffect, useState, type FormEvent } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { SITE_CONTENT_DEFAULTS } from "@/lib/siteContent";

const ADMIN_UID = "28jNe77DmcY7fgGrKhKNgwubDCa2";

const groups = [
  { title: "Store-wide settings", description: "Announcement bar and contact details.", fields: [
    ["announcement", "Announcement bar text"], ["contactPhone", "Contact phone"], ["contactEmail", "Contact email"], ["footerText", "Footer text"],
  ]},
  { title: "Homepage", description: "Main banner and homepage product/category sections.", fields: [
    ["homeEyebrow", "Hero small heading"], ["homeTitle", "Hero main heading"], ["homeDescription", "Hero description"],
    ["featuredEyebrow", "Featured products small heading"], ["featuredTitle", "Featured products title"], ["featuredDescription", "Featured products description"],
    ["electronicsTitle", "Electronics section title"], ["electronicsDescription", "Electronics section description"], ["homeElectronicsEnabled", "Show Electronics section on homepage"],
    ["hardwareTitle", "Hardware section title"], ["hardwareDescription", "Hardware section description"], ["homeHardwareEnabled", "Show Hardware section on homepage"],
    ["servicesTitle", "Home services section title"], ["servicesDescription", "Home services section description"], ["homeServicesEnabled", "Show Home Services section on homepage"],
  ]},
  { title: "Shop all products page", description: "Heading and introduction above the product catalogue.", fields: [
    ["productsTitle", "Page title"], ["productsDescription", "Page description"],
  ]},
  { title: "Electronics page", description: "Heading and introduction for the electronics catalogue.", fields: [
    ["electronicsPageTitle", "Page title"], ["electronicsPageDescription", "Page description"],
  ]},
  { title: "Hardware page", description: "Heading and introduction for the hardware catalogue.", fields: [
    ["hardwarePageTitle", "Page title"], ["hardwarePageDescription", "Page description"],
  ]},
  { title: "Home services page", description: "Main service banner content.", fields: [
    ["servicesPageEyebrow", "Small heading"], ["servicesPageTitle", "Main heading"], ["servicesPageDescription", "Description"],
  ]},
  { title: "Main Admin Contact", description: "Manage the profile shown above the store branches on the Contact page. Turn it off to hide the profile without deleting its details.", fields: [
    ["adminContactEnabled", "Show Main Admin Contact on Contact page"],
    ["adminContactName", "Admin name"], ["adminContactPhone", "Mobile number"], ["adminContactEmail", "Email address"],
    ["adminContactPhotoUrl", "Photo image URL (optional; add later)"], ["adminContactIntroduction", "Introduction and CHITRANYA brand message"],
  ]},
] as const;

export default function AdminContentPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [values, setValues] = useState<Record<string, string>>(SITE_CONTENT_DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const stop = onAuthStateChanged(auth, async (user) => {
      if (!user || user.uid !== ADMIN_UID) {
        if (user) await signOut(auth);
        router.replace("/admin/login/");
        setChecking(false);
        return;
      }
      try {
        const snapshot = await getDoc(doc(db, "siteContent", "main"));
        if (snapshot.exists()) setValues({ ...SITE_CONTENT_DEFAULTS, ...(snapshot.data() as Record<string, string>) });
      } catch (loadError) {
        console.error(loadError);
        setError("Could not load website settings. Please refresh and try again.");
      } finally {
        setChecking(false);
      }
    });
    return () => stop();
  }, [router]);

  function change(key: string, value: string) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      await setDoc(doc(db, "siteContent", "main"), { ...values, updatedAt: serverTimestamp(), updatedBy: auth.currentUser?.uid || "" }, { merge: true });
      setMessage("Website content saved. Changes will appear on the website automatically.");
    } catch (saveError) {
      console.error(saveError);
      setError("Could not save website content. Check your internet connection and Firestore rules.");
    } finally {
      setSaving(false);
    }
  }

  if (checking) return <main className="flex min-h-screen items-center justify-center bg-slate-100">Checking admin access...</main>;

  return <main className="min-h-screen bg-slate-100 text-slate-900">
    <header className="bg-slate-950 px-5 py-5 text-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
        <div><p className="text-sm font-bold tracking-[0.2em] text-orange-400">CHITRANYA</p><h1 className="text-2xl font-black">Website Content Manager</h1><p className="mt-1 text-sm text-slate-400">Edit website text and page sections without changing code.</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/admin/" className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold">Dashboard</Link><Link href="/" target="_blank" className="rounded-lg border border-slate-600 px-4 py-2 text-sm font-semibold">View website</Link></div>
      </div>
    </header>
    <div className="sticky top-0 z-20 border-b bg-white px-5 py-3 shadow-sm"><div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3"><nav className="flex flex-wrap gap-2 text-sm font-bold"><Link href="/admin/" className="rounded-lg px-3 py-2 hover:bg-slate-100">Dashboard</Link><Link href="/admin/products/" className="rounded-lg px-3 py-2 hover:bg-slate-100">Products</Link><Link href="/admin/categories/" className="rounded-lg px-3 py-2 hover:bg-slate-100">Categories</Link><span className="rounded-lg bg-orange-50 px-3 py-2 text-orange-700">Edit Website</span></nav><button onClick={() => void signOut(auth).then(() => router.replace("/admin/login/"))} className="rounded-lg border px-3 py-2 text-sm font-bold">Sign out</button></div></div>
    <form onSubmit={save} className="mx-auto max-w-5xl space-y-6 px-5 py-8">
      {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {message && <p role="status" className="rounded-xl bg-green-50 p-4 text-sm text-green-800">{message}</p>}
      {groups.map((group) => <section key={group.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5"><h2 className="text-xl font-black">{group.title}</h2><p className="mt-1 text-sm text-slate-500">{group.description}</p></div>
        <div className="grid gap-5 md:grid-cols-2">
          {group.fields.map(([key, label]) => <label key={key} className="block text-sm font-bold text-slate-700">{label}
            {(key === "adminContactEnabled" || key === "homeServicesEnabled" || key === "homeElectronicsEnabled" || key === "homeHardwareEnabled") ? <input type="checkbox" checked={values[key] !== "false"} onChange={(event) => change(key, event.target.checked ? "true" : "false")} className="ml-3 h-5 w-5 accent-orange-500" /> : key.toLowerCase().includes("description") || key.toLowerCase().includes("introduction") || key.toLowerCase().includes("title") || key === "announcement" || key === "footerText" ? <textarea rows={key.toLowerCase().includes("description") || key.toLowerCase().includes("introduction") || key === "footerText" ? 5 : 2} value={values[key] ?? ""} onChange={(event) => change(key, event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-orange-500" /> : <input value={values[key] ?? ""} onChange={(event) => change(key, event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 font-normal outline-none focus:border-orange-500" />}
          </label>)}
        </div>
      </section>)}
      <div className="sticky bottom-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur"><p className="text-sm text-slate-500">Save your changes to publish the text updates to the website.</p><button disabled={saving} className="rounded-xl bg-orange-500 px-8 py-3.5 font-extrabold text-white hover:bg-orange-600 disabled:opacity-60">{saving ? "Saving..." : "Save website changes"}</button></div>
    </form>
  </main>;
}
