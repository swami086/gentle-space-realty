import { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdminClient';
import formidable, { IncomingForm } from 'formidable';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Disable Next.js body parser to handle multipart/form-data
export const config = {
  api: {
    bodyParser: false,
  },
};

interface VideoUploadResult {
  url: string;
  path: string;
  filename: string;
  size: number;
  mimeType: string;
  duration?: number;
  thumbnailUrl?: string;
}

const SUPPORTED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_VIDEO_SIZE = 200 * 1024 * 1024; // 200MB
const VIDEO_BUCKET = 'property-videos';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse multipart/form-data with increased size limits for videos
    const form = new IncomingForm({
      maxFileSize: MAX_VIDEO_SIZE,
    });
    
    const { files } = await new Promise<{ files: formidable.Files }>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ files });
      });
    });

    // Get the uploaded file
    const uploadedFile = files.file;
    if (!uploadedFile) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Handle single file or array of files
    const file = Array.isArray(uploadedFile) ? uploadedFile[0] : uploadedFile;

    // Validate file type
    if (!SUPPORTED_VIDEO_TYPES.includes(file.mimetype || '')) {
      return res.status(400).json({ 
        error: `Unsupported video format. Supported: ${SUPPORTED_VIDEO_TYPES.join(', ')}` 
      });
    }

    // Validate file size
    if (file.size > MAX_VIDEO_SIZE) {
      return res.status(400).json({ 
        error: `Video file size exceeds 200MB limit` 
      });
    }

    // Generate unique file path
    const uuid = uuidv4();
    const extension = file.originalFilename?.split('.').pop() || 'mp4';
    const sanitizedName = file.originalFilename?.replace(/[^a-zA-Z0-9.-]/g, '_') || 'video';
    const filePath = `videos/${uuid}-${sanitizedName}`;

    // Read file content
    const fileContent = fs.readFileSync(file.filepath);

    // Upload to Supabase Storage using admin client (server-side)
    const { data, error } = await supabaseAdmin.storage
      .from(VIDEO_BUCKET)
      .upload(filePath, fileContent, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.mimetype || 'video/mp4'
      });

    if (error) {
      console.error('❌ Upload error:', error);
      return res.status(500).json({ error: `Upload failed: ${error.message}` });
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(VIDEO_BUCKET)
      .getPublicUrl(data.path);

    const result: VideoUploadResult = {
      url: urlData.publicUrl,
      path: data.path,
      filename: file.originalFilename || sanitizedName,
      size: file.size,
      mimeType: file.mimetype || 'video/mp4',
      duration: undefined, // Would need video processing to extract duration
      thumbnailUrl: undefined // Would need video processing to generate thumbnail
    };

    // Clean up temp file
    fs.unlinkSync(file.filepath);

    console.log('✅ Video uploaded successfully via server route:', result.path);
    return res.status(200).json(result);

  } catch (error) {
    console.error('❌ Server upload error:', error);
    return res.status(500).json({ 
      error: 'Internal server error during upload',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}