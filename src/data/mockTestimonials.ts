import { Testimonial } from '@/types/testimonial';

export const mockTestimonials: Testimonial[] = [
  // Approved testimonials
  {
    id: '1',
    name: 'Rajesh Kumar',
    company: 'Tech Solutions Pvt Ltd',
    role: 'CEO',
    content: 'Gentle Space helped us find the perfect office space in Koramangala. Their team was professional and understood our specific requirements. Highly recommended for anyone looking for quality office spaces in Bangalore.',
    rating: 5,
    email: 'rajesh.kumar@techsolutions.com',
    phone: '+91-9876543210',
    status: 'approved',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-16T14:20:00Z',
    approved_at: '2024-01-16T14:20:00Z',
    approved_by: 'Admin User'
  },
  {
    id: '2',
    name: 'Priya Sharma',
    company: 'Digital Marketing Hub',
    role: 'Founder',
    content: 'Amazing service and great variety of office spaces. The team at Gentle Space made our office hunt effortless. We found our dream workspace in HSR Layout within a week!',
    rating: 5,
    email: 'priya@digitalmarketinghub.com',
    phone: '+91-9876543211',
    status: 'approved',
    created_at: '2024-01-20T09:15:00Z',
    updated_at: '2024-01-21T11:30:00Z',
    approved_at: '2024-01-21T11:30:00Z',
    approved_by: 'Admin User'
  },
  {
    id: '3',
    name: 'Amit Patel',
    company: 'StartupXYZ',
    role: 'Co-founder',
    content: 'Professional service with transparent pricing. No hidden costs and excellent support throughout the process. Found our office in Indiranagar quickly.',
    rating: 4,
    email: 'amit@startupxyz.com',
    status: 'approved',
    created_at: '2024-01-25T16:45:00Z',
    updated_at: '2024-01-26T10:15:00Z',
    approved_at: '2024-01-26T10:15:00Z',
    approved_by: 'Admin User'
  },
  {
    id: '4',
    name: 'Sneha Reddy',
    company: 'Creative Agency Co.',
    role: 'Creative Director',
    content: 'Gentle Space understood our creative team\'s needs perfectly. The office space in Whitefield has great natural light and modern amenities. Very satisfied with the service.',
    rating: 5,
    email: 'sneha@creativeagency.com',
    phone: '+91-9876543213',
    status: 'approved',
    created_at: '2024-02-01T12:00:00Z',
    updated_at: '2024-02-02T09:30:00Z',
    approved_at: '2024-02-02T09:30:00Z',
    approved_by: 'Admin User'
  },
  {
    id: '5',
    name: 'Vikram Singh',
    company: 'Consulting Firm Ltd',
    role: 'Managing Partner',
    content: 'Excellent property portfolio and knowledgeable team. They helped us negotiate better terms and found us a premium office space in UB City area.',
    rating: 4,
    email: 'vikram@consultingfirm.com',
    status: 'approved',
    created_at: '2024-02-05T14:30:00Z',
    updated_at: '2024-02-06T11:45:00Z',
    approved_at: '2024-02-06T11:45:00Z',
    approved_by: 'Admin User'
  },
  
  // Pending testimonials (awaiting approval)
  {
    id: '6',
    name: 'Arjun Menon',
    company: 'DevOps Solutions',
    role: 'Technical Lead',
    content: 'Great experience working with Gentle Space team. They were responsive and helped us find a suitable office space for our growing team in Electronic City.',
    rating: 4,
    email: 'arjun@devopssolutions.com',
    phone: '+91-9876543214',
    status: 'pending',
    created_at: '2024-02-10T08:20:00Z',
    updated_at: '2024-02-10T08:20:00Z'
  },
  {
    id: '7',
    name: 'Kavya Nair',
    company: 'FinTech Innovations',
    role: 'Product Manager',
    content: 'Very professional service and great selection of office spaces. The team helped us understand all the lease terms clearly. Highly recommend for startups.',
    rating: 5,
    email: 'kavya@fintechinnovations.com',
    status: 'pending',
    created_at: '2024-02-12T15:10:00Z',
    updated_at: '2024-02-12T15:10:00Z'
  },
  {
    id: '8',
    name: 'Rohit Agarwal',
    company: 'E-commerce Ventures',
    role: 'Operations Head',
    content: 'Found our warehouse cum office space through Gentle Space. The location in Bommanahalli is perfect for our logistics operations. Satisfied with the overall experience.',
    rating: 4,
    email: 'rohit@ecommerceventures.com',
    phone: '+91-9876543215',
    status: 'pending',
    created_at: '2024-02-15T11:30:00Z',
    updated_at: '2024-02-15T11:30:00Z'
  },
  
  // One rejected testimonial (example)
  {
    id: '9',
    name: 'Test User',
    company: 'Test Company',
    role: 'Test Role',
    content: 'This is a test testimonial that was rejected.',
    rating: 3,
    email: 'test@test.com',
    status: 'rejected',
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-11T10:00:00Z',
    rejection_reason: 'Insufficient detail provided',
    approved_by: 'Admin User'
  }
];