import { NextResponse } from "next/server";
import { imageOverrides } from "../../../lib/image-overrides";

const shopOrigin = "https://www.infinitypiercing.com.br";
const maxPages = 12;
const pageSize = 250;

type ShopifyProduct = {
  id: number;
  handle: string;
  title: string;
  body_html: string | null;
  images: Array<{
    src: string;
    width?: number;
    height?: number;
    position?: number;
    variant_ids?: number[];
  }>;
  product_type: string;
  tags: string;
  variants: Array<{ sku: string | null }>;
  options?: Array<{ name: string; values: string[] }>;
};

function cleanDescription(html: string | null) {
  return cleanText((html ?? "")
    .replace(/<br\s*\/?>(\s*)/gi, " ")
    .replace(/<\/p>|<\/li>|<\/h[1-6]>/gi, ". ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .replace(/\.\s*\./g, ".")
    .trim());
}

function cleanText(value: string) {
  let text = value.trim();
  for (let pass = 0; pass < 2 && /[ÃÂâð]/.test(text); pass += 1) {
    try {
      const bytes = Uint8Array.from(text, (character) => character.charCodeAt(0) & 0xff);
      const decoded = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
      if (decoded && !decoded.includes("�") && decoded !== text) text = decoded;
      else break;
    } catch {
      break;
    }
  }
  return text
    .replace(/â€“|â€”/g, "–")
    .replace(/â€™|â€˜/g, "'")
    .replace(/â€œ|â€/g, '"')
    .replace(/Â(?=[°ºª])/g, "")
    .replace(/Acess[^a-zA-ZÀ-ÿ\s]{1,5}rios/gi, "Acessórios")
    .replace(/Mostru[^a-zA-ZÀ-ÿ\s]{1,5}rio/gi, "Mostruário")
    .replace(/Reposi[^a-zA-ZÀ-ÿ\s]{1,5}o/gi, "Reposição")
    .replace(/Cir[^a-zA-ZÀ-ÿ\s]{1,5}rgico/gi, "Cirúrgico")
    .replace(/Tit[^a-zA-ZÀ-ÿ\s]{1,5}nio/gi, "Titânio")
    .replace(/Ni[^a-zA-ZÀ-ÿ\s]{1,5}bio/gi, "Nióbio")
    .replace(/[¨®�]+|Â(?![A-Za-zÀ-ÿ])/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function imageFilename(src: string) {
  try {
    return decodeURIComponent(src.split("/").pop()?.split("?")[0] ?? "");
  } catch {
    return src.split("/").pop()?.split("?")[0] ?? "";
  }
}

function hasSilverAndGoldOptions(product: ShopifyProduct) {
  const values = (product.options ?? []).flatMap((option) => option.values).join(" ")
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const hasSilver = /(^|\s|\/)(natural|prata|aco|silver)(\s|\/|$)/.test(values);
  const hasGold = /(^|\s|\/)(dourado|ouro|gold)(\s|\/|$)/.test(values);
  return hasSilver && hasGold;
}

function bestCatalogImage(product: ShopifyProduct) {
  const explicitlyMarked = /(fotos?-com-marca|marca[-_ ]?d[-_ ]?agua|watermark|logo|selo|carimbo|d_nq_np|mercadolivre|shopee)/i;
  const marketplaceOrTiny = /(150x150|300x300|500x500)/i;
  const bothFinishes = hasSilverAndGoldOptions(product);

  const ranked = product.images.map((image, index) => {
    const filename = imageFilename(image.src);
    const position = image.position ?? index + 1;
    const shortestSide = Math.min(image.width ?? 0, image.height ?? 0);
    let score = Math.min(shortestSide, 1600) / 20;

    // A capa da loja costuma ser a composição mais clara e, quando há duas
    // cores, normalmente mostra prata/natural e dourado lado a lado.
    if (position === 1) score += bothFinishes ? 180 : 75;
    if (position <= 3) score += 16 - position;
    if (/^(img[_-]|dsc[_-]|3p8a|20\d{6,})/i.test(filename)) score += 12;
    if (marketplaceOrTiny.test(filename) || shortestSide < 600) score -= 140;
    if (explicitlyMarked.test(filename)) score -= 1000;

    return { image, score };
  });

  ranked.sort((a, b) => b.score - a.score);
  return ranked[0]?.image.src ?? product.images[0]?.src;
}

function materialFor(product: ShopifyProduct) {
  const text = `${product.title} ${product.tags} ${product.product_type}`.toLocaleLowerCase("pt-BR");
  if (text.includes("titânio") || text.includes("titanio")) return "Titânio";
  if (text.includes("nióbio") || text.includes("niobio")) return "Nióbio";
  if (text.includes("ouro")) return "Ouro";
  if (text.includes("bioflex")) return "Bioflex";
  if (text.includes("aço") || text.includes("aco")) return "Aço cirúrgico";
  return "Outros";
}

function categoryFor(product: ShopifyProduct) {
  const text = cleanText(`${product.title} ${product.product_type} ${product.tags}`)
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  const categories: Array<[RegExp, string]> = [
    [/microdermal|dermal anchor/, "Microdermal"],
    [/surface/, "Surface"],
    [/transversal|industrial/, "Transversal"],
    [/alargador|plug|tunnel/, "Alargador"],
    [/nostril/, "Nostril"],
    [/labret/, "Labret"],
    [/banana|curved barbell/, "Banana"],
    [/ferradura|circular barbell/, "Ferradura"],
    [/captive|segmento/, "Captive"],
    [/twister|espiral/, "Twister"],
    [/barbell|barra reta/, "Barbell"],
    [/argola|clicker|segment ring/, "Argola"],
    [/brinco/, "Brinco"],
    [/acessorio|mostruario|reposicao/, "Acessórios"],
  ];
  return categories.find(([pattern]) => pattern.test(text))?.[1] ?? "Outros";
}

export async function GET() {
  try {
    const settledPages = await Promise.allSettled(
      Array.from({ length: maxPages }, async (_, index) => {
        const response = await fetch(`${shopOrigin}/products.json?limit=${pageSize}&page=${index + 1}`, {
          next: { revalidate: 3600 },
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`Página ${index + 1} indisponível.`);
        const payload = await response.json() as { products?: ShopifyProduct[] };
        return payload.products ?? [];
      })
    );
    const successfulPages = settledPages
      .filter((page): page is PromiseFulfilledResult<ShopifyProduct[]> => page.status === "fulfilled")
      .map((page) => page.value);
    if (!successfulPages.length) throw new Error("Fornecedor indisponível.");

    const uniqueProducts = new Map<number, ShopifyProduct>();
    successfulPages.flat().forEach((product) => uniqueProducts.set(product.id, product));
    const products = Array.from(uniqueProducts.values());

    return NextResponse.json(products
      .filter((product) => product.images[0]?.src)
      .map((product) => ({
        id: `source-${product.id}`,
        slug: product.handle,
        title: cleanText(product.title),
        description: cleanDescription(product.body_html) || "Consulte detalhes e disponibilidade com a THATA.",
        image_url: imageOverrides[product.handle] ?? bestCatalogImage(product),
        material: materialFor(product),
        category: categoryFor(product),
        source_sku: product.variants[0]?.sku ?? null,
      })), {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível atualizar o catálogo." }, { status: 502 });
  }
}
