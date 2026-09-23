import { NextRequest, NextResponse } from "next/server";
import { getProduct, updateProduct } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) {
    return NextResponse.json({ error: "Product not found" }, { status: 404 });
  }
  return NextResponse.json(product);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const body = await req.json();
    if (!body.name || !body.sku || body.price === undefined) {
      return NextResponse.json({ error: "Name, SKU, and price are required" }, { status: 400 });
    }

    const price = parseFloat(body.price);
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ error: "Price must be a valid non-negative number" }, { status: 400 });
    }

    const updated = await updateProduct(id, {
      name: body.name.trim(),
      sku: body.sku.trim(),
      description: body.description?.trim(),
      category: body.category?.trim(),
      price,
      image_url: body.image_url?.trim(),
      status: body.status === "active" ? "active" : "draft",
    });

    if (!updated) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed: products.sku")) {
      return NextResponse.json({ error: "A product with this SKU already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Failed to update product" }, { status: 500 });
  }
}
