import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';

type EventData = { id: string; title: string; startsAt: string; endsAt: string; location: string; capacity: number; remainingSeats: number; description: string | null };
type RegistrationOwn = { id: string; status: 'ACTIVE' | 'CANCELLED'; registeredAt: string; cancelledAt: string | null; participant: { displayName: string }; event: EventData };
const dateFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const dateRange = (event: EventData) => `${dateFormat.format(new Date(event.startsAt))} – ${dateFormat.format(new Date(event.endsAt))} (Thailand time, UTC+7)`;
const button = 'inline-flex min-h-11 items-center justify-center rounded-lg bg-orange-700 px-4 py-2 font-semibold text-white hover:bg-orange-800 disabled:opacity-50';
const link = 'font-semibold text-orange-800 underline';

export function MyRegistrations({ expireSession }: { expireSession: (returnTo: string) => void }) {
  const [page, setPage] = useState(1), [retry, setRetry] = useState(0);
  const [rows, setRows] = useState<RegistrationOwn[]>([]), [total, setTotal] = useState(0);
  const [state, setState] = useState<'loading' | 'error' | 'ok'>('loading');
  const [selected, setSelected] = useState<RegistrationOwn | null>(null);
  const [confirming, setConfirming] = useState(false), [pending, setPending] = useState(false);
  const [uncertain, setUncertain] = useState(false), [checking, setChecking] = useState(false), [closed, setClosed] = useState(false);
  const [message, setMessage] = useState(''), [detailError, setDetailError] = useState('');
  const activeIdRef = useRef<string | null>(null), triggerIdRef = useRef('');
  const readSequence = useRef(0), dialogRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null), cancelRef = useRef<HTMLButtonElement>(null), keepRef = useRef<HTMLButtonElement>(null);
  const alive = useRef(true), expired = useRef(false), wasConfirming = useRef(false);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  function handleExpiredSession(returnTo: string) {
    if (expired.current) return;
    expired.current = true; activeIdRef.current = null; setSelected(null); setRows([]); setTotal(0); expireSession(returnTo);
  }
  useEffect(() => {
    const controller = new AbortController(); setState('loading');
    fetch(`/api/me/registrations?page=${page}`, { cache: 'no-store', signal: controller.signal }).then(async response => {
      if (response.status === 401) { handleExpiredSession('/my-registrations'); return null; }
      if (!response.ok) throw new Error();
      return response.json() as Promise<{ data: RegistrationOwn[]; meta: { total: number } }>;
    }).then(result => { if (!controller.signal.aborted && result) { setRows(result.data); setTotal(result.meta.total); setState('ok'); } })
      .catch(() => { if (!controller.signal.aborted) setState('error'); });
    return () => controller.abort();
  }, [page, retry]);
  async function readDetail(id: string) {
    const sequence = ++readSequence.current;
    activeIdRef.current = id; setChecking(true); setDetailError('');
    try {
      const response = await fetch(`/api/me/registrations/${encodeURIComponent(id)}`, { cache: 'no-store' });
      if (!alive.current || activeIdRef.current !== id || sequence !== readSequence.current) return;
      if (response.status === 401) { handleExpiredSession(`/my-registrations?registrationId=${encodeURIComponent(id)}`); return; }
      if (response.status === 403 || response.status === 404) setSelected(null);
      if (!response.ok) throw new Error();
      const result = (await response.json()).data as RegistrationOwn;
      if (!alive.current || activeIdRef.current !== id || sequence !== readSequence.current) return;
      setSelected(result); setUncertain(false); setConfirming(false); setClosed(false);
      setMessage(result.status === 'CANCELLED' ? 'Registration cancelled.' : 'Registration status checked.');
      setRetry(value => value + 1);
    } catch {
      if (alive.current && activeIdRef.current === id && sequence === readSequence.current) setDetailError('Unable to load registration. Please try again.');
    } finally { if (alive.current && activeIdRef.current === id && sequence === readSequence.current) setChecking(false); }
  }
  useEffect(() => {
    function syncDetail() {
      const id = new URLSearchParams(location.search).get('registrationId');
      activeIdRef.current = id; setSelected(null); setConfirming(false); setMessage(''); setDetailError('');
      if (id) { triggerIdRef.current = `registration-trigger-${id}`; void readDetail(id); }
    }
    syncDetail(); window.addEventListener('popstate', syncDetail);
    return () => { window.removeEventListener('popstate', syncDetail); activeIdRef.current = null; };
  }, []);
  useLayoutEffect(() => { if (selected) closeRef.current?.focus(); else document.getElementById(triggerIdRef.current)?.focus(); }, [selected]);
  useLayoutEffect(() => {
    if (confirming) keepRef.current?.focus();
    else if (wasConfirming.current) (cancelRef.current && !cancelRef.current.disabled ? cancelRef.current : closeRef.current)?.focus();
    wasConfirming.current = confirming;
  }, [confirming]);
  useLayoutEffect(() => { if (pending) dialogRef.current?.focus(); }, [pending]);
  function closeDetail() {
    if (pending) return;
    readSequence.current++; activeIdRef.current = null; history.replaceState({}, '', '/my-registrations'); setSelected(null); setConfirming(false); setMessage(''); setDetailError('');
    window.setTimeout(() => document.getElementById(triggerIdRef.current)?.focus(), 0);
  }
  function openDetail(row: RegistrationOwn) {
    readSequence.current++; activeIdRef.current = row.id; triggerIdRef.current = `registration-trigger-${row.id}`;
    history.pushState({}, '', `/my-registrations?registrationId=${row.id}`);
    setSelected(row); setConfirming(false); setMessage(''); setDetailError(''); setUncertain(false); setClosed(false); setChecking(false);
    void readDetail(row.id);
  }
  function trapKeyboard(event: KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') { event.preventDefault(); if (!pending) { if (confirming) setConfirming(false); else closeDetail(); } return; }
    if (event.key !== 'Tab') return;
    const focusable = event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (!first) { event.preventDefault(); return; }
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  async function cancelRegistration() {
    if (!selected || pending || uncertain || checking || detailError) return;
    const id = selected.id; readSequence.current++; setPending(true); setMessage(''); setDetailError('');
    try {
      const bootstrap = await fetch('/api/auth/csrf', { cache: 'no-store' });
      if (!bootstrap.ok) throw new Error();
      const token = (await bootstrap.json()).data.csrfToken as string;
      const response = await fetch(`/api/me/registrations/${encodeURIComponent(id)}/cancel`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token }, body: '{}' });
      if (!alive.current || activeIdRef.current !== id) return;
      if (response.status === 401) { handleExpiredSession(`/my-registrations?registrationId=${encodeURIComponent(id)}`); return; }
      const result = await response.json() as { data?: RegistrationOwn; error?: { code: string } };
      if (!alive.current || activeIdRef.current !== id) return;
      if (response.ok && result.data?.status === 'CANCELLED') {
        setSelected(result.data); setConfirming(false); setMessage('Registration cancelled.'); setRetry(value => value + 1); return;
      }
      if (result.error?.code === 'CANCELLATION_CLOSED') { setConfirming(false); setClosed(true); setMessage('Cancellation is closed because this event has started.'); return; }
      if (response.status >= 500) throw new Error();
      setConfirming(false); setMessage('Unable to cancel registration. Check your registration and try again.');
    } catch {
      if (alive.current && activeIdRef.current === id) { setConfirming(false); setUncertain(true); setMessage('We could not confirm cancellation. Check your registration before trying again.'); }
    } finally { if (alive.current && activeIdRef.current === id) setPending(false); }
  }
  const canCancel = selected?.status === 'ACTIVE' && Date.now() < Date.parse(selected.event.startsAt) && !closed;
  return <>
    <h1 className="text-3xl font-bold">My Registrations</h1>
    {detailError && !selected && <div role="alert" className="mt-4"><p>{detailError}</p><button className={link} onClick={() => activeIdRef.current && void readDetail(activeIdRef.current)}>Try again</button></div>}
    {checking && !selected && <p role="status">Loading registration details…</p>}
    {state === 'loading' ? <p role="status" className="mt-6">Loading registrations…</p> : state === 'error' ? <div role="alert" className="mt-6"><p>Unable to load registrations.</p><button className={link} onClick={() => setRetry(value => value + 1)}>Try again</button></div> : rows.length === 0 ? <p className="mt-6">You have no registrations yet. <a className={link} href="/events">Browse events</a></p> : <>
      <ul className="mt-6 grid gap-4">{rows.map(row => <li key={row.id} className="rounded-2xl bg-white p-5 shadow">
        <h2 className="text-xl font-bold"><a id={`registration-trigger-${row.id}`} className={link} href={`/my-registrations?registrationId=${row.id}`} onClick={event => { event.preventDefault(); openDetail(row); }}>{row.event.title}</a></h2>
        <p className="mt-3">{dateRange(row.event)}</p><p className="mt-1">Location: {row.event.location}</p>
        <p className="mt-1 break-all">Registration reference: {row.id}</p><p className="mt-1">Registered at: {dateFormat.format(new Date(row.registeredAt))} (Thailand time, UTC+7)</p>
        <p className="mt-1">Status: {row.status}</p>{row.cancelledAt && <p className="mt-1">Cancelled at: {dateFormat.format(new Date(row.cancelledAt))} (Thailand time, UTC+7)</p>}
        <a className={`${link} mt-3 inline-block min-h-11 py-2`} href={`/my-registrations?registrationId=${row.id}`} onClick={event => { event.preventDefault(); openDetail(row); }}>View registration</a>
      </li>)}</ul>
      <div className="mt-6 flex items-center gap-4"><button className="min-h-11 underline disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page} · {total} total</span><button className="min-h-11 underline disabled:opacity-40" disabled={page * 20 >= total} onClick={() => setPage(value => value + 1)}>Next</button></div>
    </>}
    {selected && <div role="presentation" className="fixed inset-0 z-10 grid place-items-center bg-black/50 p-4" onMouseDown={event => { if (event.target === event.currentTarget) closeDetail(); }}>
      <section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="registration-title" aria-busy={pending} onKeyDown={trapKeyboard} className="max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="registration-title" className="text-2xl font-bold">{confirming ? 'Cancel registration?' : 'Registration details'}</h2>
        {confirming ? <>
          <p className="mt-4">Cancel your registration for <strong>{selected.event.title}</strong>? Your seat will become available to another participant. Your registration history will be kept.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end"><button ref={keepRef} className={`${button} bg-neutral-800 hover:bg-neutral-700`} disabled={pending} onClick={() => setConfirming(false)}>Keep registration</button><button className={button} disabled={pending} onClick={() => void cancelRegistration()}>{pending ? 'Cancelling…' : 'Confirm cancellation'}</button></div>
        </> : <>
          <section className="mt-6 rounded-xl bg-neutral-50 p-5"><h3 className="text-lg font-bold">Event details</h3>
            <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2"><div className="sm:col-span-2"><dt className="text-sm font-semibold text-neutral-600">Event</dt><dd className="mt-1 text-lg font-semibold">{selected.event.title}</dd></div><div><dt className="text-sm font-semibold text-neutral-600">Date and time</dt><dd className="mt-1 leading-6">{dateRange(selected.event)}</dd></div><div><dt className="text-sm font-semibold text-neutral-600">Location</dt><dd className="mt-1 leading-6">{selected.event.location}</dd></div></dl>
            {selected.event.description && <div className="mt-4 border-t border-neutral-200 pt-4"><h4 className="font-semibold">About this event</h4><p className="mt-2 whitespace-pre-wrap break-words leading-7 text-neutral-700">{selected.event.description}</p></div>}
          </section>
          <section className="mt-4 rounded-xl border border-neutral-200 p-5"><h3 className="text-lg font-bold">Registration</h3>
            <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2"><div><dt className="text-sm font-semibold text-neutral-600">Registrant</dt><dd className="mt-1">{selected.participant.displayName}</dd></div><div><dt className="text-sm font-semibold text-neutral-600">Status</dt><dd className="mt-1">{selected.status}</dd></div><div><dt className="text-sm font-semibold text-neutral-600">Registration reference</dt><dd className="mt-1 break-all">{selected.id}</dd></div><div><dt className="text-sm font-semibold text-neutral-600">Registered at</dt><dd className="mt-1">{dateFormat.format(new Date(selected.registeredAt))} (Thailand time, UTC+7)</dd></div>{selected.cancelledAt && <div><dt className="text-sm font-semibold text-neutral-600">Cancelled at</dt><dd className="mt-1">{dateFormat.format(new Date(selected.cancelledAt))} (Thailand time, UTC+7)</dd></div>}</dl>
          </section>
          {message && <p role={uncertain || closed ? 'alert' : 'status'} className="mt-4">{message}</p>}
          {detailError && <p role="alert" className="mt-4">{detailError}</p>}
          {(uncertain || detailError) && <button className={`${link} mt-4 min-h-11`} disabled={checking} onClick={() => void readDetail(selected.id)}>{checking ? 'Checking…' : 'Check registration status'}</button>}
          {selected.status === 'ACTIVE' && !canCancel && !closed && <p className="mt-4">Cancellation is closed because this event has started.</p>}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            {canCancel && <button ref={cancelRef} className={`${button} bg-red-700 hover:bg-red-800`} disabled={uncertain || checking || !!detailError} onClick={() => { setMessage(''); setConfirming(true); }}>Cancel registration</button>}
            <a className={`${button} bg-neutral-800 hover:bg-neutral-700`} href={`/events/${selected.event.id}`}>View event</a>
            <button ref={closeRef} className={button} onClick={closeDetail}>Close</button>
          </div>
        </>}
      </section>
    </div>}
  </>;
}
