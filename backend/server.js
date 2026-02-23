// server.js
// server.js (top)
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import catalogRoutes from './routes/catalogRoutes.js';
import layoutRoutes from './routes/layoutRoutes.js';

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env from ../.env
dotenv.config({ path: path.join(__dirname, '../.env') });

// debug
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_SERVICE_KEY exists:', !!process.env.SUPABASE_SERVICE_KEY);

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);


const app = express();
const PORT = process.env.PORT || 3000;

// 4) Middleware
app.use(cors());
app.use(express.json());

// (optional) Make Supabase available to all routes via req.supabase
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// 5) Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// 6) API Routes
app.use('/api/catalog', catalogRoutes);
app.use('/api/layouts', layoutRoutes);

// 7) Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 8) Start server
app.listen(PORT, () => {
  console.log(`✓ CTIS Planner server running on http://localhost:${PORT}`);
  console.log(`✓ Frontend: http://localhost:${PORT}`);
  console.log(`✓ API: http://localhost:${PORT}/api`);
});
