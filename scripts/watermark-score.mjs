import sharp from "sharp";

const width = 512;
const height = 512;
const candidates = [
  [33, 253], [35, 253], [37, 253], [39, 253], [41, 253],
  [35, 242], [37, 242], [39, 242], [35, 264], [37, 264], [39, 264],
];

async function pixels(path) {
  const { data, info } = await sharp(path)
    .resize(width, height, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { data, channels: info.channels };
}

async function textEdges(fontSize, baseline) {
  const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <text x="${width / 2}" y="${baseline}" text-anchor="middle" dominant-baseline="alphabetic"
      font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" font-weight="400"
      fill="#ffffff" stroke="#c7c7c7" stroke-width="1.35">infinitypiercing.com.br</text>
  </svg>`;
  const { data, info } = await sharp(Buffer.from(svg)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const edge = new Uint8Array(width * height);
  const ring = new Uint8Array(width * height);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = (y * width + x) * info.channels;
      const center = data[index + 3];
      const horizontal = Math.abs(data[index + 3] - data[index + info.channels + 3]);
      const vertical = Math.abs(data[index + 3] - data[index + width * info.channels + 3]);
      if (center > 4 && (horizontal > 20 || vertical > 20)) edge[y * width + x] = 1;
    }
  }
  for (let y = 5; y < height - 5; y += 1) {
    for (let x = 5; x < width - 5; x += 1) {
      if (!edge[y * width + x]) continue;
      for (let deltaY = -5; deltaY <= 5; deltaY += 1) {
        for (let deltaX = -5; deltaX <= 5; deltaX += 1) {
          const distance = Math.max(Math.abs(deltaX), Math.abs(deltaY));
          const target = (y + deltaY) * width + x + deltaX;
          if (distance >= 3 && distance <= 5 && !edge[target]) ring[target] = 1;
        }
      }
    }
  }
  return { edge, ring };
}

function neutralEdgeMap(data, channels) {
  const map = new Float32Array(width * height);
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const point = (px, py) => {
        const index = (py * width + px) * channels;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        return { gray: (r + g + b) / 3, chroma: Math.max(r, g, b) - Math.min(r, g, b) };
      };
      const current = point(x, y);
      if (current.chroma > 26 || current.gray < 125) continue;
      const left = point(x - 1, y);
      const right = point(x + 1, y);
      const up = point(x, y - 1);
      const down = point(x, y + 1);
      const gradient = Math.abs(right.gray - left.gray) + Math.abs(down.gray - up.gray);
      map[y * width + x] = Math.min(255, gradient);
    }
  }
  return map;
}

function scoreAtMask(edgeMap, mask) {
  let total = 0;
  let samples = 0;
  let hits = 0;
  let ringTotal = 0;
  let ringSamples = 0;
  let ringHits = 0;
  for (let index = 0; index < mask.edge.length; index += 1) {
    if (mask.edge[index]) {
      const value = edgeMap[index];
      total += value;
      samples += 1;
      if (value > 18) hits += 1;
    }
    if (!mask.ring[index]) continue;
    const value = edgeMap[index];
    ringTotal += value;
    ringSamples += 1;
    if (value > 18) ringHits += 1;
  }
  const value = samples ? total / samples : 0;
  const background = ringSamples ? ringTotal / ringSamples : 0;
  const hitRate = samples ? hits / samples : 0;
  const backgroundHitRate = ringSamples ? ringHits / ringSamples : 0;
  return { value, hitRate, background, backgroundHitRate, contrast: value - background, hitContrast: hitRate - backgroundHitRate, samples };
}

for (const path of process.argv.slice(2)) {
  const { data, channels } = await pixels(path);
  const edgeMap = neutralEdgeMap(data, channels);
  let best = { value: -Infinity, hitRate: 0, contrast: -Infinity, hitContrast: 0, fontSize: 0, baseline: 0 };
  for (const [fontSize, baseline] of candidates) {
    const mask = await textEdges(fontSize, baseline);
    const score = scoreAtMask(edgeMap, mask);
    if (score.contrast > best.contrast) best = { ...score, fontSize, baseline };
  }
  console.log(JSON.stringify({ path, ...best }));
}
