export interface FAQCategory {
  id: string;
  name: string;
  order: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category_id: string;
  category?: FAQCategory;
  order: number;
  is_active?: boolean;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface FAQFormData {
  question: string;
  answer: string;
  category_id: string;
  order: number;
  is_active: boolean;
}

export interface FAQCategoryFormData {
  name: string;
  order: number;
  is_active: boolean;
}

export interface FAQWithCategory extends FAQ {
  category: FAQCategory;
}