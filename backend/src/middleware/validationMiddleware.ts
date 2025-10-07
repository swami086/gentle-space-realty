/**
 * Validation Middleware
 * Request validation using Joi schemas
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { createApiError } from './errorHandler';

/**
 * Generic validation middleware factory
 */
export const validate = (schema: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const errors: string[] = [];

    // Validate request body
    if (schema.body) {
      const { error } = schema.body.validate(req.body);
      if (error) {
        errors.push(...error.details.map(detail => `Body: ${detail.message}`));
      }
    }

    // Validate query parameters
    if (schema.query) {
      const { error } = schema.query.validate(req.query);
      if (error) {
        errors.push(...error.details.map(detail => `Query: ${detail.message}`));
      }
    }

    // Validate URL parameters
    if (schema.params) {
      const { error } = schema.params.validate(req.params);
      if (error) {
        errors.push(...error.details.map(detail => `Params: ${detail.message}`));
      }
    }

    if (errors.length > 0) {
      return next(createApiError(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        { errors }
      ));
    }

    next();
  };
};

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // UUID parameter validation
  uuidParam: Joi.object({
    id: Joi.string().uuid().required()
  }),

  // Pagination query validation
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // Search query validation
  search: Joi.object({
    q: Joi.string().min(1).max(100).optional(),
    category: Joi.string().optional(),
    status: Joi.string().optional()
  })
};

/**
 * Authentication validation schemas
 */
export const authSchemas = {
  login: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required()
    })
  },

  register: {
    body: Joi.object({
      name: Joi.string().min(2).max(100).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).max(128).required()
    })
  },

  refreshToken: {
    body: Joi.object({
      refreshToken: Joi.string().required()
    })
  }
};

/**
 * Property validation schemas
 */
export const propertySchemas = {
  create: {
    body: Joi.object({
      title: Joi.string().min(5).max(200).required(),
      description: Joi.string().min(10).max(2000).required(),
      price: Joi.number().positive().required(),
      location: Joi.string().min(5).max(200).required(),
      property_type: Joi.string().valid('house', 'apartment', 'condo', 'commercial').required(),
      bedrooms: Joi.number().integer().min(0).optional(),
      bathrooms: Joi.number().min(0).optional(),
      area_sqft: Joi.number().positive().optional(),
      features: Joi.array().items(Joi.string()).optional(),
      images: Joi.array().items(Joi.string().uri()).optional(),
      status: Joi.string().valid('available', 'pending', 'sold').default('available')
    })
  },

  update: {
    body: Joi.object({
      title: Joi.string().min(5).max(200).optional(),
      description: Joi.string().min(10).max(2000).optional(),
      price: Joi.number().positive().optional(),
      location: Joi.string().min(5).max(200).optional(),
      property_type: Joi.string().valid('house', 'apartment', 'condo', 'commercial').optional(),
      bedrooms: Joi.number().integer().min(0).optional(),
      bathrooms: Joi.number().min(0).optional(),
      area_sqft: Joi.number().positive().optional(),
      features: Joi.array().items(Joi.string()).optional(),
      images: Joi.array().items(Joi.string().uri()).optional(),
      status: Joi.string().valid('available', 'pending', 'sold').optional()
    }).min(1)
  },

  search: {
    query: Joi.object({
      q: Joi.string().min(1).max(100).optional(),
      minPrice: Joi.number().min(0).optional(),
      maxPrice: Joi.number().min(0).optional(),
      location: Joi.string().optional(),
      propertyType: Joi.string().optional(),
      minBedrooms: Joi.number().integer().min(0).optional(),
      maxBedrooms: Joi.number().integer().min(0).optional(),
      minBathrooms: Joi.number().min(0).optional(),
      maxBathrooms: Joi.number().min(0).optional(),
      status: Joi.string().valid('available', 'pending', 'sold').optional(),
      ...commonSchemas.pagination.describe().keys
    })
  }
};

/**
 * Testimonial validation schemas
 */
export const testimonialSchemas = {
  create: {
    body: Joi.object({
      client_name: Joi.string().min(2).max(100).required(),
      client_email: Joi.string().email().required(),
      content: Joi.string().min(10).max(1000).required(),
      rating: Joi.number().integer().min(1).max(5).required(),
      company: Joi.string().max(100).optional(),
      role: Joi.string().max(100).optional(),
      client_phone: Joi.string().pattern(/^[+]?[1-9]\d{1,14}$/).optional()
    })
  },

  update: {
    body: Joi.object({
      client_name: Joi.string().min(2).max(100).optional(),
      content: Joi.string().min(10).max(1000).optional(),
      rating: Joi.number().integer().min(1).max(5).optional(),
      company: Joi.string().max(100).optional(),
      role: Joi.string().max(100).optional(),
      client_phone: Joi.string().pattern(/^[+]?[1-9]\d{1,14}$/).optional()
    }).min(1)
  },

  updateStatus: {
    body: Joi.object({
      status: Joi.string().valid('pending', 'approved', 'rejected').required(),
      reviewerId: Joi.string().uuid().required(),
      reason: Joi.string().max(500).optional()
    })
  }
};

