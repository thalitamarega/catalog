# THATA — Catálogo de joias

Catálogo com busca, filtros, seleção de peças e consulta pelo WhatsApp.

Site: https://thata-catalogo.vercel.app

## Dados e fotos

- O Supabase, tabela `catalog_products`, é a fonte principal do catálogo.
- `GET /api/catalog` consulta todos os produtos ativos, em páginas ordenadas por ID, sem cache. Só aceita uma leitura completa; em caso de falha retorna `data/catalog-snapshot.json`.
- A página abre com a cópia salva e consulta a API em seguida. Alterações no banco, inclusive desativações, substituem a seleção inicial sem precisar publicar novamente.
- As fotos principais estão no Supabase Storage, bucket público `catalog-images`. A escrita permanece restrita ao servidor/painel autorizado.
- Ao substituir fotos, use um novo caminho versionado e atualize `image_url`. Isso evita reutilizar caches da foto anterior.
- Se a foto principal falhar, o componente usa a reserva publicada em `data/catalog-photo-packs`, servida por `/api/catalog-image/[id]`. Os endereços da reserva são versionados para evitar fotos antigas em cache.
- A reserva é uma cópia da última publicação; atualizações do banco não a regravam automaticamente.

## Atualizar a reserva antes de publicar

1. `npm run catalog:snapshot`
2. `node scripts/refresh-catalog-photo-backup.mjs`
3. `node scripts/pack-catalog-images.mjs`
4. `npm run build` e publicação do mesmo conjunto de arquivos.

O script de fotos apenas lê o Storage e cria versões compactas para a reserva. Não altera os arquivos ou os dados do usuário no Supabase. O índice contém os limites de cada imagem; a rota só atende IDs cadastrados. Os arquivos binários precisam acompanhar a publicação (`outputFileTracingIncludes`).

## Histórico da importação

`data/catalog-image-sources.json` preserva os antigos endereços do fornecedor. `data/catalog-image-migration-report.json` registra as três imagens que estavam ausentes na importação inicial. A função temporária de importação foi desativada após a migração.

## Desenvolvimento

`npm ci`, `npm run dev`.

Para verificar produção local: `npm run build` e `npm run start`.
