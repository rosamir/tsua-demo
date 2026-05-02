#!/usr/bin/env node
// Runs inside GitHub Actions every 15 minutes.
// Primary source: AviationStack API (free, 500 req/month)
// Fallback: FlightStats HTML scraping
'use strict';

const fs = require('fs');
const path = require('path');

const DATA_DIR     = path.join(__dirname, '../public/data');
const FLIGHT_FILE  = path.join(DATA_DIR, 'flight.json');
const CHANGES_FILE = path.join(DATA_DIR, 'changes.json');

// ── File helpers ──────────────────────────────────────────────────────────────

function readJSON(file, def) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return def; }
}

function writeJSON(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ── Status helpers ────────────────────────────────────────────────────────────

function getStatusHe(code) {
  return (
    { S: 'מתוכנן', A: 'בטיסה', L: 'נחת', D: 'הוסט', C: 'בוטל', NO: 'לא המריא', R: 'הופנה' }[code] ||
    code || 'לא ידוע'
  );
}

// ── AviationStack (primary) ───────────────────────────────────────────────────
// Free tier: 500 req/month, HTTP only
// Sign up at: aviationstack.com

async function fetchAviationStack() {
  const key = process.env.AVIATIONSTACK_KEY;
  if (!key) throw new Error('AVIATIONSTACK_KEY not set');

  // Try with specific date first, then without
  const urls = [
    `http://api.aviationstack.com/v1/flights?access_key=${key}&flight_iata=IZ152&flight_date=2026-05-03&limit=1`,
    `http://api.aviationstack.com/v1/flights?access_key=${key}&flight_iata=IZ152&limit=1`,
  ];

  for (const url of urls) {
    const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const json = await resp.json();

    if (json.error) throw new Error(`AviationStack: ${json.error.message || JSON.stringify(json.error)}`);

    const f = json.data?.[0];
    if (!f) continue;

    const statusMap = { scheduled: 'S', active: 'A', landed: 'L', cancelled: 'C', incident: 'D', diverted: 'D' };
    const status = statusMap[f.flight_status] || 'S';

    return {
      flightNumber: `IZ${f.flight?.number || '152'}`,
      airline: 'ארקיע',
      status,
      statusHe: getStatusHe(status),
      departure: {
        airport:   f.departure?.airport   || 'Paphos International Airport',
        iata:      f.departure?.iata      || 'PFO',
        cityHe:    'פאפוס',
        scheduled: f.departure?.scheduled || null,
        estimated: f.departure?.estimated || f.departure?.scheduled || null,
        actual:    f.departure?.actual    || null,
        terminal:  f.departure?.terminal  || null,
        gate:      f.departure?.gate      || null,
      },
      arrival: {
        airport:   f.arrival?.airport   || 'Ben Gurion International Airport',
        iata:      f.arrival?.iata      || 'TLV',
        cityHe:    'תל אביב',
        scheduled: f.arrival?.scheduled || null,
        estimated: f.arrival?.estimated || f.arrival?.scheduled || null,
        actual:    f.arrival?.actual    || null,
        terminal:  f.arrival?.terminal  || null,
        gate:      f.arrival?.gate      || null,
      },
      duration: null,
      aircraft: { type: f.aircraft?.iata || null },
      isMock: false,
      fetchedAt: new Date().toISOString(),
    };
  }
  throw new Error('AviationStack returned no data for IZ152');
}

// ── FlightStats HTML scraping (fallback) ──────────────────────────────────────

async function fetchFlightStats() {
  const FLIGHT_URL =
    'https://www.flightstats.com/v2/flight-tracker/IZ/152' +
    '?year=2026&month=05&date=03&flightId=1381306131';

  const resp = await fetch(FLIGHT_URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 ' +
        '(KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8',
    },
    signal: AbortSignal.timeout(25000),
  });

  if (!resp.ok) throw new Error(`FlightStats HTTP ${resp.status}`);
  const html = await resp.text();

  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );
  if (!match) throw new Error('__NEXT_DATA__ not found');

  const nextData = JSON.parse(match[1]);
  const pp  = nextData?.props?.pageProps;
  const raw = pp?.flightData || pp?.initialData?.flightData || null;
  if (!raw) throw new Error('No flightData in __NEXT_DATA__');

  const flights = Array.isArray(raw.flights) ? raw.flights : raw.flight ? [raw.flight] : [];
  const f = flights[0];
  if (!f) throw new Error('No flight entry found');

  const airports = raw.airports || {};
  const depAp = airports[f.departureAirportFsCode] || {};
  const arrAp = airports[f.arrivalAirportFsCode]   || {};
  const status = f.status || 'S';

  return {
    flightNumber: `IZ${f.flightNumber || '152'}`,
    airline: 'ארקיע',
    status,
    statusHe: getStatusHe(status),
    departure: {
      airport:   depAp.name || 'Paphos International Airport',
      iata:      f.departureAirportFsCode || 'PFO',
      cityHe:    'פאפוס',
      scheduled: f.scheduledGateDeparture || f.publishedDeparture || null,
      estimated: f.estimatedGateDeparture || f.scheduledGateDeparture || null,
      actual:    f.actualGateDeparture    || null,
      terminal:  f.departureTerminal || null,
      gate:      f.departureGate     || null,
    },
    arrival: {
      airport:   arrAp.name || 'Ben Gurion International Airport',
      iata:      f.arrivalAirportFsCode || 'TLV',
      cityHe:    'תל אביב',
      scheduled: f.scheduledGateArrival || f.publishedArrival || null,
      estimated: f.estimatedGateArrival || f.scheduledGateArrival || null,
      actual:    f.actualGateArrival    || null,
      terminal:  f.arrivalTerminal || null,
      gate:      f.arrivalGate     || null,
    },
    duration: f.flightDuration || null,
    aircraft: { type: f.flightEquipmentIataCode || null },
    isMock: false,
    fetchedAt: new Date().toISOString(),
  };
}

