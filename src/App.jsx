import React, { useState, useEffect, useCallback } from 'react';
import {
  Plane, RefreshCw, Bell, BellOff, Mail, CheckCircle2,
  Clock, AlertTriangle, XCircle, Navigation, Info,
  ChevronDown, ChevronUp, Wifi, WifiOff, Send,
} from 'lucide-react';

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtTime(iso, tz = 'Asia/Jerusalem') {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: tz });
  } catch { return iso; }
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('he-IL', {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
      timeZone: 'Asia/Jerusalem',
    });
  } catch { return iso; }
}

function timeDiff(a, b) {
  if (!a || !b) return null;
  const diff = Math.round((new Date(b) - new Date(a)) / 60000);
  if (diff === 0) return null;
  return diff > 0 ? `+${diff} דק'` : `${diff} דק'`;
}

function statusConfig(status) {
  const s = (status || '').toUpperCase();
  if (s === 'ACTIVE' || s === 'A')  return { color: 'text-sky-400',   bg: 'bg-sky-900/50',  border: 'border-sky-600',  icon: Navigation };
  if (s === 'LANDED' || s === 'L')  return { color: 'text-green-400', bg: 'bg-green-900/50', border: 'border-green-600', icon: CheckCircle2 };
  if (s === 'CANCELLED' || s === 'C') return { color: 'text-red-400', bg: 'bg-red-900/50',   border: 'border-red-600',   icon: XCircle };
  if (s === 'DELAYED' || s === 'D') return { color: 'text-amber-400', bg: 'bg-amber-900/50', border: 'border-amber-600', icon: AlertTriangle };
  return { color: 'text-blue-300',  bg: 'bg-blue-900/50',  border: 'border-blue-700', icon: Clock };
}

// ── Sub-components ────────────────────────────────────────────────────────────

