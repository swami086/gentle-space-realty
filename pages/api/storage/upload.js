import { supabaseAdmin } from '../../../src/lib/supabaseAdminClient';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '200mb', // Increased for video uploads
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { file, bucket, path, options = {} } = req.body;

    if (!file || !bucket || !path) {
      return res.status(400).json({ error: 'Missing required fields: file, bucket, path' });
    }

    // Check if admin client is available
    if (!supabaseAdmin) {
      console.error('❌ Admin client not available in server context');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Convert base64 file data back to buffer
    const fileBuffer = Buffer.from(file, 'base64');

    // Upload to Supabase Storage using admin client
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, fileBuffer, {
        cacheControl: '31536000', // 1 year cache
        upsert: false, // Don't overwrite existing files
        ...options
      });

    if (error) {
      console.error('❌ Supabase storage upload error:', error);
      return res.status(400).json({ 
        error: `Upload failed: ${error.message}`,
        details: error 
      });
    }

    // Get public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(path);

    if (!publicUrlData?.publicUrl) {
      return res.status(500).json({ error: 'Failed to generate public URL' });
    }

    res.status(200).json({
      success: true,
      data: {
        path: data.path,
        publicUrl: publicUrlData.publicUrl
      }
    });

  } catch (error) {
    console.error('❌ Storage upload API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}