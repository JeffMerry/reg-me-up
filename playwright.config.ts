import { defineConfig } from '@playwright/test';

// Domain journeys are added with the corresponding feature contracts.
export default defineConfig({ testDir: './e2e', use: { baseURL: 'http://localhost:5173' } });
