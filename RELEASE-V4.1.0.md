# Ateliê Natália Huebra — V4.1.0

## Correções e validações

- Corrigido erro de sintaxe que impedia o `server.js` de iniciar.
- Removida duplicidade da função de resposta HTML.
- Versão do backend atualizada para 4.1.0.
- Painel administrativo corrigido para tratamento de erros no render.
- CRM de Leads ampliado com score automático (0–100), status, follow-up, notas e tags.
- Formulário público continua registrando leads automaticamente antes do WhatsApp.
- Smoke test ampliado para validar criação pública de lead, autenticação, consulta, qualificação e follow-up.

## Testes executados

- `node --check server.js` — PASS
- `node --check script.js` — PASS
- `node --check scripts/check.js` — PASS
- JavaScript inline do admin — PASS
- `npm run check` — PASS
- `npm run smoke` — PASS
- Health endpoint — HTTP 200
- Site público — HTTP 200
- Admin — HTTP 200
- Login — PASS
- CRUD de produtos — PASS
- Publicação/inativação — PASS
- CRM de leads — PASS

## Produção

O ZIP não contém banco de dados, `.env` ou `node_modules`. Em um ambiente novo:

1. `npm ci` (ou `npm install`)
2. configure `ADMIN_EMAIL` e `ADMIN_PASSWORD`
3. `npm start`

O banco JSON será criado automaticamente na primeira inicialização quando `ADMIN_PASSWORD` estiver definido.
