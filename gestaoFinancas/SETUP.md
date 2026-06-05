# Setup — Finanças Dany & Inês

## O que precisas
- Conta no [GitHub](https://github.com)
- Conta no [Supabase](https://supabase.com)
- Conta no [Vercel](https://vercel.com)

---

## Passo 1 — Supabase: criar projeto e base de dados

1. Vai a [supabase.com](https://supabase.com) → **New project**
2. Escolhe um nome (ex: `financas-dany-ines`) e uma password forte
3. Quando o projeto estiver pronto, vai a **SQL Editor** (menu lateral)
4. Clica em **New query**, cola o conteúdo do ficheiro `schema.sql` e clica **Run**
5. Vai a **Project Settings → API**
6. Copia:
   - **Project URL** (ex: `https://xyzxyzxyz.supabase.co`)
   - **anon public** key (a chave longa que começa com `eyJ...`)

---

## Passo 2 — Criar contas de utilizador no Supabase

1. Vai a **Authentication → Users** → **Add user**
2. Adiciona o email e password do Dany
3. Repete para o email e password da Inês
4. Pronto — não há confirmação de email necessária por defeito

---

## Passo 3 — Configurar o ficheiro index.html

Abre o ficheiro `index.html` num editor de texto e substitui as duas linhas no topo do JavaScript:

```js
const SUPABASE_URL  = 'SUBSTITUI_PELO_PROJECT_URL';   // ← cola aqui a Project URL
const SUPABASE_ANON = 'SUBSTITUI_PELA_ANON_KEY';      // ← cola aqui a anon key
```

Exemplo depois de preencher:
```js
const SUPABASE_URL  = 'https://xyzxyzxyz.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

---

## Passo 4 — Colocar no GitHub

1. Vai a [github.com](https://github.com) → **New repository**
2. Nome: `financas` (ou outro à tua escolha)
3. Público ou privado — à tua escolha (privado é mais seguro para dados financeiros)
4. **Não** inicializes com README
5. Copia os ficheiros da pasta `gestaoFinancas` para o repositório:
   - `index.html`
   - `schema.sql`
   - `SETUP.md`
6. Faz commit e push

---

## Passo 5 — Deploy no Vercel

1. Vai a [vercel.com](https://vercel.com) → **Add New Project**
2. Clica em **Import** no teu repositório `financas`
3. Deixa todas as configurações por defeito (é HTML estático, não precisa de build)
4. Clica **Deploy**
5. Em segundos tens um link público (ex: `financas-xyz.vercel.app`)

---

## Passo 6 — Primeiro uso: importar o histórico

1. Abre a app no link da Vercel
2. Entra com o teu email e password
3. No topo aparece um banner **"Histórico não importado"**
4. Clica em **Importar Histórico** — carrega os 29 meses do Excel de uma só vez
5. Pronto! Os dados ficam disponíveis para ambos

---

## Atualizar a app no futuro

Quando precisares de alterar a app:
1. Edita o `index.html` na tua pasta
2. Faz commit + push para o GitHub
3. A Vercel faz deploy automático em ~30 segundos

---

## Adicionar novos meses

Basta entrar na app → **➕ Registar** → preencher os valores → **Guardar**.
Os dados ficam imediatamente visíveis para ambos (Dany e Inês).
