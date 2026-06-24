// ════════════════════════════════════════
// DIAGNÓSTICO DE CULTURA DE RECONOCIMIENTO
// Google Apps Script — pegar en script.google.com
// ════════════════════════════════════════

const SHEET_NAME = 'Respuestas';

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = [
      'Timestamp', 'Nombre', 'Equipo',
      'P1','P2','P3','P4','P5','P6','P7','P8','P9','P10',
      'P11','P12','P13','P14','P15','P16','P17','P18',
      'P19 (abierta)'
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Recibe una respuesta y la guarda
function doPost(e) {
  const cors = ContentService.createTextOutput();
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrCreateSheet();
    const row = [
      new Date().toISOString(),
      data.name,
      data.team,
      ...data.answers,
      data.open || ''
    ];
    sheet.appendRow(row);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Devuelve todas las respuestas de un equipo
function doGet(e) {
  try {
    const team = (e.parameter.team || '').toLowerCase().trim();
    const sheet = getOrCreateSheet();
    const rows = sheet.getDataRange().getValues();

    const responses = [];
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowTeam = (row[2] || '').toLowerCase().trim();
      if (rowTeam === team) {
        responses.push({
          timestamp: row[0],
          name: row[1],
          team: row[2],
          answers: row.slice(3, 21).map(Number),
          open: row[21] || ''
        });
      }
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, responses }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
