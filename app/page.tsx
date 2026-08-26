"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { supabase, type CatalogProduct } from "../lib/supabase";
import { brandLogo } from "../lib/brand-logo";
import { HeroPiercing3D } from "./components/HeroPiercing3D";

const whatsapp = "5514998939126";
const instagramUrl = "https://www.instagram.com/thata_marega/";
const productsPerPage = 24;

const products: CatalogProduct[] = [
  {
    id: "1",
    slug: "labret-titanio-rosca-interna-ponto-de-luz-zirconia",
    title: "Piercing Labret Titânio Rosca Interna Ponto de Luz Zircônia",
    description: "Espessura da haste: 1,0 / 1,2 mm. Tamanho da haste: 6 / 8 mm. Pedra: zircônia cravada. Material: titânio. Fecho: rosca interna.",
    image_url: "https://www.infinitypiercing.com.br/cdn/shop/files/14-1-4_4ce92349-74af-4757-a220-3dd5093e1a1d.jpg?v=1776190354&width=1000",
    material: "Titânio", category: "Labret", source_sku: "6357"
  },
  {
    id: "2",
    slug: "labret-titanio-push-pin-ponto-de-luz-cravejado",
    title: "Piercing Labret Titânio Push Pin Ponto de Luz Cravejado",
    description: "Comprimento da haste: 6 / 8 mm. Espessura: 1,2 mm. Topo: 2 / 2,5 / 3 / 4 mm. Material: titânio. Fecho: push pin. Pedra: zircônia cravejada.",
    image_url: "https://www.infinitypiercing.com.br/cdn/shop/files/Imagem-do-WhatsApp-de-2025-02-27-as-10.48.41_9135a918-1_45bd4f07-c40b-4fa2-a5d3-e6192e6222ec.jpg?v=1776702498&width=1000",
    material: "Titânio", category: "Labret", source_sku: "13695"
  },
  {
    id: "3",
    slug: "labret-aco-cirurgico-zirconia-redonda",
    title: "Piercing Labret Aço Cirúrgico Zircônia Redonda",
    description: "Espessura da haste: 1,2 mm. Comprimento: 6 / 8 mm. Material: aço cirúrgico. Pedra: zircônia cravejada. Fecho: rosca interna.",
    image_url: "https://www.infinitypiercing.com.br/cdn/shop/files/1a-3_bcc9676b-547f-45f7-9109-54e56720a32c.jpg?v=1774857709&width=1000",
    material: "Aço cirúrgico", category: "Labret", source_sku: "4172"
  },
  {
    id: "4",
    slug: "labret-niobio-rosca-interna",
    title: "Piercing Labret Nióbio Rosca Interna",
    description: "Comprimento da haste: 6 / 8 / 10 mm. Espessura: 1,2 mm. Bolinha: 3 mm. Material: nióbio. Fecho: rosca interna. Sem pedras.",
    image_url: "https://www.infinitypiercing.com.br/cdn/shop/files/IMG_4127-2_1894754a-c83a-41ac-8fd7-fcaec2f19938.jpg?v=1776389588&width=1000",
    material: "Nióbio", category: "Labret", source_sku: "10911"
  }
];

function whatsappUrl(product: CatalogProduct) {
  const text = `Olá, Thata! Gostaria de consultar a disponibilidade da joia: ${product.title}${product.source_sku ? ` (cód. ${product.source_sku})` : ""}.`;
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;
}

function selectionWhatsappUrl(products: CatalogProduct[]) {
  const lines = products.map((product, index) =>
    `${index + 1}. ${product.title}${product.source_sku ? ` (cód. ${product.source_sku})` : ""}`
  );
  const text = `Olá, Thata! Gostaria de consultar a disponibilidade destas joias:\n\n${lines.join("\n")}`;
  return `https://wa.me/${whatsapp}?text=${encodeURIComponent(text)}`;
}

function searchText(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");
}

