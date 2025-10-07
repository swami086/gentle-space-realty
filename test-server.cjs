const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3001;

// Environment configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://nfryqqpfprupwqayirnc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcnlxcXBmcHJ1cHdxYXlpcm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzgxNDAxOCwiZXhwIjoyMDczMzkwMDE4fQ.XTxgPSa-J5uMLvs7uGOl4REH3ziEZNY1vHQjAple_fQ';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper function to map frontend categories to database property_type
function mapCategoryToPropertyType(category) {
  const categoryMap = {
    'fully-furnished-offices': 'commercial',
    'co-working-spaces': 'commercial', 
    'meeting-rooms': 'commercial',
    'event-spaces': 'commercial',
    'retail-spaces': 'commercial',
    'warehouses': 'industrial',
    'residential-apartments': 'residential',
    'residential-houses': 'residential',
    'residential-condos': 'residential',
    'land-plots': 'land',
    'multi-family-homes': 'multi-family'
  };
  return categoryMap[category] || 'commercial';
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images and videos
const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    'image/jpeg': true,
    'image/jpg': true,
    'image/png': true,
    'image/gif': true,
    'image/webp': true,
    'video/mp4': true,
    'video/avi': true,
    'video/mov': true,
    'video/wmv': true,
    'video/webm': true,
    'audio/mp3': true,
    'audio/wav': true,
    'audio/ogg': true,
    'audio/m4a': true
  };
  
  if (allowedTypes[file.mimetype]) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: images, videos, audio`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB limit
  }
});

// Helper function to determine media type from mime type
function getMediaType(mimetype) {
  if (mimetype.startsWith('image/')) return 'image';
  if (mimetype.startsWith('video/')) return 'video';
  if (mimetype.startsWith('audio/')) return 'video'; // Store audio as video type for simplicity
  return 'image'; // default
}

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id', 'X-Request-ID', 'X-Client-Version', 'X-Client-Info'],
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Test Express API Server is running',
    timestamp: new Date().toISOString()
  });
});

// Admin properties endpoint - shows ALL properties regardless of status
app.get('/api/admin/properties', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Admin Properties API Error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch admin properties',
        details: error.message 
      });
    }

    // Transform database fields to frontend expected format for admin
    const transformedData = (data || []).map(property => ({
      ...property,
      category: property.property_type || 'commercial', // Map property_type to category
      
      // Transform availability_status to nested availability object
      availability: {
        available: property.availability_status === 'available' || property.status === 'available',
        availableFrom: property.availability_date || null
      },
      
      // Transform price to nested price object
      price: {
        amount: property.price || 0,
        period: 'monthly' // Default period
      },
      
      // Transform area_sqft to nested size object  
      size: {
        area: property.area_sqft || 0,
        unit: 'sqft'
      },
      
      // Ensure images is an array
      images: Array.isArray(property.images) ? property.images : (property.images ? [property.images] : ['/api/placeholder/400/300']),
      
      // Map timestamps
      createdAt: property.created_at,
      updatedAt: property.updated_at,
      
      // Keep original field for backward compatibility
      property_type: property.property_type
    }));

    console.log('✅ Admin Properties API: Fetched', transformedData?.length || 0, 'properties (ALL)');
    res.json({
      success: true,
      count: transformedData?.length || 0,
      data: transformedData
    });
  } catch (error) {
    console.error('❌ Admin Properties API Exception:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Public properties endpoint - shows only available properties
app.get('/api/properties', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('status', 'available')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Properties API Error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch properties',
        details: error.message 
      });
    }

    // Transform database fields to frontend expected format
    const transformedData = (data || []).map(property => ({
      ...property,
      category: property.property_type || 'commercial', // Map property_type to category
      // Keep original field for backward compatibility
      property_type: property.property_type
    }));

    console.log('✅ Properties API: Fetched', transformedData?.length || 0, 'properties');
    res.json({
      success: true,
      count: transformedData?.length || 0,
      data: transformedData
    });
  } catch (error) {
    console.error('❌ Properties API Exception:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Create property endpoint
app.post('/api/properties', async (req, res) => {
  try {
    const propertyData = req.body;
    
    // Validate required fields
    if (!propertyData.title || !propertyData.location) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Title and location are required'
      });
    }

    // Map frontend fields to database columns
    const propertyToInsert = {
      title: propertyData.title,
      description: propertyData.description || '',
      location: propertyData.location,
      
      // Map price - frontend sends {amount, period}, DB expects numeric
      price: propertyData.price?.amount || 0,
      
      // Map size - frontend sends {area, unit}, DB expects area_sqft
      area_sqft: propertyData.size?.area || null,
      
      // Map category to property_type - frontend sends category, DB has property_type
      property_type: mapCategoryToPropertyType(propertyData.category || ''),
      
      // JSONB fields
      images: propertyData.images || [],
      amenities: propertyData.amenities || [],
      features: propertyData.features || {},
      coordinates: propertyData.coordinates || null,
      approximate_location: propertyData.approximate_location || null,
      
      // Additional fields that might come from frontend
      address: propertyData.address || null,
      virtual_tour_url: propertyData.virtualTourUrl || null,
      year_built: propertyData.yearBuilt || null,
      parking_spaces: propertyData.features?.parking ? 1 : 0,
      
      // Database managed fields
      status: 'available',
      availability_status: propertyData.availability?.available ? 'available' : 'not-available',
      featured: propertyData.featured || false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('properties')
      .insert([propertyToInsert])
      .select()
      .single();

    if (error) {
      console.error('❌ Property Creation Error:', error);
      return res.status(500).json({
        error: 'Failed to create property',
        details: error.message
      });
    }

    console.log('✅ Property Created:', data.id, '-', data.title);
    res.status(201).json({
      success: true,
      data: data,
      message: 'Property created successfully'
    });
  } catch (error) {
    console.error('❌ Property Creation Exception:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Update property endpoint
app.put('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const propertyData = req.body;

    // Set updated timestamp
    const propertyToUpdate = {
      ...propertyData,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('properties')
      .update(propertyToUpdate)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Property Update Error:', error);
      return res.status(500).json({
        error: 'Failed to update property',
        details: error.message
      });
    }

    if (!data) {
      return res.status(404).json({
        error: 'Property not found',
        details: `No property found with id: ${id}`
      });
    }

    console.log('✅ Property Updated:', data.id, '-', data.title);
    res.json({
      success: true,
      data: data,
      message: 'Property updated successfully'
    });
  } catch (error) {
    console.error('❌ Property Update Exception:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Delete property endpoint
app.delete('/api/properties/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('properties')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('❌ Property Delete Error:', error);
      return res.status(500).json({
        error: 'Failed to delete property',
        details: error.message
      });
    }

    if (!data) {
      return res.status(404).json({
        error: 'Property not found',
        details: `No property found with id: ${id}`
      });
    }

    console.log('✅ Property Deleted:', data.id, '-', data.title);
    res.json({
      success: true,
      data: data,
      message: 'Property deleted successfully'
    });
  } catch (error) {
    console.error('❌ Property Delete Exception:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Media upload endpoint for properties
app.post('/api/properties/media/upload', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        error: 'No files uploaded',
        details: 'At least one file is required'
      });
    }

    const uploadedFiles = [];
    
    for (const file of req.files) {
      const mediaData = {
        filename: file.filename,
        url: `/uploads/${file.filename}`, // This would be a full URL in production
        size: file.size,
        media_type: getMediaType(file.mimetype),
        storage_path: file.path,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Add video-specific fields
      if (mediaData.media_type === 'video') {
        mediaData.duration = null; // Would need video processing to get actual duration
        mediaData.thumbnail_url = null; // Would need video processing to generate thumbnail
      }
      
      uploadedFiles.push({
        originalName: file.originalname,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        mediaType: mediaData.media_type,
        url: mediaData.url,
        storagePath: mediaData.storage_path
      });
    }

    console.log('✅ Media Upload: Uploaded', uploadedFiles.length, 'files');
    res.json({
      success: true,
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      files: uploadedFiles
    });
  } catch (error) {
    console.error('❌ Media Upload Error:', error);
    res.status(500).json({
      error: 'Failed to upload media',
      details: error.message
    });
  }
});

// Add media to property endpoint
app.post('/api/properties/:propertyId/media', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const { files } = req.body; // Array of file objects from upload endpoint
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        error: 'No media files provided',
        details: 'files array is required'
      });
    }

    const mediaRecords = [];
    
    for (const file of files) {
      const mediaData = {
        property_id: propertyId,
        url: file.url,
        filename: file.filename,
        size: file.size,
        media_type: file.mediaType || 'image',
        storage_path: file.storagePath,
        is_primary: file.isPrimary || false,
        display_order: file.displayOrder || 0,
        alt_text: file.altText || null,
        duration: file.duration || null,
        thumbnail_url: file.thumbnailUrl || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('property_media')
        .insert([mediaData])
        .select()
        .single();

      if (error) {
        console.error('❌ Property Media Error:', error);
        return res.status(500).json({
          error: 'Failed to save media to property',
          details: error.message
        });
      }

      mediaRecords.push(data);
    }

    console.log('✅ Property Media: Added', mediaRecords.length, 'media files to property', propertyId);
    res.json({
      success: true,
      message: `Added ${mediaRecords.length} media file(s) to property`,
      data: mediaRecords
    });
  } catch (error) {
    console.error('❌ Property Media Exception:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Get media for property endpoint
app.get('/api/properties/:propertyId/media', async (req, res) => {
  try {
    const { propertyId } = req.params;

    const { data, error } = await supabase
      .from('property_media')
      .select('*')
      .eq('property_id', propertyId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('❌ Property Media Get Error:', error);
      return res.status(500).json({
        error: 'Failed to fetch property media',
        details: error.message
      });
    }

    console.log('✅ Property Media: Fetched', data?.length || 0, 'media files for property', propertyId);
    res.json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error) {
    console.error('❌ Property Media Get Exception:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Serve uploaded files statically
app.use('/uploads', express.static('./uploads'));

// All testimonials endpoint
app.get('/api/testimonials', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Testimonials API Error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch testimonials',
        details: error.message 
      });
    }

    console.log('✅ Testimonials API: Fetched', data?.length || 0, 'testimonials');
    res.json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error) {
    console.error('❌ Testimonials API Exception:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Approved testimonials endpoint
app.get('/api/testimonials/approved', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Testimonials API Error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch testimonials',
        details: error.message 
      });
    }

    console.log('✅ Testimonials API: Fetched', data?.length || 0, 'testimonials');
    res.json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error) {
    console.error('❌ Testimonials API Exception:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Users endpoint
app.get('/api/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, email, role, is_active, created_at')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Users API Error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch users',
        details: error.message 
      });
    }

    console.log('✅ Users API: Fetched', data?.length || 0, 'users');
    res.json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error) {
    console.error('❌ Users API Exception:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Inquiries endpoint
app.get('/api/inquiries', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('❌ Inquiries API Error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch inquiries',
        details: error.message 
      });
    }

    console.log('✅ Inquiries API: Fetched', data?.length || 0, 'inquiries');
    res.json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error) {
    console.error('❌ Inquiries API Exception:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// FAQs endpoint
app.get('/api/faqs', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('faqs')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true });

    if (error) {
      console.error('❌ FAQs API Error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch FAQs',
        details: error.message 
      });
    }

    console.log('✅ FAQs API: Fetched', data?.length || 0, 'FAQs');
    res.json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error) {
    console.error('❌ FAQs API Exception:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// FAQ Categories endpoint
app.get('/api/faq-categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('faq_categories')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true });

    if (error) {
      console.error('❌ FAQ Categories API Error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch FAQ categories',
        details: error.message 
      });
    }

    console.log('✅ FAQ Categories API: Fetched', data?.length || 0, 'categories');
    res.json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error) {
    console.error('❌ FAQ Categories API Exception:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Companies endpoint  
app.get('/api/companies', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('is_active', true)
      .order('order', { ascending: true });

    if (error) {
      console.error('❌ Companies API Error:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch companies',
        details: error.message 
      });
    }

    console.log('✅ Companies API: Fetched', data?.length || 0, 'companies');
    res.json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error) {
    console.error('❌ Companies API Exception:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Authentication endpoints
app.get('/api/auth/me', (req, res) => {
  // Return null user for unauthenticated state (expected by frontend)
  res.json({
    success: true,
    data: { user: null }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Demo admin credentials
  const DEMO_ADMIN = {
    email: 'demo-admin@gentlespacerealty.com',
    password: 'DemoAdmin123!'
  };
  
  console.log('🔐 Admin Login Attempt:', { email, hasPassword: !!password });
  
  if (!email || !password) {
    return res.status(400).json({
      error: 'Missing credentials',
      message: 'Email and password are required'
    });
  }
  
  // Check demo admin credentials
  if (email === DEMO_ADMIN.email && password === DEMO_ADMIN.password) {
    const mockUser = {
      id: 'admin-1',
      name: 'Demo Admin',
      email: email,
      role: 'admin',
      is_active: true,
      createdAt: new Date().toISOString()
    };
    
    const mockTokens = {
      accessToken: 'mock_admin_access_token_' + Date.now(),
      refreshToken: 'mock_admin_refresh_token_' + Date.now(),
      expiresIn: 3600,
      tokenType: 'Bearer'
    };
    
    console.log('✅ Admin Login Successful:', email);
    res.json({
      success: true,
      data: {
        user: mockUser,
        tokens: mockTokens
      }
    });
  } else {
    console.log('❌ Admin Login Failed: Invalid credentials');
    res.status(401).json({
      error: 'Invalid credentials',
      message: 'The email or password you entered is incorrect'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  // Mock register endpoint
  res.status(501).json({
    error: 'Register endpoint not implemented in test server', 
    message: 'This is a test server for data flow validation'
  });
});

app.post('/api/auth/logout', (req, res) => {
  // Mock logout endpoint
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

app.post('/api/auth/refresh', (req, res) => {
  // Mock refresh endpoint
  res.status(401).json({
    error: 'No refresh token provided',
    message: 'This is a test server for data flow validation'
  });
});

// Create inquiry endpoint
app.post('/api/inquiries', async (req, res) => {
  try {
    const { name, email, phone, message, company } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        details: 'Name, email, and message are required'
      });
    }

    const { data, error } = await supabase
      .from('inquiries')
      .insert([{
        name,
        email,
        phone: phone || null,
        message,
        company: company || null,
        inquiry_type: 'general',
        status: 'new',
        source: 'website'
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ Create Inquiry API Error:', error);
      return res.status(500).json({ 
        error: 'Failed to create inquiry',
        details: error.message 
      });
    }

    console.log('✅ Create Inquiry API: Created inquiry for', email);
    res.status(201).json({
      success: true,
      message: 'Inquiry created successfully',
      data: data
    });
  } catch (error) {
    console.error('❌ Create Inquiry API Exception:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log('🚀 Test Express API Server running on port', PORT);
  console.log('🔗 Health check: http://localhost:' + PORT + '/api/health');
  console.log('📊 API Endpoints:');
  console.log('   GET  /api/properties');
  console.log('   POST /api/properties');
  console.log('   PUT  /api/properties/:id');
  console.log('   DELETE /api/properties/:id');
  console.log('   GET  /api/testimonials');
  console.log('   GET  /api/testimonials/approved');  
  console.log('   GET  /api/users');
  console.log('   GET  /api/inquiries');
  console.log('   POST /api/inquiries');
  console.log('   GET  /api/faqs');
  console.log('   GET  /api/faq-categories');
  console.log('   GET  /api/companies');
  console.log('   POST /api/properties/media/upload');
  console.log('   POST /api/properties/:id/media');
  console.log('   GET  /api/properties/:id/media');
});