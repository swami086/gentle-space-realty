const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = 3001;

// Environment configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://nfryqqpfprupwqayirnc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mcnlxcXBmcHJ1cHdxYXlpcm5jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzgxNDAxOCwiZXhwIjoyMDczMzkwMDE4fQ.XTxgPSa-J5uMLvs7uGOl4REH3ziEZNY1vHQjAple_fQ';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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

// Properties endpoint
app.get('/api/v1/properties', async (req, res) => {
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

    console.log('✅ Properties API: Fetched', data?.length || 0, 'properties');
    res.json({
      success: true,
      count: data?.length || 0,
      data: data || []
    });
  } catch (error) {
    console.error('❌ Properties API Exception:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
});

// Testimonials endpoint
app.get('/api/v1/testimonials', async (req, res) => {
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
app.get('/api/v1/users', async (req, res) => {
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
app.get('/api/v1/inquiries', async (req, res) => {
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
app.get('/api/v1/faqs', async (req, res) => {
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

// Companies endpoint  
app.get('/api/v1/companies', async (req, res) => {
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

// Create inquiry endpoint
app.post('/api/v1/inquiries', async (req, res) => {
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
  console.log('   GET  /api/v1/properties');
  console.log('   GET  /api/v1/testimonials');  
  console.log('   GET  /api/v1/users');
  console.log('   GET  /api/v1/inquiries');
  console.log('   GET  /api/v1/faqs');
  console.log('   GET  /api/v1/companies');
  console.log('   POST /api/v1/inquiries');
});