import Link from "next/link";

const branches = [
  {
    name: "Jay Maa Ugrachandi Hardware",
    area: "Kavrepalanchok, Nepal",
    landlines: ["011-665544"],
    mobiles: ["9801364268"],
    coordinates: "27.6317113,85.4941313",
    maps: "https://www.google.com/maps/place/jay+maa+ugrachandi+hardware/@27.6316801,85.4220486,9893m/data=!3m1!1e3!4m10!1m2!2m1!1sJAY+MA+UGRACHANDI+hardware+contact+number!3m6!1s0x39eb0fd8019d9ef1:0xd14012931ba66939!8m2!3d27.6317113!4d85.4941313!16s%2Fg%2F11pklrjbj1",
  },
  {
    name: "Chitranya Hardware And Suppliers",
    area: "Kavrepalanchok, Nepal",
    landlines: ["011-404159"],
    mobiles: ["9801364221"],
    coordinates: "27.5632187,85.6400835",
    maps: "https://www.google.com/maps/place/Chitranya+Hardware+And+Suppliers/@27.5632234,85.6375086,619m/data=!3m2!1e3!4b1!4m6!3m5!1s0x39eba170c9417983:0x84a99ffe584c534d!8m2!3d27.5632187!4d85.6400835!16s%2Fg%2F11ks242p7y",
  },
  {
    name: "Chitranya Hardware and Sanitary",
    area: "Kavrepalanchok, Nepal",
    landlines: ["011-441099"],
    mobiles: ["9801364230"],
    coordinates: "27.5914543,85.5167329",
    maps: "https://www.google.com/maps/place/Chitranya+Hardware+and+Sanitary/@27.591459,85.514158,619m/data=!3m2!1e3!4m6!3m5!1s0x39eb0f0071e6587f:0xaad007c6ba42c4dd!8m2!3d27.5914543!4d85.5167329!16s%2Fg%2F11vry5l9jf",
  },
  {
    name: "Chitranya Hardware Pvt. Ltd.",
    area: "Kavrepalanchok, Nepal",
    landlines: ["011-665531", "011-665104"],
    mobiles: ["9801316271"],
    coordinates: "27.6355123,85.5165676",
    maps: "https://www.google.com/maps/place/Chitranya+hardware+Pvt+ltd/@27.635517,85.5139927,618m/data=!3m2!1e3!4m6!3m5!1s0x39eb0fa46fe1ca2f:0x735dfee131e23216!8m2!3d27.6355123!4d85.5165676!16s%2Fg%2F11rqyv77p2",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-blue-950 px-4 py-14 text-white md:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-300">CHITRANYA • Our locations</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Visit a CHITRANYA store</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100">Find your nearest branch for electronics, hardware, sanitary products and store assistance. Call your branch or get directions below.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <article className="mb-8 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
          <div className="grid gap-6 p-6 sm:grid-cols-[180px_1fr] sm:items-center md:p-8">
            <div className="flex aspect-square max-w-[180px] items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 text-center text-sm font-semibold text-slate-400">
              Photo coming soon
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-orange-600">Main Admin Contact</p>
              <h2 className="mt-2 text-2xl font-black text-blue-950">Anil Suwal</h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                Hello, I’m Anil Suwal, the main administrative contact at CHITRANYA. CHITRANYA is a retail business built to bring electronics, hardware, sanitary products, and practical home solutions together in one place. From everyday hardware and electrical essentials to home appliances, tools, plumbing materials, and home services, our goal is to make it easier for customers to find the products and support they need. Through our stores and online marketplace, we aim to offer helpful service, convenient shopping, and dependable assistance. I’m here to help with your enquiries, coordinate with our branches, and connect you with the right team. Please feel free to call, email, or WhatsApp me. Thank you for being part of CHITRANYA.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href="tel:9801364220" className="rounded-lg bg-blue-950 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-900">Call 9801364220</a>
                <a href="https://wa.me/9779801364220" target="_blank" rel="noreferrer" className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-green-700">WhatsApp</a>
                <a href="mailto:chitranyahardware@gmail.com" className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-bold text-blue-950 hover:bg-slate-50">chitranyahardware@gmail.com</a>
              </div>
            </div>
          </div>
        </article>
        <div className="grid gap-5 sm:grid-cols-2">
          {branches.map((branch, index) => (
            <article key={branch.name} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-orange-600">Branch {index + 1}</p>
                  </div>
                  <h2 className="mt-2 text-xl font-extrabold text-blue-950">{branch.name}</h2>
                  <p className="mt-2 text-sm text-slate-500">{branch.area}</p>
                </div>
                <span className="rounded-xl bg-blue-50 p-3 text-xl" aria-hidden="true">⌖</span>
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Telephone</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {branch.landlines.map((number) => <a key={number} href={`tel:${number.replaceAll("-", "")}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-blue-950 hover:bg-slate-50">{number}</a>)}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Mobile / WhatsApp</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {branch.mobiles.map((number) => (
                      <div key={number} className="flex flex-wrap gap-2">
                        <a href={`tel:${number}`} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-blue-950 hover:bg-slate-50">{number}</a>
                        <a href={`https://wa.me/977${number}`} target="_blank" rel="noreferrer" className="rounded-lg bg-green-600 px-3 py-2 text-sm font-bold text-white hover:bg-green-700">WhatsApp</a>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Map coordinates</p>
                  <p className="mt-1 text-sm text-slate-600">{branch.coordinates}</p>
                </div>
                <a href={branch.maps} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-extrabold text-white transition hover:bg-orange-600">Get directions on Google Maps <span className="ml-2">↗</span></a>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50 p-6">
          <h2 className="text-lg font-extrabold text-blue-950">CHITRANYA customer support</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">For product enquiries and store assistance, contact the branch directly using the numbers above. </p>
          <Link href="/" className="mt-4 inline-flex text-sm font-extrabold text-blue-900 hover:text-orange-600">← Back to home</Link>
        </div>
      </section>
    </main>
  );
}
