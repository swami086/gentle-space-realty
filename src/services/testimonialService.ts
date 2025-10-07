import { API } from './apiService';

export interface Testimonial {
  id: string;
  name: string;
  company?: string;
  role?: string;
  content: string;
  rating: number; // 1-5
  email: string;
  phone?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
}

export interface TestimonialSubmission {
  name: string;
  company?: string;
  role?: string;
  content: string;
  rating: number;
  email: string;
  phone?: string;
}

export interface TestimonialUpdate {
  status?: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  rejection_reason?: string;
}

export class TestimonialService {
  // Public methods (for website visitors)
  static async getApprovedTestimonials(): Promise<Testimonial[]> {
    console.log('🌟 TestimonialService.getApprovedTestimonials: Fetching approved testimonials via API...');
    
    try {
      const data = await API.testimonials.getApproved();
      console.log('✅ TestimonialService.getApprovedTestimonials: Found', data?.length || 0, 'approved testimonials');
      return data || [];
    } catch (error) {
      console.error('Error fetching approved testimonials:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to fetch approved testimonials');
    }
  }

  static async submitTestimonial(testimonial: TestimonialSubmission): Promise<Testimonial> {
    console.log('📝 TestimonialService.submitTestimonial called with:', testimonial);
    
    const testimonialData = {
      name: testimonial.name,
      company: testimonial.company || null,
      role: testimonial.role || null,
      content: testimonial.content,
      rating: testimonial.rating,
      email: testimonial.email,
      phone: testimonial.phone || null,
      status: 'pending' as const
    };

    console.log('📊 Testimonial data for API:', testimonialData);
    
    try {
      const data = await API.testimonials.create(testimonialData);
      console.log('✅ Testimonial submitted successfully via API:', data);
      return data;
    } catch (error) {
      console.error('❌ Error submitting testimonial:', error);
      throw new Error(`Failed to submit testimonial: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Admin methods (for admin panel) - now use API service
  static async getAllTestimonials(): Promise<Testimonial[]> {
    console.log('🔧 TestimonialService.getAllTestimonials: Using API service...');
    
    try {
      console.log('🔍 Fetching all testimonials via API...');

      // Use API service directly
      const data = await API.testimonials.getAll();
      
      console.log('✅ TestimonialService.getAllTestimonials: API request successful, got', data.length, 'testimonials');

      return data;
    } catch (error) {
      console.error('❌ TestimonialService.getAllTestimonials: Unexpected error:', error);
      
      throw error;
    }
  }

  static async updateTestimonialStatus(
    id: string, 
    updates: TestimonialUpdate
  ): Promise<Testimonial> {
    console.log('🔄 TestimonialService.updateTestimonialStatus: Using API...', { id, updates });
    
    try {
      // Use API service directly
      const data = await API.testimonials.updateStatus(id, {
        status: updates.status || 'pending',
        reviewerId: updates.approved_by,
        reason: updates.rejection_reason
      });

      console.log('✅ Testimonial updated successfully via API service:', data);
      return data;
    } catch (error) {
      console.error('❌ TestimonialService.updateTestimonialStatus error:', error);
      throw error instanceof Error ? error : new Error('Failed to update testimonial');
    }
  }

  static async deleteTestimonial(id: string): Promise<boolean> {
    console.log('🗑️ TestimonialService.deleteTestimonial: Using API...', id);
    
    try {
      // Use API service directly
      await API.testimonials.delete(id);

      console.log('✅ Testimonial deleted successfully via API service');
      return true;
    } catch (error) {
      console.error('❌ TestimonialService.deleteTestimonial error:', error);
      throw error instanceof Error ? error : new Error('Failed to delete testimonial');
    }
  }

  // Additional convenience methods for store integration
  static async updateTestimonial(id: string, updates: Partial<Testimonial>): Promise<Testimonial> {
    return this.updateTestimonialStatus(id, updates as TestimonialUpdate);
  }

  static async approveTestimonial(id: string, approvedBy: string): Promise<Testimonial> {
    return this.updateTestimonialStatus(id, { 
      status: 'approved', 
      approved_by: approvedBy 
    });
  }

  static async rejectTestimonial(id: string, reason: string, rejectedBy: string): Promise<Testimonial> {
    return this.updateTestimonialStatus(id, { 
      status: 'rejected', 
      rejection_reason: reason,
      approved_by: rejectedBy 
    });
  }

  static async getPendingTestimonials(): Promise<Testimonial[]> {
    console.log('⏳ TestimonialService.getPendingTestimonials: Fetching pending testimonials...');
    
    try {
      // Use API service directly
      const pendingTestimonials = await API.testimonials.getPending();

      console.log('✅ TestimonialService.getPendingTestimonials: Found', pendingTestimonials.length, 'pending testimonials');
      return pendingTestimonials;
    } catch (error) {
      console.error('❌ TestimonialService.getPendingTestimonials error:', error);
      throw error;
    }
  }

  // Analytics methods
  static async getTestimonialStats() {
    console.log('📊 TestimonialService.getTestimonialStats: Getting testimonial statistics via API...');
    
    try {
      // Use API service directly
      const stats = await API.testimonials.getStats();

      console.log('✅ Testimonial stats retrieved successfully via API service:', stats);
      return stats;
    } catch (error) {
      console.error('❌ TestimonialService.getTestimonialStats error:', error);
      throw error instanceof Error ? error : new Error('Failed to get testimonial statistics');
    }
  }
}