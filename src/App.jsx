import React, { useState, useEffect, useCallback } from 'react';
import {
  Plane, RefreshCw, Clock, AlertTriangle, XCircle,
  Navigation, CheckCircle2, ChevronDown, ChevronUp,
  Wifi, WifiOff, Mail, Info,
} from 'lucide-react';

// ── Data source ───────────────────────────────────────────────────────────────
// In dev: served from public/data/ by Vite
// In prod: fetched from GitHub raw content (always the latest committed file)
const GITHUB_REPO   = import.meta.env.VITE_GITHUB_REPO   || 'rosamir/tsua-demo';
const GITHUB_BRANCH = import.meta.env.VITE_GITHUB_BRANCH || 'main';

const DATA_BASE = import.meta.env.DEV
  ? `${import.meta.env.BASE_URL}data`
  : `https://raw.githubusercontent.com/${GITHUB_REPO}/${GITHUB_BRANCH}/public/data`;

async function fetchJSON(filename) {
  const url = `${DATA_BASE}/${filename}?t=${Date.now()}`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${filename}`);
  return res.json();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString('he-IL', {
      hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem',
    });
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

function delayLabel(scheduled, estimated) {
  if (!scheduled || !estimated) return null;
  const diff = Math.round((new Date(estimated) - new Date(scheduled)) / 60000);
  if (diff === 0) return null;
  return diff > 0 ? `+${diff} דק'` : `${diff} דק'`;
}

function statusConfig(status) {
  const s = (status || '').toUpperCase();
  if (s === 'A' || s === 'ACTIVE')      return { color: 'text-sky-400',   bg: 'bg-sky-900/40',   border: 'border-sky-700',   icon: Navigation    };
  if (s === 'L' || s === 'LANDED')      return { color: 'text-green-400', bg: 'bg-green-900/40', border: 'border-green-700', icon: CheckCircle2  };
  if (s === 'C' || s === 'CANCELLED')   return { color: 'text-red-400',   bg: 'bg-red-900/40',   border: 'border-red-700',   icon: XCircle       };
  if (s === 'D' || s === 'DELAYED')     return { color: 'text-amber-400', bg: 'bg-amber-900/40', border: 'border-amber-700', icon: AlertTriangle  };
  return                                       { color: 'text-blue-300',  bg: 'bg-blue-900/40',  border: 'border-blue-800',  icon: Clock          };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex justify-center items-center py-16">
      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function TimeCard({ label, iata, cityHe, scheduled, estimated, actual }) {
  const display = actual || estimated || scheduled;
  const delay   = delayLabel(scheduled, estimated || actual);
  return (
    <div className="flex-1 text-center">
      <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mb-1">{label}</div>
      <div className="text-3xl font-black text-white tracking-tight leading-none">{fmtTime(display)}</div>
      <div className="text-sm font-bold text-slate-300 mt-1">{iata}</div>
      <div className="text-xs text-slate-500">{cityHe}</div>
      {delay && (
        <div className={`text-xs font-bold mt-1 ${delay.startsWith('+') ? 'text-amber-400' : 'text-green-400'}`}>
          {delay}
        </div>
      )}
    </div>
  );
}

function DetailGrid({ flight }) {
  const tiles = [
    flight?.departure?.terminal && { label: 'טרמינל יציאה',  value: flight.departure.terminal },
    flight?.departure?.gate     && { label: 'שער יציאה',      value: flight.departure.gate     },
    flight?.arrival?.terminal   && { label: 'טרמינל הגעה',   value: flight.arrival.terminal   },
    flight?.arrival?.gate       && { label: 'שער הגעה',       value: flight.arrival.gate       },
    flight?.aircraft?.type      && { label: 'מטוס',           value: flight.aircraft.type      },
    flight?.duration            && { label: 'משך טיסה',       value: `${flight.duration} דק'`  },
  ].filter(Boolean);

  if (!tiles.length) return null;

  return (
    <div className="grid grid-cols-2 gap-2 mt-3">
      {tiles.map(({ label, value }) => (
        <div key={label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
          <div className="text-[10px] text-slate-500 mb-0.5">{label}</div>
          <div className="text-sm font-bold text-white">{value}</div>
        </div>
      ))}
    </div>
  );
}

