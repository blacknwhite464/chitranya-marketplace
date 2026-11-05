"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export const SITE_CONTENT_DEFAULTS: Record<string, string> = {
  announcement: "CHITRANYA — ELECTRONICS, HARDWARE & HOME SERVICES",
  homeEyebrow: "Your complete home solution",
  homeTitle: "Everything Your Home Needs. All in One Place.",
  homeDescription: "Shop quality electronics and hardware, or book dependable help for repairs, installation and home improvement.",
  featuredEyebrow: "Available now at CHITRANYA",
  featuredTitle: "Featured Products",
  featuredDescription: "Live products from our store. Updated automatically from our catalogue.",
  electronicsTitle: "Electronics",
  electronicsDescription: "Technology and appliances for modern living.",
  hardwareTitle: "Hardware & Construction",
  hardwareDescription: "Essential tools and materials for every project.",
  servicesTitle: "Home Services",
  servicesDescription: "Book dependable help for repairs, installation and home improvement.",
  homeServicesEnabled: "true",
  productsTitle: "Shop All Products",
  productsDescription: "Explore the CHITRANYA catalogue.",
  electronicsPageTitle: "Electronics",
  electronicsPageDescription: "Explore televisions, appliances, computers and security systems.",
  hardwarePageTitle: "Hardware & Tools",
  hardwarePageDescription: "Find tools, plumbing, electrical, construction and home improvement essentials.",
  servicesPageEyebrow: "One place for home and business",
  servicesPageTitle: "Reliable help for repairs, installation and improvement.",
  servicesPageDescription: "Tell us what you need. CHITRANYA will review your request and contact you to confirm availability, scope and pricing before work begins.",
  footerText: "CHITRANYA. Electronics | Hardware | Home Services",
  contactPhone: "",
  contactEmail: "",
  adminContactEnabled: "true",
  adminContactName: "Anil Suwal",
  adminContactPhone: "9801364220",
  adminContactEmail: "chitranyahardware@gmail.com",
  adminContactPhotoUrl: "",
  adminContactIntroduction: "Hello, I’m Anil Suwal, the main administrative contact at CHITRANYA. CHITRANYA is a retail business built to bring electronics, hardware, sanitary products, and practical home solutions together in one place. From everyday hardware and electrical essentials to home appliances, tools, plumbing materials, and home services, our goal is to make it easier for customers to find the products and support they need. Through our stores and online marketplace, we aim to offer helpful service, convenient shopping, and dependable assistance. I’m here to help with your enquiries, coordinate with our branches, and connect you with the right team. Please feel free to call, email, or WhatsApp me. Thank you for being part of CHITRANYA.",
};

export function useSiteContent() {
  const [content, setContent] = useState(SITE_CONTENT_DEFAULTS);
  useEffect(() => onSnapshot(doc(db, "siteContent", "main"), (snapshot) => {
    if (snapshot.exists()) setContent({ ...SITE_CONTENT_DEFAULTS, ...(snapshot.data() as Record<string, string>) });
  }, (error) => console.error("Site content could not be loaded:", error)), []);
  return content;
}
