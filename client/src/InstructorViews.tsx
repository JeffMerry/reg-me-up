import { useEffect, useState } from 'react';

type Instructor = { id: string; displayName: string };
type OwnerEvent = { id: string; title: string; startsAt: string; endsAt: string; version: number; currentInstructor: Instructor | null };
type TeachingEvent = { id: string; title: string; startsAt: string; endsAt: string; location: string; description: string | null; capacity: number; remainingSeats: number; effectiveRegistrationCutoff: string; organizer: { displayName: string } };
type Page<T> = { data: T[]; meta: { page: number; pageSize: number; total: number } };
const dateFormat = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const dateRange = (event: Pick<TeachingEvent, 'startsAt' | 'endsAt'>) => `${dateFormat.format(new Date(event.startsAt))} – ${dateFormat.format(new Date(event.endsAt))} (Thailand time, UTC+7)`;
const button = 'inline-flex min-h-11 items-center justify-center rounded-lg bg-orange-700 px-4 py-2 font-semibold text-white hover:bg-orange-800 disabled:opacity-50';
const secondary = 'inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral-800 px-4 py-2 font-semibold text-white hover:bg-neutral-700 disabled:opacity-50';
const link = 'font-semibold text-orange-800 underline';
const field = 'w-full rounded-lg border border-neutral-400 bg-white px-3 py-2 focus:outline-2 focus:outline-orange-700';

async function responseJson<T>(response: Response): Promise<T> { return response.json() as Promise<T>; }
function ErrorBox({ children }: { children: string }) { return <p role="alert" className="mt-4 text-red-800">{children}</p>; }

