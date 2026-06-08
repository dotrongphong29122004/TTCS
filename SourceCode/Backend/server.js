require('dotenv').config();
const app = require('./config/app');
const { connectDB, closeDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(' NoiThat Backend đang chạy!');
    console.log(`   URL: http://localhost:${PORT}`);
    console.log(`   ENV: ${process.env.NODE_ENV}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n Nhận tín hiệu ${signal}, đang tắt server...`);
    server.close(async () => {
      await closeDB();
      console.log(' Server đã tắt an toàn');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
  process.on('unhandledRejection', (err) => {
    console.error(' Unhandled Rejection:', err.message);
    shutdown('unhandledRejection');
  });
};

startServer();