"use client";

import { useEffect, useState } from "react";
import ProductDetailsClient from "../products/[id]/ProductDetailsClient";

export default function ProductPage() {
  const [productId, setProductId] = useState("");



  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setProductId(params.get("id") ?? "");
  }, []);

  if (!productId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-center text-slate-600">
        Select a product from the products page to view its details.
      </main>
    );
  }

  return <ProductDetailsClient id={productId} />;
}
