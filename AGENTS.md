# Contexto do repositório — financas-familiares

## Objetivo
- Manter o protótipo de finanças familiares compartilhadas em React/Vite, com autenticação e persistência via Supabase ou simulação local.
- Leia `PROJETO.md` e `design_documentation.md`; o `README.md` ainda é o texto padrão do template Vite e não descreve o produto.

## Arquitetura
- `src/App.jsx` compõe a navegação; `src/components/` contém autenticação, dashboard, transações, orçamento e configurações da família.
- `src/context/AuthContext.jsx` gerencia sessão, perfis e família; `FinanceContext.jsx` carrega e altera transações/orçamentos, incluindo assinaturas Realtime filtradas por família.
- `src/supabaseClient.js` usa `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`; sem configuração válida ativa modo mock em `localStorage`, não um backend compartilhado.
- `supabase/schema.sql` define tabelas e políticas RLS; as descrições de design são intenção, mas o SQL e o código determinam o comportamento atual.

## Contratos e grão
- `families`: uma linha por família (`id`) e código de convite único; `profiles`: uma linha por usuário autenticado (`id`) associada opcionalmente a `family_id`.
- `transactions`: uma linha por lançamento (`id`), com `family_id`, `user_id`, `amount`, `type` (`income`/`expense`), `category` e `date`.
- `budgets`: uma linha por combinação única `family_id` + `category` + `month_year` (`YYYY-MM`); não confunda orçamento mensal com transação individual.
- Agregações e consultas financeiras devem manter escopo da família e distinção entre receita e despesa.

## Áreas protegidas
- Não exponha `.env`, credenciais, código de convite, dados financeiros ou sessão; não inclua chave de serviço Supabase no frontend.
- Preserve o isolamento RLS das transações e orçamentos. O SQL atual permite leitura de `families` por qualquer autenticado para o fluxo de convite; não declare isolamento total dessa tabela sem corrigir e testar a política.
- Modo mock grava dados no navegador, inclusive credenciais simuladas no `localStorage`: não o apresente como armazenamento seguro ou produção.

## Comandos e verificação
- Scripts confirmados em `package.json` (não executados nesta inspeção): `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`. Não há script de teste.
- Para mudanças de auth/dados, verifique fluxos com e sem Supabase, associação por família e políticas RLS num ambiente autorizado; build/lint isolados não comprovam segurança ou sincronização.
