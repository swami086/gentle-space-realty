import { supabaseAdmin } from '../../../src/lib/supabaseAdminClient';

export default async function handler(req, res) {
  // Check if admin client is available
  if (!supabaseAdmin) {
    console.error('❌ Admin client not available in server context');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    if (req.method === 'GET') {
      // Get all testimonials for admin panel
      const { data, error } = await supabaseAdmin
        .from('testimonials')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching all testimonials:', error);
        return res.status(400).json({ 
          error: `Failed to fetch testimonials: ${error.message}`,
          details: error 
        });
      }

      res.status(200).json({
        success: true,
        data: data || []
      });

    } else if (req.method === 'PUT') {
      // Update testimonial status
      const { id, updates } = req.body;

      if (!id || !updates) {
        return res.status(400).json({ error: 'Missing required fields: id, updates' });
      }

      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // If approving, set approved_at timestamp
      if (updates.status === 'approved') {
        updateData.approved_at = new Date().toISOString();
      }

      // Clear approval fields if rejecting or pending
      if (updates.status === 'rejected' || updates.status === 'pending') {
        updateData.approved_at = null;
        updateData.approved_by = null;
      }

      const { data, error } = await supabaseAdmin
        .from('testimonials')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ Error updating testimonial:', error);
        return res.status(400).json({ 
          error: `Failed to update testimonial: ${error.message}`,
          details: error 
        });
      }

      res.status(200).json({
        success: true,
        data
      });

    } else if (req.method === 'DELETE') {
      // Delete testimonial
      const { id } = req.body;

      if (!id) {
        return res.status(400).json({ error: 'Missing required field: id' });
      }

      const { error } = await supabaseAdmin
        .from('testimonials')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ Error deleting testimonial:', error);
        return res.status(400).json({ 
          error: `Failed to delete testimonial: ${error.message}`,
          details: error 
        });
      }

      res.status(200).json({
        success: true,
        message: 'Testimonial deleted successfully'
      });

    } else {
      res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('❌ Testimonials admin API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}