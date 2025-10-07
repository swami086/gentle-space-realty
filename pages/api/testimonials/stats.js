import { supabaseAdmin } from '../../../src/lib/supabaseAdminClient';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Check if admin client is available
  if (!supabaseAdmin) {
    console.error('❌ Admin client not available in server context');
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    // Get testimonial statistics
    const { data, error } = await supabaseAdmin
      .from('testimonials')
      .select('status, rating, created_at');

    if (error) {
      console.error('❌ Error fetching testimonial stats:', error);
      return res.status(400).json({ 
        error: `Failed to fetch testimonial stats: ${error.message}`,
        details: error 
      });
    }

    const stats = {
      total: data.length,
      pending: data.filter(t => t.status === 'pending').length,
      approved: data.filter(t => t.status === 'approved').length,
      rejected: data.filter(t => t.status === 'rejected').length,
      averageRating: data.length > 0 
        ? data.reduce((sum, t) => sum + t.rating, 0) / data.length 
        : 0,
      ratingDistribution: {
        1: data.filter(t => t.rating === 1).length,
        2: data.filter(t => t.rating === 2).length,
        3: data.filter(t => t.rating === 3).length,
        4: data.filter(t => t.rating === 4).length,
        5: data.filter(t => t.rating === 5).length,
      },
      recentSubmissions: data
        .filter(t => {
          const created = new Date(t.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return created >= weekAgo;
        }).length
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('❌ Testimonial stats API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}