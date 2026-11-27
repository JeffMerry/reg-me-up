import { useEffect, useRef, useState } from 'react';

type Row = { registrationId: string; displayName: string; registeredAt: string; attendance: { id: string; checkedInAt: string } | null };
type Roster = {
  data: { event: { id: string; title: string; startsAt: string; endsAt: string }; serverNow: string; window: 'OPEN' | 'NOT_OPEN' | 'CLOSED'; summary: { activeRegistrations: number; attended: number }; registrations: Row[] };
  meta: { page: number; pageSize: number; total: number };
};
const button = 'min-h-11 rounded-lg bg-orange-700 px-4 py-2 font-semibold text-white hover:bg-orange-800 disabled:opacity-50';
const link = 'min-h-11 py-2 font-semibold text-orange-800 underline disabled:opacity-50';
const dateFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' });

export function CheckInView({ eventId, expireSession }: { eventId: string; expireSession: (path: string) => void }) {
  const [roster, setRoster] = useState<Roster | null>(null);
  const [state, setState] = useState<'loading' | 'error' | 'missing' | 'ok'>('loading');
  const [page, setPage] = useState(1), [retry, setRetry] = useState(0);
  const [pending, setPending] = useState(false), [blocked, setBlocked] = useState(false), [message, setMessage] = useState('');
  const alive = useRef(false), writing = useRef(false);
  const path = `/organizer/events/${eventId}/check-ins`;
  const endpoint = `/api/organizer/events/${encodeURIComponent(eventId)}/check-ins`;
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  useEffect(() => {
    const controller = new AbortController(); setState('loading'); setRoster(null);
    void (async () => {
      try {
        const response = await fetch(`${endpoint}?page=${page}`, { cache: 'no-store', signal: controller.signal });
        if (controller.signal.aborted) return;
        if (response.status === 401) { expireSession(path); return; }
        if ([403, 404, 422].includes(response.status)) { setMessage(''); setState('missing'); return; }
        if (!response.ok) throw new Error();
        const result = await response.json() as Roster;
        if (controller.signal.aborted) return;
        setRoster(result); setState('ok'); setBlocked(false);
      } catch { if (!controller.signal.aborted) setState('error'); }
    })();
    return () => controller.abort();
  }, [eventId, page, retry]);

  useEffect(() => {
    if (!roster || pending || blocked || roster.data.window === 'CLOSED') return;
    const next = Date.parse(roster.data.window === 'NOT_OPEN' ? roster.data.event.startsAt : roster.data.event.endsAt) - Date.parse(roster.data.serverNow);
    const timer = window.setTimeout(() => setRetry(value => value + 1), Math.min(Math.max(next + 20, 20), 2147483647));
    return () => window.clearTimeout(timer);
  }, [roster, pending, blocked]);

  async function checkIn(row: Row) {
    if (!roster || roster.data.window !== 'OPEN' || row.attendance || blocked || writing.current) return;
    if (!window.confirm(`Check in ${row.displayName} for ${roster.data.event.title}? This attendance cannot be undone.`)) return;
    writing.current = true; setPending(true); setMessage('');
    try {
      const bootstrap = await fetch('/api/auth/csrf', { cache: 'no-store' });
      if (!alive.current) return;
      if (!bootstrap.ok) throw new Error();
      const token = (await bootstrap.json()).data.csrfToken as string;
      if (!alive.current) return;
      const response = await fetch(`/api/organizer/events/${encodeURIComponent(eventId)}/registrations/${encodeURIComponent(row.registrationId)}/check-in`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token }, body: '{}' });
      if (!alive.current) return;
      if (response.status === 401) { setRoster(null); expireSession(path); return; }
      if (response.status === 403 || response.status === 404) { setRoster(null); setState('missing'); return; }
      const result = await response.json();
      if (!alive.current) return;
      if (response.status === 409) {
        const messages: Record<string, string> = { CHECK_IN_NOT_OPEN: 'Check-in is not open yet.', CHECK_IN_CLOSED: 'Check-in has closed.', REGISTRATION_INELIGIBLE: 'This registration is no longer eligible.' };
        setMessage(messages[result.error?.code] ?? 'This registration changed. Check status before trying again.'); setBlocked(true); return;
      }
      if (!response.ok || !result.data?.id) throw new Error();
      setMessage('Check-in saved.'); setRetry(value => value + 1);
    } catch {
      if (alive.current) { setBlocked(true); setMessage('We could not confirm check-in. Check status before trying again.'); }
    } finally { writing.current = false; if (alive.current) setPending(false); }
  }

  return <>
    <a className={link} href="/organizer/events">My Events</a>
    <h1 className="mt-4 text-3xl font-bold">Event check-in</h1>
    {message && <p className="mt-4" role={blocked ? 'alert' : 'status'}>{message}</p>}
    {state === 'loading' && <p className="mt-5" role="status">Loading check-in roster…</p>}
    {state === 'error' && <div className="mt-5"><p role="alert">Unable to load the check-in roster.</p><button className={link} onClick={() => setRetry(value => value + 1)}>Try again</button></div>}
    {state === 'missing' && <p className="mt-5" role="alert">Event not found.</p>}
    {state === 'ok' && roster && <>
      <section className="mt-5 rounded-2xl bg-white p-5 shadow">
        <h2 className="text-xl font-bold">{roster.data.event.title}</h2>
        <p className="mt-2">{dateFormat.format(new Date(roster.data.event.startsAt))} – {dateFormat.format(new Date(roster.data.event.endsAt))} (Thailand time, UTC+7)</p>
        <p className="mt-3 font-semibold">{roster.data.window === 'OPEN' ? 'Check-in is open.' : roster.data.window === 'NOT_OPEN' ? 'Check-in is not open yet.' : 'Check-in has closed.'}</p>
        <p className="mt-2">Active registrations: {roster.data.summary.activeRegistrations} · Checked in: {roster.data.summary.attended}</p>
        <button className={link} disabled={pending} onClick={() => { setMessage(''); setRetry(value => value + 1); }}>Check status</button>
      </section>
      {roster.data.registrations.length === 0 ? <p className="mt-5">No active registrations.</p> : <ul className="mt-5 grid gap-4">{roster.data.registrations.map(row => <li key={row.registrationId} className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5 shadow">
        <div className="min-w-0 break-words"><h3 className="font-bold">{row.displayName}</h3>{row.attendance ? <p className="mt-2">Checked in: <time dateTime={row.attendance.checkedInAt}>{dateFormat.format(new Date(row.attendance.checkedInAt))} (Thailand time, UTC+7)</time></p> : <p className="mt-2">Not checked in</p>}</div>
        {!row.attendance && <button className={button} aria-label={`Check in ${row.displayName}`} disabled={pending || blocked || roster.data.window !== 'OPEN'} onClick={() => void checkIn(row)}>{pending ? 'Saving…' : 'Check in'}</button>}
      </li>)}</ul>}
      {roster.meta.total > roster.meta.pageSize && <div className="mt-5 flex flex-wrap items-center gap-4"><button className={link} disabled={pending || blocked || page <= 1} onClick={() => { setMessage(''); setPage(value => value - 1); }}>Previous</button><span>Page {roster.meta.page}</span><button className={link} disabled={pending || blocked || page * roster.meta.pageSize >= roster.meta.total} onClick={() => { setMessage(''); setPage(value => value + 1); }}>Next</button></div>}
    </>}
  </>;
}
