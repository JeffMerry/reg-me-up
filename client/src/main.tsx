import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

function App() {
  return <main className="mx-auto max-w-5xl px-6 py-12"><h1 className="text-3xl font-bold text-ink">RegMeUp</h1><p className="mt-3 text-ink">University activities and workshops</p></main>;
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
