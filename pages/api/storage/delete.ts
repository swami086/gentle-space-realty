import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

interface DeleteRequest {
  bucket: string;
  path: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bucket, path }: DeleteRequest = req.body;

    if (!bucket || !path) {
      return res.status(400).json({ error: 'Bucket and path are required' });
    }

    // Validate bucket names for security
    const allowedBuckets = ['property-images', 'property-videos'];
    if (!allowedBuckets.includes(bucket)) {
      return res.status(400).json({ error: 'Invalid bucket name' });
    }

    console.log('🗑️ Server delete request:', { bucket, path });

    // Delete from Supabase Storage using admin client (server-side)
    const { error } = await supabaseAdmin.storage
      .from(bucket)
      .remove([path]);

    if (error) {
      console.error('❌ Delete error:', error);
      return res.status(500).json({ error: `Delete failed: ${error.message}` });
    }

    console.log('✅ File deleted successfully via server route:', path);
    return res.status(200).json({ success: true, deleted: path });

  } catch (error) {
    console.error('❌ Server delete error:', error);
    return res.status(500).json({ 
      error: 'Internal server error during deletion',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}