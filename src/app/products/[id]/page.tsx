import ProductDetailsClient from "./ProductDetailsClient";

export const dynamicParams = false;

export function generateStaticParams() {
  return Array.from({ length: 10 }, (_, index) => ({
    id: String(index + 1),
  }));
}

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetailsClient id={id} />;
}
