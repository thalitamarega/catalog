import { NextResponse } from "next/server";
import { supabase, type CatalogProduct } from "../../../lib/supabase";
import savedCatalog from "../../../data/catalog-snapshot.json";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
const fields = "id, slug, title, description, image_url, material, category, source_sku";
const pageSize = 1000;

export async function GET() {
  const signal = AbortSignal.timeout(8000);
  try {
    const first = await supabase.from("catalog_products").select(fields, { count: "exact" })
      .eq("is_active", true).order("id").range(0, pageSize - 1).abortSignal(signal);
    if (first.error || first.count === null || !first.data) throw new Error("Catalog unavailable");
    const batches = await Promise.all(Array.from({ length: Math.max(0, Math.ceil(first.count / pageSize) - 1) }, (_, index) =>
      supabase.from("catalog_products").select(fields).eq("is_active", true).order("id")
        .range((index + 1) * pageSize, (index + 2) * pageSize - 1).abortSignal(signal)));
    if (batches.some(batch => batch.error || !batch.data)) throw new Error("Incomplete catalog");
    const products = [...first.data, ...batches.flatMap(batch => batch.data ?? [])] as CatalogProduct[];
    if (products.length !== first.count || new Set(products.map(product => product.id)).size !== first.count) {
      throw new Error("Incomplete catalog");
    }
    return NextResponse.json(products, { headers: { "Cache-Control": "no-store", "X-Catalog-Source": "database" } });
  } catch {
    return NextResponse.json(savedCatalog, { headers: { "Cache-Control": "no-store", "X-Catalog-Source": "snapshot" } });
  }
}
