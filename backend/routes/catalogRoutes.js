// routes/catalogRoutes.js
import express from 'express';
import { getCatalog } from '../controllers/catalogController.js';

const router = express.Router();

// GET /api/catalog - Get course catalog, professors, and IS electives
router.get('/', getCatalog);

export default router;
