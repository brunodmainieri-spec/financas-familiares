# Documentação de Design: Sistema de Controle de Finanças Compartilhado (React + Supabase)

## 1. Resumo do Entendimento
* **Objetivo**: Aplicativo web de controle de finanças familiares com sincronização em tempo real e dashboard interativo de gráficos.
* **Usuário-alvo**: Membros de uma mesma família que colaboram para gerenciar receitas, despesas e orçamentos.
* **Restrições Técnicas**: Frontend em React (SPA), Backend/Auth com Supabase, Estilo em CSS Vanilla (Moderno, Glassmorphism, responsivo).

## 2. Arquitetura do Banco de Dados (Supabase)

### Esquema de Tabelas

```sql
-- Habilitar a extensão de UUID se necessário
create extension if not exists "uuid-ossp";

-- 1. Tabela de Famílias (Grupos)
create table families (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  invite_code text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Tabela de Perfis de Usuário
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  family_id uuid references families on delete set null,
  display_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. Tabela de Transações (Receitas e Despesas)
create table transactions (
  id uuid default uuid_generate_v4() primary key,
  family_id uuid references families on delete cascade not null,
  user_id uuid references profiles on delete cascade not null,
  amount numeric(12,2) not null,
  type text check (type in ('income', 'expense')) not null,
  category text not null,
  description text,
  date date default current_date not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Tabela de Orçamentos (Metas Mensais)
create table budgets (
  id uuid default uuid_generate_v4() primary key,
  family_id uuid references families on delete cascade not null,
  category text not null,
  limit_amount numeric(12,2) not null,
  month_year text not null, -- Formato: 'YYYY-MM'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (family_id, category, month_year)
);
```

### Políticas de Segurança (Row Level Security - RLS)
Para garantir o isolamento de dados por família:
* A leitura e escrita em `transactions`, `budgets` e `families` só é permitida se o `family_id` do usuário logado corresponder ao `family_id` do registro.
* O `profiles` do usuário é visível para membros que compartilham o mesmo `family_id`.

---

## 3. Log de Decisões (Decision Log)

| Decisão | Alternativas Consideradas | Motivo da Escolha |
| :--- | :--- | :--- |
| **Frontend: React (SPA) via Vite** | Next.js, HTML/JS puro | React é obrigatório pelo projeto; Vite provê carregamento ultra-rápido de desenvolvimento e estrutura enxuta. |
| **Backend: Supabase** | Firebase, Backend customizado (Node/Express) | Supabase fornece PostgreSQL nativo, gerenciamento de autenticação simplificado e sincronização em tempo real pronta para uso. |
| **Arquitetura: Cliente Direto (Direct Client SDK)** | Camada de API Serverless intermediária | Reduz complexidade de deploy, latência e atende perfeitamente ao princípio YAGNI para o escopo do projeto. |
| **Gráficos: Recharts** | Chart.js, D3.js | Integração nativa com componentes declarativos do React, excelente suporte a animações e facilidade para estilização responsiva via SVG. |

---

## 4. Design de Interface & UX
* **Visual**: Tema escuro premium (`#0b111e`), com transparências em blur (efeito vidro/glassmorphism), bordas sutis e tipografia moderna (*Plus Jakarta Sans* ou *Inter*).
* **Gráficos**:
  * *Evolução Mensal (Receitas vs Despesas)*: Gráfico de Barras Agrupado/Empilhado.
  * *Distribuição por Categoria*: Gráfico de Pizza ou Rosca (Donut) interativo.
  * *Histórico de Saldo*: Gráfico de Linha suavizada (com preenchimento de área).
  * *Metas de Categoria*: Barras de progresso com gradientes do violeta para o vermelho quando excedidas.
