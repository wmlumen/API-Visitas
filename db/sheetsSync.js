/**
 * Sincronización con Google Sheets para persistencia externa
 * Envía cada visita a una Google Sheet via Apps Script Web App
 */
const SHEETS_URL = process.env.SHEETS_URL || '';
const SHEETS_KEY = process.env.SHEETS_KEY || 'monitor-secret-key-2026';

async function syncVisit(visit) {
  if (!SHEETS_URL) return; // Sin URL configurada, no sincroniza

  try {
    await fetch(SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: SHEETS_KEY, visit }),
      signal: AbortSignal.timeout(5000)
    });
  } catch (e) {
    // Silencioso: el archivo JSON local sigue siendo el primario
  }
}

async function syncShare(project, platform, page) {
  if (!SHEETS_URL) return;

  try {
    await fetch(SHEETS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: SHEETS_KEY,
        visit: {
          project,
          page: page || '',
          country: 'share',
          city: platform,
          browser: 'share',
          os: platform,
          device: 'share',
          referrer: '',
          created_at: new Date().toISOString()
        }
      }),
      signal: AbortSignal.timeout(5000)
    });
  } catch (e) { /* */ }
}

module.exports = { syncVisit, syncShare };
