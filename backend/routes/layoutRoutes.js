// backend/routes/layoutRoutes.js
import express from 'express';
import {
  getAllLayouts,
  saveLayout,
  getLayout,
  deleteLayout,
} from '../controllers/layoutController.js';

const router = express.Router();

// GET /api/layouts — list all saved layouts
router.get('/', getAllLayouts);

// POST /api/layouts — save new layout
router.post('/', saveLayout);

// GET /api/layouts/:id — load specific layout
router.get('/:id', getLayout);

// DELETE /api/layouts/:id — delete layout
router.delete('/:id', deleteLayout);

export default router;
