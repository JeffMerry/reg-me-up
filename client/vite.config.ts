import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  server: { proxy: { '/api': process.env.REGMEUP_API_PROXY_TARGET ?? loadEnv(mode, process.cwd(), 'REGMEUP_').REGMEUP_API_PROXY_TARGET ?? 'http://localhost:3000' } },
}));
