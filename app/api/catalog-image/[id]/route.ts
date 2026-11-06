import { readFile } from "node:fs/promises";
import path from "node:path";
import photoIndex from "../../../../data/catalog-photo-index.json";

export const runtime = "nodejs";
const photos: Record<string, { pack: string; offset: number; length: number }> = photoIndex;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/.test(id)) return new Response("Not found", { status: 404 });
  const photo = photos[id];
  if (!photo) return new Response("Not found", { status: 404 });
  const pack = await readFile(path.join(process.cwd(), "data/catalog-photo-packs", photo.pack));
  return new Response(new Uint8Array(pack.subarray(photo.offset, photo.offset + photo.length)), {
    headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
