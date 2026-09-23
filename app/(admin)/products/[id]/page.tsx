import { notFound } from "next/navigation";
import ProductForm from "@/components/ProductForm";
import { getProduct } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = getProduct(id);

  if (!product) {
    notFound();
  }

  return <ProductForm initialData={product} />;
}
