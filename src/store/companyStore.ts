import { create } from 'zustand';
import { Company, CompanyFormData } from '@/types/company';
import { API } from '@/services/apiService';
import { mockCompanies } from '@/data/mockCompanies';

interface CompanyStore {
  // State
  companies: Company[];
  selectedCompany: Company | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadCompanies: () => Promise<void>;
  loadActiveCompanies: () => Promise<void>;
  createCompany: (company: CompanyFormData) => Promise<void>;
  updateCompany: (id: string, updates: Partial<CompanyFormData>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  clearError: () => void;
  setSelectedCompany: (c: Company | null) => void;

  // Getters
  getActiveCompanies: () => Company[];
  initializeWithMockData: () => void;
}

export const useCompanyStore = create<CompanyStore>((set, get) => ({
  // Initial State
  companies: [],
  selectedCompany: null,
  isLoading: false,
  error: null,

  // Actions
  loadCompanies: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('📋 Loading all companies from database...');
      const companies = await API.getAllCompanies();
      console.log('✅ Loaded', companies.length, 'companies from database');
      set({ companies, isLoading: false });
    } catch (error) {
      console.error('❌ Error loading companies, falling back to mock data:', error);
      set({ 
        companies: mockCompanies, 
        isLoading: false, 
        error: 'Failed to load companies from database. Using offline data.' 
      });
    }
  },

  loadActiveCompanies: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('📋 Loading active companies from database...');
      const companies = await API.getActiveCompanies();
      console.log('✅ Loaded', companies.length, 'active companies from database');
      set({ companies, isLoading: false });
    } catch (error) {
      console.error('❌ Error loading active companies, falling back to mock data:', error);
      const activeCompanies = mockCompanies.filter(company => company.is_active !== false);
      set({ 
        companies: activeCompanies, 
        isLoading: false, 
        error: 'Failed to load companies from database. Using offline data.' 
      });
    }
  },

  createCompany: async (companyData: CompanyFormData) => {
    set({ isLoading: true, error: null });
    try {
      console.log('➕ Creating new company...');
      const newCompany = await API.createCompany(companyData);
      console.log('✅ Company created successfully:', newCompany.id);
      
      const { companies } = get();
      const next = [...companies, newCompany].sort((a,b) => (a.order||0) - (b.order||0));
      set({ companies: next, isLoading: false });
    } catch (error) {
      console.error('❌ Error creating company:', error);
      set({ 
        isLoading: false, 
        error: 'Failed to create company. Please try again.' 
      });
      throw error;
    }
  },

  updateCompany: async (id: string, updates: Partial<CompanyFormData>) => {
    set({ isLoading: true, error: null });
    try {
      console.log('✏️ Updating company:', id);
      const updatedCompany = await API.updateCompany(id, updates);
      console.log('✅ Company updated successfully:', updatedCompany.id);
      
      const { companies } = get();
      const updated = companies
        .map(c => c.id === id ? updatedCompany : c)
        .sort((a,b) => (a.order||0) - (b.order||0));
      set({ companies: updated, isLoading: false });
    } catch (error) {
      console.error('❌ Error updating company:', error);
      set({ 
        isLoading: false, 
        error: 'Failed to update company. Please try again.' 
      });
      throw error;
    }
  },

  deleteCompany: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🗑️ Deleting company:', id);
      await API.deleteCompany(id);
      console.log('✅ Company deleted successfully');
      
      const { companies } = get();
      const filteredCompanies = companies.filter(company => company.id !== id);
      set({ companies: filteredCompanies, isLoading: false });
    } catch (error) {
      console.error('❌ Error deleting company:', error);
      set({ 
        isLoading: false, 
        error: 'Failed to delete company. Please try again.' 
      });
      throw error;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setSelectedCompany: (c: Company | null) => {
    set({ selectedCompany: c });
  },

  // Getters
  getActiveCompanies: () => {
    const { companies } = get();
    return companies.filter(company => company.is_active !== false);
  },

  initializeWithMockData: () => {
    console.log('🔄 Initializing company store with mock data...');
    set({
      companies: mockCompanies,
      isLoading: false,
      error: null
    });
    console.log('✅ Company store initialized with mock data');
  },
}));

export default useCompanyStore;