// ── Change detection ──────────────────────────────────────────────────────────

const WATCHED_FIELDS = [
  { path: 'status',                 label: 'סטטוס טיסה'          },
  { path: 'departure.scheduled',    label: 'זמן יציאה מתוכנן'    },
  { path: 'departure.estimated',    label: 'זמן יציאה משוער'      },
  { path: 'departure.actual',       label: 'זמן יציאה בפועל'      },
  { path: 'departure.gate',         label: 'שער יציאה'            },
  { path: 'departure.terminal',     label: 'טרמינל יציאה'         },
  { path: 'arrival.scheduled',      label: 'זמן הגעה מתוכנן'      },
  { path: 'arrival.estimated',      label: 'זמן הגעה משוער'        },
  { path: 'arrival.actual',         label: 'זמן הגעה בפועל'        },
  { path: 'arrival.gate',           label: 'שער הגעה'             },
  { path: 'arrival.terminal',       label: 'טרמינל הגעה'          },
  { path: 'aircraft.type',          label: 'סוג מטוס'             },
];

const dig = (obj, dotPath) => dotPath.split('.').reduce((o, k) => o?.[k], obj);

function detectChanges(oldData, newData) {
  if (!oldData || oldData.isMock) return [];
  return WATCHED_FIELDS
    .filter(f => String(dig(oldData, f.path) ?? '') !== String(dig(newData, f.path) ?? ''))
    .map(f => ({
      id:        `${Date.now()}-${f.path}`,
      timestamp: new Date().toISOString(),
      field:     f.path,
      label:     f.label,
      from:      dig(oldData, f.path) ?? null,
      to:        dig(newData, f.path) ?? null,
    }));
}

// ── Email ─────────────────────────────────────────────────────────────────────

function fmtTime(iso) {
  if (!iso) return 'לא ידוע';
  try {
    return new Date(iso).toLocaleTimeString('he-IL', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem',
    });
  } catch { return iso; }
}

function fmtVal(field, val) {
  if (val == null) return 'לא ידוע';
  if (field.includes('scheduled') || field.includes('estimated') || field.includes('actual')) return fmtTime(val);
  return String(val);
}

