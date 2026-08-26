import sharp from "sharp";

const width = 512;
const height = 512;

async function imageMap(path) {
  const { data, info } = await sharp(path).resize(width, height, { fit: "fill" }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const map = new Float32Array(width * height);
  const point = (x, y) => {
    const index = (y * width + x) * info.channels;
    const r = data[index]; const g = data[index + 1]; const b = data[index + 2];
    return { gray: (r + g + b) / 3, chroma: Math.max(r, g, b) - Math.min(r, g, b) };
  };
  for (let y = 1; y < height - 1; y += 1) for (let x = 1; x < width - 1; x += 1) {
    const current = point(x, y);
    if (current.chroma > 26 || current.gray < 125) continue;
    const left = point(x - 1, y); const right = point(x + 1, y); const up = point(x, y - 1); const down = point(x, y + 1);
    map[y * width + x] = Math.min(255, Math.abs(right.gray - left.gray) + Math.abs(down.gray - up.gray));
  }
  return map;
}

function patternFrom(a, b, threshold) {
  const pattern = new Uint8Array(width * height);
  for (let y = 195; y <= 295; y += 1) for (let x = 8; x < width - 8; x += 1) {
    const index = y * width + x;
    if (Math.min(a[index], b[index]) >= threshold) pattern[index] = 1;
  }
  return pattern;
}

function score(map, pattern) {
  let sum = 0, hits = 0, count = 0;
  for (let index = 0; index < pattern.length; index += 1) if (pattern[index]) {
    const value = map[index]; sum += value; count += 1; if (value > 18) hits += 1;
  }
  return { score: count ? sum / count : 0, hitRate: count ? hits / count : 0, count };
}

const references = await Promise.all([
  imageMap("upload/0943D640-FE84-4E63-865A-A03BBAE072A7.jpeg"),
  imageMap("upload/4390BF80-76A2-4FA7-B877-F081AC760E70.jpeg"),
]);
const files = [
  "upload/0943D640-FE84-4E63-865A-A03BBAE072A7.jpeg",
  "upload/4390BF80-76A2-4FA7-B877-F081AC760E70.jpeg",
  "public/catalog/argola-titanio-zirconia-prata-dourado.webp",
  "public/catalog/brinco-argola-segmento-articulado-aco-cirurgico-liso.webp",
  "public/catalog/piercing-argola-segmento-articulado-niobio.webp",
  "public/catalog/piercing-argola-segmento-articulado-ouro-14k-com-correntes.webp",
  "public/catalog/piercing-argola-segmento-articulado-ouro-14k-detalhes-frontal.webp",
  "generated_images/exec-b810a168-d6f0-4c33-a818-af1b55807ca2.png",
];
const maps = await Promise.all(files.map(imageMap));
for (const threshold of [8, 12, 16, 20, 24, 28, 32]) {
  const pattern = patternFrom(references[0], references[1], threshold);
  console.log(JSON.stringify({ threshold, results: files.map((path, index) => ({ path, ...score(maps[index], pattern) })) }));
  if (threshold === 20) {
    const output = Buffer.alloc(width * height * 3, 255);
    for (let index = 0; index < pattern.length; index += 1) if (pattern[index]) output[index * 3] = output[index * 3 + 1] = output[index * 3 + 2] = 0;
    await sharp(output, { raw: { width, height, channels: 3 } }).png().toFile("/tmp/watermark-template.png");
  }
}
