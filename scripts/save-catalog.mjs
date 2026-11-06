import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile, rename, readFile } from "node:fs/promises";
const config = await readFile(new URL("../lib/supabase.ts", import.meta.url), "utf8");
const url = config.match(/const supabaseUrl = "([^"]+)"/)[1];
const key = config.match(/const supabasePublishableKey = "([^"]+)"/)[1];
const client = createClient(url, key, { auth: { persistSession: false } });
const products = [];
for (let from = 0; ; from += 1000) {
  const { data, error } = await client.from("catalog_products")
    .select("id, slug, title, description, image_url, material, category, source_sku")
    .eq("is_active", true).order("id").range(from, from + 999);
  if (error) throw error;
  products.push(...data);
  if (data.length < 1000) break;
}
const unique = [...new Map(products.map(product => [product.id, product])).values()];
if (unique.length < 2000 || unique.length !== products.length) throw new Error("Incomplete catalog; snapshot preserved.");
const directory = new URL("../data/", import.meta.url);
await mkdir(directory, { recursive: true });
const target = new URL("catalog-snapshot.json", directory);
const temporary = new URL("catalog-snapshot.json.tmp", directory);
await writeFile(temporary, JSON.stringify(unique, null, 2) + "\n");
await rename(temporary, target);
console.log("Saved " + unique.length + " products.");
