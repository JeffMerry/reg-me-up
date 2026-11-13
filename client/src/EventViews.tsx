import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react';

type Identity = { id: string; displayName: string; role: 'PARTICIPANT' | 'ORGANIZER' };
type EventData = { id: string; title: string; startsAt: string; endsAt: string; location: string; capacity: number; remainingSeats: number; description: string | null; organizer: { displayName: string }; activeRegistrationCount?: number };
type PageData = { data: EventData[]; meta: { page: number; pageSize: number; total: number } };
type FormData = { title: string; startsAt: string; endsAt: string; location: string; capacity: string; description: string };
const initial: FormData = { title: '', startsAt: '', endsAt: '', location: '', capacity: '', description: '' };
const dateFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const dateRange = (event: EventData) => `${dateFormat.format(new Date(event.startsAt))} – ${dateFormat.format(new Date(event.endsAt))} (Thailand time, UTC+7)`;
const button = 'inline-flex min-h-11 items-center justify-center rounded-lg bg-orange-700 px-4 py-2 font-semibold text-white hover:bg-orange-800 disabled:opacity-50';
const link = 'font-semibold text-orange-800 underline';
const field = 'w-full rounded-lg border border-neutral-400 bg-white px-3 py-2 focus:outline-2 focus:outline-orange-700';

