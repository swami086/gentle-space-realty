export interface Company {
  id: string;
  name: string;
  logo: string;
  website?: string;
  description?: string;
  is_active?: boolean;
  order: number;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CompanyFormData {
  name: string;
  logo: string;
  website?: string;
  description?: string;
  is_active?: boolean;
  order: number;
}