export interface ServerConfig {
  nodeEnv: 'development' | 'test' | 'production';
  port: number;
  databaseUrl: string;
  sessionSecret: string;
  appOrigin: string;
}

export function parseConfig(env: NodeJS.ProcessEnv): ServerConfig {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const port = Number(env.PORT ?? '3000');
  const databaseUrl = env.DATABASE_URL ?? '';
  const sessionSecret = env.SESSION_SECRET ?? '';
  const appOrigin = env.APP_ORIGIN ?? '';
  let validUrl = false;
  let validOrigin = false;
  try { const url = new URL(databaseUrl); validUrl = ['postgres:', 'postgresql:'].includes(url.protocol) && Boolean(url.hostname && url.pathname.slice(1)); } catch { /* invalid */ }
  try { const url = new URL(appOrigin); validOrigin = ['http:', 'https:'].includes(url.protocol) && url.origin === appOrigin; } catch { /* invalid */ }
  if (!['development', 'test', 'production'].includes(nodeEnv) || !Number.isInteger(port) || port < 1 || port > 65535 || !validUrl || sessionSecret.length < 32 || !validOrigin) {
    throw new Error('Invalid server configuration');
  }
  return { nodeEnv: nodeEnv as ServerConfig['nodeEnv'], port, databaseUrl, sessionSecret, appOrigin };
}
