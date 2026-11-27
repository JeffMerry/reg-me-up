import { useEffect, useRef, useState, type FormEvent } from 'react';

type EventData = { id: string; title: string; startsAt: string; endsAt: string; location: string; capacity: number; description: string | null; registrationDeadline: string | null; effectiveRegistrationCutoff: string; version: number; activeRegistrationCount: number };
type Values = Record<'title' | 'startsAt' | 'endsAt' | 'location' | 'capacity' | 'description' | 'registrationDeadline', string>;
const local = (iso: string) => new Date(Date.parse(iso) + 7 * 3600000).toISOString().slice(0, 23);
const valuesOf = (event: EventData): Values => ({ title: event.title, startsAt: local(event.startsAt), endsAt: local(event.endsAt), location: event.location, capacity: String(event.capacity), description: event.description ?? '', registrationDeadline: event.registrationDeadline ? local(event.registrationDeadline) : '' });
const fields = [{ key: 'title', label: 'Event name', type: 'text' }, { key: 'startsAt', label: 'Start date and time', type: 'datetime-local' }, { key: 'endsAt', label: 'End date and time', type: 'datetime-local' }, { key: 'location', label: 'Location', type: 'text' }, { key: 'capacity', label: 'Capacity', type: 'number' }, { key: 'description', label: 'Description (optional)', type: 'textarea' }, { key: 'registrationDeadline', label: 'Registration deadline (optional)', type: 'datetime-local' }] as const;
const button = 'min-h-11 rounded-lg bg-orange-700 px-4 py-2 font-semibold text-white disabled:opacity-50';

