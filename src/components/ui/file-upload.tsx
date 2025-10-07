import React, { useCallback, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Video, 
  FileImage, 
  FileVideo,
  Loader2,
  AlertCircle,
  Check
} from 'lucide-react';

export interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  onFileRemove?: (index: number) => void;
  acceptedTypes: 'image' | 'video' | 'both';
  maxFiles?: number;
  maxFileSize?: number; // in MB
  className?: string;
  disabled?: boolean;
  uploadProgress?: { [key: string]: number };
  uploadStatus?: { [key: string]: 'uploading' | 'success' | 'error' };
}

interface FilePreview {
  file: File;
  preview?: string;
  type: 'image' | 'video';
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFilesSelected,
  onFileRemove,
  acceptedTypes = 'both',
  maxFiles = 10,
  maxFileSize = 10, // Default 10MB
  className = '',
  disabled = false,
  uploadProgress = {},
  uploadStatus = {}
}) => {
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get accepted file types
  const getAcceptedFileTypes = () => {
    switch (acceptedTypes) {
      case 'image':
        return 'image/jpeg,image/png,image/gif,image/webp';
      case 'video':
        return 'video/mp4,video/webm';
      case 'both':
      default:
        return 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm';
    }
  };

  // Validate file
  const validateFile = (file: File): string | null => {
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    // Check file type
    if (acceptedTypes === 'image' && !isImage) {
      return 'Only image files are allowed';
    }
    if (acceptedTypes === 'video' && !isVideo) {
      return 'Only video files are allowed';
    }
    if (!isImage && !isVideo) {
      return 'Only image and video files are allowed';
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    const maxSize = isVideo ? Math.min(maxFileSize * 20, 200) : maxFileSize; // Videos can be larger
    if (fileSizeMB > maxSize) {
      return `File size must be less than ${maxSize}MB`;
    }

    return null;
  };

  // Create file preview
  const createPreview = useCallback((file: File): Promise<FilePreview> => {
    return new Promise((resolve) => {
      const isImage = file.type.startsWith('image/');
      const type = isImage ? 'image' : 'video';

      if (isImage) {
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            file,
            preview: reader.result as string,
            type
          });
        };
        reader.readAsDataURL(file);
      } else {
        // For videos, we'll create a video element to get the first frame
        const video = document.createElement('video');
        video.src = URL.createObjectURL(file);
        video.addEventListener('loadedmetadata', () => {
          video.currentTime = 1; // Get frame at 1 second
        });
        video.addEventListener('seeked', () => {
          const canvas = document.createElement('canvas');
          canvas.width = 160;
          canvas.height = 90;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const preview = canvas.toDataURL();
            URL.revokeObjectURL(video.src);
            resolve({ file, preview, type });
          } else {
            resolve({ file, type });
          }
        });
      }
    });
  }, []);

  // Handle file selection
  const handleFiles = useCallback(async (files: FileList) => {
    setError(null);
    const fileArray = Array.from(files);
    
    // Check max files limit
    if (previews.length + fileArray.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate files
    const validFiles: File[] = [];
    for (const file of fileArray) {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      validFiles.push(file);
    }

    // Create previews
    try {
      const newPreviews = await Promise.all(
        validFiles.map(file => createPreview(file))
      );
      
      setPreviews(prev => [...prev, ...newPreviews]);
      onFilesSelected(validFiles);
    } catch (error) {
      setError('Failed to process files');
    }
  }, [previews.length, maxFiles, createPreview, onFilesSelected]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  }, [disabled, handleFiles]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  // Remove file
  const handleRemoveFile = useCallback((index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    onFileRemove?.(index);
  }, [onFileRemove]);

  // Open file picker
  const openFilePicker = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  // Get upload status for file
  const getFileStatus = (filename: string) => {
    return uploadStatus[filename] || null;
  };

  const getFileProgress = (filename: string) => {
    return uploadProgress[filename] || 0;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop Zone */}
      <Card
        className={`
          relative border-2 border-dashed p-8 text-center cursor-pointer transition-colors
          ${dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-gray-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFilePicker}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={getAcceptedFileTypes()}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
        
        <div className="flex flex-col items-center space-y-2">
          <Upload className="w-8 h-8 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {acceptedTypes === 'image' && 'Images only (JPEG, PNG, GIF, WebP)'}
              {acceptedTypes === 'video' && 'Videos only (MP4, WebM)'}
              {acceptedTypes === 'both' && 'Images and videos (JPEG, PNG, GIF, WebP, MP4, WebM)'}
            </p>
            <p className="text-xs text-gray-500">
              Max {maxFiles} files, up to {maxFileSize}MB each
            </p>
          </div>
        </div>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* File Previews */}
      {previews.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {previews.map((preview, index) => {
            const status = getFileStatus(preview.file.name);
            const progress = getFileProgress(preview.file.name);

            return (
              <Card key={index} className="relative overflow-hidden">
                {/* Preview */}
                <div className="aspect-square relative">
                  {preview.preview ? (
                    preview.type === 'image' ? (
                      <img
                        src={preview.preview}
                        alt={preview.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center relative">
                        <img
                          src={preview.preview}
                          alt="Video thumbnail"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <Video className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      {preview.type === 'image' ? (
                        <FileImage className="w-8 h-8 text-gray-400" />
                      ) : (
                        <FileVideo className="w-8 h-8 text-gray-400" />
                      )}
                    </div>
                  )}

                  {/* Upload Progress */}
                  {status === 'uploading' && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-1" />
                        <div className="text-xs">{Math.round(progress)}%</div>
                      </div>
                    </div>
                  )}

                  {/* Upload Status */}
                  {status === 'success' && (
                    <div className="absolute top-1 right-1 bg-green-500 rounded-full p-1">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {status === 'error' && (
                    <div className="absolute top-1 right-1 bg-red-500 rounded-full p-1">
                      <AlertCircle className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {/* Remove Button */}
                  {!status || status === 'error' ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="absolute top-1 right-1 w-6 h-6 p-0 bg-white hover:bg-gray-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFile(index);
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  ) : null}
                </div>

                {/* File Info */}
                <div className="p-2">
                  <p className="text-xs text-gray-600 truncate" title={preview.file.name}>
                    {preview.file.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {(preview.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};