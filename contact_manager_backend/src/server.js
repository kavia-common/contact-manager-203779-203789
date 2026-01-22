const app = require('./app');
const { closeDb } = require('./db/sqlite');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} signal received: closing HTTP server`);
  server.close(async () => {
    try {
      await closeDb();
      console.log('SQLite connection closed');
    } catch (err) {
      console.error('Error closing SQLite connection:', err);
    }
    console.log('HTTP server closed');
    process.exit(0);
  });
}

// Graceful shutdown
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;
