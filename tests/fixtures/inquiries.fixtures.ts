import { faker } from 'faker';

export interface TestInquiry {
  id?: string;
  propertyId: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'new' | 'contacted' | 'qualified' | 'closed';
  submittedAt?: string;
  respondedAt?: string;
}

export const createMockInquiry = (overrides: Partial<TestInquiry> = {}): TestInquiry => ({
  id: faker.string.uuid(),
  propertyId: faker.string.uuid(),
  customerName: faker.person.fullName(),
  customerEmail: faker.internet.email(),
  customerPhone: faker.phone.number(),
  message: faker.lorem.sentences(2),
  priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'urgent']),
  status: faker.helpers.arrayElement(['new', 'contacted', 'qualified', 'closed']),
  submittedAt: faker.date.past().toISOString(),
  respondedAt: faker.datatype.boolean() ? faker.date.recent().toISOString() : undefined,
  ...overrides,
});

export const createMockInquiries = (count: number, overrides: Partial<TestInquiry> = {}): TestInquiry[] => {
  return Array.from({ length: count }, () => createMockInquiry(overrides));
};

// Specific inquiry types for testing
export const mockUrgentInquiry = (propertyId?: string): TestInquiry => createMockInquiry({
  propertyId: propertyId || faker.string.uuid(),
  priority: 'urgent',
  status: 'new',
  message: 'I need to see this property immediately. Cash buyer ready to close.',
  customerName: 'VIP Customer',
  customerEmail: 'vip@example.com',
  submittedAt: new Date().toISOString(),
});

export const mockLowPriorityInquiry = (propertyId?: string): TestInquiry => createMockInquiry({
  propertyId: propertyId || faker.string.uuid(),
  priority: 'low',
  status: 'new',
  message: 'Just looking for information about the neighborhood.',
  submittedAt: faker.date.past({ days: 7 }).toISOString(),
});

export const mockQualifiedInquiry = (propertyId?: string): TestInquiry => createMockInquiry({
  propertyId: propertyId || faker.string.uuid(),
  priority: 'high',
  status: 'qualified',
  message: 'Pre-approved for mortgage, interested in scheduling a viewing.',
  customerName: 'Qualified Buyer',
  customerEmail: 'qualified@example.com',
  submittedAt: faker.date.past({ days: 2 }).toISOString(),
  respondedAt: faker.date.past({ days: 1 }).toISOString(),
});

export const mockClosedInquiry = (propertyId?: string): TestInquiry => createMockInquiry({
  propertyId: propertyId || faker.string.uuid(),
  priority: 'medium',
  status: 'closed',
  message: 'Interested in the property details and financing options.',
  submittedAt: faker.date.past({ days: 14 }).toISOString(),
  respondedAt: faker.date.past({ days: 12 }).toISOString(),
});

// Inquiry request data for API testing
export const mockInquiryRequest = (propertyId?: string) => ({
  propertyId: propertyId || faker.string.uuid(),
  customerName: faker.person.fullName(),
  customerEmail: faker.internet.email(),
  customerPhone: faker.phone.number(),
  message: faker.lorem.sentences(2),
});

export const mockInquiryRequestWithoutPhone = (propertyId?: string) => ({
  propertyId: propertyId || faker.string.uuid(),
  customerName: faker.person.fullName(),
  customerEmail: faker.internet.email(),
  message: faker.lorem.sentences(1),
});

// Invalid inquiry data for validation testing
export const invalidInquiryData = {
  missingPropertyId: {
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    message: 'Interested in this property',
  },
  missingCustomerName: {
    propertyId: faker.string.uuid(),
    customerEmail: 'test@example.com',
    message: 'No name provided',
  },
  invalidEmail: {
    propertyId: faker.string.uuid(),
    customerName: 'Test User',
    customerEmail: 'invalid-email',
    message: 'Invalid email format',
  },
  emptyMessage: {
    propertyId: faker.string.uuid(),
    customerName: 'Test User',
    customerEmail: 'test@example.com',
    message: '',
  },
  tooLongMessage: {
    propertyId: faker.string.uuid(),
    customerName: 'Test User',
    customerEmail: 'test@example.com',
    message: 'a'.repeat(2001), // Assuming 2000 char limit
  },
  invalidPhone: {
    propertyId: faker.string.uuid(),
    customerName: 'Test User',
    customerEmail: 'test@example.com',
    customerPhone: '123', // Invalid phone format
    message: 'Test message',
  },
  nonExistentPropertyId: {
    propertyId: '00000000-0000-0000-0000-000000000000',
    customerName: 'Test User',
    customerEmail: 'test@example.com',
    message: 'Inquiry for non-existent property',
  },
};

// Spam-like inquiry data for security testing
export const spamInquiryData = {
  repetitiveContent: {
    propertyId: faker.string.uuid(),
    customerName: 'Spam User',
    customerEmail: 'spam@spam.com',
    message: 'Buy now! Buy now! Buy now! Click here! Free money!',
  },
  suspiciousLinks: {
    propertyId: faker.string.uuid(),
    customerName: 'Spammer',
    customerEmail: 'spammer@example.com',
    message: 'Check out this amazing offer: http://suspicious-link.com/malware',
  },
  scriptInjection: {
    propertyId: faker.string.uuid(),
    customerName: '<script>alert("XSS")</script>',
    customerEmail: 'hacker@example.com',
    message: '<script>document.cookie="stolen"</script>Interested in property',
  },
  sqlInjection: {
    propertyId: faker.string.uuid(),
    customerName: "'; DROP TABLE inquiries; --",
    customerEmail: 'sql@injection.com',
    message: 'Robert\'); DROP TABLE inquiries;--',
  },
};

// Bulk inquiry data for load testing
export const createBulkInquiries = (count: number, propertyIds: string[]): TestInquiry[] => {
  return Array.from({ length: count }, () => createMockInquiry({
    propertyId: faker.helpers.arrayElement(propertyIds),
  }));
};

// Priority classification test cases
export const priorityTestCases = {
  urgentKeywords: [
    'cash buyer',
    'immediate',
    'urgent',
    'asap',
    'ready to close',
    'pre-approved'
  ].map(keyword => mockInquiryRequest().message = `I am a ${keyword} and interested in this property`),
  
  highPriorityKeywords: [
    'qualified',
    'pre-qualified',
    'financing approved',
    'serious buyer',
    'relocating soon'
  ].map(keyword => mockInquiryRequest().message = `I am ${keyword} for this property`),
  
  lowPriorityKeywords: [
    'just looking',
    'information only',
    'browsing',
    'curious about',
    'general inquiry'
  ].map(keyword => mockInquiryRequest().message = `${keyword} - tell me about this property`),
};