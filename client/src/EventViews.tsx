import { useEffect, useRef, useState, type FormEvent } from 'react';
import { EditEvent } from './EditEvent';
import { MyRegistrations } from './RegistrationViews';
import { InstructorManagement, MyTeaching, TeachingDetail } from './InstructorViews';

type Identity = { id: string; displayName: string; role: 'PARTICIPANT' | 'ORGANIZER' | 'INSTRUCTOR' };
type EventData = { id: string; title: string; startsAt: string; endsAt: string; location: string; capacity: number; remainingSeats: number; registrationDeadline?: string | null; effectiveRegistrationCutoff?: string; description: string | null; organizer: { displayName: string }; activeRegistrationCount?: number };
type PageData = { data: EventData[]; meta: { page: number; pageSize: number; total: number } };
type FormData = { title: string; startsAt: string; endsAt: string; location: string; capacity: string; description: string };
const initial: FormData = { title: '', startsAt: '', endsAt: '', location: '', capacity: '', description: '' };
const dateFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const dateRange = (event: EventData) => `${dateFormat.format(new Date(event.startsAt))} – ${dateFormat.format(new Date(event.endsAt))} (Thailand time, UTC+7)`;
const button = 'inline-flex min-h-11 items-center justify-center rounded-lg bg-orange-700 px-4 py-2 font-semibold text-white hover:bg-orange-800 disabled:opacity-50';
const closed = (event: EventData) => Date.now() >= Date.parse(event.effectiveRegistrationCutoff ?? event.startsAt);
const link = 'font-semibold text-orange-800 underline';
const field = 'w-full rounded-lg border border-neutral-400 bg-white px-3 py-2 focus:outline-2 focus:outline-orange-700';

