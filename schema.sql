-- ============================================================
-- Gestão Financeira — Dany & Inês
-- Schema SQL para Supabase
-- Corre este ficheiro no Supabase Dashboard > SQL Editor
-- ============================================================

-- Tabela principal de entradas mensais
CREATE TABLE IF NOT EXISTS entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        TEXT NOT NULL UNIQUE,   -- formato "2024-01"
  assets      JSONB NOT NULL DEFAULT '{}',
  summary     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para ordenar por data
CREATE INDEX IF NOT EXISTS entries_date_idx ON entries(date);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security (RLS)
-- Só utilizadores autenticados podem ler e escrever
-- ============================================================
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

-- Leitura: qualquer utilizador autenticado
CREATE POLICY "auth_read" ON entries
  FOR SELECT USING (auth.role() = 'authenticated');

-- Escrita: qualquer utilizador autenticado
CREATE POLICY "auth_insert" ON entries
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Atualização: qualquer utilizador autenticado
CREATE POLICY "auth_update" ON entries
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Eliminação: qualquer utilizador autenticado
CREATE POLICY "auth_delete" ON entries
  FOR DELETE USING (auth.role() = 'authenticated');
