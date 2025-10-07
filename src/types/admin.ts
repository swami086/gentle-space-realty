export interface Admin {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  createdAt: string;
}

export interface CustomerInquiry {
  id: string;
  name: string;
  company?: string;
  email: string;
  phone?: string;
  message: string;
  propertyId?: string;
  propertyTitle?: string;
  status: 'new' | 'contacted' | 'in_progress' | 'converted' | 'closed';
  priority: 'low' | 'medium' | 'high';
  notes?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  responseTime?: number; // in hours
}

export interface PropertyFormData {
  title: string;
  description: string;
  category: string;
  location: string;
  price: {
    amount: number;
    period: 'monthly' | 'daily' | 'hourly';
  };
  size: {
    area: number;
    unit: 'sqft' | 'seats';
  };
  images: string[];
  amenities: string[];
  availability: {
    available: boolean;
    availableFrom?: string;
  };
  features: {
    furnished: boolean;
    parking: boolean;
    wifi: boolean;
    ac: boolean;
    security: boolean;
    cafeteria: boolean;
  };
  contact: {
    phone: string;
    email: string;
    whatsapp?: string;
  };
}

export interface DashboardStats {
  totalProperties: number;
  activeProperties: number;
  totalInquiries: number;
  newInquiries: number;
  conversionRate: number;
  averageResponseTime: number;
  monthlyInquiries: number[];
  inquiriesByStatus: {
    new: number;
    contacted: number;
    in_progress: number;
    converted: number;
    closed: number;
  };
}

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
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
}

export interface TestimonialStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  recentSubmissions: number;
}

// Property Tag interfaces for custom tagging system
export interface PropertyTag {
  id: string;
  name: string;
  color: string;
  backgroundColor: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TagFormData {
  name: string;
  color: string;
  backgroundColor: string;
  description?: string;
  isActive: boolean;
}