function Cover() { return <div className="flex h-36 items-center justify-center rounded-t-2xl bg-orange-100 text-5xl text-orange-800" aria-hidden="true">🎟</div>; }
function EventSummary({ event }: { event: EventData }) {
  return <><p className="mt-2 text-sm">{dateRange(event)}</p><p className="mt-1">{event.location}</p><p className="mt-2">{event.remainingSeats < 0 ? 'Availability unavailable' : `${event.remainingSeats} of ${event.capacity} seats remaining`}</p><p className="mt-1 font-semibold">{event.remainingSeats < 0 ? 'Please try again.' : closed(event) ? 'Closed' : event.remainingSeats === 0 ? 'Full' : 'Seats available'}</p></>;
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
  return <><div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-bold">{owner ? 'My Events' : 'Discover events and workshops'}</h1>{owner && <a className={button} href="/organizer/events/new">Create event</a>}</div>{loading ? <div className="mt-6" role="status"><p>Loading events…</p><div className="mt-4 grid gap-6 md:grid-cols-2 lg:grid-cols-3" aria-hidden="true">{[1, 2, 3].map(id => <div key={id} className="h-64 animate-pulse rounded-2xl bg-neutral-200" />)}</div></div> : error ? <div className="mt-6" role="alert"><p>Unable to load events.</p><button className={`${link} mt-2 min-h-11`} onClick={() => setRetry(retry + 1)}>Try again</button></div> : data && data.data.length === 0 ? <p className="mt-6">{owner ? 'Create your first event.' : 'No events are available yet.'}</p> : data && <>{owner && <div className="mt-6 hidden overflow-x-auto rounded-2xl bg-white shadow md:block"><table className="w-full text-left"><thead><tr><th className="p-4">Event</th><th className="p-4">Date and time</th><th className="p-4">Location</th><th className="p-4">Registrations / capacity</th><th className="p-4">Remaining</th><th className="p-4">Status</th><th className="p-4">Action</th></tr></thead><tbody>{data.data.map(event => <tr key={event.id} className="border-t border-neutral-200"><td className="p-4"><a className={link} href={`/events/${event.id}`}>{event.title}</a></td><td className="p-4">{dateRange(event)}</td><td className="p-4">{event.location}</td><td className="p-4">{event.activeRegistrationCount} / {event.capacity}</td><td className="p-4">{event.remainingSeats < 0 ? 'Unavailable' : event.remainingSeats}</td><td className="p-4">{event.remainingSeats < 0 ? 'Unavailable' : closed(event) ? 'Closed' : event.remainingSeats === 0 ? 'Full' : 'Seats available'}</td><td className="p-4"><div className="flex flex-wrap gap-x-4 gap-y-2"><a className={link} href={`/events/${event.id}`}>View details</a><a className={link} href={`/organizer/events/${event.id}/registrations`}>View registrations</a><a className={link} href={`/organizer/events/${event.id}/edit`}>Edit event</a><a className={link} href={`/organizer/events/${event.id}/instructor`}>Manage Instructor</a></div></td></tr>)}</tbody></table></div>}<div className={`mt-6 grid gap-6 ${owner ? 'md:hidden' : 'md:grid-cols-2 lg:grid-cols-3'}`}>{data.data.map(event => <article key={event.id} className="overflow-hidden rounded-2xl bg-white shadow"><Cover /><div className="p-5"><h2 className="text-xl font-bold"><a className={link} href={`/events/${event.id}`}>{event.title}</a></h2><EventSummary event={event} />{owner && <p className="mt-2">Active registrations: {event.activeRegistrationCount} / {event.capacity}</p>}<div className="mt-4 flex flex-wrap gap-x-4 gap-y-2"><a className={link} href={`/events/${event.id}`}>View details</a>{owner && <><a className={link} href={`/organizer/events/${event.id}/registrations`}>View registrations</a><a className={link} href={`/organizer/events/${event.id}/edit`}>Edit event</a><a className={link} href={`/organizer/events/${event.id}/instructor`}>Manage Instructor</a></>}</div></div></article>)}</div><Pages meta={data.meta} onPage={setPage} /></>}</>;
}
function EventDetail({ id, identity, expireSession }: { id: string; identity: Identity | null; expireSession: (returnTo: string, keepPublicEvent?: boolean) => void }) {
  const [data, setData] = useState<EventData | null>(null); const [status, setStatus] = useState<'loading' | 'error' | 'missing' | 'ok'>('loading'); const [retry, setRetry] = useState(0);
  const [registration, setRegistration] = useState<{ state: 'loading' | 'error' | 'none' | 'registered' | 'pending' | 'uncertain'; id?: string }>({ state: 'none' });
  const [registrationRetry, setRegistrationRetry] = useState(0);
  const [published] = useState(() => sessionStorage.getItem('regmeup:published') === id);
  useEffect(() => {
    if (!data) return;
    const remaining = Date.parse(data.effectiveRegistrationCutoff ?? data.startsAt) - Date.now();
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setRetry(value => value + 1), Math.min(remaining + 20, 2147483647));
    return () => window.clearTimeout(timer);
  }, [data]);
  useEffect(() => { if (published) sessionStorage.removeItem('regmeup:published'); }, [published]);
  useEffect(() => { const controller = new AbortController(); setData(null); setStatus('loading'); fetch(`/api/events/${encodeURIComponent(id)}`, { signal: controller.signal, cache: 'no-store' }).then(async response => { if (response.status === 404 || response.status === 422) { setStatus('missing'); return; } if (!response.ok) throw new Error(); setData((await response.json()).data as EventData); setStatus('ok'); }).catch(() => { if (!controller.signal.aborted) setStatus('error'); }); return () => controller.abort(); }, [id, retry]);
  useEffect(() => {
    if (identity?.role !== 'PARTICIPANT') { setRegistration({ state: 'none' }); return; }
    const controller = new AbortController(); setRegistration({ state: 'loading' });
    void (async () => {
      // Own reads now include cancelled history. Search all returned pages,
      // rather than treating an old cancelled row as an active registration.
      let page = 1;
      while (!controller.signal.aborted) {
        const response = await fetch(`/api/me/registrations?eventId=${encodeURIComponent(id)}${page > 1 ? `&page=${page}` : ''}`, { signal: controller.signal, cache: 'no-store' });
        if (response.status === 401) { expireSession(`/events/${id}`, true); setRegistration({ state: 'none' }); return; }
        if (!response.ok) throw new Error();
        const result = await response.json() as { data: Array<{ id: string; status: string }>; meta: { page: number; pageSize: number; total: number } };
        if (controller.signal.aborted) return;
        const active = result.data.find(row => row.status === 'ACTIVE');
        if (active) { setRegistration({ state: 'registered', id: active.id }); return; }
        if (result.meta.page * result.meta.pageSize >= result.meta.total) { setRegistration({ state: 'none' }); return; }
        page++;
      }
    })().catch(() => { if (!controller.signal.aborted) setRegistration({ state: 'error' }); });
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
      if (body.error?.code === 'REGISTRATION_CLOSED') { setRegistration({ state: 'none' }); setRetry(value => value + 1); return; }
      if (body.error?.code === 'EVENT_FULL') { setRegistration({ state: 'none' }); setRetry(value => value + 1); return; }
      if (response.status >= 500) { setRegistration({ state: 'uncertain' }); return; }
      setRegistration({ state: 'error' });
    } catch { setRegistration({ state: 'uncertain' }); }
  }
  if (status === 'loading') return <p role="status">Loading event…</p>;
  if (status === 'missing') return <><h1 className="text-3xl font-bold">Event not found</h1><a className={link} href="/events">Browse events</a></>;
  if (status === 'error' || !data) return <div role="alert"><p>Unable to load event.</p><button className={link} onClick={() => setRetry(retry + 1)}>Try again</button></div>;
  return <>{published && <p role="status" className="mb-4 font-semibold">Event published successfully.</p>}<a className={link} href="/events">Events</a><article className="mt-4 overflow-hidden rounded-2xl bg-white shadow"><Cover /><div className="grid gap-8 p-6 md:grid-cols-3"><div className="md:col-span-2"><h1 className="text-3xl font-bold">{data.title}</h1><EventSummary event={data} /><p className="mt-4">Organized by {data.organizer.displayName}</p>{data.description && <section className="mt-6"><h2 className="text-xl font-bold">Description</h2><p className="mt-2 whitespace-pre-wrap">{data.description}</p></section>}</div><aside><h2 className="text-xl font-bold">Registration</h2><p className="mt-2">{data.remainingSeats < 0 ? 'Availability unavailable. Please try again.' : `${data.remainingSeats} seats remaining`}</p>{identity?.role === 'ORGANIZER' ? <p className="mt-4">Registration is available to Participant accounts.</p> : !identity ? <>{closed(data) ? <p className="mt-4">Registration is closed.</p> : data.remainingSeats <= 0 ? <p className="mt-4">This event is full.</p> : <a className={`${button} mt-4`} href={`/login?returnTo=${encodeURIComponent(`/events/${data.id}`)}`}>Log in to register</a>}</> : registration.state === 'loading' ? <p role="status" className="mt-4">Checking your registration…</p> : registration.state === 'error' ? <div role="alert" className="mt-4"><p>Unable to check your registration.</p><button className={link} onClick={() => setRegistrationRetry(value => value + 1)}>Try again</button></div> : registration.state === 'registered' ? <p role="status" className="mt-4">You are registered. <a className={link} href={`/my-registrations?registrationId=${registration.id}`}>View registration</a></p> : registration.state === 'uncertain' ? <div role="alert" className="mt-4"><p>We could not confirm your registration. Check your registrations before trying again.</p><a className={link} href="/my-registrations">Check My Registrations</a></div> : <><button disabled={registration.state === 'pending' || closed(data) || data.remainingSeats <= 0} className={`${button} mt-4`} onClick={() => void register()}>{registration.state === 'pending' ? 'Registering…' : closed(data) ? 'Closed' : data.remainingSeats <= 0 ? 'Full' : 'Register'}</button>{closed(data) && <p className="mt-2">Registration is closed.</p>}{!closed(data) && data.remainingSeats <= 0 && <p className="mt-2">This event is full.</p>}</>}</aside></div></article></>;
}
type OwnerRegistrations = {
  data: {
    event: EventData;
    summary: { capacity: number; activeRegistrations: number; remainingSeats: number };
    registrations: Array<{ id: string; displayName: string; registeredAt: string; status: string }>;
  };
  meta: { page: number; pageSize: number; total: number };
};
function OrganizerRegistrations({ eventId, expireSession }: { eventId: string; expireSession: (returnTo: string) => void }) {
  const [page, setPage] = useState(1); const [data, setData] = useState<OwnerRegistrations | null>(null);
  const [state, setState] = useState<'loading' | 'error' | 'missing' | 'ok'>('loading'); const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setData(null); setState('loading');
    fetch(`/api/organizer/events/${encodeURIComponent(eventId)}/registrations?page=${page}`, { cache: 'no-store', signal: controller.signal }).then(async response => {
      if (response.status === 401) { expireSession(`/organizer/events/${eventId}/registrations`); return null; }
      if (response.status === 403 || response.status === 404 || response.status === 422) { setState('missing'); return null; }
      if (!response.ok) throw new Error();
      return response.json() as Promise<OwnerRegistrations>;
    }).then(result => { if (result) { setData(result); setState('ok'); } }).catch(() => { if (!controller.signal.aborted) setState('error'); });
    return () => controller.abort();
  }, [eventId, page, retry]);
  if (state === 'loading') return <div role="status" className="mt-6"><p>Loading registrations…</p><div className="mt-4 grid gap-3" aria-hidden="true">{[1, 2, 3].map(row => <div key={row} className="h-16 animate-pulse rounded-xl bg-neutral-200" />)}</div></div>;
  if (state === 'missing') return <><h1 className="text-3xl font-bold">Event not found</h1><p className="mt-3">This event is unavailable.</p><a className={`${link} mt-4 inline-block min-h-11 py-2`} href="/organizer/events">Back to My Events</a></>;
  if (state === 'error') return <div role="alert"><h1 className="text-3xl font-bold">Unable to load registrations.</h1><p className="mt-2">Please try again.</p><button className={`${link} mt-2 min-h-11`} onClick={() => setRetry(value => value + 1)}>Try again</button></div>;
  if (!data) return null;
  const { event, summary, registrations } = data.data;
  return <>
    <a className={link} href="/organizer/events">My Events</a>
    <h1 className="mt-4 break-words text-3xl font-bold">{event.title} — Registrations</h1>
    <p className="mt-2">{dateRange(event)}</p><p className="mt-1 break-words">{event.location}</p>
    <section aria-label="Registration summary" className="mt-6 grid gap-4 rounded-2xl bg-white p-5 shadow sm:grid-cols-3">
      <p><span className="block text-sm text-neutral-700">Active registrations</span><strong className="mt-1 block text-2xl">{summary.activeRegistrations}</strong></p>
      <p><span className="block text-sm text-neutral-700">Capacity</span><strong className="mt-1 block text-2xl">{summary.capacity}</strong></p>
      <p><span className="block text-sm text-neutral-700">Remaining seats</span><strong className="mt-1 block text-2xl">{summary.remainingSeats}</strong></p>
    </section>
    {registrations.length === 0 ? <p className="mt-6 rounded-xl bg-white p-5">No participants have registered for this event yet.</p> : <>
      <div className="mt-6 hidden overflow-x-auto rounded-2xl bg-white shadow sm:block"><table className="w-full text-left"><caption className="sr-only">Event registrations</caption><thead><tr><th scope="col" className="p-4">#</th><th scope="col" className="p-4">Registrant</th><th scope="col" className="p-4">Registration reference</th><th scope="col" className="p-4">Registered at</th><th scope="col" className="p-4">Status</th></tr></thead><tbody>{registrations.map((row, index) => <tr key={row.id} className="border-t border-neutral-200"><td className="p-4">{(data.meta.page - 1) * data.meta.pageSize + index + 1}</td><td className="p-4 break-words">{row.displayName}</td><td className="p-4 break-all">{row.id}</td><td className="p-4">{dateFormat.format(new Date(row.registeredAt))} (UTC+7)</td><td className="p-4">{row.status}</td></tr>)}</tbody></table></div>
      <ul className="mt-6 grid gap-4 sm:hidden">{registrations.map((row, index) => <li key={row.id} className="rounded-xl bg-white p-5 shadow"><p className="text-sm text-neutral-700">Registrant {(data.meta.page - 1) * data.meta.pageSize + index + 1}</p><p className="mt-1 break-words text-lg font-semibold">{row.displayName}</p><dl className="mt-3 grid gap-3"><div><dt className="text-sm text-neutral-700">Registration reference</dt><dd className="break-all">{row.id}</dd></div><div><dt className="text-sm text-neutral-700">Registered at</dt><dd>{dateFormat.format(new Date(row.registeredAt))} (UTC+7)</dd></div><div><dt className="text-sm text-neutral-700">Status</dt><dd>{row.status}</dd></div></dl></li>)}</ul>
    </>}
    {data.meta.total > data.meta.pageSize && <div className="mt-6 flex items-center gap-4"><button className="min-h-11 underline disabled:opacity-40" disabled={data.meta.page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {data.meta.page} · {data.meta.total} total</span><button className="min-h-11 underline disabled:opacity-40" disabled={data.meta.page * data.meta.pageSize >= data.meta.total} onClick={() => setPage(value => value + 1)}>Next</button></div>}
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
    if (!/^\d+$/.test(values.capacity) || !Number.isInteger(capacity) || capacity < 1 || capacity > 60) next.capacity = 'Enter a whole number from 1 to 60.';
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
  return <><a className={link} href="/organizer/events">My Events</a><h1 className="mt-4 text-3xl font-bold">Create event</h1><p className="mt-2">Thailand time (UTC+7)</p><form ref={form} onSubmit={event => void submit(event)} noValidate className="mt-6 grid max-w-3xl gap-4 rounded-2xl bg-white p-6 shadow">{rows.map(({ key, label, type, required }) => <div key={key}><label className="mb-1 block font-semibold" htmlFor={`event-${key}`}>{label}{required && ' *'}</label>{type === 'textarea' ? <textarea id={`event-${key}`} className={field} value={values[key]} onChange={event => update(key, event.target.value)} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `error-${key}` : undefined} /> : <input id={`event-${key}`} type={type} className={field} value={values[key]} onChange={event => update(key, event.target.value)} required={required} min={key === 'capacity' ? 1 : undefined} max={key === 'capacity' ? 60 : undefined} step={key === 'capacity' ? 1 : undefined} aria-invalid={!!errors[key]} aria-describedby={errors[key] ? `error-${key}` : undefined} />}{errors[key] && <p id={`error-${key}`} className="mt-1 text-red-700">{errors[key]}</p>}</div>)}{message && <p role="alert" className="text-red-700">{message}</p>}<div className="flex flex-wrap gap-4"><button type="submit" className={button} disabled={pending || uncertain}>{pending ? 'Publishing…' : 'Publish event'}</button><button type="button" className="min-h-11 underline" disabled={pending} onClick={cancel}>Cancel</button>{uncertain && <a className="min-h-11 underline" href="/organizer/events">Check My Events</a>}</div></form></>;
}
export function EventViews({ path, identity, navigate, expireSession }: { path: string; identity: Identity | null; navigate: (target: string) => void; expireSession: (returnTo: string, keepPublicEvent?: boolean) => void }) {
  const edit = /^\/organizer\/events\/([0-9a-f-]+)\/edit$/i.exec(path);
  if (edit) return <EditEvent id={edit[1]} expireSession={expireSession} />;
  const assignment = /^\/organizer\/events\/([0-9a-f-]+)\/instructor$/i.exec(path);
  if (assignment) return <InstructorManagement eventId={assignment[1]} expireSession={expireSession} />;
  const teachingDetail = /^\/my-teaching\/([0-9a-f-]+)$/i.exec(path);
  if (teachingDetail) return <TeachingDetail eventId={teachingDetail[1]} expireSession={expireSession} />;
  if (path === '/my-teaching') return <MyTeaching expireSession={expireSession} />;
  if (path === '/events') return <EventList owner={false} expireSession={expireSession} />;
  if (path === '/my-registrations') return <MyRegistrations expireSession={expireSession} />;
  if (path === '/organizer/events') return <EventList owner expireSession={expireSession} />;
  if (path === '/organizer/events/new') return <CreateEvent navigate={navigate} expireSession={expireSession} />;
  const ownerRegistrations = path.match(/^\/organizer\/events\/([0-9a-fA-F-]+)\/registrations$/);
  if (ownerRegistrations) return <OrganizerRegistrations eventId={ownerRegistrations[1]} expireSession={expireSession} />;
  if (path.startsWith('/events/')) return <EventDetail id={path.slice('/events/'.length)} identity={identity} expireSession={expireSession} />;
  return <><h1 className="text-2xl font-bold">Page not found</h1><a className={link} href="/events">Browse events</a></>;
}
