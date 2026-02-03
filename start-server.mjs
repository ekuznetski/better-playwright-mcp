#!/usr/bin/env node
/**
 * Better Playwright HTTP Server
 *
 * Starts the HTTP server that provides browser automation with
 * getOutline and searchSnapshot for token-efficient operations.
 *
 * Usage:
 *   better-playwright-server
 *   better-playwright-server --headless
 *   PORT=3103 better-playwright-server
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { PlaywrightServer } = await import(join(__dirname, 'dist/server/playwright-server.js'));

const server = new PlaywrightServer();

server.start().then(() => {
  console.log(`Better Playwright HTTP server started on http://localhost:${server.port}`);
});

process.on('SIGINT', async () => {
  console.log('\nShutting down...');
  await server.stop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await server.stop();
  process.exit(0);
});