export function InstructorManagement({ eventId, expireSession }: { eventId: string; expireSession: (returnTo: string) => void }) {
  const [event, setEvent] = useState<OwnerEvent | null>(null);
  const [directory, setDirectory] = useState<Page<Instructor> | null>(null);
  const [directoryPage, setDirectoryPage] = useState(1);
  const [state, setState] = useState<'loading' | 'error' | 'missing' | 'ok'>('loading');
  const [message, setMessage] = useState('');
  const [selected, setSelected] = useState('');
  const [pending, setPending] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState('loading'); setEvent(null); setDirectory(null); setMessage('');
    void (async () => {
      try {
        const [eventResponse, directoryResponse] = await Promise.all([
          fetch(`/api/organizer/events/${encodeURIComponent(eventId)}`, { cache: 'no-store', signal: controller.signal }),
          fetch(`/api/organizer/instructors?page=${directoryPage}`, { cache: 'no-store', signal: controller.signal }),
        ]);
        if (eventResponse.status === 401 || directoryResponse.status === 401) { expireSession(`/organizer/events/${eventId}/instructor`); return; }
        if (eventResponse.status === 404) { setState('missing'); return; }
        if (!eventResponse.ok || !directoryResponse.ok) throw new Error();
        const owner = (await responseJson<{ data: OwnerEvent }>(eventResponse)).data;
        const instructors = await responseJson<Page<Instructor>>(directoryResponse);
        if (controller.signal.aborted) return;
        setEvent(owner); setDirectory(instructors); setSelected(owner.currentInstructor?.id ?? ''); setState('ok'); setBlocked(false);
      } catch { if (!controller.signal.aborted) setState('error'); }
    })();
    return () => controller.abort();
  }, [eventId, directoryPage, retry]);

  async function refresh() { setRetry(value => value + 1); }
  async function mutate(remove: boolean) {
    if (!event || !directory || pending || blocked) return;
    if (remove && !event.currentInstructor) return;
    if (!remove && !selected) { setMessage('Choose an Instructor first.'); return; }
    const name = event.currentInstructor?.displayName;
    const nextName = directory.data.find(item => item.id === selected)?.displayName ?? event.currentInstructor?.displayName;
    const prompt = remove ? `Remove ${name} from ${event.title}?` : event.currentInstructor && event.currentInstructor.id !== selected ? `Replace ${name} with ${nextName} for ${event.title}?` : `Assign ${nextName} to ${event.title}?`;
    if (!window.confirm(prompt)) return;
    setPending(true); setMessage('');
    try {
      const bootstrap = await fetch('/api/auth/csrf', { cache: 'no-store' });
      if (!bootstrap.ok) throw new Error();
      const token = (await bootstrap.json()).data.csrfToken as string;
      const response = await fetch(`/api/organizer/events/${encodeURIComponent(eventId)}/instructor`, {
        method: remove ? 'DELETE' : 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
        body: JSON.stringify(remove ? { expectedVersion: event.version } : { expectedVersion: event.version, instructorId: selected }),
      });
      if (response.status === 401) { setEvent(null); setDirectory(null); expireSession(`/organizer/events/${eventId}/instructor`); return; }
      const result = await response.json().catch(() => ({})) as { data?: OwnerEvent; error?: { code?: string; fieldErrors?: Record<string, string> } };
      if (response.status === 409) { setBlocked(true); setMessage(result.error?.code === 'EVENT_CHANGED' ? 'This event changed. Reload it and review the assignment before trying again.' : result.error?.code === 'EVENT_STARTED' ? 'This event has started, so its Instructor can no longer be changed.' : 'This Instructor is unavailable for the event time.'); return; }
      if (response.status === 422) { setMessage(result.error?.fieldErrors?.instructorId ?? 'Unable to save this assignment. Check your selection.'); return; }
      if (!response.ok || !result.data) throw new Error();
      setEvent(result.data); setSelected(result.data.currentInstructor?.id ?? ''); setMessage(remove ? 'Instructor removed.' : 'Assignment saved.');
    } catch { setBlocked(true); setMessage('We could not confirm the change. Reload the event before trying again.'); }
    finally { setPending(false); }
  }

  return <>
    <a className={link} href="/organizer/events">My Events</a>
    {state === 'loading' && <p role="status" className="mt-4">Loading Instructor assignment…</p>}
    {state === 'error' && <div className="mt-4"><ErrorBox>Unable to load this event or the Instructor list.</ErrorBox><button className={`${link} mt-3 min-h-11`} onClick={() => void refresh()}>Try again</button></div>}
    {state === 'missing' && <ErrorBox>Event not found.</ErrorBox>}
    {state === 'ok' && event && directory && <>
      <h1 className="mt-4 text-3xl font-bold">Manage Instructor</h1>
      <section className="mt-6 max-w-2xl rounded-2xl bg-white p-6 shadow">
        <h2 className="text-xl font-bold">{event.title}</h2>
        <p className="mt-2">{dateRange(event)}</p>
        <p className="mt-4">Current Instructor: <strong>{event.currentInstructor?.displayName ?? 'None assigned'}</strong></p>
        {directory.meta.total === 0 ? <p className="mt-4">No Instructor accounts are available.</p> : <>
          <label className="mt-5 block font-semibold" htmlFor="instructor-select">Choose an Instructor</label>
          <select id="instructor-select" className={`${field} mt-2`} value={selected} disabled={pending || blocked} onChange={event => { setSelected(event.target.value); setMessage(''); }}>
            <option value="">Select an Instructor</option>
            {event.currentInstructor && !directory.data.some(item => item.id === event.currentInstructor?.id) && <option value={event.currentInstructor.id}>{event.currentInstructor.displayName}</option>}
            {directory.data.map(item => <option key={item.id} value={item.id}>{item.displayName}</option>)}
          </select>
          <div className="mt-3"><button className={button} disabled={pending || blocked || !selected} onClick={() => void mutate(false)}>{pending ? 'Saving…' : 'Save Instructor'}</button></div>
          {directory.meta.total > directory.meta.pageSize && <div className="mt-4 flex items-center gap-4"><button className={`${link} min-h-11`} disabled={directoryPage <= 1} onClick={() => setDirectoryPage(value => value - 1)}>Previous Instructors</button><span>Page {directory.meta.page} of {Math.ceil(directory.meta.total / directory.meta.pageSize)}</span><button className={`${link} min-h-11`} disabled={directoryPage * directory.meta.pageSize >= directory.meta.total} onClick={() => setDirectoryPage(value => value + 1)}>Next Instructors</button></div>}
        </>}
        {event.currentInstructor && <div className="mt-3"><button className={secondary} disabled={pending || blocked} onClick={() => void mutate(true)}>Remove Instructor</button></div>}
        {message && <p role={blocked ? 'alert' : 'status'} className="mt-4">{message}</p>}
        {blocked && <button className={`${link} mt-2 min-h-11`} onClick={() => void refresh()}>Reload event</button>}
      </section>
    </>}
  </>;
}

