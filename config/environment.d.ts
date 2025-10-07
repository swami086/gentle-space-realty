/**
 * Centralized Environment Configuration Manager
 *
 * This module provides centralized, type-safe environment configuration
 * for the entire application with validation and error handling.
 */
import { z } from 'zod';
declare const frontendSchema: z.ZodObject<{
    VITE_API_BASE_URL: z.ZodString;
    VITE_SUPABASE_URL: z.ZodString;
    VITE_SUPABASE_ANON_KEY: z.ZodString;
    VITE_GOOGLE_MAPS_API_KEY: z.ZodOptional<z.ZodString>;
    VITE_GOOGLE_CLIENT_ID: z.ZodOptional<z.ZodString>;
    VITE_SENTRY_DSN: z.ZodOptional<z.ZodString>;
    VITE_APP_ENV: z.ZodDefault<z.ZodEnum<["development", "staging", "production"]>>;
    VITE_DEBUG_MODE: z.ZodDefault<z.ZodEffects<z.ZodString, boolean, string>>;
}, "strip", z.ZodTypeAny, {
    VITE_API_BASE_URL: string;
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_ANON_KEY: string;
    VITE_APP_ENV: "development" | "staging" | "production";
    VITE_DEBUG_MODE: boolean;
    VITE_GOOGLE_MAPS_API_KEY?: string | undefined;
    VITE_GOOGLE_CLIENT_ID?: string | undefined;
    VITE_SENTRY_DSN?: string | undefined;
}, {
    VITE_API_BASE_URL: string;
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_ANON_KEY: string;
    VITE_GOOGLE_MAPS_API_KEY?: string | undefined;
    VITE_GOOGLE_CLIENT_ID?: string | undefined;
    VITE_SENTRY_DSN?: string | undefined;
    VITE_APP_ENV?: "development" | "staging" | "production" | undefined;
    VITE_DEBUG_MODE?: string | undefined;
}>;
declare const backendSchema: z.ZodObject<{
    SUPABASE_URL: z.ZodString;
    SUPABASE_SERVICE_ROLE_KEY: z.ZodString;
    JWT_SECRET: z.ZodString;
    PORT: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "staging", "production"]>>;
    CORS_ORIGINS: z.ZodDefault<z.ZodString>;
    RATE_LIMIT_WINDOW: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    RATE_LIMIT_MAX: z.ZodDefault<z.ZodEffects<z.ZodString, number, string>>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["error", "warn", "info", "debug"]>>;
    GOOGLE_OAUTH_CLIENT_SECRET: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
    PORT: number;
    NODE_ENV: "development" | "staging" | "production";
    CORS_ORIGINS: string;
    RATE_LIMIT_WINDOW: number;
    RATE_LIMIT_MAX: number;
    LOG_LEVEL: "error" | "warn" | "info" | "debug";
    GOOGLE_OAUTH_CLIENT_SECRET?: string | undefined;
}, {
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    JWT_SECRET: string;
    PORT?: string | undefined;
    NODE_ENV?: "development" | "staging" | "production" | undefined;
    CORS_ORIGINS?: string | undefined;
    RATE_LIMIT_WINDOW?: string | undefined;
    RATE_LIMIT_MAX?: string | undefined;
    LOG_LEVEL?: "error" | "warn" | "info" | "debug" | undefined;
    GOOGLE_OAUTH_CLIENT_SECRET?: string | undefined;
}>;
export type FrontendConfig = z.infer<typeof frontendSchema>;
export type BackendConfig = z.infer<typeof backendSchema>;
/**
 * Environment validation errors
 */
export declare class EnvironmentValidationError extends Error {
    readonly issues: z.ZodIssue[];
    constructor(message: string, issues: z.ZodIssue[]);
}
/**
 * Validates and parses environment variables for the frontend
 */
export declare function validateFrontendEnvironment(env: Record<string, string | undefined>): FrontendConfig;
/**
 * Validates and parses environment variables for the backend
 */
export declare function validateBackendEnvironment(env: Record<string, string | undefined>): BackendConfig;
/**
 * Environment utility functions
 */
export declare const EnvUtils: {
    isDevelopment: (env: string) => env is "development";
    isStaging: (env: string) => env is "staging";
    isProduction: (env: string) => env is "production";
    isDebugMode: (debug: boolean | string) => debug is true | "true";
    /**
     * Get CORS origins as array
     */
    getCorsOrigins: (origins: string) => string[];
    /**
     * Validate required environment variables exist
     */
    validateRequired: (env: Record<string, string | undefined>, requiredVars: string[]) => void;
    /**
     * Get environment variable with default fallback
     */
    getWithDefault: (env: Record<string, string | undefined>, key: string, defaultValue: string) => string;
    /**
     * Parse boolean environment variable
     */
    parseBoolean: (value: string | undefined, defaultValue?: boolean) => boolean;
    /**
     * Parse integer environment variable
     */
    parseInt: (value: string | undefined, defaultValue: number) => number;
};
/**
 * Common environment validation patterns
 */
export declare const ValidationPatterns: {
    url: (value: string) => boolean;
    port: (value: string | number) => boolean;
    apiKey: (value: string) => boolean;
    jwt: (value: string) => boolean;
};
/**
 * Environment configuration documentation
 */
export declare const EnvironmentDocs: {
    frontend: {
        VITE_API_BASE_URL: string;
        VITE_SUPABASE_URL: string;
        VITE_SUPABASE_ANON_KEY: string;
        VITE_GOOGLE_MAPS_API_KEY: string;
        VITE_GOOGLE_CLIENT_ID: string;
        VITE_SENTRY_DSN: string;
        VITE_APP_ENV: string;
        VITE_DEBUG_MODE: string;
    };
    backend: {
        SUPABASE_URL: string;
        SUPABASE_SERVICE_ROLE_KEY: string;
        JWT_SECRET: string;
        PORT: string;
        NODE_ENV: string;
        CORS_ORIGINS: string;
        RATE_LIMIT_WINDOW: string;
        RATE_LIMIT_MAX: string;
        LOG_LEVEL: string;
        GOOGLE_OAUTH_CLIENT_SECRET: string;
    };
};
export {};
//# sourceMappingURL=environment.d.ts.map