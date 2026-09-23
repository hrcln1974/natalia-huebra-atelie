# Ateliê Natália Huebra — V4.3.0

**Release/validação:** 23/09/2026

## Entregue

- Interface pública em paleta champagne/bege/marrom, sem preto dominante.
- Catálogo preservado e integrado ao painel.
- Nova vitrine de promoções com imagem, preço anterior, preço promocional e botão de interesse.
- Página pública `/promocoes` incluída no sitemap.
- Produto promocional inicial criado por migração segura quando ainda não existir uma promoção.
- Painel administrativo com CRUD funcional para Galeria e Vídeos.
- Upload de fotos e vídeos no painel via `/api/upload`.
- Upload limitado a 25 MB e formatos JPG/JPEG/PNG/WEBP/GIF/MP4/WEBM/MOV.
- Arquivos enviados são armazenados em `storage/uploads/` e publicados por URL interna.
- Vídeos públicos: exatamente 3 vídeos locais + 1 vídeo YouTube separado abaixo da grade.
- `sitemap.xml` e `sitemap.txt` incluem `/promocoes`.
- Autenticação, CRM, leads, agenda, catálogo, pedidos, financeiro e demais funcionalidades existentes preservados.

## Testes realizados

- `node --check server.js` — PASS
- `node --check script.js` — PASS
- `node --check scripts/smoke.js` — PASS
- `npm run check` — PASS
- Smoke HTTP/API — PASS
- Login/sessão administrativa — PASS
- CRUD de produtos — PASS
- CRUD de galeria — PASS
- CRUD de vídeos — PASS
- Upload real de imagem pelo endpoint protegido — PASS
- Vitrine `/promocoes` — PASS
- `sitemap.txt` com `/promocoes` — PASS
- API pública com 3 vídeos locais + 1 YouTube — PASS
- Cadastro de lead → CRM → qualificação/follow-up — PASS

## Observação de deploy

A data acima é a data de **release/validação do pacote**. Não foi declarado deploy em produção nesta sessão porque a publicação na Hostinger não foi executada aqui.
