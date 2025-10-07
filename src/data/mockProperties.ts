import { Property } from '@/types/property';
import { mockTags } from './mockTags';

export const mockProperties: Property[] = [
  {
    id: '1',
    title: 'Premium Furnished Office in Koramangala',
    description: 'Modern 2500 sqft office space with premium interiors, perfect for tech startups and growing companies. Located in the heart of Koramangala with excellent connectivity.',
    category: 'fully-furnished-offices',
    location: 'koramangala',
    price: {
      amount: 125000,
      period: 'monthly',
      currency: 'INR'
    },
    size: {
      area: 2500,
      unit: 'sqft'
    },
    images: [
      '/images/properties/property-1-office-1.jpg',
      '/images/properties/property-1-office-2.jpg'
    ],
    amenities: ['High-Speed WiFi', 'AC', 'Parking', 'Security', 'Cafeteria', 'Meeting Rooms'],
    availability: {
      available: true,
      availableFrom: '2024-02-01',
      status: 'available'
    },
    coordinates: {
      lat: 12.9279,
      lng: 77.6271
    },
    approximateLocation: {
      area: 'Koramangala 5th Block',
      radius: '1km',
      landmarks: ['Forum Mall', 'Sony Signal', 'Jyoti Nivas College']
    },
    customTags: [mockTags[0], mockTags[2], mockTags[4]],
    features: {
      furnished: true,
      parking: true,
      wifi: true,
      ac: true,
      security: true,
      cafeteria: true
    },
    contact: {
      phone: '+91-9876543210',
      email: 'contact@gentlespace.com',
      whatsapp: '+91-9876543210'
    },
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: 'Co-working Space in Indiranagar',
    description: 'Vibrant co-working environment with flexible seating options. Perfect for freelancers, startups, and remote teams looking for a collaborative workspace.',
    category: 'co-working-spaces',
    location: 'indiranagar',
    price: {
      amount: 8000,
      period: 'monthly',
      currency: 'INR'
    },
    size: {
      area: 50,
      unit: 'seats'
    },
    images: [
      '/images/properties/property-2-coworking-1.jpg',
      '/images/properties/property-2-coworking-2.jpg'
    ],
    amenities: ['High-Speed WiFi', 'AC', 'Printing', 'Coffee', 'Networking Events'],
    availability: {
      available: true,
      status: 'available'
    },
    coordinates: {
      lat: 12.9784,
      lng: 77.6408
    },
    approximateLocation: {
      area: 'Indiranagar 100 Feet Road',
      radius: '500m',
      landmarks: ['Indiranagar Metro Station', '100 Feet Road', 'CMH Road']
    },
    customTags: [mockTags[2], mockTags[6], mockTags[7]],
    features: {
      furnished: true,
      parking: false,
      wifi: true,
      ac: true,
      security: true,
      cafeteria: true
    },
    contact: {
      phone: '+91-9876543210',
      email: 'contact@gentlespace.com',
      whatsapp: '+91-9876543210'
    },
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-10T10:00:00Z'
  },
  {
    id: '3',
    title: 'Enterprise Office in Whitefield',
    description: 'Large-scale office facility spanning 10,000 sqft, designed for enterprise clients and fast-growing teams. Modern infrastructure with scalable workspace solutions.',
    category: 'enterprise-offices',
    location: 'whitefield',
    price: {
      amount: 450000,
      period: 'monthly',
      currency: 'INR'
    },
    size: {
      area: 10000,
      unit: 'sqft'
    },
    images: [
      '/images/properties/property-3-enterprise-1.jpg',
      '/images/properties/property-3-enterprise-2.jpg'
    ],
    amenities: ['High-Speed WiFi', 'AC', 'Parking', 'Security', 'Cafeteria', 'Conference Rooms', 'Reception'],
    availability: {
      available: true,
      availableFrom: '2024-03-01',
      status: 'available'
    },
    coordinates: {
      lat: 12.9698,
      lng: 77.7499
    },
    approximateLocation: {
      area: 'Whitefield IT Park',
      radius: '2km',
      landmarks: ['ITPL', 'Phoenix MarketCity', 'Graphite India']
    },
    customTags: [mockTags[0], mockTags[4], mockTags[8]],
    features: {
      furnished: true,
      parking: true,
      wifi: true,
      ac: true,
      security: true,
      cafeteria: true
    },
    contact: {
      phone: '+91-9876543210',
      email: 'contact@gentlespace.com',
      whatsapp: '+91-9876543210'
    },
    createdAt: '2024-01-12T10:00:00Z',
    updatedAt: '2024-01-12T10:00:00Z'
  },
  {
    id: '4',
    title: 'Private Office Cabin in MG Road',
    description: 'Secure, enclosed private office space perfect for small teams needing privacy and focus. Located in the prestigious MG Road business district.',
    category: 'private-office-cabins',
    location: 'mg-road',
    price: {
      amount: 35000,
      period: 'monthly',
      currency: 'INR'
    },
    size: {
      area: 400,
      unit: 'sqft'
    },
    images: [
      '/images/properties/property-4-private-1.jpg',
      '/images/properties/property-4-private-2.jpg'
    ],
    amenities: ['High-Speed WiFi', 'AC', 'Parking', 'Security', 'Reception'],
    availability: {
      available: true,
      status: 'available'
    },
    coordinates: {
      lat: 12.9716,
      lng: 77.5946
    },
    approximateLocation: {
      area: 'MG Road Commercial District',
      radius: '300m',
      landmarks: ['MG Road Metro Station', 'Brigade Road', 'Trinity Circle']
    },
    customTags: [mockTags[0], mockTags[5], mockTags[7]],
    features: {
      furnished: true,
      parking: true,
      wifi: true,
      ac: true,
      security: true,
      cafeteria: false
    },
    contact: {
      phone: '+91-9876543210',
      email: 'contact@gentlespace.com',
      whatsapp: '+91-9876543210'
    },
    createdAt: '2024-01-08T10:00:00Z',
    updatedAt: '2024-01-08T10:00:00Z'
  },
  {
    id: '5',
    title: 'Virtual Office Package - HSR Layout',
    description: 'Establish your business presence with a premium HSR Layout address. Includes GST registration, mail handling, and meeting room access.',
    category: 'virtual-offices',
    location: 'hsr-layout',
    price: {
      amount: 5000,
      period: 'monthly',
      currency: 'INR'
    },
    size: {
      area: 0,
      unit: 'sqft'
    },
    images: [
      '/images/properties/property-5-virtual-1.jpg',
      '/images/properties/property-5-virtual-2.jpg'
    ],
    amenities: ['Business Address', 'Mail Handling', 'GST Registration', 'Meeting Room Access'],
    availability: {
      available: true,
      status: 'available'
    },
    coordinates: {
      lat: 12.9082,
      lng: 77.6476
    },
    approximateLocation: {
      area: 'HSR Layout Sector 7',
      radius: '1.5km',
      landmarks: ['Central Mall', '27th Main Road', 'HSR BDA Complex']
    },
    customTags: [mockTags[6], mockTags[7]],
    features: {
      furnished: false,
      parking: false,
      wifi: false,
      ac: false,
      security: false,
      cafeteria: false
    },
    contact: {
      phone: '+91-9876543210',
      email: 'contact@gentlespace.com',
      whatsapp: '+91-9876543210'
    },
    createdAt: '2024-01-05T10:00:00Z',
    updatedAt: '2024-01-05T10:00:00Z'
  },
  {
    id: '6',
    title: 'Meeting Room - Electronic City',
    description: 'Fully equipped meeting room available for hourly bookings. Perfect for client presentations, team meetings, and video conferences.',
    category: 'meeting-conference-rooms',
    location: 'electronic-city',
    price: {
      amount: 1500,
      period: 'hourly',
      currency: 'INR'
    },
    size: {
      area: 200,
      unit: 'sqft'
    },
    images: [
      '/images/properties/property-6-meeting-1.jpg',
      '/images/properties/property-6-meeting-2.jpg'
    ],
    amenities: ['Projector', 'Whiteboard', 'AC', 'WiFi', 'Video Conferencing', 'Refreshments'],
    availability: {
      available: true,
      status: 'available'
    },
    coordinates: {
      lat: 12.8440,
      lng: 77.6631
    },
    approximateLocation: {
      area: 'Electronic City Phase 1',
      radius: '800m',
      landmarks: ['Electronic City Metro Station', 'Infosys Campus', 'TCS Campus']
    },
    customTags: [mockTags[4], mockTags[8]],
    features: {
      furnished: true,
      parking: true,
      wifi: true,
      ac: true,
      security: true,
      cafeteria: false
    },
    contact: {
      phone: '+91-9876543210',
      email: 'contact@gentlespace.com',
      whatsapp: '+91-9876543210'
    },
    createdAt: '2024-01-03T10:00:00Z',
    updatedAt: '2024-01-03T10:00:00Z'
  },
  {
    id: '7',
    title: 'Custom-Built Workspace - JP Nagar',
    description: 'Tailored workspace solution designed according to your business needs. Flexible layout with modern amenities in the vibrant JP Nagar area.',
    category: 'custom-built-workspaces',
    location: 'jp-nagar',
    price: {
      amount: 85000,
      period: 'monthly',
      currency: 'INR'
    },
    size: {
      area: 1800,
      unit: 'sqft'
    },
    images: [
      '/images/properties/property-7-custom-1.jpg',
      '/images/properties/property-7-custom-2.jpg'
    ],
    amenities: ['High-Speed WiFi', 'AC', 'Parking', 'Security', 'Custom Interiors', 'Flexible Layout'],
    availability: {
      available: false,
      status: 'coming-soon',
      availableFrom: '2024-04-15'
    },
    coordinates: {
      lat: 12.9082,
      lng: 77.5855
    },
    approximateLocation: {
      area: 'JP Nagar 4th Phase',
      radius: '1km',
      landmarks: ['Sarakki Lake', 'Banashankari BDA Complex', 'JP Nagar Metro']
    },
    customTags: [mockTags[6], mockTags[9]],
    features: {
      furnished: true,
      parking: true,
      wifi: true,
      ac: true,
      security: true,
      cafeteria: false
    },
    contact: {
      phone: '+91-9876543210',
      email: 'contact@gentlespace.com',
      whatsapp: '+91-9876543210'
    },
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z'
  },
  {
    id: '8',
    title: 'Tech Hub - BTM Layout',
    description: 'State-of-the-art tech hub with advanced infrastructure, ideal for IT companies and tech startups. Currently under renovation with modern upgrades.',
    category: 'fully-furnished-offices',
    location: 'btm-layout',
    price: {
      amount: 95000,
      period: 'monthly',
      currency: 'INR'
    },
    size: {
      area: 2200,
      unit: 'sqft'
    },
    images: [
      '/images/properties/property-8-tech-1.jpg',
      '/images/properties/property-8-tech-2.jpg'
    ],
    amenities: ['High-Speed WiFi', 'AC', 'Parking', 'Security', 'Server Room', 'Conference Rooms'],
    availability: {
      available: false,
      status: 'under-maintenance',
      availableFrom: '2024-03-15'
    },
    coordinates: {
      lat: 12.9165,
      lng: 77.6101
    },
    approximateLocation: {
      area: 'BTM Layout 2nd Stage',
      radius: '1.2km',
      landmarks: ['Silk Board', 'BTM Bus Stop', 'Forum South Bangalore']
    },
    customTags: [mockTags[4], mockTags[9]],
    features: {
      furnished: true,
      parking: true,
      wifi: true,
      ac: true,
      security: true,
      cafeteria: true
    },
    contact: {
      phone: '+91-9876543210',
      email: 'contact@gentlespace.com',
      whatsapp: '+91-9876543210'
    },
    createdAt: '2024-01-18T10:00:00Z',
    updatedAt: '2024-01-18T10:00:00Z'
  }
];