/**
 * Inquiry validation schemas
 */
export const inquirySchemas = {
  create: {
    body: Joi.object({
      name: Joi.string().min(2).max(100).required(),
      email: Joi.string().email().required(),
      message: Joi.string().min(10).max(1000).required(),
      phone: Joi.string().pattern(/^[+]?[1-9]\d{1,14}$/).optional(),
      property_id: Joi.string().uuid().optional(),
      inquiry_type: Joi.string().valid('general', 'property', 'viewing', 'investment').default('general'),
      company: Joi.string().max(100).optional()
    })
  },

  update: {
    body: Joi.object({
      status: Joi.string().valid('new', 'contacted', 'qualified', 'converted', 'closed').optional(),
      priority: Joi.string().valid('low', 'medium', 'high', 'urgent').optional(),
      notes: Joi.string().max(1000).optional(),
      assigned_to: Joi.string().uuid().optional()
    }).min(1)
  },

  updateStatus: {
    body: Joi.object({
      status: Joi.string().valid('new', 'contacted', 'qualified', 'converted', 'closed').required(),
      notes: Joi.string().max(1000).optional()
    })
  },

  assign: {
    body: Joi.object({
      agentId: Joi.string().uuid().required()
    })
  }
};

/**
 * User validation schemas
 */
export const userSchemas = {
  create: {
    body: Joi.object({
      name: Joi.string().min(2).max(100).required(),
      email: Joi.string().email().required(),
      role: Joi.string().valid('user', 'agent', 'admin').default('user'),
      is_active: Joi.boolean().default(true)
    })
  },

  update: {
    body: Joi.object({
      name: Joi.string().min(2).max(100).optional(),
      email: Joi.string().email().optional(),
      is_active: Joi.boolean().optional()
    }).min(1)
  },

  updateRole: {
    body: Joi.object({
      role: Joi.string().valid('user', 'agent', 'admin').required()
    })
  }
};

/**
 * Scraper validation schemas for property scraping endpoints with dynamic search support
 */
