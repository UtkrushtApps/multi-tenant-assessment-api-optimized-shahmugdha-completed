const app = require('./app');
const connectDatabase = require('./database');

const PORT = 3000;

(async () => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      // Basic startup log
      console.log(`API server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
})();