function ChangeItem({ change }) {
  const fmt = (field, val) => {
    if (val == null) return 'לא ידוע';
    if (field.includes('scheduled') || field.includes('estimated') || field.includes('actual')) return fmtTime(val);
    return String(val);
  };
  return (
    <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-slate-500">{fmtDateTime(change.timestamp)}</span>
        <span className="text-[11px] font-bold text-blue-400 bg-blue-900/40 px-2 py-0.5 rounded-full">{change.label}</span>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <span className="text-red-400 line-through">{fmt(change.field, change.from)}</span>
        <span className="text-slate-500">→</span>
        <span className="text-green-400 font-bold">{fmt(change.field, change.to)}</span>
      </div>
    </div>
  );
}

function NotificationsInfo() {
  return (
    <div className="mx-4 mt-3 bg-slate-800/50 border border-slate-700/60 rounded-3xl p-4">
      <div className="flex items-start gap-2">
        <Mail size={15} className="text-blue-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-bold text-white mb-1">התראות מייל</p>
          <p className="text-xs text-slate-400 leading-relaxed">
            מוגדרות דרך GitHub Secrets.
            כל שינוי בטיסה ישלח אוטומטית מייל לכתובות שהוגדרו.
          </p>
        </div>
      </div>
    </div>
  );
}

function MockBanner({ isMock }) {
  if (!isMock) return null;
  return (
    <div className="mx-4 mb-3 flex items-start gap-2 bg-amber-900/30 border border-amber-700/40 rounded-2xl p-3">
      <Info size={13} className="text-amber-400 mt-0.5 shrink-0" />
      <p className="text-xs text-amber-300">
        ממתין לנתונים אמיתיים מ-FlightStats. GitHub Actions יעדכן בקרוב.
      </p>
    </div>
  );
}

