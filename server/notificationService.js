const nodemailer = require('nodemailer');
const webpush = require('web-push');

// ── VAPID (Web Push) ─────────────────────────────────────────────────────────
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_EMAIL = process.env.VAPID_EMAIL || 'mailto:admin@example.com';

let pushEnabled = false;
if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC, VAPID_PRIVATE);
  pushEnabled = true;
  console.log('[Push] Web Push configured');
} else {
  console.warn('[Push] VAPID keys not set — push notifications disabled');
}

// ── Email ────────────────────────────────────────────────────────────────────
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!process.env.EMAIL_HOST && !process.env.EMAIL_SERVICE) return null;

  const cfg = process.env.EMAIL_SERVICE
    ? { service: process.env.EMAIL_SERVICE, auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } }
    : {
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      };

  transporter = nodemailer.createTransport(cfg);
  return transporter;
}

function formatTime(iso) {
  if (!iso) return 'לא ידוע';
  try {
    return new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' });
  } catch { return iso; }
}

function formatFieldValue(field, value) {
  if (value === null || value === undefined) return 'לא ידוע';
  if (field.includes('scheduled') || field.includes('estimated') || field.includes('actual')) {
    return formatTime(value);
  }
  return String(value);
}

function buildEmailHtml(flight, changes) {
  const rows = changes.map(c => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-weight:600;color:#1e3a5f">${c.label}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#e53e3e;text-decoration:line-through">${formatFieldValue(c.field, c.from)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;color:#276749;font-weight:600">${formatFieldValue(c.field, c.to)}</td>
    </tr>`).join('');

  return `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;direction:rtl">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:24px 0">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a365d 0%,#2b6cb0 100%);padding:32px 24px;text-align:center">
            <div style="font-size:13px;color:#90cdf4;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px">עדכון טיסה</div>
            <div style="font-size:36px;font-weight:900;color:#fff;letter-spacing:4px">${flight?.flightNumber || 'IZ152'}</div>
            <div style="font-size:14px;color:#bee3f8;margin-top:4px">
              ${flight?.departure?.cityHe || 'פאפוס'} → ${flight?.arrival?.cityHe || 'תל אביב'}
            </div>
          </td>
        </tr>
        <!-- Status badge -->
        <tr>
          <td style="padding:16px 24px;text-align:center;background:#ebf8ff;border-bottom:2px solid #bee3f8">
            <span style="font-size:15px;font-weight:700;color:#2c5282">
              סטטוס נוכחי: ${flight?.statusHe || '—'}
            </span>
          </td>
        </tr>
        <!-- Changes table -->
        <tr>
          <td style="padding:24px">
            <div style="font-size:18px;font-weight:700;color:#1a365d;margin-bottom:16px">
              🔄 ${changes.length === 1 ? 'שינוי אחד' : `${changes.length} שינויים`} זוהו
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0">
              <thead>
                <tr style="background:#2b6cb0">
                  <th style="padding:10px 12px;color:#fff;font-size:12px;font-weight:600;text-align:right">שדה</th>
                  <th style="padding:10px 12px;color:#fff;font-size:12px;font-weight:600;text-align:right">לפני</th>
                  <th style="padding:10px 12px;color:#fff;font-size:12px;font-weight:600;text-align:right">אחרי</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
            </table>
          </td>
        </tr>
        <!-- Times summary -->
        <tr>
          <td style="padding:0 24px 24px">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="48%" style="background:#ebf8ff;border-radius:12px;padding:16px;text-align:center">
                  <div style="font-size:11px;color:#2c5282;font-weight:600;margin-bottom:4px">✈️ המראה — פאפוס (PFO)</div>
                  <div style="font-size:22px;font-weight:900;color:#1a365d">${formatTime(flight?.departure?.estimated || flight?.departure?.scheduled)}</div>
                  <div style="font-size:11px;color:#718096">זמן משוער</div>
                </td>
                <td width="4%"></td>
                <td width="48%" style="background:#f0fff4;border-radius:12px;padding:16px;text-align:center">
                  <div style="font-size:11px;color:#276749;font-weight:600;margin-bottom:4px">🛬 נחיתה — ת"א (TLV)</div>
                  <div style="font-size:22px;font-weight:900;color:#1a365d">${formatTime(flight?.arrival?.estimated || flight?.arrival?.scheduled)}</div>
                  <div style="font-size:11px;color:#718096">זמן משוער</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f7fafc;padding:16px 24px;text-align:center;border-top:1px solid #e2e8f0">
            <div style="font-size:11px;color:#a0aec0">
              עודכן: ${new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' })}
            </div>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

async function sendEmailNotifications(subscribers, flight, changes) {
  const t = getTransporter();
  if (!t) {
    console.warn('[Email] No transporter configured — skipping email');
    return;
  }
  if (!subscribers.length || !changes.length) return;

  const subject = `עדכון טיסה ${flight?.flightNumber || 'IZ152'} – ${changes.map(c => c.label).join(', ')}`;
  const html = buildEmailHtml(flight, changes);

  for (const email of subscribers) {
    try {
      await t.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: email,
        subject,
        html,
      });
      console.log(`[Email] Sent to ${email}`);
    } catch (e) {
      console.error(`[Email] Failed to send to ${email}:`, e.message);
    }
  }
}

async function sendPushNotifications(pushSubscribers, flight, changes, removeFn) {
  if (!pushEnabled || !pushSubscribers.length || !changes.length) return;

  const payload = JSON.stringify({
    title: `עדכון טיסה ${flight?.flightNumber || 'IZ152'}`,
    body: changes.map(c => `${c.label}: ${formatFieldValue(c.field, c.from)} → ${formatFieldValue(c.field, c.to)}`).join('\n'),
    icon: '/icons/icon-192.png',
    data: { url: '/' },
  });

  for (const sub of pushSubscribers) {
    try {
      await webpush.sendNotification(sub, payload);
      console.log('[Push] Sent to', sub.endpoint.slice(0, 40) + '...');
    } catch (e) {
      if (e.statusCode === 410 || e.statusCode === 404) {
        console.log('[Push] Subscription expired, removing');
        removeFn(sub.endpoint);
      } else {
        console.error('[Push] Send failed:', e.message);
      }
    }
  }
}

module.exports = { sendEmailNotifications, sendPushNotifications, pushEnabled, VAPID_PUBLIC };
