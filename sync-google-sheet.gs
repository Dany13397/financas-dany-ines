// ============================================================
// Sync Google Sheet → Supabase
// Como usar:
//   1. Na Google Sheet: Extensions → Apps Script
//   2. Cola este código e guarda
//   3. Substitui SUPABASE_SERVICE_KEY pela tua service role key
//      (Supabase → Project Settings → API → service_role)
//   4. Corre setupTrigger() UMA VEZ para ativar sync diário automático
//   5. Ou corre syncToSupabase() manualmente quando quiseres
// ============================================================

const SUPABASE_URL         = 'https://evokatcmngxgfqpdlusp.supabase.co';
const SUPABASE_SERVICE_KEY = 'SUBSTITUI_PELA_SERVICE_ROLE_KEY'; // ← muda aqui

// Meses em português → número
const MONTH_MAP = {
  'janeiro':'01','fevereiro':'02','março':'03','marco':'03',
  'abril':'04','maio':'05','junho':'06',
  'julho':'07','agosto':'08','setembro':'09',
  'outubro':'10','novembro':'11','dezembro':'12'
};

// Nome na sheet → nome no Supabase
const NAME_MAP = {
  'ppr (não se pode levantar)': 'PPR',
  'ppr (nao se pode levantar)': 'PPR',
};

// Linhas de ativos (ficam em assets{})
const ASSET_ROWS = new Set([
  'conta à ordem','conta poupança','conta poupanca','conta conjunta',
  'certificados de aforro','trade republic (carteira)','trade republic (saldo)',
  'ppr','ppr (não se pode levantar)','ppr (nao se pode levantar)',
  'ações accenture','acoes accenture','degiro','trust wallet','xtb','cgd pensões','cgd pensoes'
]);

// Linhas de resumo (ficam em summary{})
const SUMMARY_ROWS = new Set([
  'total juntos','total individual',
  'dinheiro total possivel casa','dinheiro possivel casa individual',
  'ganho/perda casa total mensal','ganho/perda casa individual mensal',
  'dinheiro investido total (não possível casa)','dinheiro investido total (nao possivel casa)',
  'dinheiro investido individual (não possível casa)','dinheiro investido individual (nao possivel casa)'
]);

// ── Parsers ───────────────────────────────────────────────────

function parseDate(val) {
  if (!val) return null;
  const s = val.toString().toLowerCase().trim();
  for (const [name, num] of Object.entries(MONTH_MAP)) {
    if (s.includes(name)) {
      const m = s.match(/\d{4}/);
      if (m) return `${m[0]}-${num}`;
    }
  }
  return null;
}

function parseValue(val) {
  if (val === null || val === undefined || val === '') return null;
  // Formato europeu: "1 671,17 €" → 1671.17
  const cleaned = val.toString()
    .replace(/[€\s]/g, '')   // remove € e espaços
    .replace(/\./g, '')       // remove pontos (separador de milhares)
    .replace(',', '.');       // vírgula → ponto decimal
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function normalizeName(raw) {
  if (!raw) return null;
  const lower = raw.toString().toLowerCase().trim();
  return NAME_MAP[lower] || raw.toString().trim();
}

// ── Core sync ─────────────────────────────────────────────────

function syncToSupabase() {
  if (SUPABASE_SERVICE_KEY === 'SUBSTITUI_PELA_SERVICE_ROLE_KEY') {
    Logger.log('❌ Substitui a SUPABASE_SERVICE_KEY antes de correr.');
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const entries = {};

  for (const sheet of ss.getSheets()) {
    const tabName = sheet.getName().toLowerCase();
    if (!tabName.includes('trimestre')) continue;

    const data = sheet.getDataRange().getValues();
    if (data.length < 3) continue;

    // Cada separador tem 3 grupos de colunas: (0,1,2), (3,4,5), (6,7,8)
    // Linha 0: data em col 1, 4, 7
    // Linha 1: "Inês" e "Dany"
    // Linhas 2+: dados
    const months = [
      { nameCol: 0, inesCol: 1, danyCol: 2, dateCol: 1 },
      { nameCol: 3, inesCol: 4, danyCol: 5, dateCol: 4 },
      { nameCol: 6, inesCol: 7, danyCol: 8, dateCol: 7 },
    ];

    for (const m of months) {
      const date = parseDate(data[0][m.dateCol]);
      if (!date) continue;

      if (!entries[date]) entries[date] = { date, assets: {}, summary: {} };
      const entry = entries[date];

      for (let r = 2; r < data.length; r++) {
        const row    = data[r];
        const rawName = row[m.nameCol];
        if (!rawName || rawName.toString().trim() === '') continue;

        const name  = normalizeName(rawName);
        const lower = rawName.toString().toLowerCase().trim();
        const ines  = parseValue(row[m.inesCol]);
        const dany  = parseValue(row[m.danyCol]);

        // Ignora linhas de legenda e outras
        if (lower.startsWith('legenda') || lower.startsWith('balanço') || lower.startsWith('balanco')) continue;

        if (ASSET_ROWS.has(lower)) {
          if (ines !== null || dany !== null) {
            entry.assets[name] = { ines, dany };
          }
        } else if (SUMMARY_ROWS.has(lower)) {
          if (ines !== null || dany !== null) {
            entry.summary[name] = { ines, dany };
          }
        }
      }
    }
  }

  // Só sincroniza meses com dados reais (pelo menos 3 ativos preenchidos)
  const toSync = Object.values(entries).filter(e => Object.keys(e.assets).length >= 3);

  let ok = 0, fail = 0;
  for (const entry of toSync) {
    const resp = UrlFetchApp.fetch(`${SUPABASE_URL}/rest/v1/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Prefer': 'resolution=merge-duplicates',
      },
      payload: JSON.stringify(entry),
      muteHttpExceptions: true,
    });
    const code = resp.getResponseCode();
    if (code === 200 || code === 201) { ok++; }
    else { fail++; Logger.log(`❌ ${entry.date}: ${resp.getContentText()}`); }
  }

  Logger.log(`✅ Sync completo: ${ok} OK, ${fail} erros (de ${toSync.length} meses com dados).`);
}

// ── Trigger automático ────────────────────────────────────────
// Corre esta função UMA VEZ para ativar o sync diário às 8h

function setupTrigger() {
  // Remove triggers antigos para não duplicar
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === 'syncToSupabase') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('syncToSupabase')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();
  Logger.log('✅ Trigger criado: sync diário às 8h.');
}
