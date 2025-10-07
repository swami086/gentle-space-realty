import { supabaseAdmin } from '../../../src/lib/supabaseAdminClient';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bucket, path } = req.body;

    if (!bucket || !path) {
      return res.status(400).json({ error: 'Missing required fields: bucket, path' });
    }

    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('❌ Admin client not available in server context');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Delete from Supabase Storage using admin client
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('❌ Supabase storage deletion error:', error);
      return res.status(400).json({ 
        error: `Delete failed: ${error.message}`,
        details: error 
      });
    }

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('❌ Storage delete API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}