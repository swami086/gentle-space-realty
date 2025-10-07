import { supabaseAdmin } from '../../../src/lib/supabaseAdminClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bucket, path, expiresIn = 3600 } = req.body;

    if (!bucket || !path) {
      return res.status(400).json({ error: 'Missing required fields: bucket, path' });
    }

    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('❌ Admin client not available in server context');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Create signed URL using admin client
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error || !data?.signedUrl) {
      console.error('❌ Supabase signed URL error:', error);
      return res.status(400).json({ 
        error: `Signed URL creation failed: ${error?.message || 'Unknown error'}`,
        details: error 
      });
    }

    res.status(200).json({
      success: true,
      signedUrl: data.signedUrl
    });

  } catch (error) {
    console.error('❌ Signed URL API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}