function Cover() { return <div className="flex h-36 items-center justify-center rounded-t-2xl bg-orange-100 text-5xl text-orange-800" aria-hidden="true">🎟</div>; }
function EventSummary({ event }: { event: EventData }) {
  return <><p className="mt-2 text-sm">{dateRange(event)}</p><p className="mt-1">{event.location}</p><p className="mt-2">{event.remainingSeats < 0 ? 'Availability unavailable' : `${event.remainingSeats} of ${event.capacity} seats remaining`}</p><p className="mt-1 font-semibold">{event.remainingSeats < 0 ? 'Please try again.' : event.remainingSeats === 0 ? 'Full' : 'Seats available'}</p></>;
}
function Pages({ meta, onPage }: { meta: PageData['meta']; onPage: (page: number) => void }) {
  return <div className="mt-6 flex items-center gap-4"><button className="min-h-11 underline disabled:opacity-40" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Previous</button><span>Page {meta.page}</span><button className="min-h-11 underline disabled:opacity-40" disabled={meta.page * meta.pageSize >= meta.total} onClick={() => onPage(meta.page + 1)}>Next</button></div>;
}
function EventList({ owner, expireSession }: { owner: boolean; expireSession: (returnTo: string) => void }) {
  const [page, setPage] = useState(1); const [data, setData] = useState<PageData | null>(null); const [error, setError] = useState(false); const [loading, setLoading] = useState(true); const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(false); setData(null);
    fetch(`${owner ? '/api/me/events' : '/api/events'}?page=${page}`, { signal: controller.signal, cache: 'no-store' }).then(async response => { if (owner && response.status === 401) { expireSession('/organizer/events'); return null; } if (!response.ok) throw new Error(); return response.json() as Promise<PageData>; }).then(result => { if (result) setData(result); }).catch(() => { if (!controller.signal.aborted) setError(true); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [owner, page, retry]);
  return <><div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-bold">{owner ? 'My Events' : 'Discover your next event'}</h1>{owner && <a className={button} href="/organizer/events/new">Create event</a>}</div>{loading ? <div className="mt-6" role="status"><p>Loading events…</p><div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">{[1, 2, 3].map(id => <div key={id} className="h-64 animate-pulse rounded-2xl bg-neutral-200" />)}</div></div> : error ? <div className="mt-6" role="alert"><p>Unable to load events.</p><button className={`${link} mt-2 min-h-11`} onClick={() => setRetry(retry + 1)}>Try again</button></div> : data && data.data.length === 0 ? <p className="mt-6">{owner ? 'Create your first event.' : 'No events are available yet.'}</p> : data && <>{owner && <div className="mt-6 hidden overflow-x-auto rounded-2xl bg-white shadow md:block"><table className="w-full text-left"><thead><tr><th className="p-4">Event</th><th className="p-4">Date and time</th><th className="p-4">Location</th><th className="p-4">Registrations / capacity</th><th className="p-4">Remaining</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead><tbody>{data.data.map(event => <tr key={event.id} className="border-t border-neutral-200"><td className="p-4"><a className={link} href={`/events/${event.id}`}>{event.title}</a></td><td className="p-4">{dateRange(event)}</td><td className="p-4">{event.location}</td><td className="p-4">{event.activeRegistrationCount} / {event.capacity}</td><td className="p-4">{event.remainingSeats < 0 ? 'Unavailable' : event.remainingSeats}</td><td className="p-4">{event.remainingSeats < 0 ? 'Unavailable' : event.remainingSeats === 0 ? 'Full' : 'Seats available'}</td><td className="p-4"><a className={link} href={`/events/${event.id}`}>View details</a></td></tr>)}</tbody></table></div>}<div className={`mt-6 grid gap-6 ${owner ? 'md:hidden' : 'md:grid-cols-2 lg:grid-cols-3'}`}>{data.data.map(event => <article key={event.id} className="overflow-hidden rounded-2xl bg-white shadow"><Cover /><div className="p-5"><h2 className="text-xl font-bold"><a className={link} href={`/events/${event.id}`}>{event.title}</a></h2><EventSummary event={event} />{owner && <p className="mt-2">Active registrations: {event.activeRegistrationCount} / {event.capacity}</p>}<a className={`${link} mt-4 inline-block`} href={`/events/${event.id}`}>View details</a></div></article>)}</div><Pages meta={data.meta} onPage={setPage} /></>}</>;
}
function EventDetail({ id, identity, expireSession }: { id: string; identity: Identity | null; expireSession: (returnTo: string, keepPublicEvent?: boolean) => void }) {
  const [data, setData] = useState<EventData | null>(null); const [status, setStatus] = useState<'loading' | 'error' | 'missing' | 'ok'>('loading'); const [retry, setRetry] = useState(0);
  const [registration, setRegistration] = useState<{ state: 'loading' | 'error' | 'none' | 'registered' | 'pending' | 'uncertain'; id?: string }>({ state: 'none' });
  const [registrationRetry, setRegistrationRetry] = useState(0);
  const [published] = useState(() => sessionStorage.getItem('regmeup:published') === id);
  useEffect(() => { if (published) sessionStorage.removeItem('regmeup:published'); }, [published]);
  useEffect(() => { const controller = new AbortController(); setData(null); setStatus('loading'); fetch(`/api/events/${encodeURIComponent(id)}`, { signal: controller.signal, cache: 'no-store' }).then(async response => { if (response.status === 404 || response.status === 422) { setStatus('missing'); return; } if (!response.ok) throw new Error(); setData((await response.json()).data as EventData); setStatus('ok'); }).catch(() => { if (!controller.signal.aborted) setStatus('error'); }); return () => controller.abort(); }, [id, retry]);
  useEffect(() => {
    if (identity?.role !== 'PARTICIPANT') { setRegistration({ state: 'none' }); return; }
    const controller = new AbortController(); setRegistration({ state: 'loading' });
    fetch(`/api/me/registrations?eventId=${encodeURIComponent(id)}`, { signal: controller.signal, cache: 'no-store' }).then(async response => {
      if (response.status === 401) { expireSession(`/events/${id}`, true); setRegistration({ state: 'none' }); return null; }
      if (!response.ok) throw new Error();
      const result = await response.json() as { data: Array<{ id: string }> };
      setRegistration(result.data[0] ? { state: 'registered', id: result.data[0].id } : { state: 'none' });
    }).catch(() => { if (!controller.signal.aborted) setRegistration({ state: 'error' }); });
    return () => controller.abort();
  }, [id, identity?.id, identity?.role, registrationRetry]);
  async function register() {
    if (registration.state !== 'none') return;
    setRegistration({ state: 'pending' });
    try {
      const boot = await fetch('/api/auth/csrf', { cache: 'no-store' }); if (!boot.ok) throw new Error();
      const token = (await boot.json()).data.csrfToken as string;
      const response = await fetch(`/api/events/${encodeURIComponent(id)}/registrations`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token }, body: '{}' });
      if (response.status === 401) { expireSession(`/events/${id}`, true); setRegistration({ state: 'none' }); return; }
      const body = await response.json() as { data?: { id: string }; error?: { code: string; registrationId?: string } };
      if (response.status === 201) { setRegistration({ state: 'registered', id: body.data?.id }); setRetry(value => value + 1); return; }
      if (body.error?.code === 'ALREADY_REGISTERED' && body.error.registrationId) { setRegistration({ state: 'registered', id: body.error.registrationId }); return; }
      if (body.error?.code === 'EVENT_FULL') { setRegistration({ state: 'none' }); setRetry(value => value + 1); return; }
      if (response.status >= 500) { setRegistration({ state: 'uncertain' }); return; }
      setRegistration({ state: 'error' });
    } catch { setRegistration({ state: 'uncertain' }); }
  }
  if (status === 'loading') return <p role="status">Loading event…</p>;
  if (status === 'missing') return <><h1 className="text-3xl font-bold">Event not found</h1><a className={link} href="/events">Browse events</a></>;
  if (status === 'error' || !data) return <div role="alert"><p>Unable to load event.</p><button className={link} onClick={() => setRetry(retry + 1)}>Try again</button></div>;
  return <>{published && <p role="status" className="mb-4 font-semibold">Event published successfully.</p>}<a className={link} href="/events">Events</a><article className="mt-4 overflow-hidden rounded-2xl bg-white shadow"><Cover /><div className="grid gap-8 p-6 md:grid-cols-3"><div className="md:col-span-2"><h1 className="text-3xl font-bold">{data.title}</h1><EventSummary event={data} /><p className="mt-4">Organized by {data.organizer.displayName}</p>{data.description && <section className="mt-6"><h2 className="text-xl font-bold">Description</h2><p className="mt-2 whitespace-pre-wrap">{data.description}</p></section>}</div><aside><h2 className="text-xl font-bold">Registration</h2><p className="mt-2">{data.remainingSeats < 0 ? 'Availability unavailable. Please try again.' : `${data.remainingSeats} seats remaining`}</p>{identity?.role === 'ORGANIZER' ? <p className="mt-4">Registration is available to Participant accounts.</p> : !identity ? <>{data.remainingSeats <= 0 ? <p className="mt-4">This event is full.</p> : <a className={`${button} mt-4`} href={`/login?returnTo=${encodeURIComponent(`/events/${data.id}`)}`}>Log in to register</a>}</> : registration.state === 'loading' ? <p role="status" className="mt-4">Checking your registration…</p> : registration.state === 'error' ? <div role="alert" className="mt-4"><p>Unable to check your registration.</p><button className={link} onClick={() => setRegistrationRetry(value => value + 1)}>Try again</button></div> : registration.state === 'registered' ? <p role="status" className="mt-4">You are registered. <a className={link} href={`/my-registrations?registrationId=${registration.id}`}>View registration</a></p> : registration.state === 'uncertain' ? <div role="alert" className="mt-4"><p>We could not confirm your registration. Check your registrations before trying again.</p><a className={link} href="/my-registrations">Check My Registrations</a></div> : <><button disabled={registration.state === 'pending' || data.remainingSeats <= 0} className={`${button} mt-4`} onClick={() => void register()}>{registration.state === 'pending' ? 'Registering…' : data.remainingSeats <= 0 ? 'Full' : 'Register'}</button>{data.remainingSeats <= 0 && <p className="mt-2">This event is full.</p>}</>}</aside></div></article></>;
}
type RegistrationOwn = { id: string; status: string; registeredAt: string; participant: { displayName: string }; event: EventData };
function MyRegistrations({ expireSession }: { expireSession: (returnTo: string) => void }) {
  const [page, setPage] = useState(1); const [rows, setRows] = useState<RegistrationOwn[]>([]); const [total, setTotal] = useState(0);
  const [state, setState] = useState<'loading' | 'error' | 'ok'>('loading'); const [retry, setRetry] = useState(0); const [selected, setSelected] = useState<RegistrationOwn | null>(null);
  const triggerIdRef = useRef(''); const closeRef = useRef<HTMLButtonElement | null>(null);
  const sessionExpiredRef = useRef(false);
  function handleExpiredSession(returnTo: string) {
    if (sessionExpiredRef.current) return;
    sessionExpiredRef.current = true; setRows([]); setTotal(0); setSelected(null); expireSession(returnTo);
  }
  useEffect(() => {
    const controller = new AbortController(); setState('loading');
    fetch(`/api/me/registrations?page=${page}`, { cache: 'no-store', signal: controller.signal }).then(async response => { if (response.status === 401) { handleExpiredSession('/my-registrations'); return null; } if (!response.ok) throw new Error(); return response.json() as Promise<{ data: RegistrationOwn[]; meta: { total: number } }> }).then(result => { if (result) { setRows(result.data); setTotal(result.meta.total); setState('ok'); } }).catch(() => { if (!controller.signal.aborted) setState('error'); });
    return () => controller.abort();
  }, [page, retry]);
  useEffect(() => {
    const id = new URLSearchParams(location.search).get('registrationId'); if (!id) { setSelected(null); return; }
    const controller = new AbortController();
    fetch(`/api/me/registrations/${encodeURIComponent(id)}`, { cache: 'no-store', signal: controller.signal }).then(async response => { if (response.status === 401) { handleExpiredSession(`/my-registrations?registrationId=${encodeURIComponent(id)}`); return; } if (!response.ok) throw new Error(); triggerIdRef.current = `registration-trigger-${id}`; setSelected((await response.json()).data as RegistrationOwn); }).catch(() => { if (!controller.signal.aborted) setSelected(null); });
    return () => controller.abort();
  }, []);
  useLayoutEffect(() => { if (selected) closeRef.current?.focus(); else document.getElementById(triggerIdRef.current)?.focus(); }, [selected]);
  function closeDetail() { const triggerId = triggerIdRef.current; history.replaceState({}, '', '/my-registrations'); setSelected(null); window.setTimeout(() => document.getElementById(triggerId)?.focus(), 0); }
  function trapDialogKeyboard(event: React.KeyboardEvent<HTMLElement>) {
    if (event.key === 'Escape') { event.preventDefault(); closeDetail(); return; }
    if (event.key !== 'Tab') return;
    const focusable = event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled])');
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }
  return <>
    <h1 className="text-3xl font-bold">My Registrations</h1>
    {state === 'loading' ? <p role="status" className="mt-6">Loading registrations…</p> : state === 'error' ? <div role="alert" className="mt-6"><p>Unable to load registrations.</p><button className={link} onClick={() => setRetry(value => value + 1)}>Try again</button></div> : rows.length === 0 ? <p className="mt-6">You have no registrations yet. <a className={link} href="/events">Browse events</a></p> : <>
      <ul className="mt-6 grid gap-4">
        {rows.map(row => <li key={row.id} className="rounded-2xl bg-white p-5 shadow">
          <h2 className="text-xl font-bold"><a id={`registration-trigger-${row.id}`} className={link} href={`/my-registrations?registrationId=${row.id}`} onClick={event => { event.preventDefault(); triggerIdRef.current = event.currentTarget.id; history.pushState({}, '', `/my-registrations?registrationId=${row.id}`); setSelected(row); }}>{row.event.title}</a></h2>
          <p className="mt-3">{dateRange(row.event)}</p>
          <p className="mt-1">Location: {row.event.location}</p>
          <p className="mt-1">Registration reference: {row.id}</p>
          <p className="mt-1">Registered at: {dateFormat.format(new Date(row.registeredAt))} (Thailand time, UTC+7)</p>
          <p className="mt-1">Status: {row.status}</p>
          <a className={`${link} mt-3 inline-block min-h-11 py-2`} href={`/my-registrations?registrationId=${row.id}`} onClick={event => { event.preventDefault(); triggerIdRef.current = `registration-trigger-${row.id}`; history.pushState({}, '', `/my-registrations?registrationId=${row.id}`); setSelected(row); }}>View registration</a>
        </li>)}
      </ul>
      <div className="mt-6 flex items-center gap-4"><button className="min-h-11 underline disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {page} · {total} total</span><button className="min-h-11 underline disabled:opacity-40" disabled={page * 20 >= total} onClick={() => setPage(value => value + 1)}>Next</button></div>
    </>}
    {selected && <div role="presentation" className="fixed inset-0 z-10 grid place-items-center bg-black/50 p-4" onMouseDown={event => { if (event.target === event.currentTarget) closeDetail(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="registration-title" onKeyDown={trapDialogKeyboard} className="max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h2 id="registration-title" className="text-2xl font-bold">Registration details</h2>
        <section className="mt-6 rounded-xl bg-neutral-50 p-5">
          <h3 className="text-lg font-bold">Event details</h3>
          <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><dt className="text-sm font-semibold text-neutral-600">Event</dt><dd className="mt-1 text-lg font-semibold">{selected.event.title}</dd></div>
            <div><dt className="text-sm font-semibold text-neutral-600">Date and time</dt><dd className="mt-1 leading-6">{dateRange(selected.event)}</dd></div>
            <div><dt className="text-sm font-semibold text-neutral-600">Location</dt><dd className="mt-1 leading-6">{selected.event.location}</dd></div>
          </dl>
          {selected.event.description && <div className="mt-4 border-t border-neutral-200 pt-4"><h4 className="font-semibold">About this event</h4><p className="mt-2 whitespace-pre-wrap break-words leading-7 text-neutral-700">{selected.event.description}</p></div>}
        </section>
        <section className="mt-4 rounded-xl border border-neutral-200 p-5">
          <h3 className="text-lg font-bold">Registration</h3>
          <dl className="mt-4 grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <div><dt className="text-sm font-semibold text-neutral-600">Registrant</dt><dd className="mt-1">{selected.participant.displayName}</dd></div>
            <div><dt className="text-sm font-semibold text-neutral-600">Status</dt><dd className="mt-1">{selected.status}</dd></div>
            <div><dt className="text-sm font-semibold text-neutral-600">Registration reference</dt><dd className="mt-1 break-all">{selected.id}</dd></div>
            <div><dt className="text-sm font-semibold text-neutral-600">Registered at</dt><dd className="mt-1">{dateFormat.format(new Date(selected.registeredAt))} (Thailand time, UTC+7)</dd></div>
          </dl>
        </section>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <a className={`${button} bg-neutral-800 hover:bg-neutral-700`} href={`/events/${selected.event.id}`}>View event</a>
          <button ref={closeRef} className={`${button} bg-orange-700`} onClick={closeDetail}>Close</button>
        </div>
      </section>
    </div>}
  </>;
}
function CreateEvent({ navigate, expireSession }: { navigate: (target: string) => void; expireSession: (returnTo: string) => void }) {
  const [values, setValues] = useState<FormData>(initial); const [errors, setErrors] = useState<Record<string, string>>({}); const [pending, setPending] = useState(false); const [message, setMessage] = useState(''); const [uncertain, setUncertain] = useState(false); const form = useRef<HTMLFormElement>(null);
  const update = (key: keyof FormData, value: string) => setValues(current => ({ ...current, [key]: value }));
  async function submit(event: FormEvent) {
    event.preventDefault(); if (pending || uncertain) return;
    const next: Record<string, string> = {};
    if (!values.title.trim() || [...values.title.trim()].length > 200) next.title = 'Enter an event name up to 200 characters.';
    if (!values.location.trim() || [...values.location.trim()].length > 300) next.location = 'Enter a location up to 300 characters.';
    const start = new Date(`${values.startsAt}:00+07:00`), end = new Date(`${values.endsAt}:00+07:00`);
    if (!values.startsAt || !Number.isFinite(start.getTime())) next.startsAt = 'Enter a valid start date and time.';
    if (!values.endsAt || !Number.isFinite(end.getTime()) || (Number.isFinite(start.getTime()) && end <= start)) next.endsAt = 'End time must be after start time.';
    const capacity = Number(values.capacity);
    if (!/^\d+$/.test(values.capacity) || !Number.isInteger(capacity) || capacity < 1 || capacity > 2147483647) next.capacity = 'Capacity must be a positive whole number.';
    if ([...values.description].length > 10000) next.description = 'Description must be at most 10,000 characters.';
    setErrors(next); setMessage('');
    if (Object.keys(next).length) { const first = ['title', 'startsAt', 'endsAt', 'location', 'capacity', 'description'].find(key => next[key]); if (first) document.getElementById(`event-${first}`)?.focus(); return; }
    setPending(true);
    try {
      const boot = await fetch('/api/auth/csrf', { cache: 'no-store' }); if (!boot.ok) { setMessage('Unable to prepare the form. Please try again.'); return; }
      const token = (await boot.json()).data.csrfToken as string;
      let response: Response;
      try { response = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token }, body: JSON.stringify({ title: values.title, startsAt: start.toISOString(), endsAt: end.toISOString(), location: values.location, capacity, description: values.description }) }); }
      catch { setUncertain(true); setMessage('We could not confirm publication. Please check My Events before trying again.'); return; }
      if (response.status === 401) { expireSession('/organizer/events/new'); return; }
      if (!response.ok) {
        if (response.status >= 500) { setUncertain(true); setMessage('We could not confirm publication. Please check My Events before trying again.'); return; }
        const result = await response.json().catch(() => ({})) as { error?: { fieldErrors?: Record<string, string> } }; setErrors(result.error?.fieldErrors ?? {}); setMessage('Unable to publish. Please check the form and try again.');
        const first = ['title', 'startsAt', 'endsAt', 'location', 'capacity', 'description'].find(key => result.error?.fieldErrors?.[key]); if (first) document.getElementById(`event-${first}`)?.focus(); return;
      }
      try {
        const result = await response.json() as { data: EventData };
        if (!result.data?.id) throw new Error('Missing event reference');
        sessionStorage.setItem('regmeup:published', result.data.id); navigate(`/events/${result.data.id}`);
      } catch { setUncertain(true); setMessage('We could not confirm publication. Please check My Events before trying again.'); }
    } catch { setMessage('Unable to prepare the form. Please try again.'); } finally { setPending(false); }
  }
  function cancel() { if (Object.values(values).some(Boolean) && !window.confirm('Discard your unsaved changes?')) return; navigate('/organizer/events'); }
  const rows: Array<{ key: keyof FormData; label: string; type: string; required: boolean }> = [
    { key: 'title', label: 'Event name', type: 'text', required: true }, { key: 'startsAt', label: 'Start date and time', type: 'datetime-local', required: true }, { key: 'endsAt', label: 'End date and time', type: 'datetime-local', required: true }, { key: 'location', label: 'Location', type: 'text', required: true }, { key: 'capacity', label: 'Capacity', type: 'number', required: true }, { key: 'description', label: 'Description (optional)', type: 'textarea', required: false },
  ];
  return <><a className={link} href="/organizer/events">My Events</a><h1 className="mt-4 text-3xl font-bold">Create event</h1><p className="mt-2">Thailand time (UTC+7)</p><form ref={form} onSubmit={event => void submit(event)} noValidate className="mt-6 grid max-w-3xl gap-4 rounded-2xl bg-white p-6 shadow">{rows.map(({ key, label, type, required }) => <div key={key}><label className="mb-1 block font-semibold" htmlFor={`event-${key}`}>{label}{required && ' *'}</label>{type === 'textarea' ? <textarea id={`event-${key}`} className={field} value={values[key]} onChange={event => update(key, event.target.value)} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `error-${key}` : undefined} /> : <input id={`event-${key}`} type={type} className={field} value={values[key]} onChange={event => update(key, event.target.value)} required={required} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `error-${key}` : undefined} />}{errors[key] && <p id={`error-${key}`} className="mt-1 text-red-700">{errors[key]}</p>}</div>)}{message && <p role="alert" className="text-red-700">{message}</p>}<div className="flex flex-wrap gap-4"><button type="submit" className={button} disabled={pending || uncertain}>{pending ? 'Publishing…' : 'Publish event'}</button><button type="button" className="min-h-11 underline" disabled={pending} onClick={cancel}>Cancel</button>{uncertain && <a className="min-h-11 underline" href="/organizer/events">Check My Events</a>}</div></form></>;
}
export function EventViews({ path, identity, navigate, expireSession }: { path: string; identity: Identity | null; navigate: (target: string) => void; expireSession: (returnTo: string, keepPublicEvent?: boolean) => void }) {
  if (path === '/events') return <EventList owner={false} expireSession={expireSession} />;
  if (path === '/my-registrations') return <MyRegistrations expireSession={expireSession} />;
  if (path === '/organizer/events') return <EventList owner expireSession={expireSession} />;
  if (path === '/organizer/events/new') return <CreateEvent navigate={navigate} expireSession={expireSession} />;
  if (path.startsWith('/events/')) return <EventDetail id={path.slice('/events/'.length)} identity={identity} expireSession={expireSession} />;
  return <><h1 className="text-2xl font-bold">Page not found</h1><a className={link} href="/events">Browse events</a></>;
}
