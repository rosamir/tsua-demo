require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { fetchFlightData, detectChanges } = require('./flightService');
const { sendEmailNotifications, sendPushNotifications, pushEnabled, VAPID_PUBLIC } = require('./notificationService');
const db = require('./dataStore');

const app = express();
const PORT = process.env.FLIGHT_SERVER_PORT || 3001;

app.use(cors({ origin: true }));
app.use(express.json());

// ── Core poll loop ──────────────────────────────────────────────────────────

async function pollFlight() {
  console.log('[Poll] Fetching flight data...');
  const newData = await fetchFlightData();
  if (!newData) { console.warn('[Poll] No data returned'); return; }

  newData.fetchedAt = new Date().toISOString();

  const oldData = db.getFlightData();
  const changes = detectChanges(oldData, newData);

  db.setFlightData(newData);

  if (changes.length) {
    console.log(`[Poll] ${changes.length} change(s) detected`);
    db.addChanges(changes);

    const emailSubs = db.getEmailSubscribers();
    const pushSubs = db.getPushSubscribers();

    await sendEmailNotifications(emailSubs, newData, changes);
    await sendPushNotifications(pushSubs, newData, changes, db.removePushSubscriber);
  } else {
    console.log('[Poll] No changes');
  }
}

// Poll every 5 minutes
cron.schedule('*/5 * * * *', pollFlight);

// Initial poll on startup
pollFlight().catch(console.error);

// ── REST API ────────────────────────────────────────────────────────────────

// GET /api/flight — current flight data + change history
app.get('/api/flight', (req, res) => {
  const flight = db.getFlightData();
  const changes = db.getChanges();
  res.json({ flight, changes, ok: true });
});

// POST /api/refresh — manual refresh
app.post('/api/refresh', async (req, res) => {
  try {
    await pollFlight();
    const flight = db.getFlightData();
    const changes = db.getChanges();
    res.json({ flight, changes, ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message, ok: false });
  }
});

// POST /api/subscribe/email
app.post('/api/subscribe/email', (req, res) => {
  const { email } = req.body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'כתובת מייל לא תקינה', ok: false });
  }
  const added = db.addEmailSubscriber(email);
  res.json({ ok: true, added, message: added ? 'נרשמת בהצלחה!' : 'כבר רשום' });
});

// DELETE /api/subscribe/email
app.delete('/api/subscribe/email', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'חסר מייל', ok: false });
  db.removeEmailSubscriber(email);
  res.json({ ok: true, message: 'הוסרת מהרשימה' });
});

// GET /api/subscribers/email — list (for admin/testing)
app.get('/api/subscribers/email', (req, res) => {
  res.json({ subscribers: db.getEmailSubscribers() });
});

// POST /api/subscribe/push
app.post('/api/subscribe/push', (req, res) => {
  if (!pushEnabled) return res.status(503).json({ error: 'Push not configured', ok: false });
  const { subscription } = req.body;
  if (!subscription?.endpoint) return res.status(400).json({ error: 'Invalid subscription', ok: false });
  db.addPushSubscriber(subscription);
  res.json({ ok: true, message: 'Push subscription saved' });
});

// DELETE /api/subscribe/push
app.delete('/api/subscribe/push', (req, res) => {
  const { endpoint } = req.body;
  if (!endpoint) return res.status(400).json({ error: 'Missing endpoint', ok: false });
  db.removePushSubscriber(endpoint);
  res.json({ ok: true });
});

// GET /api/vapid-public-key
app.get('/api/vapid-public-key', (req, res) => {
  if (!pushEnabled || !VAPID_PUBLIC) return res.status(503).json({ error: 'Push not configured', ok: false });
  res.json({ key: VAPID_PUBLIC, ok: true });
});

// POST /api/test-notification — for testing
app.post('/api/test-notification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email', ok: false });

  const flight = db.getFlightData();
  const testChanges = [{
    id: `test-${Date.now()}`,
    timestamp: new Date().toISOString(),
    field: 'departure.estimated',
    label: 'זמן יציאה משוער',
    from: '08:00',
    to: '08:45',
  }];

  try {
    const { sendEmailNotifications } = require('./notificationService');
    await sendEmailNotifications([email], flight, testChanges);
    res.json({ ok: true, message: `התראת בדיקה נשלחה ל-${email}` });
  } catch (e) {
    res.status(500).json({ error: e.message, ok: false });
  }
});

app.listen(PORT, () => {
  console.log(`[Server] Flight tracker API running on http://localhost:${PORT}`);
  console.log(`[Server] Polling FlightStats every 5 minutes`);
  console.log(`[Server] Push notifications: ${pushEnabled ? 'enabled' : 'disabled (set VAPID keys)'}`);
});