export const scraperSchemas = {
  // Reusable search parameters sub-schema
  searchParams: Joi.object({
    location: Joi.string().min(2).max(100).optional(),
    propertyType: Joi.string().valid('office', 'coworking', 'retail', 'warehouse', 'land').optional(),
    minPrice: Joi.number().positive().optional(),
    maxPrice: Joi.number().positive().optional(),
    minArea: Joi.number().positive().optional(),
    maxArea: Joi.number().positive().optional(),
    furnished: Joi.string().valid('furnished', 'semi-furnished', 'unfurnished').optional(),
    availability: Joi.string().valid('immediate', 'within-15-days', 'within-30-days', 'after-30-days').optional(),
    amenities: Joi.array().items(Joi.string()).optional(),
    sortBy: Joi.string().valid('relevance', 'price-low-to-high', 'price-high-to-low', 'newest').optional(),
    page: Joi.number().integer().min(1).optional()
  }),

  // Main scraping endpoint validation
  scrape: {
    body: Joi.object({
      directUrl: Joi.string().uri().optional(),
      searchParams: Joi.object({
        location: Joi.string().min(2).max(100).optional(),
        propertyType: Joi.string().valid('office', 'coworking', 'retail', 'warehouse', 'land').optional(),
        minPrice: Joi.number().positive().optional(),
        maxPrice: Joi.number().positive().optional(),
        minArea: Joi.number().positive().optional(),
        maxArea: Joi.number().positive().optional(),
        furnished: Joi.string().valid('furnished', 'semi-furnished', 'unfurnished').optional(),
        availability: Joi.string().valid('immediate', 'within-15-days', 'within-30-days', 'after-30-days').optional(),
        amenities: Joi.array().items(Joi.string()).optional(),
        sortBy: Joi.string().valid('relevance', 'price-low-to-high', 'price-high-to-low', 'newest').optional(),
        page: Joi.number().integer().min(1).optional()
      }).optional(),
      useCrawl: Joi.boolean().optional().default(false),
      maxPages: Joi.number().integer().min(1).max(10).optional().default(1),
      waitFor: Joi.number().integer().min(0).max(10000).optional(),
      includeTags: Joi.array().items(Joi.string()).optional(),
      excludeTags: Joi.array().items(Joi.string()).optional()
    }).custom((value, helpers) => {
      // Custom validation: at least one of directUrl or searchParams must be provided
      if (!value.directUrl && !value.searchParams) {
        return helpers.error('object.missing', {
          message: 'At least one of directUrl or searchParams must be provided'
        });
      }
      return value;
    })
  },

  // Preview endpoint validation
  preview: {
    body: Joi.object({
      directUrl: Joi.string().uri().optional(),
      searchParams: Joi.object({
        location: Joi.string().min(2).max(100).optional(),
        propertyType: Joi.string().valid('office', 'coworking', 'retail', 'warehouse', 'land').optional(),
        minPrice: Joi.number().positive().optional(),
        maxPrice: Joi.number().positive().optional(),
        minArea: Joi.number().positive().optional(),
        maxArea: Joi.number().positive().optional(),
        furnished: Joi.string().valid('furnished', 'semi-furnished', 'unfurnished').optional(),
        availability: Joi.string().valid('immediate', 'within-15-days', 'within-30-days', 'after-30-days').optional(),
        amenities: Joi.array().items(Joi.string()).optional(),
        sortBy: Joi.string().valid('relevance', 'price-low-to-high', 'price-high-to-low', 'newest').optional(),
        page: Joi.number().integer().min(1).optional()
      }).optional()
    }).custom((value, helpers) => {
      // Custom validation: at least one of directUrl or searchParams must be provided
      if (!value.directUrl && !value.searchParams) {
        return helpers.error('object.missing', {
          message: 'At least one of directUrl or searchParams must be provided'
        });
      }
      return value;
    })
  },

  // Bulk import endpoint validation
  bulkImport: {
    body: Joi.object({
      properties: Joi.array().items(
        Joi.object({
          title: Joi.string().min(5).max(200).required(),
          description: Joi.string().min(10).max(2000).required(),
          location: Joi.string().min(3).max(200).required(),
          sourceUrl: Joi.string().uri().required(),
          price: Joi.object({
            amount: Joi.number().positive().optional(),
            currency: Joi.string().valid('INR', 'USD', 'EUR').optional(),
            period: Joi.string().valid('monthly', 'yearly', 'one-time').optional()
          }).optional(),
          size: Joi.object({
            area: Joi.number().positive().optional(),
            unit: Joi.string().valid('sqft', 'seats').optional()
          }).optional(),
          amenities: Joi.array().items(Joi.string()).optional(),
          features: Joi.object({
            furnished: Joi.boolean().optional(),
            parking: Joi.boolean().optional(),
            wifi: Joi.boolean().optional(),
            ac: Joi.boolean().optional(),
            security: Joi.boolean().optional(),
            cafeteria: Joi.boolean().optional(),
            elevator: Joi.boolean().optional(),
            powerBackup: Joi.boolean().optional(),
            conferenceRoom: Joi.boolean().optional()
          }).optional(),
          contact: Joi.object({
            phone: Joi.string().optional(),
            email: Joi.string().email().optional(),
            contactPerson: Joi.string().optional()
          }).optional(),
          media: Joi.object({
            images: Joi.array().items(Joi.string().uri()).optional(),
            videos: Joi.array().items(Joi.string().uri()).optional()
          }).optional(),
          availability: Joi.object({
            status: Joi.string().valid('available', 'occupied', 'coming-soon').optional(),
            date: Joi.string().optional()
          }).optional(),
          scrapedAt: Joi.string().isoDate().optional(),
          searchParams: Joi.object().optional()
        })
      ).min(1).max(50).required(),
      skipValidation: Joi.boolean().optional().default(false),
      overwriteExisting: Joi.boolean().optional().default(false)
    })
  },

  // Save search preset validation
  savePreset: {
    body: Joi.object({
      name: Joi.string().min(3).max(100).required(),
      description: Joi.string().max(500).optional(),
      searchParams: Joi.object({
        location: Joi.string().min(2).max(100).optional(),
        propertyType: Joi.string().valid('office', 'coworking', 'retail', 'warehouse', 'land').optional(),
        minPrice: Joi.number().positive().optional(),
        maxPrice: Joi.number().positive().optional(),
        minArea: Joi.number().positive().optional(),
        maxArea: Joi.number().positive().optional(),
        furnished: Joi.string().valid('furnished', 'semi-furnished', 'unfurnished').optional(),
        availability: Joi.string().valid('immediate', 'within-15-days', 'within-30-days', 'after-30-days').optional(),
        amenities: Joi.array().items(Joi.string()).optional(),
        sortBy: Joi.string().valid('relevance', 'price-low-to-high', 'price-high-to-low', 'newest').optional(),
        page: Joi.number().integer().min(1).optional()
      }).required()
    })
  },

  // Get presets with pagination
  getPresets: {
    query: Joi.object({
      ...commonSchemas.pagination.describe().keys
    })
  }
};

export const validationMiddleware = validate;
export default validate;