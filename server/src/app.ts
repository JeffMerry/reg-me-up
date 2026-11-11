import express from 'express';

export function createApp(checkDatabase: () => Promise<void>) {
  const app = express();
  app.disable('x-powered-by');
  app.get('/api/health', async (_req, res) => {
    try { await checkDatabase(); res.status(200).json({ status: 'ok' }); }
    catch { res.status(503).json({ status: 'unavailable' }); }
  });
  return app;
}
