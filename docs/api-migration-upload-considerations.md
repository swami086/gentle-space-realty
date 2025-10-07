# Upload Service - API Migration Considerations

## Overview

The Upload Service intentionally maintains direct Supabase Storage integration rather than routing through Express API endpoints. This document explains the architectural decisions and integration patterns.

## Why Direct Storage Access?

### Performance Benefits
- **Reduced Server Load**: Files don't pass through the Express server
- **Better Progress Tracking**: Direct upload provides real-time progress updates
- **Lower Latency**: Eliminates API server as intermediary
- **Large File Support**: Avoids API timeout issues for large video files
- **Bandwidth Efficiency**: Direct client-to-storage reduces server bandwidth usage

### Technical Benefits
- **Parallel Uploads**: Multiple files can upload simultaneously
- **Resumable Uploads**: Supabase Storage supports resumable uploads for large files
- **Built-in CDN**: Supabase Storage provides global CDN distribution
- **Automatic Optimization**: Supabase handles image optimization and compression

## Integration Pattern with API-First Architecture

### 1. Upload Process Flow
```
1. Client validates files (size, type, count)
2. Client uploads directly to Supabase Storage
3. Client receives storage URLs and metadata
4. Client sends file metadata to Express API via property endpoints
5. Express API stores metadata in PostgreSQL database
```

### 2. File Metadata Management
- **Upload Results**: Direct from Supabase Storage (URL, path, size, type)
- **Database Records**: Managed through Express API endpoints
- **Property Association**: Files linked to properties via API calls

### 3. Security Implementation
- **Upload Permissions**: Managed via Supabase RLS (Row Level Security) policies
- **File Access**: Public URLs for approved content, signed URLs for private content
- **Validation**: Client-side and server-side file type/size validation

### 4. Cleanup and Error Handling
- **Failed Uploads**: Direct storage API calls for immediate cleanup
- **Orphaned Files**: Background cleanup jobs via Express API
- **Error Recovery**: Retry mechanism for failed uploads

## File Types and Limits

### Supported Formats
- **Images**: JPEG, PNG, GIF, WebP (max 10MB)
- **Videos**: MP4, WebM (max 200MB)

### Storage Organization
```
property-images/
  images/
    timestamp-uuid-filename.ext

property-videos/
  videos/
    timestamp-uuid-filename.ext
```

## Usage Examples

### Basic File Upload
```typescript
import { UploadService } from '@/services/uploadService';

// Upload single file
const result = await UploadService.uploadFile(file, 'image');

// Use result in API call
await API.properties.create({
  ...propertyData,
  images: [result.url]
});
```

### Multiple File Upload with Progress
```typescript
const files = [...fileList];
const uploadPromises = files.map(file => 
  UploadService.uploadFile(file, 'image')
);

const results = await Promise.all(uploadPromises);
const imageUrls = results.map(r => r.url);

// Update property via API
await API.properties.update(propertyId, {
  images: imageUrls
});
```

## Migration Status

- ✅ **Upload Service**: Intentionally kept as direct Supabase Storage integration
- ✅ **File UI Components**: Compatible with direct upload service
- ✅ **API Integration**: File metadata managed through Express API endpoints
- ✅ **Error Handling**: Direct storage cleanup with API coordination
- ✅ **Security**: RLS policies and validation maintained

## Future Considerations

### Potential Enhancements
1. **CDN Integration**: Consider additional CDN layers for global optimization
2. **Image Processing**: Server-side image optimization and thumbnail generation
3. **Virus Scanning**: Integrate file scanning for security
4. **Storage Quotas**: Implement user/organization storage limits
5. **Analytics**: Track upload patterns and optimize performance

### Alternative Architectures
If direct storage access becomes problematic, consider:
1. **Proxy Upload**: Express API proxies uploads while maintaining performance
2. **Signed Upload URLs**: Pre-signed URLs from API for direct uploads
3. **Chunked Uploads**: API-managed chunked upload for very large files

## Conclusion

The current upload service architecture balances performance optimization with API-first principles. File uploads remain direct to storage for optimal performance, while file metadata is managed through the Express API for consistent data handling.

This hybrid approach provides:
- Best possible upload performance
- Consistent data management through APIs
- Proper security and validation
- Seamless integration with the API-first architecture