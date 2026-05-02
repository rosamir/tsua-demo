const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const FLIGHT_FILE = path.join(DATA_DIR, 'flight.json');
const CHANGES_FILE = path.join(DATA_DIR, 'changes.json');
const SUBSCRIBERS_FILE = path.join(DATA_DIR, 'subscribers.json');
const PUSH_SUBS_FILE = path.join(DATA_DIR, 'push_subscribers.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJSON(file, defaultVal) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    }
  } catch (e) {
    console.error(`Error reading ${file}:`, e.message);
  }
  return defaultVal;
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
  getFlightData: () => readJSON(FLIGHT_FILE, null),
  setFlightData: (data) => writeJSON(FLIGHT_FILE, data),

  getChanges: () => readJSON(CHANGES_FILE, []),
  addChanges: (newChanges) => {
    const existing = readJSON(CHANGES_FILE, []);
    const merged = [...newChanges, ...existing];
    if (merged.length > 200) merged.length = 200;
    writeJSON(CHANGES_FILE, merged);
  },

  getEmailSubscribers: () => readJSON(SUBSCRIBERS_FILE, []),
  addEmailSubscriber: (email) => {
    const subs = readJSON(SUBSCRIBERS_FILE, []);
    const norm = email.trim().toLowerCase();
    if (!subs.includes(norm)) {
      subs.push(norm);
      writeJSON(SUBSCRIBERS_FILE, subs);
      return true;
    }
    return false;
  },
  removeEmailSubscriber: (email) => {
    const subs = readJSON(SUBSCRIBERS_FILE, []);
    writeJSON(SUBSCRIBERS_FILE, subs.filter(e => e !== email.trim().toLowerCase()));
  },

  getPushSubscribers: () => readJSON(PUSH_SUBS_FILE, []),
  addPushSubscriber: (sub) => {
    const subs = readJSON(PUSH_SUBS_FILE, []);
    if (!subs.some(s => s.endpoint === sub.endpoint)) {
      subs.push(sub);
      writeJSON(PUSH_SUBS_FILE, subs);
    }
  },
  removePushSubscriber: (endpoint) => {
    const subs = readJSON(PUSH_SUBS_FILE, []);
    writeJSON(PUSH_SUBS_FILE, subs.filter(s => s.endpoint !== endpoint));
  },
};