function displayText(value: string | null | undefined) {
  let text = (value ?? "").trim();

  // Algumas entradas chegam com a codificação quebrada mais de uma vez.
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
    .replace(/Acess[^a-zA-ZÀ-ÿ\s]{1,6}rios/gi, "Acessórios")
    .replace(/Mostru[^a-zA-ZÀ-ÿ\s]{1,6}rio/gi, "Mostruário")
    .replace(/Reposi[^a-zA-ZÀ-ÿ\s]{1,6}o/gi, "Reposição")
    .replace(/Cir[^a-zA-ZÀ-ÿ\s]{1,6}rgico/gi, "Cirúrgico")
    .replace(/Tit[^a-zA-ZÀ-ÿ\s]{1,6}nio/gi, "Titânio")
    .replace(/Ni[^a-zA-ZÀ-ÿ\s]{1,6}bio/gi, "Nióbio")
    .replace(/[¨®�]+|Â(?![A-Za-zÀ-ÿ])/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function categoryLabel(value: string | null | undefined) {
  const text = searchText(displayText(value));
  const categories: Array<[RegExp, string]> = [
    [/microdermal|dermal anchor/, "Microdermal"], [/surface/, "Surface"],
    [/transversal|industrial/, "Transversal"], [/alargador|plug|tunnel/, "Alargador"],
    [/nostril/, "Nostril"], [/labret/, "Labret"], [/banana|curved barbell/, "Banana"],
    [/ferradura|circular barbell/, "Ferradura"], [/captive|segmento/, "Captive"],
    [/twister|espiral/, "Twister"], [/barbell|barra reta/, "Barbell"],
    [/argola|clicker|segment ring/, "Argola"], [/brinco/, "Brinco"],
    [/acessorio|mostruario|reposicao/, "Acessórios"],
  ];
  return categories.find(([pattern]) => pattern.test(text))?.[1] ?? "Outros";
}

function normalizedCatalog(products: CatalogProduct[]) {
  const uniqueProducts = new Map<string, CatalogProduct>();
  products.forEach((product) => uniqueProducts.set(String(product.id || product.slug), product));
  return Array.from(uniqueProducts.values()).map((product) => ({
    ...product,
    title: displayText(product.title),
    description: displayText(product.description),
    material: displayText(product.material),
    category: categoryLabel(`${product.title} ${product.category ?? ""}`),
  }));
}

function uniqueLabels(values: Array<string | null | undefined>) {
  const labels = new Map<string, string>();
  for (const rawValue of values) {
    const value = displayText(rawValue);
    if (!value) continue;
    const key = searchText(value);
    if (!labels.has(key)) labels.set(key, value);
  }
  return Array.from(labels.values()).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function Brand({ footer = false }: { footer?: boolean }) {
  return (
    <a className={`brand${footer ? " brand-footer" : ""}`} href="#inicio" aria-label="THATA Body Piercing — início">
      <img src={brandLogo} alt="THATA Body Piercing" />
    </a>
  );
}

export default function CatalogPage() {
  const [query, setQuery] = useState("");
  const [material, setMaterial] = useState("Todos");
  const [category, setCategory] = useState("Todas");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<CatalogProduct | null>(null);
  const [selection, setSelection] = useState<CatalogProduct[]>([]);
  const [selectionOpen, setSelectionOpen] = useState(false);
  const [catalog, setCatalog] = useState(products);
  const [isLoading, setIsLoading] = useState(true);
  const [catalogNotice, setCatalogNotice] = useState("");

  useEffect(() => {
    async function loadCatalog() {
      try {
        const response = await fetch("/api/catalog");
        const sourceProducts = await response.json();
        if (response.ok && Array.isArray(sourceProducts) && sourceProducts.length) {
          setCatalog(normalizedCatalog(sourceProducts as CatalogProduct[]));
          setIsLoading(false);
          return;
        }
      } catch {
        // A seleção validada no Supabase continua disponível se a fonte estiver indisponível.
      }
      const { data } = await supabase.from("catalog_products")
        .select("id, slug, title, description, image_url, material, category, source_sku")
        .eq("is_active", true).order("created_at", { ascending: false });
      if (data?.length) {
        setCatalog(normalizedCatalog(data as CatalogProduct[]));
        setCatalogNotice("Exibindo a seleção disponível no momento.");
      } else {
        setCatalogNotice("Não foi possível atualizar o catálogo. Exibindo uma seleção temporária.");
      }
      setIsLoading(false);
    }
    void loadCatalog();
  }, []);

  const materials = useMemo(() => ["Todos", ...uniqueLabels(catalog.map((product) => product.material))], [catalog]);
  const categories = useMemo(() => ["Todas", ...uniqueLabels(catalog.map((product) => product.category))], [catalog]);
  const normalizedQuery = searchText(query.trim());
  const visibleProducts = useMemo(() => catalog.filter((product) => {
    return (material === "Todos" || searchText(product.material) === searchText(material))
      && (category === "Todas" || searchText(product.category) === searchText(category))
      && searchText(product.title).includes(normalizedQuery);
  }), [catalog, material, category, normalizedQuery]);
  const pageCount = Math.max(1, Math.ceil(visibleProducts.length / productsPerPage));
  const paginatedProducts = useMemo(() => visibleProducts.slice((page - 1) * productsPerPage, page * productsPerPage), [visibleProducts, page]);

  useEffect(() => {
    setPage(1);
  }, [query, material, category]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  function changePage(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), pageCount));
    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleSelection(product: CatalogProduct) {
    setSelection((current) => current.some((item) => item.id === product.id)
      ? current.filter((item) => item.id !== product.id)
      : [...current, product]);
  }

  function isSelected(product: CatalogProduct) {
    return selection.some((item) => item.id === product.id);
  }

  return (
    <main>
      <section className="hero" id="inicio">
        <nav className="nav shell">
          <Brand />
          <a className="nav-cta" href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer">Falar com a THATA <span>↗</span></a>
        </nav>
        <div className="hero-copy shell">
          <p className="eyebrow">CATÁLOGO DE JOIAS</p>
          <h1>Joias que<br /><em>contam histórias.</em></h1>
          <p className="intro">Uma seleção cuidadosa de peças para tornar cada perfuração ainda mais sua.</p>
          <a className="hero-link" href="#catalogo">Explorar o catálogo <span>↓</span></a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="hero-art-halo" />
          <HeroPiercing3D />
        </div>
        <div className="orbit orbit-one" /><div className="orbit orbit-two" />
      </section>

      <section className="catalog shell" id="catalogo">
        <div className="catalog-heading">
          <div><p className="eyebrow dark">SELEÇÃO ATUAL</p><h2>Encontre sua joia.</h2></div>
          <p>Escolha a peça que mais combina com você e consulte disponibilidade comigo.</p>
        </div>
        <div className="filters">
          <label className="search-filter"><span className="filter-label">Pesquisar</span><span className="search"><span aria-hidden="true">⌕</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome da joia" aria-label="Buscar pelo nome da joia" />{query && <button className="clear-search" type="button" onClick={() => setQuery("")} aria-label="Limpar busca">×</button>}</span></label>
          <label className="category-filter"><span className="filter-label">Tipo de joia</span><select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filtrar por tipo de joia">{categories.map((item) => <option key={searchText(item)} value={item}>{item}</option>)}</select></label>
          <div className="material-filter"><span className="filter-label">Material</span><div className="pills" aria-label="Filtrar por material">{materials.map((item) => <button type="button" className={material === item ? "active" : ""} onClick={() => setMaterial(item || "Todos")} key={searchText(item)}>{item}</button>)}</div></div>
        </div>
        <div className="results-summary" aria-live="polite"><span>{isLoading ? "Carregando joias…" : `${visibleProducts.length} ${visibleProducts.length === 1 ? "joia encontrada" : "joias encontradas"}`}</span>{(material !== "Todos" || category !== "Todas" || query) && <button type="button" onClick={() => { setQuery(""); setMaterial("Todos"); setCategory("Todas"); }}>Limpar filtros</button>}</div>
        {catalogNotice && <p className="catalog-notice" role="status">{catalogNotice}</p>}
        <div className="grid">
          {paginatedProducts.map((product) => <article className={`card${isSelected(product) ? " selected-card" : ""}`} key={product.id}>
            <button className="image-button" type="button" onClick={() => setSelected(product)} aria-label={`Ver ${product.title}`}>
              <Image src={product.image_url} alt={product.title} fill sizes="(max-width: 390px) 100vw, (max-width: 620px) 50vw, (max-width: 880px) 33vw, 25vw" />
              <span className="view">ver detalhes <b>↗</b></span>
            </button>
            <div className="card-copy"><p>{product.material}</p><h3>{product.title}</h3><div className="card-actions"><button type="button" className={`select-jewel${isSelected(product) ? " active" : ""}`} onClick={() => toggleSelection(product)}>{isSelected(product) ? "✓ Selecionada" : "+ Selecionar"}</button><a href={whatsappUrl(product)} target="_blank" rel="noreferrer">Consultar <span>↗</span></a></div></div>
          </article>)}
        </div>
        {!isLoading && !visibleProducts.length && <p className="empty">Nenhuma joia encontrada nesta seleção.</p>}
        {visibleProducts.length > 0 && pageCount > 1 && <nav className="pagination" aria-label="Paginação do catálogo">
          <button type="button" onClick={() => changePage(page - 1)} disabled={page === 1} aria-label="Página anterior">← Anterior</button>
          <span>Página {page} de {pageCount}</span>
          <button type="button" onClick={() => changePage(page + 1)} disabled={page === pageCount} aria-label="Próxima página">Próxima →</button>
        </nav>}
      </section>

      <section className="consultation"><div className="shell consultation-inner"><div><p className="eyebrow">ATENDIMENTO PERSONALIZADO</p><h2>Encontrou uma<br /><em>joia especial?</em></h2></div><a className="whatsapp" href={`https://wa.me/${whatsapp}?text=${encodeURIComponent("Olá, Thata! Gostaria de consultar uma joia do catálogo.")}`} target="_blank" rel="noreferrer">Consultar pelo WhatsApp <span>↗</span></a></div></section>
      <footer className="shell"><Brand footer /><p>MARÍLIA, SP</p><a className="instagram-button" href={instagramUrl} target="_blank" rel="noreferrer" aria-label="Abrir Instagram @thata_marega">Instagram <span>@thata_marega</span> ↗</a></footer>

      {selection.length > 0 && <button className="selection-fab" type="button" onClick={() => setSelectionOpen(true)} aria-label={`Abrir seleção com ${selection.length} joias`}><span>{selection.length}</span> Ver minha seleção</button>}

      {selectionOpen && <div className="selection-backdrop" role="presentation" onMouseDown={() => setSelectionOpen(false)}><aside className="selection-drawer" role="dialog" aria-modal="true" aria-label="Joias selecionadas" onMouseDown={(event) => event.stopPropagation()}><div className="selection-header"><div><p className="eyebrow dark">SUA SELEÇÃO</p><h2>{selection.length} {selection.length === 1 ? "joia" : "joias"}</h2></div><button type="button" onClick={() => setSelectionOpen(false)} aria-label="Fechar seleção">×</button></div><div className="selection-list">{selection.map((product) => <div className="selection-item" key={product.id}><span className="selection-thumb"><Image src={product.image_url} alt="" fill sizes="70px" /></span><div><strong>{product.title}</strong>{product.source_sku && <small>Cód. {product.source_sku}</small>}</div><button type="button" onClick={() => toggleSelection(product)} aria-label={`Remover ${product.title}`}>×</button></div>)}</div><div className="selection-footer"><button type="button" onClick={() => setSelection([])}>Limpar seleção</button><a href={selectionWhatsappUrl(selection)} target="_blank" rel="noreferrer">Enviar tudo pelo WhatsApp <span>↗</span></a></div></aside></div>}

      {selected && <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}><section className="modal" role="dialog" aria-modal="true" aria-label={selected.title} onMouseDown={(event) => event.stopPropagation()}><button className="close" type="button" onClick={() => setSelected(null)} aria-label="Fechar">×</button><div className="modal-image"><Image src={selected.image_url} alt={selected.title} fill sizes="(max-width: 620px) 100vw, 420px" /></div><div className="modal-copy"><p className="eyebrow dark">{selected.material}</p><h2>{selected.title}</h2><p className="description">{selected.description}</p>{selected.source_sku && <p className="code">Cód. {selected.source_sku}</p>}<button className={`modal-select${isSelected(selected) ? " active" : ""}`} type="button" onClick={() => toggleSelection(selected)}>{isSelected(selected) ? "✓ Adicionada à seleção" : "+ Adicionar à seleção"}</button><a className="modal-cta" href={whatsappUrl(selected)} target="_blank" rel="noreferrer">Consultar esta joia <span>↗</span></a></div></section></div>}
    </main>
  );
}
