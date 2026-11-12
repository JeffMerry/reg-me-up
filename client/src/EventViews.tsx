import { useEffect, useRef, useState, type FormEvent } from 'react';

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
function EventDetail({ id, identity }: { id: string; identity: Identity | null }) {
  const [data, setData] = useState<EventData | null>(null); const [status, setStatus] = useState<'loading' | 'error' | 'missing' | 'ok'>('loading'); const [retry, setRetry] = useState(0);
  const [published] = useState(() => sessionStorage.getItem('regmeup:published') === id);
  useEffect(() => { if (published) sessionStorage.removeItem('regmeup:published'); }, [published]);
  useEffect(() => { const controller = new AbortController(); setData(null); setStatus('loading'); fetch(`/api/events/${encodeURIComponent(id)}`, { signal: controller.signal, cache: 'no-store' }).then(async response => { if (response.status === 404 || response.status === 422) { setStatus('missing'); return; } if (!response.ok) throw new Error(); setData((await response.json()).data as EventData); setStatus('ok'); }).catch(() => { if (!controller.signal.aborted) setStatus('error'); }); return () => controller.abort(); }, [id, retry]);
  if (status === 'loading') return <p role="status">Loading event…</p>;
  if (status === 'missing') return <><h1 className="text-3xl font-bold">Event not found</h1><a className={link} href="/events">Browse events</a></>;
  if (status === 'error' || !data) return <div role="alert"><p>Unable to load event.</p><button className={link} onClick={() => setRetry(retry + 1)}>Try again</button></div>;
  return <>{published && <p role="status" className="mb-4 font-semibold">Event published successfully.</p>}<a className={link} href="/events">Events</a><article className="mt-4 overflow-hidden rounded-2xl bg-white shadow"><Cover /><div className="grid gap-8 p-6 md:grid-cols-3"><div className="md:col-span-2"><h1 className="text-3xl font-bold">{data.title}</h1><EventSummary event={data} /><p className="mt-4">Organized by {data.organizer.displayName}</p>{data.description && <section className="mt-6"><h2 className="text-xl font-bold">Description</h2><p className="mt-2 whitespace-pre-wrap">{data.description}</p></section>}</div><aside><h2 className="text-xl font-bold">Registration</h2><p className="mt-2">{data.remainingSeats < 0 ? 'Availability unavailable. Please try again.' : `${data.remainingSeats} seats remaining`}</p>{identity?.role === 'ORGANIZER' ? <p className="mt-4">Registration is available to Participant accounts.</p> : data.remainingSeats <= 0 ? <button disabled className={`${button} mt-4`}>{data.remainingSeats < 0 ? 'Unavailable' : 'Full'}</button> : !identity ? <a className={`${button} mt-4`} href={`/login?returnTo=${encodeURIComponent(`/events/${data.id}`)}`}>Log in to register</a> : <button disabled className={`${button} mt-4`}>Registration is not available yet</button>}</aside></div></article></>;
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
export function EventViews({ path, identity, navigate, expireSession }: { path: string; identity: Identity | null; navigate: (target: string) => void; expireSession: (returnTo: string) => void }) {
  if (path === '/events') return <EventList owner={false} expireSession={expireSession} />;
  if (path === '/organizer/events') return <EventList owner expireSession={expireSession} />;
  if (path === '/organizer/events/new') return <CreateEvent navigate={navigate} expireSession={expireSession} />;
  if (path.startsWith('/events/')) return <EventDetail id={path.slice('/events/'.length)} identity={identity} />;
  return <><h1 className="text-2xl font-bold">Page not found</h1><a className={link} href="/events">Browse events</a></>;
}
