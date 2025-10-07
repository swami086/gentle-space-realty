import { uploadService } from '../../src/services/uploadService';
import { supabase } from '../../src/lib/supabaseClient';

// Mock Supabase
jest.mock('../../src/lib/supabaseClient', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        remove: jest.fn(),
        getPublicUrl: jest.fn(),
        createSignedUrl: jest.fn(),
        list: jest.fn()
      }))
    }
  },
  handleSupabaseError: jest.fn((error) => error)
}));

describe('UploadService', () => {
  // Create mock file for testing
  const createMockFile = (name: string, type: string = 'image/jpeg', size: number = 1000000): File => {
    // Create a buffer with the specified size to ensure File.size property is correct
    const buffer = new ArrayBuffer(size);
    const blob = new Blob([buffer], { type });
    return new File([blob], name, { type, lastModified: Date.now() });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset the storage mock to its default state
    const mockStorageFrom = supabase.storage.from as jest.Mock;
    mockStorageFrom.mockReturnValue({
      upload: jest.fn(),
      remove: jest.fn(),
      getPublicUrl: jest.fn(),
      createSignedUrl: jest.fn(),
      list: jest.fn()
    });
  });

  describe('uploadFile', () => {
    it('should successfully upload a valid image file', async () => {
      const mockFile = createMockFile('test-image.jpg', 'image/jpeg');
      const mockStorageResult = {
        data: {
          path: 'uploads/123-abc-test-image.jpg',
          fullPath: 'property-images/uploads/123-abc-test-image.jpg'
        },
        error: null
      };
      const mockUrlResult = {
        data: {
          publicUrl: 'https://supabase.co/storage/v1/object/public/property-images/uploads/123-abc-test-image.jpg'
        }
      };

      const mockStorageFrom = supabase.storage.from as jest.Mock;
      const mockUpload = jest.fn().mockResolvedValue(mockStorageResult);
      const mockGetPublicUrl = jest.fn().mockReturnValue(mockUrlResult);
      
      mockStorageFrom.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl
      });

      const result = await uploadService.uploadFile(mockFile);

      expect(mockStorageFrom).toHaveBeenCalledWith('property-images');
      expect(mockUpload).toHaveBeenCalledWith(
        expect.stringContaining('test-image.jpg'),
        mockFile,
        { cacheControl: '3600', upsert: false }
      );
      expect(result).toEqual({
        url: mockUrlResult.data.publicUrl,
        path: mockStorageResult.data.path,
        fullPath: mockStorageResult.data.fullPath
      });
    });

    it('should reject files that are too large', async () => {
      const mockFile = createMockFile('large-image.jpg', 'image/jpeg', 20 * 1024 * 1024); // 20MB

      // File should be rejected before any Supabase calls due to size validation
      await expect(uploadService.uploadFile(mockFile)).rejects.toThrow(
        'File size exceeds limit of 10MB'
      );
      
      // Verify that no storage calls were made since validation failed
      const mockStorageFrom = supabase.storage.from as jest.Mock;
      expect(mockStorageFrom).not.toHaveBeenCalled();
    });

    it('should reject files with invalid types', async () => {
      const mockFile = createMockFile('document.pdf', 'application/pdf');

      await expect(uploadService.uploadFile(mockFile)).rejects.toThrow(
        'File type application/pdf is not allowed'
      );
    });

    it('should handle upload errors from Supabase', async () => {
      const mockFile = createMockFile('test-image.jpg', 'image/jpeg');
      const mockError = new Error('Storage error');
      
      const mockStorageFrom = supabase.storage.from as jest.Mock;
      const mockUpload = jest.fn().mockResolvedValue({ data: null, error: mockError });
      
      mockStorageFrom.mockReturnValue({
        upload: mockUpload
      });

      await expect(uploadService.uploadFile(mockFile)).rejects.toThrow('Storage error');
    });
  });

  describe('uploadPropertyImages', () => {
    it('should upload multiple images for a property', async () => {
      const mockFiles = [
        createMockFile('image1.jpg'),
        createMockFile('image2.jpg')
      ];
      const propertyId = 'test-property-id';

      // Mock successful uploads
      const mockStorageFrom = supabase.storage.from as jest.Mock;
      const mockUpload = jest.fn()
        .mockResolvedValueOnce({
          data: { path: 'properties/test-property-id/image1.jpg', fullPath: 'full/path1' },
          error: null
        })
        .mockResolvedValueOnce({
          data: { path: 'properties/test-property-id/image2.jpg', fullPath: 'full/path2' },
          error: null
        });
      const mockGetPublicUrl = jest.fn()
        .mockReturnValueOnce({ data: { publicUrl: 'url1' } })
        .mockReturnValueOnce({ data: { publicUrl: 'url2' } });
      
      mockStorageFrom.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl
      });

      const results = await uploadService.uploadPropertyImages(propertyId, mockFiles);

      expect(results).toHaveLength(2);
      expect(results[0].url).toBe('url1');
      expect(results[1].url).toBe('url2');
      expect(mockUpload).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteFile', () => {
    it('should successfully delete a file', async () => {
      const filePath = 'uploads/test-file.jpg';
      
      const mockStorageFrom = supabase.storage.from as jest.Mock;
      const mockRemove = jest.fn().mockResolvedValue({ error: null });
      
      mockStorageFrom.mockReturnValue({
        remove: mockRemove
      });

      const result = await uploadService.deleteFile(filePath);

      expect(result).toBe(true);
      expect(mockRemove).toHaveBeenCalledWith([filePath]);
    });

    it('should handle delete errors', async () => {
      const filePath = 'uploads/test-file.jpg';
      const mockError = new Error('Delete failed');
      
      const mockStorageFrom = supabase.storage.from as jest.Mock;
      const mockRemove = jest.fn().mockResolvedValue({ error: mockError });
      
      mockStorageFrom.mockReturnValue({
        remove: mockRemove
      });

      await expect(uploadService.deleteFile(filePath)).rejects.toThrow('Delete failed');
    });
  });

  describe('getPublicUrl', () => {
    it('should return public URL for a file', () => {
      const filePath = 'uploads/test-file.jpg';
      const expectedUrl = 'https://supabase.co/storage/v1/object/public/property-images/uploads/test-file.jpg';
      
      const mockStorageFrom = supabase.storage.from as jest.Mock;
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: expectedUrl }
      });
      
      mockStorageFrom.mockReturnValue({
        getPublicUrl: mockGetPublicUrl
      });

      const url = uploadService.getPublicUrl(filePath);

      expect(url).toBe(expectedUrl);
      expect(mockGetPublicUrl).toHaveBeenCalledWith(filePath);
    });
  });

  describe('createSignedUrl', () => {
    it('should create a signed URL', async () => {
      const filePath = 'uploads/test-file.jpg';
      const expectedUrl = 'https://supabase.co/storage/v1/object/sign/property-images/uploads/test-file.jpg?token=abc123';
      
      const mockStorageFrom = supabase.storage.from as jest.Mock;
      const mockCreateSignedUrl = jest.fn().mockResolvedValue({
        data: { signedUrl: expectedUrl },
        error: null
      });
      
      mockStorageFrom.mockReturnValue({
        createSignedUrl: mockCreateSignedUrl
      });

      const url = await uploadService.createSignedUrl(filePath, 3600);

      expect(url).toBe(expectedUrl);
      expect(mockCreateSignedUrl).toHaveBeenCalledWith(filePath, 3600);
    });

    it('should handle signed URL creation errors', async () => {
      const filePath = 'uploads/test-file.jpg';
      const mockError = new Error('Failed to create signed URL');
      
      const mockStorageFrom = supabase.storage.from as jest.Mock;
      const mockCreateSignedUrl = jest.fn().mockResolvedValue({
        data: null,
        error: mockError
      });
      
      mockStorageFrom.mockReturnValue({
        createSignedUrl: mockCreateSignedUrl
      });

      await expect(uploadService.createSignedUrl(filePath)).rejects.toThrow('Failed to create signed URL');
    });
  });

  describe('listFiles', () => {
    it('should list files in a folder', async () => {
      const folder = 'properties/test-property';
      const mockFiles = [
        { name: 'image1.jpg', id: 'id1' },
        { name: 'image2.jpg', id: 'id2' }
      ];
      
      const mockStorageFrom = supabase.storage.from as jest.Mock;
      const mockList = jest.fn().mockResolvedValue({
        data: mockFiles,
        error: null
      });
      
      mockStorageFrom.mockReturnValue({
        list: mockList
      });

      const files = await uploadService.listFiles(folder);

      expect(files).toEqual(mockFiles);
      expect(mockList).toHaveBeenCalledWith(folder);
    });

    it('should handle list errors', async () => {
      const folder = 'properties/test-property';
      const mockError = new Error('List failed');
      
      const mockStorageFrom = supabase.storage.from as jest.Mock;
      const mockList = jest.fn().mockResolvedValue({
        data: null,
        error: mockError
      });
      
      mockStorageFrom.mockReturnValue({
        list: mockList
      });

      await expect(uploadService.listFiles(folder)).rejects.toThrow('List failed');
    });
  });

  describe('File validation', () => {
    it('should validate file type correctly', async () => {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      
      for (const type of validTypes) {
        const mockFile = createMockFile(`test.${type.split('/')[1]}`, type);
        
        const mockStorageFrom = supabase.storage.from as jest.Mock;
        const mockUpload = jest.fn().mockResolvedValue({
          data: { path: 'test-path', fullPath: 'full-path' },
          error: null
        });
        const mockGetPublicUrl = jest.fn().mockReturnValue({
          data: { publicUrl: 'test-url' }
        });
        
        mockStorageFrom.mockReturnValue({
          upload: mockUpload,
          getPublicUrl: mockGetPublicUrl
        });

        await expect(uploadService.uploadFile(mockFile)).resolves.toBeDefined();
      }
    });

    it('should generate unique file paths', async () => {
      const mockFile1 = createMockFile('same-name.jpg');
      const mockFile2 = createMockFile('same-name.jpg');
      
      const mockStorageFrom = supabase.storage.from as jest.Mock;
      let uploadCalls: any[] = [];
      
      const mockUpload = jest.fn().mockImplementation((path) => {
        uploadCalls.push(path);
        return Promise.resolve({
          data: { path, fullPath: `full-${path}` },
          error: null
        });
      });
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'test-url' }
      });
      
      mockStorageFrom.mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl
      });

      await uploadService.uploadFile(mockFile1);
      await uploadService.uploadFile(mockFile2);

      // Both calls should have different paths despite same file name
      expect(uploadCalls[0]).not.toBe(uploadCalls[1]);
      expect(uploadCalls[0]).toContain('same-name.jpg');
      expect(uploadCalls[1]).toContain('same-name.jpg');
    });
  });
});