export function MyTeaching({ expireSession }: { expireSession: (returnTo: string) => void }) {
  const [page, setPage] = useState(1); const [retry, setRetry] = useState(0);
  const [data, setData] = useState<Page<TeachingEvent> | null>(null);
  const [state, setState] = useState<'loading' | 'error' | 'ok'>('loading');
  useEffect(() => {
    const controller = new AbortController(); setState('loading'); setData(null);
    fetch(`/api/me/teaching-events?page=${page}`, { cache: 'no-store', signal: controller.signal }).then(async response => {
      if (response.status === 401) { expireSession('/my-teaching'); return null; }
      if (!response.ok) throw new Error();
      return response.json() as Promise<Page<TeachingEvent>>;
    }).then(result => { if (!controller.signal.aborted && result) { setData(result); setState('ok'); } })
      .catch(() => { if (!controller.signal.aborted) setState('error'); });
    return () => controller.abort();
  }, [page, retry]);
  return <>
    <h1 className="text-3xl font-bold">My Teaching</h1>
    {state === 'loading' && <p role="status" className="mt-6">Loading teaching events…</p>}
    {state === 'error' && <div className="mt-6"><ErrorBox>Unable to load teaching events.</ErrorBox><button className={`${link} mt-3 min-h-11`} onClick={() => setRetry(value => value + 1)}>Try again</button></div>}
    {state === 'ok' && data && data.data.length === 0 && <p className="mt-6">You have no assigned teaching events.</p>}
    {state === 'ok' && data && data.data.length > 0 && <>
      <ul className="mt-6 grid gap-4">{data.data.map(event => <li key={event.id} className="rounded-2xl bg-white p-5 shadow"><h2 className="text-xl font-bold"><a className={link} href={`/my-teaching/${event.id}`}>{event.title}</a></h2><p className="mt-2">{dateRange(event)}</p><p className="mt-1">{event.location}</p><a className={`${link} mt-3 inline-block min-h-11 py-2`} href={`/my-teaching/${event.id}`}>View teaching details</a></li>)}</ul>
      <div className="mt-6 flex items-center gap-4"><button className="min-h-11 underline disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Previous</button><span>Page {data.meta.page} · {data.meta.total} events</span><button className="min-h-11 underline disabled:opacity-40" disabled={page * data.meta.pageSize >= data.meta.total} onClick={() => setPage(value => value + 1)}>Next</button></div>
    </>}
  </>;
}

export function TeachingDetail({ eventId, expireSession }: { eventId: string; expireSession: (returnTo: string) => void }) {
  const [data, setData] = useState<TeachingEvent | null>(null); const [state, setState] = useState<'loading' | 'error' | 'missing' | 'ok'>('loading'); const [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setState('loading'); setData(null);
    fetch(`/api/me/teaching-events/${encodeURIComponent(eventId)}`, { cache: 'no-store', signal: controller.signal }).then(async response => {
      if (response.status === 401) { expireSession(`/my-teaching/${eventId}`); return null; }
      if (response.status === 404) { setState('missing'); return null; }
      if (!response.ok) throw new Error();
      return (await responseJson<{ data: TeachingEvent }>(response)).data;
    }).then(result => { if (!controller.signal.aborted && result) { setData(result); setState('ok'); } })
      .catch(() => { if (!controller.signal.aborted) setState('error'); });
    return () => controller.abort();
  }, [eventId, retry]);
  return <>
    <a className={link} href="/my-teaching">My Teaching</a>
    {state === 'loading' && <p role="status" className="mt-4">Loading teaching details…</p>}
    {state === 'error' && <div className="mt-4"><ErrorBox>Unable to load teaching details.</ErrorBox><button className={`${link} mt-3 min-h-11`} onClick={() => setRetry(value => value + 1)}>Try again</button></div>}
    {state === 'missing' && <ErrorBox>Teaching event not found.</ErrorBox>}
    {state === 'ok' && data && <article className="mt-4 max-w-3xl rounded-2xl bg-white p-6 shadow"><h1 className="text-3xl font-bold">{data.title}</h1><dl className="mt-5 grid gap-4 sm:grid-cols-2"><div><dt className="font-semibold">Date and time</dt><dd className="mt-1">{dateRange(data)}</dd></div><div><dt className="font-semibold">Location</dt><dd className="mt-1">{data.location}</dd></div><div><dt className="font-semibold">Organizer</dt><dd className="mt-1">{data.organizer.displayName}</dd></div><div><dt className="font-semibold">Capacity</dt><dd className="mt-1">{data.capacity}</dd></div><div><dt className="font-semibold">Remaining seats</dt><dd className="mt-1">{data.remainingSeats}</dd></div><div><dt className="font-semibold">Registration cutoff</dt><dd className="mt-1">{dateFormat.format(new Date(data.effectiveRegistrationCutoff))} (Thailand time, UTC+7)</dd></div></dl>{data.description && <section className="mt-6 border-t border-neutral-200 pt-5"><h2 className="text-lg font-bold">Teaching details</h2><p className="mt-2 whitespace-pre-wrap break-words leading-7">{data.description}</p></section>}</article>}
  </>;
}