const Spinner = () => (
  <div className="flex items-center justify-center h-full">
    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

const ErrorBanner = ({ message, onRetry }) => (
  <div className="mx-4 mt-4 p-4 bg-red-900/40 border border-red-700 rounded-2xl flex items-start gap-3">
    <WifiOff size={18} className="text-red-400 mt-0.5 shrink-0" />
    <div className="flex-1">
      <p className="text-red-200 text-sm">{message}</p>
      <button onClick={onRetry} className="mt-2 text-xs text-red-400 underline">נסה שוב</button>
    </div>
  </div>
);

function TimeCard({ label, iata, cityHe, scheduled, estimated, actual, terminal, gate, side }) {
  const display = actual || estimated || scheduled;
  const delay = timeDiff(scheduled, estimated || actual);
  const isDelayed = delay && delay.startsWith('+');

  return (
    <div className={`flex-1 ${side === 'dep' ? 'text-right' : 'text-left'}`}>
      <div className="text-xs text-slate-500 font-medium mb-1">{label}</div>
      <div className="text-3xl font-black text-white tracking-tight">{fmtTime(display)}</div>
      <div className="text-sm font-bold text-slate-300 mt-0.5">{iata}</div>
      <div className="text-xs text-slate-500">{cityHe}</div>
      {delay && (
        <div className={`text-xs font-bold mt-1 ${isDelayed ? 'text-amber-400' : 'text-green-400'}`}>
          {delay}
        </div>
      )}
      {(terminal || gate) && (
        <div className="text-xs text-slate-500 mt-1">
          {terminal && <span>טרמינל {terminal}</span>}
          {terminal && gate && ' · '}
          {gate && <span>שער {gate}</span>}
        </div>
      )}
    </div>
  );
}

function ChangeItem({ change }) {
  const formatVal = (field, val) => {
    if (val === null || val === undefined) return 'לא ידוע';
    if (field.includes('scheduled') || field.includes('estimated') || field.includes('actual')) {
      return fmtTime(val);
    }
    return String(val);
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-xs text-slate-500">{fmtDateTime(change.timestamp)}</span>
        <span className="text-xs font-bold text-blue-400 bg-blue-900/40 px-2 py-0.5 rounded-full">{change.label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-red-400 line-through">{formatVal(change.field, change.from)}</span>
        <span className="text-slate-500 text-sm">→</span>
        <span className="text-sm font-bold text-green-400">{formatVal(change.field, change.to)}</span>
      </div>
    </div>
  );
}

function EmailSubscription({ onNotify }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [msg, setMsg] = useState('');
  const [testEmail, setTestEmail] = useState('');
  const [testStatus, setTestStatus] = useState(null);
  const [showTest, setShowTest] = useState(false);

  async function subscribe(e) {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/subscribe/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.ok) {
        setStatus('ok');
        setMsg(data.message);
        onNotify?.(data.message);
      } else {
        setStatus('error');
        setMsg(data.error || 'שגיאה');
      }
    } catch {
      setStatus('error');
      setMsg('שגיאת חיבור');
    }
  }

  async function sendTest(e) {
    e.preventDefault();
    if (!testEmail) return;
    setTestStatus('loading');
    try {
      const res = await fetch('/api/test-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });
      const data = await res.json();
      setTestStatus(data.ok ? 'ok' : 'error');
    } catch {
      setTestStatus('error');
    }
  }

  return (
    <div className="mx-4 mt-4 bg-slate-800/60 border border-slate-700 rounded-3xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <Mail size={18} className="text-blue-400" />
        <h3 className="font-bold text-white text-sm">התראות מייל</h3>
      </div>

      {status === 'ok' ? (
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <CheckCircle2 size={16} />
          <span>{msg}</span>
        </div>
      ) : (
        <form onSubmit={subscribe} className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="הכנס כתובת מייל..."
            className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-right"
            dir="rtl"
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors"
          >
            {status === 'loading' ? '...' : 'הרשם'}
          </button>
        </form>
      )}

      {status === 'error' && <p className="text-red-400 text-xs mt-2">{msg}</p>}

      {/* Test notification toggle */}
      <button
        onClick={() => setShowTest(v => !v)}
        className="mt-3 text-xs text-slate-500 hover:text-slate-400 flex items-center gap-1 transition-colors"
      >
        <Send size={11} />
        {showTest ? 'הסתר בדיקה' : 'שלח התראת בדיקה'}
      </button>

      {showTest && (
        <form onSubmit={sendTest} className="mt-2 flex gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={e => setTestEmail(e.target.value)}
            placeholder="מייל לבדיקה..."
            className="flex-1 bg-slate-900 border border-slate-600 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-right"
            dir="rtl"
          />
          <button
            type="submit"
            disabled={testStatus === 'loading'}
            className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
          >
            {testStatus === 'loading' ? '...' : testStatus === 'ok' ? '✓' : 'שלח'}
          </button>
        </form>
      )}
    </div>
  );
}

function PushSubscription() {
  const [state, setState] = useState('idle'); // idle | requesting | enabled | error | unsupported
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
    }
  }, []);

  async function requestPush() {
    setState('requesting');
    try {
      const vapidRes = await fetch('/api/vapid-public-key');
      if (!vapidRes.ok) { setState('error'); setMsg('Push לא מוגדר בשרת'); return; }
      const { key } = await vapidRes.json();

      const perm = await Notification.requestPermission();
      if (perm !== 'granted') { setState('error'); setMsg('הרשאה נדחתה'); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(key),
      });

      await fetch('/api/subscribe/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });

      setState('enabled');
    } catch (e) {
      setState('error');
      setMsg(e.message);
    }
  }

  if (state === 'unsupported') return null;

  return (
    <div className="mx-4 mt-3 bg-slate-800/60 border border-slate-700 rounded-3xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {state === 'enabled' ? <Bell size={16} className="text-green-400" /> : <BellOff size={16} className="text-slate-400" />}
          <div>
            <p className="text-sm font-bold text-white">התראות Push</p>
            <p className="text-xs text-slate-500">
              {state === 'enabled' ? 'פעיל — תקבל התראות על שינויים' :
               state === 'error' ? msg :
               'קבל התראות ישירות לטלפון'}
            </p>
          </div>
        </div>
        {state !== 'enabled' && (
          <button
            onClick={requestPush}
            disabled={state === 'requesting'}
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold disabled:opacity-50 transition-colors"
          >
            {state === 'requesting' ? '...' : 'הפעל'}
          </button>
        )}
        {state === 'enabled' && <CheckCircle2 size={18} className="text-green-400" />}
      </div>
    </div>
  );
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return new Uint8Array([...raw].map(c => c.charCodeAt(0)));
}

// ── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [flight, setFlight] = useState(null);
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [tab, setTab] = useState('status');
  const [toast, setToast] = useState(null);
  const [historyExpanded, setHistoryExpanded] = useState(true);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const res = await fetch('/api/flight');
      if (!res.ok) throw new Error(`שגיאת שרת ${res.status}`);
      const data = await res.json();
      setFlight(data.flight);
      setChanges(data.changes || []);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleManualRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/refresh', { method: 'POST' });
      const data = await res.json();
      setFlight(data.flight);
      setChanges(data.changes || []);
      setLastUpdated(new Date());
      setError(null);
      showToast('עודכן בהצלחה');
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  };

  const sc = statusConfig(flight?.status);
  const StatusIcon = sc.icon;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start py-8 px-4" dir="rtl">

      {/* Phone frame */}
      <div className="w-full max-w-[390px] bg-slate-900 rounded-[2.5rem] border-[8px] border-slate-800 shadow-2xl shadow-black/60 overflow-hidden relative" style={{ minHeight: 780 }}>

        {/* Status bar */}
        <div className="flex justify-between items-center px-6 pt-3 pb-1">
          <span className="text-[11px] font-bold text-slate-400">
            {new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="w-24 h-6 bg-slate-800 rounded-b-xl absolute left-1/2 -translate-x-1/2 top-0" />
          <Wifi size={14} className="text-slate-400" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500 font-medium tracking-widest uppercase">ארקיע · IZ152</div>
              <h1 className="text-2xl font-black text-white tracking-tight">מעקב טיסה</h1>
              <div className="text-xs text-slate-500">
                פאפוס ← תל אביב · 3.5.2026
              </div>
            </div>
            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-3 rounded-2xl transition-colors disabled:opacity-50"
              title="רענן נתונים"
            >
              <RefreshCw size={18} className={`text-slate-300 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mx-4 mb-4 bg-slate-800/60 rounded-2xl p-1 gap-1">
          {[
            { id: 'status', label: 'סטטוס', icon: Plane },
            { id: 'history', label: `היסטוריה${changes.length ? ` (${changes.length})` : ''}`, icon: Clock },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="overflow-y-auto pb-10" style={{ maxHeight: 580 }}>
          {loading ? (
            <div style={{ height: 300 }}><Spinner /></div>
          ) : error ? (
            <>
              <ErrorBanner message={error} onRetry={() => loadData(true)} />
              {flight && <FlightStatus flight={flight} sc={sc} StatusIcon={StatusIcon} />}
            </>
          ) : tab === 'status' ? (
            <>
              <FlightStatus flight={flight} sc={sc} StatusIcon={StatusIcon} />
              <MockBanner isMock={flight?.isMock} />
              <EmailSubscription onNotify={showToast} />
              <PushSubscription />
              <LastUpdated ts={lastUpdated} />
            </>
          ) : (
            <HistoryTab changes={changes} expanded={historyExpanded} onToggle={() => setHistoryExpanded(v => !v)} />
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className="absolute bottom-8 left-4 right-4 bg-green-700 text-white text-sm font-bold py-3 px-4 rounded-2xl text-center shadow-xl animate-fade-in">
            {toast}
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-600">Powered by FlightStats · מתעדכן כל 5 דקות</p>
    </div>
  );
}

function FlightStatus({ flight, sc, StatusIcon }) {
  if (!flight) return (
    <div className="mx-4 p-6 text-center text-slate-500 text-sm">
      לא נמצאו נתוני טיסה. ודא שהשרת פועל.
    </div>
  );

  const depTime = flight.departure?.actual || flight.departure?.estimated || flight.departure?.scheduled;
  const arrTime = flight.arrival?.actual || flight.arrival?.estimated || flight.arrival?.scheduled;

  return (
    <div className="mx-4">
      {/* Status badge */}
      <div className={`flex items-center gap-2 ${sc.bg} border ${sc.border} rounded-2xl px-4 py-3 mb-4`}>
        <StatusIcon size={18} className={sc.color} />
        <span className={`font-black text-base ${sc.color}`}>{flight.statusHe || flight.status}</span>
        {flight.isMock && <span className="text-xs text-slate-500 mr-auto">מידע לדוגמה</span>}
      </div>

      {/* Main flight card */}
      <div className="bg-slate-800/60 border border-slate-700 rounded-3xl p-5 mb-4">
        <div className="flex items-start gap-3">
          <TimeCard
            label="המראה"
            iata={flight.departure?.iata}
            cityHe={flight.departure?.cityHe}
            scheduled={flight.departure?.scheduled}
            estimated={flight.departure?.estimated}
            actual={flight.departure?.actual}
            terminal={flight.departure?.terminal}
            gate={flight.departure?.gate}
            side="dep"
          />

          {/* Plane icon in center */}
          <div className="flex flex-col items-center pt-6 px-2">
            <div className="w-px h-4 bg-slate-700" />
            <Plane size={20} className="text-blue-400 rotate-90 my-1" />
            <div className="w-px h-4 bg-slate-700" />
            {flight.duration && (
              <span className="text-[10px] text-slate-500 mt-1">{flight.duration}′</span>
            )}
          </div>

          <TimeCard
            label="נחיתה"
            iata={flight.arrival?.iata}
            cityHe={flight.arrival?.cityHe}
            scheduled={flight.arrival?.scheduled}
            estimated={flight.arrival?.estimated}
            actual={flight.arrival?.actual}
            terminal={flight.arrival?.terminal}
            gate={flight.arrival?.gate}
            side="arr"
          />
        </div>
      </div>

      {/* Details row */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <DetailTile label="מטוס" value={flight.aircraft?.type || '—'} />
        <DetailTile label="מזהה טיסה" value={flight.flightId || '—'} />
        {flight.departure?.terminal && <DetailTile label="טרמינל יציאה" value={flight.departure.terminal} />}
        {flight.arrival?.terminal && <DetailTile label="טרמינל הגעה" value={flight.arrival.terminal} />}
      </div>
    </div>
  );
}

function DetailTile({ label, value }) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-3">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-sm font-bold text-white">{value}</div>
    </div>
  );
}

function MockBanner({ isMock }) {
  if (!isMock) return null;
  return (
    <div className="mx-4 mb-3 flex items-start gap-2 bg-amber-900/30 border border-amber-700/50 rounded-2xl p-3">
      <Info size={14} className="text-amber-400 mt-0.5 shrink-0" />
      <p className="text-xs text-amber-300">
        השרת לא הצליח להגיע ל-FlightStats. מוצגים נתוני דוגמה. ודא שהשרת פועל ויש גישה לאינטרנט.
      </p>
    </div>
  );
}

function HistoryTab({ changes, expanded, onToggle }) {
  if (changes.length === 0) {
    return (
      <div className="mx-4 py-12 text-center">
        <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
        <p className="font-bold text-white text-lg">אין שינויים</p>
        <p className="text-slate-500 text-sm mt-1">לא זוהו שינויים מאז תחילת המעקב</p>
      </div>
    );
  }

  return (
    <div className="mx-4">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-2 mb-3"
      >
        <span className="text-sm font-bold text-slate-300">{changes.length} שינויים מתועדים</span>
        {expanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
      </button>

      {expanded && (
        <div className="space-y-3 pb-4">
          {changes.map((c, i) => <ChangeItem key={c.id || i} change={c} />)}
        </div>
      )}
    </div>
  );
}

function LastUpdated({ ts }) {
  if (!ts) return null;
  return (
    <p className="text-center text-xs text-slate-600 mt-4 mb-2">
      עודכן לאחרונה: {ts.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </p>
  );
}
