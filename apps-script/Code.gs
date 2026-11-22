/**
 * RSVP receiver for the birthday site.
 * Paste into Extensions → Apps Script of your private Google Sheet, run `setup` once,
 * then Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * Full steps are in the README.
 */

var RSVP_SHEET = "RSVPs";
var CHILD_SHEET = "Children";
var SUMMARY_SHEET = "Summary";

// Spam limits. The web app URL is public (the form needs it), so cap how many RSVPs it accepts.
// Real guests never come close; raise these if the guest list is ever bigger.
var MAX_PER_HOUR = 20;
var MAX_TOTAL = 200;

var RSVP_HEADERS = ["Received", "Attending", "Adult name", "Phone", "Adults", "Children", "Children (name · age)", "Language", "ID"];
var CHILD_HEADERS = ["Received", "Child name", "Age", "Family (adult)", "Phone", "RSVP ID"];

function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  ensureSheet_(ss, RSVP_SHEET, RSVP_HEADERS);
  ensureSheet_(ss, CHILD_SHEET, CHILD_HEADERS);

  var summary = ss.getSheetByName(SUMMARY_SHEET) || ss.insertSheet(SUMMARY_SHEET, 0);
  summary.clear();
  summary.getRange("A1:B6").setValues([
    ["Families coming", '=COUNTIF(RSVPs!B:B,"Yes")'],
    ["Adults coming", '=SUMIF(RSVPs!B:B,"Yes",RSVPs!E:E)'],
    ["Children coming", '=SUMIF(RSVPs!B:B,"Yes",RSVPs!F:F)'],
    ["Total guests", "=B2+B3"],
    ["Can't make it", '=COUNTIF(RSVPs!B:B,"No")'],
    ["Note", "If someone RSVPs twice, delete the older row in RSVPs and Children."],
  ]);
  summary.getRange("A1:A6").setFontWeight("bold");
  summary.autoResizeColumns(1, 2);
}

function doPost(e) {
  var data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply_({ ok: false, error: "bad_json" });
  }
  if (data.website) return reply_({ ok: true }); // honeypot filled → bot, drop silently

  var name = clean_(data.adultName, 80);
  if (!name) return reply_({ ok: false, error: "missing_name" });

  var attending = data.attending === true;
  var kids = attending && Array.isArray(data.children) ? data.children.slice(0, 8) : [];
  kids = kids
    .map(function (k) { return { name: clean_(k && k.name, 60), age: clean_(k && k.age, 3) }; })
    .filter(function (k) { return k.name; });
  var adults = attending ? Math.max(0, Math.min(10, Number(data.adults) || 0)) : 0;
  var phone = clean_(data.phone, 30);
  var now = new Date();
  var id = Utilities.getUuid().slice(0, 8);

  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var rsvps = ensureSheet_(ss, RSVP_SHEET, RSVP_HEADERS);
    var children = ensureSheet_(ss, CHILD_SHEET, CHILD_HEADERS);
    if (overLimit_(rsvps, now)) return reply_({ ok: false, error: "too_many" });

    rsvps.appendRow([
      now,
      attending ? "Yes" : "No",
      name,
      phone,
      adults,
      kids.length,
      kids.map(function (k) { return k.name + (k.age ? " · " + k.age : ""); }).join(", "),
      clean_(data.lang, 2),
      id,
    ]);
    kids.forEach(function (k) {
      children.appendRow([now, k.name, k.age, name, phone, id]);
    });
  } finally {
    lock.releaseLock();
  }
  return reply_({ ok: true });
}

function doGet() {
  return reply_({ ok: true, service: "rsvp" });
}

// True once the sheet holds MAX_TOTAL RSVPs, or MAX_PER_HOUR arrived in the last hour.
function overLimit_(sheet, now) {
  var count = sheet.getLastRow() - 1; // minus the header row
  if (count >= MAX_TOTAL) return true;
  if (count < MAX_PER_HOUR) return false;
  var recent = sheet.getRange(sheet.getLastRow() - MAX_PER_HOUR + 1, 1, MAX_PER_HOUR, 1).getValues();
  var hourAgo = now.getTime() - 60 * 60 * 1000;
  return recent.every(function (row) { return row[0] instanceof Date && row[0].getTime() > hourAgo; });
}

function ensureSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Trim, cap length, and stop guest input from being read as a spreadsheet formula.
function clean_(value, max) {
  var s = String(value == null ? "" : value).trim().slice(0, max);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