async function sendEmails(flight, changes) {
  const { GMAIL_USER, GMAIL_APP_PASSWORD, NOTIFY_EMAILS } = process.env;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !NOTIFY_EMAILS) {
    console.log('[Email] Secrets not configured — skipping');
    return;
  }

  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });

  const rows = changes.map(c => `
    <tr>
      <td style="padding:8px 14px;border-bottom:1px solid #e2e8f0;font-weight:600;color:#1a365d">${c.label}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #e2e8f0;color:#e53e3e;text-decoration:line-through">${fmtVal(c.field, c.from)}</td>
      <td style="padding:8px 14px;border-bottom:1px solid #e2e8f0;color:#276749;font-weight:700">${fmtVal(c.field, c.to)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html dir="rtl" lang="he"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:20px;background:#f0f4f8;font-family:Arial,sans-serif;direction:rtl">
<div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.08)">
  <div style="background:linear-gradient(135deg,#1a365d,#2b6cb0);padding:28px;text-align:center">
    <div style="font-size:40px;font-weight:900;color:#fff;letter-spacing:4px">${flight?.flightNumber || 'IZ152'}</div>
    <div style="color:#bee3f8;margin-top:4px">✈️ פאפוס ← תל אביב · 3.5.2026</div>
  </div>
  <div style="background:#ebf8ff;padding:12px;text-align:center;border-bottom:2px solid #bee3f8">
    <span style="font-weight:700;color:#2c5282">סטטוס: ${flight?.statusHe || '—'}</span>
  </div>
  <div style="padding:24px">
    <div style="font-size:17px;font-weight:700;color:#1a365d;margin-bottom:14px">🔄 ${changes.length} שינויים זוהו</div>
    <table width="100%" style="border-collapse:collapse;border:1px solid #e2e8f0">
      <thead><tr style="background:#2b6cb0">
        <th style="padding:10px 14px;color:#fff;font-size:12px;text-align:right">שדה</th>
        <th style="padding:10px 14px;color:#fff;font-size:12px;text-align:right">לפני</th>
        <th style="padding:10px 14px;color:#fff;font-size:12px;text-align:right">אחרי</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <table width="100%" style="margin-top:18px;border-collapse:collapse"><tr>
      <td style="background:#ebf8ff;border-radius:12px;padding:14px;text-align:center;width:48%">
        <div style="font-size:11px;color:#2c5282;font-weight:600;margin-bottom:3px">✈️ המראה (PFO)</div>
        <div style="font-size:26px;font-weight:900;color:#1a365d">${fmtTime(flight?.departure?.estimated || flight?.departure?.scheduled)}</div>
      </td>
      <td style="width:4%"></td>
      <td style="background:#f0fff4;border-radius:12px;padding:14px;text-align:center;width:48%">
        <div style="font-size:11px;color:#276749;font-weight:600;margin-bottom:3px">🛬 נחיתה (TLV)</div>
        <div style="font-size:26px;font-weight:900;color:#1a365d">${fmtTime(flight?.arrival?.estimated || flight?.arrival?.scheduled)}</div>
      </td>
    </tr></table>
  </div>
  <div style="background:#f7fafc;padding:12px;text-align:center;font-size:11px;color:#a0aec0;border-top:1px solid #e2e8f0">
    עודכן: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}
  </div>
</div>
</body></html>`;

  const subject = `✈️ עדכון IZ152: ${changes.map(c => c.label).join(', ')}`;
  const recipients = NOTIFY_EMAILS.split(',').map(s => s.trim()).filter(Boolean);
  for (const to of recipients) {
    try {
      await transporter.sendMail({ from: `IZ152 Tracker <${GMAIL_USER}>`, to, subject, html });
      console.log(`[Email] ✓ Sent to ${to}`);
    } catch (e) {
      console.error(`[Email] ✗ Failed for ${to}:`, e.message);
    }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  let newData = null;

  // 1. AviationStack (primary — reliable, no scraping)
  try {
    newData = await fetchAviationStack();
    console.log('[Poll] ✓ AviationStack');
  } catch (e) {
    console.warn('[Poll] AviationStack failed:', e.message);
  }

  // 2. FlightStats HTML scraping (fallback)
  if (!newData) {
    try {
      newData = await fetchFlightStats();
      console.log('[Poll] ✓ FlightStats HTML');
    } catch (e) {
      console.warn('[Poll] FlightStats failed:', e.message);
    }
  }

  if (!newData) {
    console.error('[Poll] All sources failed — keeping existing data');
    process.exit(0);
  }

  const oldData  = readJSON(FLIGHT_FILE, null);
  const changes  = detectChanges(oldData, newData);

  writeJSON(FLIGHT_FILE, newData);

  if (changes.length) {
    console.log(`[Poll] ${changes.length} change(s): ${changes.map(c => c.label).join(', ')}`);
    const history = readJSON(CHANGES_FILE, []);
    writeJSON(CHANGES_FILE, [...changes, ...history].slice(0, 200));
    await sendEmails(newData, changes);
  } else {
    console.log('[Poll] No changes detected');
  }
}

main().catch(e => { console.error('[Poll] Fatal:', e); process.exit(1); });
