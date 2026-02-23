// API functions for backend communication

const API_BASE = '/api';

// Fetch catalog data from backend
async function fetchCatalog() {
  try {
    const response = await fetch(`${API_BASE}/catalog`);
    if (!response.ok) throw new Error('Failed to fetch catalog');
    return await response.json();
  } catch (error) {
    console.error('Error fetching catalog:', error);
    toast('Failed to load catalog data', 'err');
    return null;
  }
}


// Get all saved layouts
async function getAllSavedLayouts() {
  try {
    const response = await fetch(`${API_BASE}/layouts`);
    if (!response.ok) throw new Error('Failed to fetch layouts');
    return await response.json();
  } catch (error) {
    console.error('Error fetching layouts:', error);
    toast('Failed to load saved layouts', 'err');
    return [];
  }
}

// Save named layout
async function saveNamedLayout(name, saved_by, state) {
  try {
    const response = await fetch(`${API_BASE}/layouts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, saved_by, state })
    });
    if (!response.ok) throw new Error('Failed to save layout');
    const result = await response.json();
    toast(`Layout "${name}" saved`, 'ok');
    return result;
  } catch (error) {
    console.error('Error saving named layout:', error);
    toast('Failed to save layout', 'err');
    return null;
  }
}

// Load specific layout
async function loadSpecificLayout(id) {
  try {
    const response = await fetch(`${API_BASE}/layouts/${id}`);
    if (!response.ok) throw new Error('Failed to load layout');
    return await response.json();
  } catch (error) {
    console.error('Error loading layout:', error);
    toast('Failed to load layout', 'err');
    return null;
  }
}

// Delete layout
async function deleteLayout(id) {
  try {
    const response = await fetch(`${API_BASE}/layouts/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete layout');
    toast('Layout deleted successfully', 'ok');
    return await response.json();
  } catch (error) {
    console.error('Error deleting layout:', error);
    toast('Failed to delete layout', 'err');
    return null;
  }
}
