export type Json = string | number | boolean | null | {
    [key: string]: Json | undefined;
} | Json[];
export type Database = {
    __InternalSupabase: {
        PostgrestVersion: "13.0.5";
    };
    public: {
        Tables: {
            analytics_events: {
                Row: {
                    created_at: string | null;
                    event_data: Json | null;
                    event_type: string;
                    id: string;
                    ip_address: unknown | null;
                    property_id: string | null;
                    referrer: string | null;
                    session_id: string | null;
                    user_agent: string | null;
                    user_id: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    event_data?: Json | null;
                    event_type: string;
                    id?: string;
                    ip_address?: unknown | null;
                    property_id?: string | null;
                    referrer?: string | null;
                    session_id?: string | null;
                    user_agent?: string | null;
                    user_id?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    event_data?: Json | null;
                    event_type?: string;
                    id?: string;
                    ip_address?: unknown | null;
                    property_id?: string | null;
                    referrer?: string | null;
                    session_id?: string | null;
                    user_agent?: string | null;
                    user_id?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "analytics_events_property_id_fkey";
                        columns: ["property_id"];
                        isOneToOne: false;
                        referencedRelation: "properties";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "analytics_events_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            companies: {
                Row: {
                    created_at: string;
                    created_by: string | null;
                    description: string | null;
                    id: string;
                    is_active: boolean | null;
                    logo: string;
                    name: string;
                    order: number;
                    updated_at: string;
                    updated_by: string | null;
                    website: string | null;
                };
                Insert: {
                    created_at?: string;
                    created_by?: string | null;
                    description?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    logo: string;
                    name: string;
                    order?: number;
                    updated_at?: string;
                    updated_by?: string | null;
                    website?: string | null;
                };
                Update: {
                    created_at?: string;
                    created_by?: string | null;
                    description?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    logo?: string;
                    name?: string;
                    order?: number;
                    updated_at?: string;
                    updated_by?: string | null;
                    website?: string | null;
                };
                Relationships: [];
            };
            faq_categories: {
                Row: {
                    created_at: string;
                    id: string;
                    is_active: boolean | null;
                    name: string;
                    order: number;
                    updated_at: string;
                };
                Insert: {
                    created_at?: string;
                    id?: string;
                    is_active?: boolean | null;
                    name: string;
                    order?: number;
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    is_active?: boolean | null;
                    name?: string;
                    order?: number;
                    updated_at?: string;
                };
                Relationships: [];
            };
            faqs: {
                Row: {
                    answer: string;
                    category_id: string | null;
                    created_at: string;
                    created_by: string | null;
                    id: string;
                    is_active: boolean | null;
                    order: number;
                    question: string;
                    updated_at: string;
                    updated_by: string | null;
                };
                Insert: {
                    answer: string;
                    category_id?: string | null;
                    created_at?: string;
                    created_by?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    order?: number;
                    question: string;
                    updated_at?: string;
                    updated_by?: string | null;
                };
                Update: {
                    answer?: string;
                    category_id?: string | null;
                    created_at?: string;
                    created_by?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    order?: number;
                    question?: string;
                    updated_at?: string;
                    updated_by?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "faqs_category_id_fkey";
                        columns: ["category_id"];
                        isOneToOne: false;
                        referencedRelation: "faq_categories";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "faqs_created_by_fkey";
                        columns: ["created_by"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "faqs_updated_by_fkey";
                        columns: ["updated_by"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            inquiries: {
                Row: {
                    assigned_to: string | null;
                    company: string | null;
                    contacted_at: string | null;
                    created_at: string | null;
                    email: string;
                    id: string;
                    inquiry_type: string | null;
                    ip_address: unknown | null;
                    message: string;
                    name: string;
                    notes: string | null;
                    phone: string | null;
                    priority: string | null;
                    property_id: string | null;
                    source: string | null;
                    status: string | null;
                    updated_at: string | null;
                    user_agent: string | null;
                };
                Insert: {
                    assigned_to?: string | null;
                    company?: string | null;
                    contacted_at?: string | null;
                    created_at?: string | null;
                    email: string;
                    id?: string;
                    inquiry_type?: string | null;
                    ip_address?: unknown | null;
                    message: string;
                    name: string;
                    notes?: string | null;
                    phone?: string | null;
                    priority?: string | null;
                    property_id?: string | null;
                    source?: string | null;
                    status?: string | null;
                    updated_at?: string | null;
                    user_agent?: string | null;
                };
                Update: {
                    assigned_to?: string | null;
                    company?: string | null;
                    contacted_at?: string | null;
                    created_at?: string | null;
                    email?: string;
                    id?: string;
                    inquiry_type?: string | null;
                    ip_address?: unknown | null;
                    message?: string;
                    name?: string;
                    notes?: string | null;
                    phone?: string | null;
                    priority?: string | null;
                    property_id?: string | null;
                    source?: string | null;
                    status?: string | null;
                    updated_at?: string | null;
                    user_agent?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "inquiries_assigned_to_fkey";
                        columns: ["assigned_to"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "inquiries_property_id_fkey";
                        columns: ["property_id"];
                        isOneToOne: false;
                        referencedRelation: "properties";
                        referencedColumns: ["id"];
                    }
                ];
            };
            inquiries_backup_003: {
                Row: {
                    assigned_to: string | null;
                    contacted_at: string | null;
                    created_at: string | null;
                    email: string | null;
                    id: string | null;
                    inquiry_type: string | null;
                    ip_address: unknown | null;
                    message: string | null;
                    name: string | null;
                    notes: string | null;
                    phone: string | null;
                    priority: string | null;
                    property_id: string | null;
                    source: string | null;
                    status: string | null;
                    updated_at: string | null;
                    user_agent: string | null;
                };
                Insert: {
                    assigned_to?: string | null;
                    contacted_at?: string | null;
                    created_at?: string | null;
                    email?: string | null;
                    id?: string | null;
                    inquiry_type?: string | null;
                    ip_address?: unknown | null;
                    message?: string | null;
                    name?: string | null;
                    notes?: string | null;
                    phone?: string | null;
                    priority?: string | null;
                    property_id?: string | null;
                    source?: string | null;
                    status?: string | null;
                    updated_at?: string | null;
                    user_agent?: string | null;
                };
                Update: {
                    assigned_to?: string | null;
                    contacted_at?: string | null;
                    created_at?: string | null;
                    email?: string | null;
                    id?: string | null;
                    inquiry_type?: string | null;
                    ip_address?: unknown | null;
                    message?: string | null;
                    name?: string | null;
                    notes?: string | null;
                    phone?: string | null;
                    priority?: string | null;
                    property_id?: string | null;
                    source?: string | null;
                    status?: string | null;
                    updated_at?: string | null;
                    user_agent?: string | null;
                };
                Relationships: [];
            };
            properties: {
                Row: {
                    address: string | null;
                    amenities: Json | null;
                    approximate_location: Json | null;
                    area_sqft: number | null;
                    availability_status: string | null;
                    bathrooms: number | null;
                    bedrooms: number | null;
                    city: string | null;
                    coordinates: Json | null;
                    country: string | null;
                    created_at: string | null;
                    description: string | null;
                    featured: boolean | null;
                    features: Json | null;
                    formatted_address: string | null;
                    hoa_fees: number | null;
                    id: string;
                    images: Json | null;
                    listing_agent_id: string | null;
                    location: string;
                    lot_size_sqft: number | null;
                    parking_spaces: number | null;
                    place_id: string | null;
                    place_types: string[] | null;
                    price: number;
                    property_taxes: number | null;
                    property_type: string | null;
                    state: string | null;
                    status: string | null;
                    title: string;
                    updated_at: string | null;
                    virtual_tour_url: string | null;
                    year_built: number | null;
                };
                Insert: {
                    address?: string | null;
                    amenities?: Json | null;
                    approximate_location?: Json | null;
                    area_sqft?: number | null;
                    availability_status?: string | null;
                    bathrooms?: number | null;
                    bedrooms?: number | null;
                    city?: string | null;
                    coordinates?: Json | null;
                    country?: string | null;
                    created_at?: string | null;
                    description?: string | null;
                    featured?: boolean | null;
                    features?: Json | null;
                    formatted_address?: string | null;
                    hoa_fees?: number | null;
                    id?: string;
                    images?: Json | null;
                    listing_agent_id?: string | null;
                    location: string;
                    lot_size_sqft?: number | null;
                    parking_spaces?: number | null;
                    place_id?: string | null;
                    place_types?: string[] | null;
                    price: number;
                    property_taxes?: number | null;
                    property_type?: string | null;
                    state?: string | null;
                    status?: string | null;
                    title: string;
                    updated_at?: string | null;
                    virtual_tour_url?: string | null;
                    year_built?: number | null;
                };
                Update: {
                    address?: string | null;
                    amenities?: Json | null;
                    approximate_location?: Json | null;
                    area_sqft?: number | null;
                    availability_status?: string | null;
                    bathrooms?: number | null;
                    bedrooms?: number | null;
                    city?: string | null;
                    coordinates?: Json | null;
                    country?: string | null;
                    created_at?: string | null;
                    description?: string | null;
                    featured?: boolean | null;
                    features?: Json | null;
                    formatted_address?: string | null;
                    hoa_fees?: number | null;
                    id?: string;
                    images?: Json | null;
                    listing_agent_id?: string | null;
                    location?: string;
                    lot_size_sqft?: number | null;
                    parking_spaces?: number | null;
                    place_id?: string | null;
                    place_types?: string[] | null;
                    price?: number;
                    property_taxes?: number | null;
                    property_type?: string | null;
                    state?: string | null;
                    status?: string | null;
                    title?: string;
                    updated_at?: string | null;
                    virtual_tour_url?: string | null;
                    year_built?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "properties_listing_agent_id_fkey";
                        columns: ["listing_agent_id"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            property_media: {
                Row: {
                    alt_text: string | null;
                    created_at: string | null;
                    display_order: number | null;
                    duration: number | null;
                    file_size: number | null;
                    filename: string;
                    height: number | null;
                    id: string;
                    image_url: string | null;
                    is_primary: boolean | null;
                    media_type: string;
                    property_id: string;
                    size: number;
                    storage_path: string | null;
                    thumbnail_url: string | null;
                    updated_at: string | null;
                    url: string;
                    width: number | null;
                };
                Insert: {
                    alt_text?: string | null;
                    created_at?: string | null;
                    display_order?: number | null;
                    duration?: number | null;
                    file_size?: number | null;
                    filename: string;
                    height?: number | null;
                    id?: string;
                    image_url?: string | null;
                    is_primary?: boolean | null;
                    media_type?: string;
                    property_id: string;
                    size: number;
                    storage_path?: string | null;
                    thumbnail_url?: string | null;
                    updated_at?: string | null;
                    url: string;
                    width?: number | null;
                };
                Update: {
                    alt_text?: string | null;
                    created_at?: string | null;
                    display_order?: number | null;
                    duration?: number | null;
                    file_size?: number | null;
                    filename?: string;
                    height?: number | null;
                    id?: string;
                    image_url?: string | null;
                    is_primary?: boolean | null;
                    media_type?: string;
                    property_id?: string;
                    size?: number;
                    storage_path?: string | null;
                    thumbnail_url?: string | null;
                    updated_at?: string | null;
                    url?: string;
                    width?: number | null;
                };
                Relationships: [
                    {
                        foreignKeyName: "property_media_property_id_fkey";
                        columns: ["property_id"];
                        isOneToOne: false;
                        referencedRelation: "properties";
                        referencedColumns: ["id"];
                    }
                ];
            };
            property_tag_assignments: {
                Row: {
                    assigned_at: string | null;
                    assigned_by: string | null;
                    id: string;
                    property_id: string;
                    tag_id: string;
                };
                Insert: {
                    assigned_at?: string | null;
                    assigned_by?: string | null;
                    id?: string;
                    property_id: string;
                    tag_id: string;
                };
                Update: {
                    assigned_at?: string | null;
                    assigned_by?: string | null;
                    id?: string;
                    property_id?: string;
                    tag_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "property_tag_assignments_property_id_fkey";
                        columns: ["property_id"];
                        isOneToOne: false;
                        referencedRelation: "properties";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "property_tag_assignments_tag_id_fkey";
                        columns: ["tag_id"];
                        isOneToOne: false;
                        referencedRelation: "property_tags";
                        referencedColumns: ["id"];
                    }
                ];
            };
            property_tags: {
                Row: {
                    background_color: string;
                    color: string;
                    created_at: string | null;
                    description: string | null;
                    id: string;
                    is_active: boolean;
                    name: string;
                    updated_at: string | null;
                };
                Insert: {
                    background_color?: string;
                    color?: string;
                    created_at?: string | null;
                    description?: string | null;
                    id?: string;
                    is_active?: boolean;
                    name: string;
                    updated_at?: string | null;
                };
                Update: {
                    background_color?: string;
                    color?: string;
                    created_at?: string | null;
                    description?: string | null;
                    id?: string;
                    is_active?: boolean;
                    name?: string;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
            saved_properties: {
                Row: {
                    created_at: string | null;
                    id: string;
                    notes: string | null;
                    property_id: string;
                    user_id: string;
                };
                Insert: {
                    created_at?: string | null;
                    id?: string;
                    notes?: string | null;
                    property_id: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string | null;
                    id?: string;
                    notes?: string | null;
                    property_id?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: "saved_properties_property_id_fkey";
                        columns: ["property_id"];
                        isOneToOne: false;
                        referencedRelation: "properties";
                        referencedColumns: ["id"];
                    },
                    {
                        foreignKeyName: "saved_properties_user_id_fkey";
                        columns: ["user_id"];
                        isOneToOne: false;
                        referencedRelation: "users";
                        referencedColumns: ["id"];
                    }
                ];
            };
            testimonials: {
                Row: {
                    approved_at: string | null;
                    approved_by: string | null;
                    company: string | null;
                    content: string;
                    created_at: string;
                    email: string;
                    id: string;
                    name: string;
                    phone: string | null;
                    rating: number;
                    rejection_reason: string | null;
                    role: string | null;
                    status: string;
                    updated_at: string;
                };
                Insert: {
                    approved_at?: string | null;
                    approved_by?: string | null;
                    company?: string | null;
                    content: string;
                    created_at?: string;
                    email: string;
                    id?: string;
                    name: string;
                    phone?: string | null;
                    rating: number;
                    rejection_reason?: string | null;
                    role?: string | null;
                    status?: string;
                    updated_at?: string;
                };
                Update: {
                    approved_at?: string | null;
                    approved_by?: string | null;
                    company?: string | null;
                    content?: string;
                    created_at?: string;
                    email?: string;
                    id?: string;
                    name?: string;
                    phone?: string | null;
                    rating?: number;
                    rejection_reason?: string | null;
                    role?: string | null;
                    status?: string;
                    updated_at?: string;
                };
                Relationships: [];
            };
            users: {
                Row: {
                    created_at: string | null;
                    email: string;
                    failed_login_attempts: number | null;
                    firebase_uid: string | null;
                    id: string;
                    is_active: boolean | null;
                    is_test_account: boolean | null;
                    last_login: string | null;
                    locked_until: string | null;
                    name: string;
                    role: string | null;
                    saved_properties: Json | null;
                    updated_at: string | null;
                };
                Insert: {
                    created_at?: string | null;
                    email: string;
                    failed_login_attempts?: number | null;
                    firebase_uid?: string | null;
                    id: string;
                    is_active?: boolean | null;
                    is_test_account?: boolean | null;
                    last_login?: string | null;
                    locked_until?: string | null;
                    name: string;
                    role?: string | null;
                    saved_properties?: Json | null;
                    updated_at?: string | null;
                };
                Update: {
                    created_at?: string | null;
                    email?: string;
                    failed_login_attempts?: number | null;
                    firebase_uid?: string | null;
                    id?: string;
                    is_active?: boolean | null;
                    is_test_account?: boolean | null;
                    last_login?: string | null;
                    locked_until?: string | null;
                    name?: string;
                    role?: string | null;
                    saved_properties?: Json | null;
                    updated_at?: string | null;
                };
                Relationships: [];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            add_saved_property: {
                Args: {
                    property_id: string;
                    user_id: string;
                };
                Returns: undefined;
            };
            assign_inquiry: {
                Args: {
                    agent_id: string;
                    inquiry_id: string;
                    notes_text?: string;
                };
                Returns: boolean;
            };
            check_admin_access: {
                Args: {
                    p_user_id: string;
                };
                Returns: boolean;
            };
            check_email_rate_limit: {
                Args: {
                    user_email: string;
                };
                Returns: boolean;
            };
            check_rls_enabled: {
                Args: {
                    table_name: string;
                };
                Returns: boolean;
            };
            cleanup_all_test_accounts: {
                Args: Record<PropertyKey, never>;
                Returns: {
                    deleted_count: number;
                    errors: string[];
                }[];
            };
            cleanup_inactive_users: {
                Args: {
                    p_admin_user_id?: string;
                    p_days_inactive?: number;
                };
                Returns: {
                    cleaned_count: number;
                    details: string;
                }[];
            };
            cleanup_test_account: {
                Args: {
                    target_user_id: string;
                };
                Returns: boolean;
            };
            get_analytics_data: {
                Args: {
                    end_date?: string;
                    metrics?: string[];
                    start_date?: string;
                };
                Returns: {
                    browser_breakdown: Json;
                    conversion_metrics: Json;
                    daily_trends: Json;
                    device_breakdown: Json;
                    inquiry_form_views: number;
                    page_views: number;
                    property_views: number;
                    top_properties: Json;
                    total_events: number;
                    traffic_sources: Json;
                    unique_sessions: number;
                }[];
            };
            get_inquiry_stats: {
                Args: {
                    days?: number;
                    end_date?: string;
                    start_date?: string;
                } | {
                    end_date?: string;
                    start_date?: string;
                } | {
                    end_date?: string;
                    start_date?: string;
                };
                Returns: Json;
            };
            get_saved_properties_count: {
                Args: {
                    user_id: string;
                };
                Returns: number;
            };
            get_user_role: {
                Args: {
                    p_user_id: string;
                };
                Returns: string;
            };
            get_user_saved_properties: {
                Args: {
                    p_user_id: string;
                };
                Returns: {
                    created_at: string;
                    id: string;
                    notes: string;
                    property_id: string;
                    property_location: string;
                    property_price: number;
                    property_title: string;
                }[];
            };
            increment_failed_login_attempts: {
                Args: {
                    user_email: string;
                };
                Returns: undefined;
            };
            is_user_locked: {
                Args: {
                    user_email: string;
                };
                Returns: boolean;
            };
            notify_new_inquiry: {
                Args: {
                    inquiry_id: string;
                };
                Returns: undefined;
            };
            remove_saved_property: {
                Args: {
                    property_id: string;
                    user_id: string;
                };
                Returns: undefined;
            };
            reset_failed_login_attempts: {
                Args: {
                    user_email: string;
                };
                Returns: undefined;
            };
            save_property: {
                Args: {
                    p_notes?: string;
                    p_property_id: string;
                    p_user_id: string;
                };
                Returns: string;
            };
            search_properties: {
                Args: {
                    limit_results?: number;
                    location_filter?: string;
                    max_price?: number;
                    min_bathrooms?: number;
                    min_bedrooms?: number;
                    min_price?: number;
                    offset_results?: number;
                    prop_type?: string;
                    search_term?: string;
                } | {
                    location_filter?: string;
                    max_bathrooms?: number;
                    max_bedrooms?: number;
                    max_price?: number;
                    min_bathrooms?: number;
                    min_bedrooms?: number;
                    min_price?: number;
                    page_limit?: number;
                    page_offset?: number;
                    property_type_filter?: string;
                    search_query?: string;
                    sort_by?: string;
                    sort_order?: string;
                };
                Returns: {
                    address: string;
                    agent_email: string;
                    agent_name: string;
                    area_sqft: number;
                    bathrooms: number;
                    bedrooms: number;
                    created_at: string;
                    description: string;
                    featured: boolean;
                    id: string;
                    image_count: number;
                    images: Json;
                    location: string;
                    parking_spaces: number;
                    price: number;
                    property_type: string;
                    status: string;
                    title: string;
                    virtual_tour_url: string;
                    year_built: number;
                }[];
            };
            unsave_property: {
                Args: {
                    p_property_id: string;
                    p_user_id: string;
                };
                Returns: boolean;
            };
            update_inquiry_status: {
                Args: {
                    inquiry_id: string;
                    new_status: string;
                    notes_text?: string;
                };
                Returns: boolean;
            };
            update_user_role: {
                Args: {
                    p_admin_user_id: string;
                    p_new_role: string;
                    p_user_id: string;
                };
                Returns: {
                    email: string;
                    id: string;
                    name: string;
                    role: string;
                    updated_at: string;
                }[];
            };
            upsert_firebase_user: {
                Args: {
                    p_avatar_url?: string;
                    p_firebase_uid: string;
                    p_user_email: string;
                    p_user_name: string;
                    p_user_role?: string;
                };
                Returns: {
                    avatar_url: string;
                    created_at: string;
                    email: string;
                    firebase_uid: string;
                    id: string;
                    name: string;
                    role: string;
                }[];
            };
            upsert_oauth_user: {
                Args: {
                    user_email: string;
                    user_id: string;
                    user_name: string;
                    user_role?: string;
                };
                Returns: {
                    created_at: string;
                    email: string;
                    id: string;
                    name: string;
                    role: string;
                }[];
            };
        };
        Enums: {
            [_ in never]: never;
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};
type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];
export type Tables<DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) | {
    schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"]) : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
    Row: infer R;
} ? R : never : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"]) ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
    Row: infer R;
} ? R : never : never;
export type TablesInsert<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
    schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I;
} ? I : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I;
} ? I : never : never;
export type TablesUpdate<DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | {
    schema: keyof DatabaseWithoutInternals;
}, TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] : never = never> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U;
} ? U : never : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U;
} ? U : never : never;
export type Enums<DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | {
    schema: keyof DatabaseWithoutInternals;
}, EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"] : never = never> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName] : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions] : never;
export type CompositeTypes<PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] | {
    schema: keyof DatabaseWithoutInternals;
}, CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"] : never = never> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
} ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName] : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"] ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions] : never;
export declare const Constants: {
    readonly public: {
        readonly Enums: {};
    };
};
export {};
//# sourceMappingURL=database.d.ts.map