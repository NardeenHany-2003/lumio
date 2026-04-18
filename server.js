import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Handle uncaught synchronous exceptions
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION — shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

import app from './src/app.js';

const PORT = process.env.PORT || 4000;
const DB = process.env.MONGODB_URI;

mongoose
  .connect(DB)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

const server = app.listen(PORT, () => {
  console.log(`🚀 Lumio server running on http://localhost:${PORT}`);
  console.log(`🌍 Mode: ${process.env.NODE_ENV}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('💥 UNHANDLED REJECTION — shutting down...');
  console.error(err.name, err.message);
  server.close(() => process.exit(1));
});
