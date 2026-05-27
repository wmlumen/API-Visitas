/**
 * Google Apps Script - Guardar visitas de API-Visitas en Sheets
 * 
 * PASOS PARA CONFIGURAR:
 * 1. Abrir https://docs.google.com/spreadsheets/d/1FMmFjhXwYJ7oI4D42uR3lgNmFekz3-1iT1cuo6zTRMI
 * 2. Ir a Extensiones > Apps Script
 * 3. Pegar este código completo y guardar (Ctrl+S)
 * 4. Clic en "Implementar" > "Nueva implementación" > Tipo: "Aplicación web"
 * 5. Ejecutar como: "Yo (tu email)"
 * 6. Acceso: "Cualquiera, incluso anónimo"
 * 7. Clic "Implementar" > Copiar la URL generada
 * 8. Pegar la URL en la variable SHEETS_URL en Render (Environment Variables)
 * 9. La sheet queda solo-lectura para el público, solo la API puede escribir
 */

const SHEET_NAME = 'Hoja 1';
const API_KEY = 'monitor-secret-key-2026';

function doPost(e) {
  try {
    if (!e || !e.postData) {
      return json({ error: 'No data received' });
    }

    const data = JSON.parse(e.postData.contents);
    
    if (data.api_key !== API_KEY) {
      return json({ error: 'Unauthorized' });
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    
    // Crear cabeceras si la sheet está vacía
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'project', 'page', 'ip', 'country', 'region', 'city',
        'lat', 'lon', 'isp', 'browser', 'os', 'device',
        'referrer', 'visitor_hash', 'time_spent', 'is_bot', 'created_at'
      ]);
      sheet.getRange(1, 1, 1, 17).setFontWeight('bold').setBackground('#0f172a').setFontColor('#e2e8f0');
      sheet.setFrozenRows(1);
    }
    
    const v = data.visit || {};
    sheet.appendRow([
      v.project || '', v.page || '', v.ip || '',
      v.country || '', v.region || '', v.city || '',
      v.lat != null ? v.lat : '', v.lon != null ? v.lon : '', v.isp || '',
      v.browser || '', v.os || '', v.device || '',
      v.referrer || '', v.visitor_hash || '',
      v.time_spent != null ? v.time_spent : '', v.is_bot ? 1 : 0,
      v.created_at || new Date().toISOString()
    ]);

    return json({ success: true, row: sheet.getLastRow() });
  } catch (err) {
    return json({ error: err.message || 'Internal error' });
  }
}

function doGet() {
  return json({ status: 'API-Visitas Sheets endpoint', usage: 'POST only with api_key + visit data' });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
