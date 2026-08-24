import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiPlugin = () => ({
  name: 'api-serverless-middleware',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url.startsWith('/api/')) {
        const url = new URL(req.url, 'http://localhost');
        const pathname = url.pathname;

        let handler;
        if (pathname === '/api/orders') handler = (await import('./api/orders.js')).default || require('./api/orders.js');
        else if (pathname === '/api/accounts') handler = (await import('./api/accounts.js')).default || require('./api/accounts.js');
        else if (pathname === '/api/sync') handler = (await import('./api/sync.js')).default || require('./api/sync.js');

        if (handler) {
          // Parse JSON body if present
          let body = {};
          if (req.method === 'POST' || req.method === 'PUT' || req.method === 'DELETE') {
            const buffers = [];
            for await (const chunk of req) buffers.push(chunk);
            const data = Buffer.concat(buffers).toString();
            try {
              body = data ? JSON.parse(data) : {};
            } catch (e) {
              body = {};
            }
          }

          // Mock Express-like res methods
          const enhancedReq = Object.assign(req, {
            body,
            query: Object.fromEntries(url.searchParams.entries()),
          });

          const enhancedRes = Object.assign(res, {
            status: (code) => {
              res.statusCode = code;
              return enhancedRes;
            },
            json: (data) => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(data));
            },
            send: (data) => res.end(data),
          });

          return handler(enhancedReq, enhancedRes);
        }
      }
      next();
    });
  },
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), apiPlugin()],
});
