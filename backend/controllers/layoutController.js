// backend/controllers/layoutController.js
// ESM controller using Supabase from req.supabase

// Get all saved layouts (just metadata, not full state)
export const getAllLayouts = async (req, res) => {
  try {
    const supabase = req.supabase;

    const { data, error } = await supabase
      .from('layouts')
      .select('id, name, saved_by, saved_at')
      .order('saved_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error('Error fetching layouts:', error);
    res.status(500).json({ error: 'Failed to load layouts' });
  }
};

// Save new named layout
export const saveLayout = async (req, res) => {
  try {
    const supabase = req.supabase;
    const { name, saved_by, state } = req.body;

    const { data, error } = await supabase
      .from('layouts')
      .insert({
        name:     name     || 'Unnamed Layout',
        saved_by: saved_by || 'Anonymous',
        state:    state,
      })
      .select('id, name, saved_by, saved_at')
      .single();

    if (error) throw error;
    res.json({ success: true, ...data });
  } catch (error) {
    console.error('Error saving layout:', error);
    res.status(500).json({ error: 'Failed to save layout' });
  }
};

// Load specific layout (full state)
export const getLayout = async (req, res) => {
  try {
    const supabase = req.supabase;
    const { id } = req.params;

    const { data, error } = await supabase
      .from('layouts')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Layout not found' });
    res.json(data);
  } catch (error) {
    console.error('Error loading layout:', error);
    res.status(500).json({ error: 'Failed to load layout' });
  }
};

// Delete layout
export const deleteLayout = async (req, res) => {
  try {
    const supabase = req.supabase;
    const { id } = req.params;

    const { error } = await supabase
      .from('layouts')
      .delete()
      .eq('id', id);

    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting layout:', error);
    res.status(500).json({ error: 'Failed to delete layout' });
  }
};
