-- ============================================================
-- Finanças Dany & Inês — Schema completo
-- Supabase Dashboard > SQL Editor > New query > colar e Run
-- Seguro de correr múltiplas vezes (idempotente)
-- ============================================================

-- ── Função partilhada para updated_at ────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABELA: entries
-- Registos mensais de ativos e sumários
-- ============================================================
CREATE TABLE IF NOT EXISTS entries (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date        TEXT NOT NULL UNIQUE,   -- formato "2024-01"
  assets      JSONB NOT NULL DEFAULT '{}',
  summary     JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS entries_date_idx ON entries(date);

CREATE OR REPLACE TRIGGER entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE entries ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='entries' AND policyname='auth_read') THEN
    CREATE POLICY "auth_read"   ON entries FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='entries' AND policyname='auth_insert') THEN
    CREATE POLICY "auth_insert" ON entries FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='entries' AND policyname='auth_update') THEN
    CREATE POLICY "auth_update" ON entries FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='entries' AND policyname='auth_delete') THEN
    CREATE POLICY "auth_delete" ON entries FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- ============================================================
-- TABELA: config
-- Configurações da app: casa, casamento, etc.
-- Cada registo é uma chave (key) com valor JSON (value)
-- Chaves usadas:
--   "casa"      → { preco, credito, pago, goal, extras[] }
--   "casamento" → { items[{ nome, custo }] }
-- ============================================================
CREATE TABLE IF NOT EXISTS config (
  key        TEXT PRIMARY KEY,
  value      JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE TRIGGER config_updated_at
  BEFORE UPDATE ON config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE config ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config' AND policyname='auth_read') THEN
    CREATE POLICY "auth_read"   ON config FOR SELECT USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config' AND policyname='auth_insert') THEN
    CREATE POLICY "auth_insert" ON config FOR INSERT WITH CHECK (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config' AND policyname='auth_update') THEN
    CREATE POLICY "auth_update" ON config FOR UPDATE USING (auth.role() = 'authenticated');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='config' AND policyname='auth_delete') THEN
    CREATE POLICY "auth_delete" ON config FOR DELETE USING (auth.role() = 'authenticated');
  END IF;
END $$;
