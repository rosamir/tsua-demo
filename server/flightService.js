const axios = require('axios');

const FLIGHT_URL = 'https://www.flightstats.com/v2/flight-tracker/IZ/152?year=2026&month=05&date=03&flightId=1381306131';
const API_URL = 'https://www.flightstats.com/v2/api-next/flight-tracker/other-days/IZ/152?year=2026&month=5&date=3';

// Fallback mock — used when FlightStats is unreachable
const MOCK_DATA = {
  flightNumber: 'IZ152',
  airline: 'ארקיע',
  airlineEn: 'Arkia Israeli Airlines',
  flightId: '1381306131',
  status: 'SCHEDULED',
  statusHe: 'מתוכנן',
  departure: {
    airport: 'Paphos International Airport',
    iata: 'PFO',
    cityHe: 'פאפוס',
    country: 'Cyprus',
    scheduled: '2026-05-03T07:50:00+03:00',
    estimated: '2026-05-03T07:50:00+03:00',
    actual: null,
    terminal: null,
    gate: null,
  },
  arrival: {
    airport: 'Ben Gurion International Airport',
    iata: 'TLV',
    cityHe: 'תל אביב',
    country: 'Israel',
    scheduled: '2026-05-03T09:30:00+03:00',
    estimated: '2026-05-03T09:30:00+03:00',
    actual: null,
    terminal: '3',
    gate: null,
  },
  duration: 100,
  aircraft: { type: 'ATR 72-600', registration: null },
  isMock: true,
};

function getStatusHe(code) {
  const map = {
    'S': 'מתוכנן', 'A': 'בטיסה', 'L': 'נחת', 'D': 'הוסט',
    'C': 'בוטל', 'NO': 'לא המריא', 'R': 'הופנה',
    'SCHEDULED': 'מתוכנן', 'ACTIVE': 'בטיסה', 'LANDED': 'נחת',
    'CANCELLED': 'בוטל', 'DIVERTED': 'הוסט', 'DELAYED': 'מאחר',
    'ON_TIME': 'בזמן',
  };
  return map[code] || code;
}

function parseFlightFromNextData(nextData) {
  try {
    const pp = nextData?.props?.pageProps;
    // Try various possible structure paths FlightStats has used over time
    const raw =
      pp?.flightData ||
      pp?.initialData?.flightData ||
      pp?.dehydratedState?.queries?.[0]?.state?.data ||
      null;

    if (!raw) return null;

    const flights = raw.flights || raw.flight ? [raw.flight] : [];
    const flight = Array.isArray(flights) ? flights[0] : flights;
    if (!flight) return null;

    const airports = raw.airports || {};
    const depAp = airports[flight.departureAirportFsCode] || {};
    const arrAp = airports[flight.arrivalAirportFsCode] || {};

    const statusCode = flight.status || flight.flightStatus || 'S';

    return {
      flightNumber: `IZ${flight.flightNumber || '152'}`,
      airline: 'ארקיע',
      airlineEn: 'Arkia Israeli Airlines',
      flightId: String(flight.flightId || '1381306131'),
      status: statusCode,
      statusHe: getStatusHe(statusCode),
      departure: {
        airport: depAp.name || 'Paphos International Airport',
        iata: flight.departureAirportFsCode || 'PFO',
        cityHe: 'פאפוס',
        country: depAp.countryName || 'Cyprus',
        scheduled: flight.scheduledGateDeparture || flight.publishedDeparture || null,
        estimated: flight.estimatedGateDeparture || flight.scheduledGateDeparture || null,
        actual: flight.actualGateDeparture || null,
        terminal: flight.departureTerminal || null,
        gate: flight.departureGate || null,
      },
      arrival: {
        airport: arrAp.name || 'Ben Gurion International Airport',
        iata: flight.arrivalAirportFsCode || 'TLV',
        cityHe: 'תל אביב',
        country: arrAp.countryName || 'Israel',
        scheduled: flight.scheduledGateArrival || flight.publishedArrival || null,
        estimated: flight.estimatedGateArrival || flight.scheduledGateArrival || null,
        actual: flight.actualGateArrival || null,
        terminal: flight.arrivalTerminal || null,
        gate: flight.arrivalGate || null,
      },
      duration: flight.flightDuration || null,
      aircraft: {
        type: flight.flightEquipmentIataCode || null,
        registration: flight.tailNumber || null,
      },
      isMock: false,
    };
  } catch (e) {
    console.error('parseFlightFromNextData error:', e.message);
    return null;
  }
}

async function fetchFromHtml() {
  const resp = await axios.get(FLIGHT_URL, {
    timeout: 20000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Samsung Galaxy S24) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
    },
  });

  const html = resp.data;
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
  if (!match) throw new Error('__NEXT_DATA__ not found in HTML');

  const nextData = JSON.parse(match[1]);
  return parseFlightFromNextData(nextData);
}

async function fetchFromApi() {
  const resp = await axios.get(API_URL, {
    timeout: 15000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible)',
      'Accept': 'application/json',
      'Referer': 'https://www.flightstats.com/',
    },
  });
  if (resp.data && typeof resp.data === 'object') {
    // Wrap in a fake pageProps shape so parseFlightFromNextData can handle it
    return parseFlightFromNextData({ props: { pageProps: { flightData: resp.data } } });
  }
  return null;
}

async function fetchFlightData() {
  // Try HTML scraping first, then API endpoint, then mock
  try {
    const data = await fetchFromHtml();
    if (data) {
      console.log('[Flight] Fetched from FlightStats HTML');
      return data;
    }
  } catch (e) {
    console.warn('[Flight] HTML fetch failed:', e.message);
  }

  try {
    const data = await fetchFromApi();
    if (data) {
      console.log('[Flight] Fetched from FlightStats API');
      return data;
    }
  } catch (e) {
    console.warn('[Flight] API fetch failed:', e.message);
  }

  console.warn('[Flight] Using mock data');
  return { ...MOCK_DATA, fetchedAt: new Date().toISOString() };
}

// Compare two flight objects and return array of change descriptors
function detectChanges(oldData, newData) {
  if (!oldData) return [];

  const FIELDS = [
    { path: 'status',                   label: 'סטטוס טיסה' },
    { path: 'departure.scheduled',      label: 'זמן יציאה מתוכנן' },
    { path: 'departure.estimated',      label: 'זמן יציאה משוער' },
    { path: 'departure.actual',         label: 'זמן יציאה בפועל' },
    { path: 'departure.gate',           label: 'שער יציאה' },
    { path: 'departure.terminal',       label: 'טרמינל יציאה' },
    { path: 'arrival.scheduled',        label: 'זמן הגעה מתוכנן' },
    { path: 'arrival.estimated',        label: 'זמן הגעה משוער' },
    { path: 'arrival.actual',           label: 'זמן הגעה בפועל' },
    { path: 'arrival.gate',             label: 'שער הגעה' },
    { path: 'arrival.terminal',         label: 'טרמינל הגעה' },
    { path: 'aircraft.type',            label: 'סוג מטוס' },
  ];

  const get = (obj, p) => p.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
  const changes = [];

  for (const { path, label } of FIELDS) {
    const from = get(oldData, path);
    const to = get(newData, path);
    if (String(from ?? '') !== String(to ?? '')) {
      changes.push({
        id: `${Date.now()}-${path}`,
        timestamp: new Date().toISOString(),
        field: path,
        label,
        from: from ?? null,
        to: to ?? null,
      });
    }
  }

  return changes;
}

module.exports = { fetchFlightData, detectChanges };
