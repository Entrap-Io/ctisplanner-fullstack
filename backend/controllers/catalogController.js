// controllers/catalogController.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname replacement
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get catalog data (courses, professors, IS electives)
export const getCatalog = (req, res) => {
  try {
    const catalogPath = path.join(__dirname, '../data/catalog.json');
    const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    res.json(catalog);
  } catch (error) {
    console.error('Error reading catalog:', error);
    res.status(500).json({ error: 'Failed to load catalog data' });
  }
};
