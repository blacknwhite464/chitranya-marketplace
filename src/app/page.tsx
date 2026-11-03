
const electronics = [
  "Televisions & Smart TVs",
  "Refrigerators",
  "Washing Machines",
  "Kitchen Appliances",
  "Computers & Accessories",
  "CCTV & Security",
  "Fans, Lights & Electrical",
];

const hardware = [
  "Hand Tools",
  "Power Tools",
  "Plumbing Materials",
  "Electrical Accessories",
  "Paint & Painting",
  "Construction Materials",
  "Bathroom Fittings",
  "Safety Equipment",
];

const services = [
  ["🔧", "Plumbing", "Professional plumbing and repair"],
  ["⚡", "Electrical Repair", "Electrical installation and repair"],
  ["❄️", "AC Services", "AC installation and maintenance"],
  ["🛠️", "Appliance Repair", "Repair for home appliances"],
  ["📹", "CCTV Installation", "Security camera installation"],
  ["🧹", "Home Cleaning", "Reliable home cleaning services"],
  ["🎨", "Painting", "Interior and exterior painting"],
  ["🏠", "Renovation", "Home improvement and renovation"],
  ["🔩", "Hardware Installation", "Professional fitting and installation"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="bg-slate-950 px-4 py-2 text-center text-sm text-white">
        Welcome to CHITRANYA | Electronics, Hardware & Home Services
      </div>

      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-5">
          <a href="#" className="text-3xl font-black tracking-tight text-blue-800">
            CHITRANYA<span className="text-orange-500">.</span>
          </a>

          <nav className="flex flex-wrap gap-5 text-sm font-semibold">
            <a href="#" className="hover:text-blue-700">Home</a>
            <a href="#electronics" className="hover:text-blue-700">Electronics</a>
            <a href="#hardware" className="hover:text-blue-700">Hardware</a>
            <a href="#services" className="hover:text-blue-700">Services</a>
            <a href="#contact" className="hover:text-blue-700">Contact</a>
          </nav>

          <a href="#contact" className="rounded-lg bg-blue-800 px-5 py-3 text-sm font-bold text-white hover:bg-blue-900">
            Contact Us
          </a>
        </div>
      </header>

      <section className="bg-gradient-to-r from-slate-950 via-blue-950 to-blue-800 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-24 md:grid-cols-2">
          <div>
            <p className="mb-4 font-bold uppercase tracking-[0.2em] text-orange-400">
              Your Complete Home Solution
            </p>
            <h1 className="text-5xl font-black leading-tight md:text-6xl">
              Everything Your Home Needs.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
              Discover quality electronics, hardware products and trusted
              home services — all in one place.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <a href="#electronics" className="rounded-lg bg-orange-500 px-7 py-4 font-bold text-white hover:bg-orange-600">
                Explore Products
              </a>
              <a href="#services" className="rounded-lg border border-white px-7 py-4 font-bold hover:bg-white hover:text-blue-950">
                Book a Service
              </a>
            </div>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/10 p-10 backdrop-blur">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="rounded-2xl bg-white/10 p-8">
                <div className="text-5xl">📺</div>
                <p className="mt-3 font-bold">Electronics</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-8">
                <div className="text-5xl">🔨</div>
                <p className="mt-3 font-bold">Hardware</p>
              </div>
              <div className="col-span-2 rounded-2xl bg-white/10 p-8">
                <div className="text-5xl">🛠️</div>
                <p className="mt-3 font-bold">Professional Home Services</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="electronics" className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10">
          <p className="font-bold uppercase tracking-widest text-blue-700">Shop Products</p>
          <h2 className="mt-2 text-3xl font-black">Electronics</h2>
          <p className="mt-3 text-slate-500">Technology and appliances for modern living.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {electronics.map((item, index) => (
            <div key={item} className="rounded-xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
              <div className="mb-4 text-3xl">{["📺","🧊","🧺","🍳","💻","📹","💡"][index]}</div>
              <h3 className="font-bold">{item}</h3>
              <p className="mt-2 text-sm text-slate-500">Explore our collection</p>
            </div>
          ))}
        </div>
      </section>

      <section id="hardware" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <p className="font-bold uppercase tracking-widest text-orange-600">Build With Confidence</p>
          <h2 className="mt-2 text-3xl font-black">Hardware & Construction</h2>
          <p className="mt-3 text-slate-500">Essential tools and materials for every project.</p>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {hardware.map((item, index) => (
              <div key={item} className="rounded-xl border bg-slate-50 p-6 transition hover:border-orange-400 hover:shadow-md">
                <div className="mb-4 text-3xl">{["🔧","🛠️","🚿","🔌","🎨","🧱","🚽","🦺"][index]}</div>
                <h3 className="font-bold">{item}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="services" className="mx-auto max-w-7xl px-6 py-20">
        <p className="font-bold uppercase tracking-widest text-blue-700">We Are Here To Help</p>
        <h2 className="mt-2 text-3xl font-black">Professional Home Services</h2>
        <p className="mt-3 text-slate-500">Book trusted professionals for your home and business.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(([emoji, name, description]) => (
            <div key={name} className="rounded-xl border bg-white p-6 shadow-sm">
              <div className="text-4xl">{emoji}</div>
              <h3 className="mt-4 text-lg font-bold">{name}</h3>
              <p className="mt-2 text-sm text-slate-500">{description}</p>
              <a href="#contact" className="mt-5 inline-block font-bold text-blue-700 hover:text-orange-600">
                Enquire Now →
              </a>
            </div>
          ))}
        </div>
      </section>

      <section id="contact" className="bg-blue-950 px-6 py-16 text-center text-white">
        <h2 className="text-3xl font-black">Need Something for Your Home?</h2>
        <p className="mt-4 text-slate-300">Contact CHITRANYA for products and professional services.</p>
        <a href="mailto:info@chitranya.com" className="mt-7 inline-block rounded-lg bg-orange-500 px-8 py-4 font-bold hover:bg-orange-600">
          Contact CHITRANYA
        </a>
      </section>

      <footer className="bg-slate-950 px-6 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} CHITRANYA. All rights reserved.
        <p className="mt-2">Electronics | Hardware | Home Services</p>
      </footer>
    </main>
  );
}
