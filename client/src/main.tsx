import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { EventViews } from './EventViews';
import './styles.css';

type Identity = { id: string; displayName: string; role: 'PARTICIPANT' | 'ORGANIZER' | 'INSTRUCTOR' };
const uuid = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
function destination(value: string | null, role: Identity['role']) {
  const fallback = role === 'ORGANIZER' ? '/organizer/events' : role === 'INSTRUCTOR' ? '/my-teaching' : '/events';
  if (!value || /[%\\#]/.test(value)) return fallback;
  if (value === '/events' || new RegExp(`^/events/${uuid}$`).test(value)) return value;
  if (role === 'PARTICIPANT' && (value === '/my-registrations' || new RegExp(`^/my-registrations\\?registrationId=${uuid}$`).test(value))) return value;
  if (role === 'ORGANIZER' && (value === '/organizer/events' || value === '/organizer/events/new' || new RegExp(`^/organizer/events/${uuid}/(?:registrations|edit|check-ins)$`).test(value))) return value;
  if (role === 'ORGANIZER' && new RegExp(`^/organizer/events/${uuid}/instructor$`).test(value)) return value;
  if (role === 'INSTRUCTOR' && (value === '/my-teaching' || new RegExp(`^/my-teaching/${uuid}$`).test(value))) return value;
  return fallback;
}
type Result = { data?: any; error?: { code: string; fieldErrors?: Record<string, string> } };
async function json(response: Response): Promise<Result> { return response.json() as Promise<Result>; }
function App() {
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [path, setPath] = useState(location.pathname);
  const [menuOpen, setMenuOpen] = useState(false);
  function navigate(target: string, replace = false) { history[replace ? 'replaceState' : 'pushState']({}, '', target); setPath(location.pathname); }
  function expireSession(returnTo: string, keepPublicEvent = false) {
    setIdentity(null); setToken(''); setError('Your session has expired. Please log in again.');
    if (!keepPublicEvent) navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`, true);
  }
  async function refresh() {
    setLoading(true);
    try { const response = await fetch('/api/auth/me', { cache: 'no-store' }); if (response.ok) setIdentity((await json(response)).data as Identity); else if (response.status === 401) setIdentity(null); else throw new Error(); }
    catch { setIdentity(null); setError('Unable to check your session. Please try again.'); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    void refresh();
    const back = () => { setPath(location.pathname); void refresh(); };
    const restored = (event: PageTransitionEvent) => { if (event.persisted) void refresh(); };
    window.addEventListener('popstate', back);
    window.addEventListener('pageshow', restored);
    return () => { window.removeEventListener('popstate', back); window.removeEventListener('pageshow', restored); };
  }, []);
  useEffect(() => { const key = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); }; window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key); }, []);
  useEffect(() => {
    if (loading) return;
    if (path === '/') navigate('/events', true);
    else if (path === '/login' && identity) navigate(destination(new URLSearchParams(location.search).get('returnTo'), identity.role), true);
    else if (!identity && (path.startsWith('/organizer/') || path === '/my-registrations' || path === '/my-teaching' || path.startsWith('/my-teaching/'))) navigate(`/login?returnTo=${encodeURIComponent(path)}`, true);
  }, [loading, identity, path]);
  async function bootstrap() { const r = await fetch('/api/auth/csrf', { cache: 'no-store' }); if (!r.ok) throw new Error(); const t = (await json(r)).data.csrfToken as string; setToken(t); return t; }
  async function login(event: React.FormEvent) {
    event.preventDefault(); if (pending) return;
    const next: Record<string, string> = {};
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email.';
    if (!password) next.password = 'Enter your password.';
    setFields(next); setError('');
    if (Object.keys(next).length) { document.getElementById(next.email ? 'email' : 'password')?.focus(); return; }
    setPending(true);
    try {
      const csrf = await bootstrap();
      const response = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: JSON.stringify({ email, password }) });
      const result = await json(response);
      if (!response.ok) { setFields(result.error?.fieldErrors ?? {}); setError(result.error?.code === 'INVALID_CREDENTIALS' ? 'Incorrect email or password.' : 'Unable to log in. Please try again.'); return; }
      setToken(result.data.csrfToken); setPassword(''); setIdentity(result.data.user as Identity);
      navigate(destination(new URLSearchParams(location.search).get('returnTo'), result.data.user.role), true);
    } catch { setError('Unable to log in. Please try again.'); } finally { setPending(false); }
  }
  async function logout() {
    if (pending) return; setPending(true); setError('');
    try {
      const csrf = token || await bootstrap();
      const response = await fetch('/api/auth/logout', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf }, body: '{}' });
      if (response.status === 401) { setIdentity(null); setToken(''); setError('Your session has expired. Please log in again.'); if (!new RegExp(`^/events/${uuid}$`).test(path)) navigate('/events'); }
      else if (!response.ok) throw new Error();
      else { setIdentity(null); setToken(''); navigate('/events'); }
    } catch { setError('Unable to log out. Please try again.'); } finally { setPending(false); }
  }
  const instructorPath = path === '/my-teaching' || path.startsWith('/my-teaching/');
  const denied = identity && ((path.startsWith('/organizer/') && identity.role !== 'ORGANIZER') || (path === '/my-registrations' && identity.role !== 'PARTICIPANT') || (instructorPath && identity.role !== 'INSTRUCTOR'));
  return <><header className="flex flex-wrap items-center justify-between gap-4 bg-neutral-900 px-4 py-4 text-white md:px-6"><a href="/events" className="text-xl font-bold">RegMeUp</a><button type="button" className="min-h-11 min-w-11 rounded border px-3 md:hidden" aria-label="Toggle navigation" aria-controls="main-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>Menu</button><nav id="main-navigation" className={`${menuOpen ? 'flex' : 'hidden'} w-full flex-col items-start gap-4 md:flex md:w-auto md:flex-row md:items-center`} aria-label="Main navigation"><a href="/events">Events</a>{loading ? <span>Checking session…</span> : identity ? <><a href={identity.role === 'ORGANIZER' ? '/organizer/events' : identity.role === 'INSTRUCTOR' ? '/my-teaching' : '/my-registrations'}>{identity.role === 'ORGANIZER' ? 'My Events' : identity.role === 'INSTRUCTOR' ? 'My Teaching' : 'My Registrations'}</a><span>{identity.displayName} ({identity.role})</span><button type="button" onClick={() => void logout()} disabled={pending}>{pending ? 'Logging out…' : 'Log out'}</button></> : <a href={path.startsWith('/events/') ? `/login?returnTo=${encodeURIComponent(path)}` : '/login'}>Log in</a>}</nav></header>
  <main className="mx-auto max-w-5xl px-5 py-10"><p role="status" aria-live="polite" className="text-red-700">{error}</p>{loading ? <p>Checking session…</p> : path === '/login' && !identity ? <div className="grid overflow-hidden rounded-2xl bg-white shadow md:grid-cols-2"><section className="bg-neutral-900 p-8 text-white"><div className="text-5xl text-orange-500" aria-hidden="true">🎟</div><h1 className="mt-6 text-3xl font-bold">Welcome to RegMeUp</h1><p className="mt-4">Discover university activities and workshops.</p></section><section className="p-8"><h2 className="text-2xl font-bold">Log in</h2><form onSubmit={event => void login(event)} noValidate className="mt-6 grid gap-4"><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} aria-invalid={!!fields.email} aria-describedby={fields.email ? 'email-error' : undefined} className="rounded border p-3" />{fields.email && <p id="email-error" className="text-red-700">{fields.email}</p>}<label htmlFor="password">Password</label><input id="password" type={visible ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} aria-invalid={!!fields.password} aria-describedby={fields.password ? 'password-error' : undefined} className="rounded border p-3" />{fields.password && <p id="password-error" className="text-red-700">{fields.password}</p>}<button type="button" className="text-left underline" onClick={() => setVisible(!visible)}>{visible ? 'Hide password' : 'Show password'}</button><button disabled={pending} className="rounded bg-orange-700 p-3 font-bold text-white disabled:opacity-60">{pending ? 'Logging in…' : 'Log in'}</button></form><a className="mt-5 inline-block underline" href="/events">Browse events</a></section></div> : denied ? <><h1 className="text-2xl font-bold">Access Denied</h1><p>You do not have access to this page.</p></> : <EventViews key={path} path={path} identity={identity} navigate={navigate} expireSession={expireSession} />}</main></>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
