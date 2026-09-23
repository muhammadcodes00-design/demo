import { NextRequest, NextResponse } from "next/server";
import { getProducts, createProduct } from "@/lib/data";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || undefined;

  const products = getProducts(search, status);
  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.sku || body.price === undefined) {
      return NextResponse.json({ error: "Name, SKU, and price are required" }, { status: 400 });
    }

    const price = parseFloat(body.price);
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ error: "Price must be a valid non-negative number" }, { status: 400 });
    }

    const product = createProduct({
      name: body.name.trim(),
      sku: body.sku.trim(),
      description: body.description?.trim(),
      category: body.category?.trim(),
      price,
      image_url: body.image_url?.trim(),
      status: body.status === "active" ? "active" : "draft",
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    if (error.message?.includes("UNIQUE constraint failed: products.sku")) {
      return NextResponse.json({ error: "A product with this SKU already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: error.message || "Failed to create product" }, { status: 500 });
  }
}
