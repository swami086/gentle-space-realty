import { faker } from 'faker';

export interface TestProperty {
  id?: string;
  title: string;
  description: string;
  type: 'house' | 'apartment' | 'commercial';
  price: number;
  location: {
    address: string;
    city: string;
    state: string;
    zipcode: string;
    latitude?: number;
    longitude?: number;
  };
  features: {
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    parking?: boolean;
    garden?: boolean;
    pool?: boolean;
    garage?: boolean;
  };
  images?: Array<{
    id: string;
    url: string;
    alt: string;
    isPrimary: boolean;
  }>;
  status: 'available' | 'pending' | 'sold';
  createdAt?: string;
  updatedAt?: string;
}

export const createMockProperty = (overrides: Partial<TestProperty> = {}): TestProperty => ({
  id: faker.string.uuid(),
  title: faker.lorem.words(3),
  description: faker.lorem.paragraphs(2),
  type: faker.helpers.arrayElement(['house', 'apartment', 'commercial']),
  price: faker.number.int({ min: 100000, max: 2000000 }),
  location: {
    address: faker.location.streetAddress(),
    city: faker.location.city(),
    state: faker.location.state({ abbreviated: true }),
    zipcode: faker.location.zipCode(),
    latitude: faker.location.latitude(),
    longitude: faker.location.longitude(),
  },
  features: {
    bedrooms: faker.number.int({ min: 1, max: 5 }),
    bathrooms: faker.number.int({ min: 1, max: 4 }),
    squareFootage: faker.number.int({ min: 800, max: 4000 }),
    parking: faker.datatype.boolean(),
    garden: faker.datatype.boolean(),
    pool: faker.datatype.boolean(),
    garage: faker.datatype.boolean(),
  },
  images: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, (_, index) => ({
    id: faker.string.uuid(),
    url: faker.image.urlPicsumPhotos({ width: 800, height: 600 }),
    alt: `Property image ${index + 1}`,
    isPrimary: index === 0,
  })),
  status: faker.helpers.arrayElement(['available', 'pending', 'sold']),
  createdAt: faker.date.past().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
  ...overrides,
});

export const createMockProperties = (count: number, overrides: Partial<TestProperty> = {}): TestProperty[] => {
  return Array.from({ length: count }, () => createMockProperty(overrides));
};

// Specific property types for testing
export const mockHouse = (): TestProperty => createMockProperty({
  type: 'house',
  features: {
    bedrooms: faker.number.int({ min: 2, max: 5 }),
    bathrooms: faker.number.int({ min: 2, max: 4 }),
    squareFootage: faker.number.int({ min: 1200, max: 4000 }),
    parking: true,
    garden: true,
    pool: faker.datatype.boolean(),
    garage: true,
  },
});

export const mockApartment = (): TestProperty => createMockProperty({
  type: 'apartment',
  features: {
    bedrooms: faker.number.int({ min: 1, max: 3 }),
    bathrooms: faker.number.int({ min: 1, max: 2 }),
    squareFootage: faker.number.int({ min: 600, max: 1500 }),
    parking: faker.datatype.boolean(),
    garden: false,
    pool: faker.datatype.boolean(),
    garage: false,
  },
});

export const mockCommercialProperty = (): TestProperty => createMockProperty({
  type: 'commercial',
  price: faker.number.int({ min: 500000, max: 5000000 }),
  features: {
    bedrooms: 0,
    bathrooms: faker.number.int({ min: 1, max: 10 }),
    squareFootage: faker.number.int({ min: 1000, max: 20000 }),
    parking: true,
    garden: false,
    pool: false,
    garage: false,
  },
});

// Edge cases for testing
export const mockMinimalProperty = (): TestProperty => createMockProperty({
  title: 'Minimal Test Property',
  description: 'Basic property for testing',
  price: 100000,
  features: {
    bedrooms: 1,
    bathrooms: 1,
    squareFootage: 500,
  },
  images: [],
});

export const mockLuxuryProperty = (): TestProperty => createMockProperty({
  title: 'Luxury Test Estate',
  description: 'High-end property for testing',
  type: 'house',
  price: 5000000,
  features: {
    bedrooms: 6,
    bathrooms: 5,
    squareFootage: 8000,
    parking: true,
    garden: true,
    pool: true,
    garage: true,
  },
});

// Property search filters for testing
export const mockPropertyFilters = {
  basic: {
    search: 'family home',
    type: 'house' as const,
  },
  priceRange: {
    priceRange: { min: 200000, max: 800000 },
  },
  locationBased: {
    location: 'San Francisco',
    search: 'downtown',
  },
  featureBased: {
    bedrooms: 3,
    bathrooms: 2,
    type: 'apartment' as const,
  },
  comprehensive: {
    search: 'modern apartment',
    type: 'apartment' as const,
    priceRange: { min: 300000, max: 600000 },
    location: 'New York',
    bedrooms: 2,
    bathrooms: 1,
  },
};

// Invalid property data for validation testing
export const invalidPropertyData = {
  missingTitle: {
    description: 'Missing title',
    type: 'house',
    price: 100000,
  },
  invalidPrice: {
    title: 'Invalid Price Property',
    description: 'Property with invalid price',
    type: 'house',
    price: -100000, // Negative price
  },
  invalidType: {
    title: 'Invalid Type Property',
    description: 'Property with invalid type',
    type: 'mansion', // Invalid type
    price: 100000,
  },
  missingLocation: {
    title: 'Missing Location',
    description: 'Property without location',
    type: 'apartment',
    price: 200000,
    // location field missing
  },
  invalidFeatures: {
    title: 'Invalid Features',
    description: 'Property with invalid features',
    type: 'house',
    price: 300000,
    location: {
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipcode: '12345',
    },
    features: {
      bedrooms: -1, // Invalid negative bedrooms
      bathrooms: 0.5, // Invalid decimal bathrooms
      squareFootage: 0, // Invalid zero square footage
    },
  },
};