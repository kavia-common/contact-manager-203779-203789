const cors = require('cors');
const express = require('express');
const routes = require('./routes');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../swagger');
const { getDb } = require('./db/sqlite');
const { notFoundHandler, errorHandler } = require('./middleware/errors');

// Initialize express app
const app = express();

/**
 * CORS:
 * - In hosted preview, set CONTACT_MANAGER_FRONTEND_ORIGIN to the frontend URL (e.g. https://...:3000).
 * - In local/dev, we allow all origins by default for convenience.
 */
const allowedOrigins = (process.env.CONTACT_MANAGER_FRONTEND_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Non-browser clients (curl/postman) may not send Origin
      if (!origin) return cb(null, true);

      // If not configured, keep permissive dev behavior.
      if (allowedOrigins.length === 0) return cb(null, true);

      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
app.set('trust proxy', true);
app.use('/docs', swaggerUi.serve, (req, res, next) => {
  const host = req.get('host'); // may or may not include port
  let protocol = req.protocol; // http or https

  const actualPort = req.socket.localPort;
  const hasPort = host.includes(':');

  const needsPort =
    !hasPort &&
    ((protocol === 'http' && actualPort !== 80) ||
      (protocol === 'https' && actualPort !== 443));
  const fullHost = needsPort ? `${host}:${actualPort}` : host;
  protocol = req.secure ? 'https' : protocol;

  const dynamicSpec = {
    ...swaggerSpec,
    servers: [
      {
        url: `${protocol}://${fullHost}`,
      },
    ],
  };
  swaggerUi.setup(dynamicSpec)(req, res, next);
});

// Provide a stable OpenAPI JSON endpoint that matches the spec shown in /docs.
app.get('/openapi.json', (req, res) => {
  const host = req.get('host');
  let protocol = req.protocol;

  const actualPort = req.socket.localPort;
  const hasPort = host.includes(':');
  const needsPort =
    !hasPort &&
    ((protocol === 'http' && actualPort !== 80) ||
      (protocol === 'https' && actualPort !== 443));
  const fullHost = needsPort ? `${host}:${actualPort}` : host;
  protocol = req.secure ? 'https' : protocol;

  const dynamicSpec = {
    ...swaggerSpec,
    servers: [
      {
        url: `${protocol}://${fullHost}`,
      },
    ],
  };

  res.json(dynamicSpec);
});

// Parse JSON request body
app.use(express.json());

// Initialize SQLite and run migrations on startup.
// If the DB cannot be initialized, fail fast (better than serving a broken API).
getDb().catch((err) => {
  console.error('Failed to initialize SQLite database:', err);
  process.exit(1);
});

// Mount routes
app.use('/', routes);

// 404 handler for unknown routes (consistent JSON error)
app.use(notFoundHandler);

// Error handling middleware (consistent JSON errors)
app.use(errorHandler);

module.exports = app;