function LastUpdated({ ts }) {
  if (!ts) return null;
  return (
    <p className="text-center text-[11px] text-slate-600 mt-4 mb-2 px-4">
      עודכן לאחרונה:{' '}
      {ts.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      {' · '}מתרענן אוטומטית כל 5 דק'
    </p>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [flight,      setFlight]      = useState(null);
  const [changes,     setChanges]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [error,       setError]       = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [tab,         setTab]         = useState('status');
  const [histOpen,    setHistOpen]    = useState(true);
  const [toast,       setToast]       = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const loadData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    try {
      const [f, c] = await Promise.all([
        fetchJSON('flight.json'),
        fetchJSON('changes.json'),
      ]);
      setFlight(f);
      setChanges(c);
      setLastUpdated(new Date());
      setError(null);
      if (manual) showToast('עודכן בהצלחה');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load + auto-refresh every 5 minutes
  useEffect(() => {
    loadData();
    const id = setInterval(() => loadData(), 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [loadData]);

  const sc          = statusConfig(flight?.status);
  const StatusIcon  = sc.icon;
  const badgeCount  = changes.length ? ` (${changes.length})` : '';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center py-8 px-4" dir="rtl">

      {/* Phone frame */}
      <div
        className="w-full max-w-[390px] bg-slate-900 rounded-[2.5rem] border-[8px] border-slate-800 shadow-2xl shadow-black/70 overflow-hidden relative flex flex-col"
        style={{ minHeight: 780 }}
      >
        {/* Status bar */}
        <div className="flex justify-between items-center px-6 pt-3 pb-1 shrink-0">
          <span className="text-[11px] font-bold text-slate-400">
            {new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="w-24 h-6 bg-slate-800 rounded-b-xl absolute left-1/2 -translate-x-1/2 top-0" />
          {error
            ? <WifiOff size={13} className="text-red-500" />
            : <Wifi    size={13} className="text-slate-400" />
          }
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-3 shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[11px] text-slate-500 font-semibold tracking-widest uppercase">ארקיע · IZ152</div>
              <h1 className="text-[22px] font-black text-white leading-tight">מעקב טיסה</h1>
              <div className="text-xs text-slate-500">פאפוס ← תל אביב · 3.5.2026</div>
            </div>
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 p-2.5 rounded-2xl transition-colors disabled:opacity-50 mt-1"
            >
              <RefreshCw size={17} className={`text-slate-300 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-4 mb-3 flex items-start gap-2 bg-red-900/40 border border-red-800 rounded-2xl p-3 shrink-0">
            <WifiOff size={13} className="text-red-400 mt-0.5 shrink-0" />
            <p className="text-xs text-red-300">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex mx-4 mb-3 bg-slate-800/60 rounded-2xl p-1 gap-1 shrink-0">
          {[
            { id: 'status',  label: 'סטטוס',                    icon: Plane  },
            { id: 'history', label: `היסטוריה${badgeCount}`,    icon: Clock  },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition-all ${
                tab === id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pb-6">
          {loading ? <Spinner /> : tab === 'status' ? (
            <>
              {/* Status badge */}
              {flight && (
                <div className={`mx-4 flex items-center gap-2 ${sc.bg} border ${sc.border} rounded-2xl px-4 py-3 mb-3`}>
                  <StatusIcon size={17} className={sc.color} />
                  <span className={`font-black text-base ${sc.color}`}>{flight.statusHe || flight.status}</span>
                </div>
              )}

              {/* Flight card */}
              {flight ? (
                <div className="mx-4 bg-slate-800/60 border border-slate-700 rounded-3xl p-5 mb-3">
                  <div className="flex items-center gap-2">
                    <TimeCard
                      label="המראה"
                      iata={flight.departure?.iata}
                      cityHe={flight.departure?.cityHe}
                      scheduled={flight.departure?.scheduled}
                      estimated={flight.departure?.estimated}
                      actual={flight.departure?.actual}
                    />
                    <div className="flex flex-col items-center px-1">
                      <div className="w-px h-6 bg-slate-700" />
                      <Plane size={18} className="text-blue-400 rotate-90 my-1" />
                      <div className="w-px h-6 bg-slate-700" />
                      {flight.duration && (
                        <span className="text-[9px] text-slate-600 mt-1">{flight.duration}′</span>
                      )}
                    </div>
                    <TimeCard
                      label="נחיתה"
                      iata={flight.arrival?.iata}
                      cityHe={flight.arrival?.cityHe}
                      scheduled={flight.arrival?.scheduled}
                      estimated={flight.arrival?.estimated}
                      actual={flight.arrival?.actual}
                    />
                  </div>
                  <DetailGrid flight={flight} />
                </div>
              ) : (
                <div className="mx-4 py-8 text-center text-slate-500 text-sm">אין נתוני טיסה</div>
              )}

              <MockBanner isMock={flight?.isMock} />
              <NotificationsInfo />
              <LastUpdated ts={lastUpdated} />
            </>
          ) : (
            /* History tab */
            <div className="mx-4">
              {changes.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle2 size={40} className="text-green-500 mx-auto mb-3" />
                  <p className="font-bold text-white text-lg">אין שינויים</p>
                  <p className="text-slate-500 text-sm mt-1">לא זוהו שינויים מאז תחילת המעקב</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setHistOpen(v => !v)}
                    className="w-full flex items-center justify-between py-2 mb-3"
                  >
                    <span className="text-sm font-bold text-slate-300">{changes.length} שינויים מתועדים</span>
                    {histOpen
                      ? <ChevronUp size={15} className="text-slate-500" />
                      : <ChevronDown size={15} className="text-slate-500" />
                    }
                  </button>
                  {histOpen && (
                    <div className="space-y-3 pb-4">
                      {changes.map((c, i) => <ChangeItem key={c.id || i} change={c} />)}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Toast */}
        {toast && (
          <div className="absolute bottom-6 left-4 right-4 bg-green-700 text-white text-sm font-bold py-3 px-4 rounded-2xl text-center shadow-xl pointer-events-none">
            {toast}
          </div>
        )}
      </div>

      <p className="mt-4 text-[11px] text-slate-700 text-center">
        נתונים מ-FlightStats · מתעדכן ע"י GitHub Actions כל 5 דק'
      </p>
    </div>
  );
}