export function EditEvent({ id, expireSession }: { id: string; expireSession: (returnTo: string) => void }) {
  const [data, setData] = useState<EventData | null>(null), [values, setValues] = useState<Values | null>(null);
  const [loading, setLoading] = useState(true), [pending, setPending] = useState(false), [reloadRequired, setReloadRequired] = useState(false);
  const [message, setMessage] = useState(''), [errors, setErrors] = useState<Record<string, string>>({});
  const alive = useRef(true), busy = useRef(false), sequence = useRef(0);
  const path = `/organizer/events/${id}/edit`;
  const dirty = data && values && Object.keys(values).some(key => values[key as keyof Values] !== valuesOf(data)[key as keyof Values]);
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (dirty || pending) { event.preventDefault(); event.returnValue = ''; } }; window.addEventListener('beforeunload', warn); return () => window.removeEventListener('beforeunload', warn); }, [dirty, pending]);
  function apply(row: EventData) { setData(row); setValues(valuesOf(row)); setReloadRequired(false); setErrors({}); }
  function expire() { setData(null); setValues(null); expireSession(path); }
  async function load() {
    const current = ++sequence.current; setLoading(true); setMessage('');
    try {
      const response = await fetch(`/api/organizer/events/${id}`, { cache: 'no-store' });
      if (!alive.current || current !== sequence.current) return;
      if (response.status === 401) { expire(); return; }
      if (response.status === 403 || response.status === 404) { setData(null); setValues(null); throw new Error('Event unavailable.'); }
      if (!response.ok) throw new Error('Unable to load event. Please try again.');
      const result = await response.json();
      if (alive.current && current === sequence.current) apply(result.data);
    } catch (error) { if (alive.current && current === sequence.current) { setReloadRequired(true); setMessage(error instanceof Error ? error.message : 'Unable to load event.'); } }
    finally { if (alive.current && current === sequence.current) setLoading(false); }
  }
  useEffect(() => { alive.current = true; void load(); return () => { alive.current = false; sequence.current++; }; }, [id]);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!data || !values || busy.current || reloadRequired) return;
    const original = valuesOf(data); const input: Record<string, unknown> = { expectedVersion: data.version }; const next: Record<string, string> = {};
    for (const field of fields) {
      const key = field.key; if (values[key] === original[key]) continue;
      if (key === 'capacity') { const n = Number(values[key]); if (!/^\d+$/.test(values[key]) || !Number.isInteger(n) || n < 1 || n > 60) next.capacity = 'Enter a whole number from 1 to 60.'; input[key] = n; }
      else if (key === 'registrationDeadline' && !values[key]) input[key] = null;
      else if (field.type === 'datetime-local') { const time = new Date(`${values[key]}+07:00`); if (!Number.isFinite(time.getTime())) next[key] = 'Enter a valid date and time.'; else input[key] = time.toISOString(); }
      else input[key] = key === 'description' && !values[key].trim() ? null : values[key];
    }
    setErrors(next); setMessage('');
    if (Object.keys(next).length) { document.getElementById(`edit-${Object.keys(next)[0]}`)?.focus(); return; }
    if (Object.keys(input).length === 1) { setMessage('No changes to save.'); return; }
    busy.current = true; setPending(true);
    try {
      const csrf = await fetch('/api/auth/csrf', { cache: 'no-store' }); if (!csrf.ok) throw new Error();
      const token = (await csrf.json()).data.csrfToken as string;
      const response = await fetch(`/api/organizer/events/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token }, body: JSON.stringify(input) });
      if (!alive.current) return;
      if (response.status === 401) { expire(); return; }
      if (response.status === 403 || response.status === 404) { setData(null); setValues(null); setMessage('Event unavailable.'); return; }
      const result = await response.json(); if (!alive.current) return;
      if (response.ok) { apply(result.data); setMessage('Changes saved.'); }
      else if (response.status === 422) { setErrors(result.error.fieldErrors ?? {}); setMessage('Check the highlighted fields.'); const key = Object.keys(result.error.fieldErrors ?? {})[0]; window.setTimeout(() => document.getElementById(`edit-${key}`)?.focus(), 0); }
      else if (response.status === 409) { setReloadRequired(true); setMessage(result.error.message); }
      else throw new Error();
    } catch { if (alive.current) { setReloadRequired(true); setMessage('We could not confirm the edit. Reload the event before saving again.'); } }
    finally { busy.current = false; if (alive.current) setPending(false); }
  }
  const started = data && Date.now() >= Date.parse(data.startsAt);
  return <><a className="font-semibold text-orange-800 underline" href="/organizer/events" onClick={event => { if (pending || (dirty && !window.confirm('Discard your unsaved changes?'))) event.preventDefault(); }}>My Events</a><h1 className="mt-4 text-3xl font-bold">Edit event</h1><p className="mt-2">Thailand time (UTC+7)</p>
    {message && <p role={reloadRequired || Object.keys(errors).length ? 'alert' : 'status'} className="mt-4">{message}</p>}
    {loading ? <p role="status">Loading event…</p> : !data || !values ? <button className={`${button} mt-4`} onClick={() => void load()}>Try again</button> : <>
      <p className="mt-4">Active registrations: {data.activeRegistrationCount}. Leave the deadline empty to accept registrations until the event starts.</p>
      {data.capacity > 60 && <p className="mt-2">This existing event has capacity {data.capacity}. Leave Capacity unchanged to keep it. A new capacity must be 1–60 and cover all active registrations.</p>}
      {started && <p role="alert" className="mt-4">This event has started and cannot be edited.</p>}
      <form onSubmit={event => void submit(event)} noValidate className="mt-6 grid max-w-3xl gap-4 rounded-2xl bg-white p-6 shadow"><fieldset disabled={pending || loading || !!started || reloadRequired} className="grid gap-4">{fields.map(field => <div key={field.key}><label className="mb-1 block font-semibold" htmlFor={`edit-${field.key}`}>{field.label}</label>{field.type === 'textarea' ? <textarea id={`edit-${field.key}`} className="w-full rounded-lg border p-3" value={values[field.key]} onChange={e => setValues({ ...values, [field.key]: e.target.value })} aria-invalid={!!errors[field.key]} aria-describedby={errors[field.key] ? `edit-error-${field.key}` : undefined} /> : <input id={`edit-${field.key}`} className="w-full rounded-lg border p-3" type={field.type} step={field.type === 'datetime-local' ? 'any' : field.key === 'capacity' ? 1 : undefined} min={field.key === 'capacity' ? 1 : undefined} max={field.key === 'capacity' ? 60 : undefined} value={values[field.key]} onChange={e => setValues({ ...values, [field.key]: e.target.value })} aria-invalid={!!errors[field.key]} aria-describedby={errors[field.key] ? `edit-error-${field.key}` : undefined} />}{errors[field.key] && <p id={`edit-error-${field.key}`} className="mt-1 text-red-700">{errors[field.key]}</p>}</div>)}<button className={button} type="submit">{pending ? 'Saving…' : 'Save changes'}</button></fieldset></form>
    </>}
    {reloadRequired && <button className={`${button} mt-4`} disabled={pending || loading} onClick={() => { if (!dirty || window.confirm('Reload the saved event and discard unsaved changes?')) void load(); }}>Reload event</button>}
  </>;
}
