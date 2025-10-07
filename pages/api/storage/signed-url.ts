import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';

interface SignedUrlRequest {
  bucket: string;
  path: string;
  expiresIn?: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { bucket, path, expiresIn = 3600 }: SignedUrlRequest = req.body;

    if (!bucket || !path) {
      return res.status(400).json({ error: 'Bucket and path are required' });
    }

    // Validate bucket names for security
    const allowedBuckets = ['property-images', 'property-videos'];
    if (!allowedBuckets.includes(bucket)) {
      return res.status(400).json({ error: 'Invalid bucket name' });
    }

    // Validate expiresIn range
    if (expiresIn < 60 || expiresIn > 86400) {
      return res.status(400).json({ error: 'expiresIn must be between 60 and 86400 seconds' });
    }

    console.log('🔐 Server signed URL request:', { bucket, path, expiresIn });

    // Create signed URL using admin client (server-side)
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) {
      console.error('❌ Signed URL error:', error);
      return res.status(500).json({ error: `Signed URL creation failed: ${error.message}` });
    }

    console.log('✅ Signed URL created successfully via server route');
    return res.status(200).json({ signedUrl: data.signedUrl });

  } catch (error) {
    console.error('❌ Server signed URL error:', error);
    return res.status(500).json({ 
      error: 'Internal server error during signed URL creation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}