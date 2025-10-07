export interface Testimonial {
  id: string;
  name: string;
  company: string;
  position: string;
  content: string;
  rating: number; // 1-5 stars
  email: string;
  phone?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
  rejection_reason?: string;
}

export interface TestimonialFormData {
  name: string;
  company: string;
  position: string;
  content: string;
  rating: number;
  email: string;
  phone?: string;
}

export interface TestimonialStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}