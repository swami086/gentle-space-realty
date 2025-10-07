import { create } from 'zustand';
import { FAQ, FAQCategory, FAQFormData, FAQCategoryFormData } from '@/types/faq';
import { API } from '@/services/apiService';
import { mockFAQs, mockFAQCategories } from '@/data/mockFAQs';

interface FAQStore {
  // State
  faqs: FAQ[];
  categories: FAQCategory[];
  isLoading: boolean;
  error: string | null;
  selectedCategory: string | null;

  // Actions
  loadFAQs: () => Promise<void>;
  loadCategories: () => Promise<void>;
  loadActiveFAQs: () => Promise<void>;
  loadActiveCategories: () => Promise<void>;
  loadFAQsByCategory: (categoryId: string) => Promise<void>;
  createFAQ: (faq: FAQFormData) => Promise<void>;
  updateFAQ: (id: string, updates: Partial<FAQFormData>) => Promise<void>;
  deleteFAQ: (id: string) => Promise<void>;
  createCategory: (category: FAQCategoryFormData) => Promise<void>;
  updateCategory: (id: string, updates: Partial<FAQCategoryFormData>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  setSelectedCategory: (categoryId: string | null) => void;
  clearError: () => void;

  // Getters
  getFAQsByCategory: (categoryId: string) => FAQ[];
  getActiveFAQs: () => FAQ[];
  getActiveCategories: () => FAQCategory[];
  initializeWithMockData: () => void;
}

export const useFAQStore = create<FAQStore>((set, get) => ({
  // Initial State
  faqs: [],
  categories: [],
  isLoading: false,
  error: null,
  selectedCategory: null,

  // Actions
  loadFAQs: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('📋 Loading all FAQs from database...');
      const faqs = await API.getAllFAQs();
      console.log('✅ Loaded', faqs.length, 'FAQs from database');
      set({ faqs, isLoading: false });
    } catch (error) {
      console.error('❌ Error loading FAQs, falling back to mock data:', error);
      set({ 
        faqs: mockFAQs, 
        isLoading: false, 
        error: 'Failed to load FAQs from database. Using offline data.' 
      });
    }
  },

  loadCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('📋 Loading all FAQ categories from database...');
      const categories = await API.getAllFAQCategories();
      console.log('✅ Loaded', categories.length, 'FAQ categories from database');
      set({ categories, isLoading: false });
    } catch (error) {
      console.error('❌ Error loading FAQ categories, falling back to mock data:', error);
      set({ 
        categories: mockFAQCategories, 
        isLoading: false, 
        error: 'Failed to load FAQ categories from database. Using offline data.' 
      });
    }
  },

  loadActiveFAQs: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('📋 Loading active FAQs from database...');
      const faqs = await API.getActiveFAQs();
      console.log('✅ Loaded', faqs.length, 'active FAQs from database');
      set({ faqs, isLoading: false });
    } catch (error) {
      console.error('❌ Error loading active FAQs, falling back to mock data:', error);
      const activeFAQs = mockFAQs.filter(faq => faq.is_active !== false);
      set({ 
        faqs: activeFAQs, 
        isLoading: false, 
        error: 'Failed to load FAQs from database. Using offline data.' 
      });
    }
  },

  loadActiveCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      console.log('📋 Loading active FAQ categories from database...');
      const categories = await API.getActiveFAQCategories();
      console.log('✅ Loaded', categories.length, 'active FAQ categories from database');
      set({ categories, isLoading: false });
    } catch (error) {
      console.error('❌ Error loading active FAQ categories, falling back to mock data:', error);
      const activeCategories = mockFAQCategories.filter(cat => cat.is_active !== false);
      set({ 
        categories: activeCategories, 
        isLoading: false, 
        error: 'Failed to load FAQ categories from database. Using offline data.' 
      });
    }
  },

  loadFAQsByCategory: async (categoryId: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log('📋 Loading FAQs for category from database:', categoryId);
      const faqs = await API.getFAQsByCategory(categoryId);
      console.log('✅ Loaded', faqs.length, 'FAQs for category from database');
      set({ faqs, isLoading: false });
    } catch (error) {
      console.error('❌ Error loading FAQs by category, falling back to mock data:', error);
      const categoryFAQs = mockFAQs.filter(faq => faq.category_id === categoryId);
      set({ 
        faqs: categoryFAQs, 
        isLoading: false, 
        error: 'Failed to load FAQs from database. Using offline data.' 
      });
    }
  },

  createFAQ: async (faqData: FAQFormData) => {
    set({ isLoading: true, error: null });
    try {
      console.log('➕ Creating new FAQ...');
      const newFAQ = await API.createFAQ(faqData);
      console.log('✅ FAQ created successfully:', newFAQ.id);
      
      const { faqs } = get();
      set({ faqs: [...faqs, newFAQ], isLoading: false });
    } catch (error) {
      console.error('❌ Error creating FAQ:', error);
      set({ 
        isLoading: false, 
        error: 'Failed to create FAQ. Please try again.' 
      });
      throw error;
    }
  },

  updateFAQ: async (id: string, updates: Partial<FAQFormData>) => {
    set({ isLoading: true, error: null });
    try {
      console.log('✏️ Updating FAQ:', id);
      const updatedFAQ = await API.updateFAQ(id, updates);
      console.log('✅ FAQ updated successfully:', updatedFAQ.id);
      
      const { faqs } = get();
      const updatedFAQs = faqs.map(faq => faq.id === id ? updatedFAQ : faq);
      set({ faqs: updatedFAQs, isLoading: false });
    } catch (error) {
      console.error('❌ Error updating FAQ:', error);
      set({ 
        isLoading: false, 
        error: 'Failed to update FAQ. Please try again.' 
      });
      throw error;
    }
  },

  deleteFAQ: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🗑️ Deleting FAQ:', id);
      await API.deleteFAQ(id);
      console.log('✅ FAQ deleted successfully');
      
      const { faqs } = get();
      const filteredFAQs = faqs.filter(faq => faq.id !== id);
      set({ faqs: filteredFAQs, isLoading: false });
    } catch (error) {
      console.error('❌ Error deleting FAQ:', error);
      set({ 
        isLoading: false, 
        error: 'Failed to delete FAQ. Please try again.' 
      });
      throw error;
    }
  },

  createCategory: async (categoryData: FAQCategoryFormData) => {
    set({ isLoading: true, error: null });
    try {
      console.log('➕ Creating new FAQ category...');
      const newCategory = await API.createFAQCategory(categoryData);
      console.log('✅ FAQ category created successfully:', newCategory.id);
      
      const { categories } = get();
      set({ categories: [...categories, newCategory], isLoading: false });
    } catch (error) {
      console.error('❌ Error creating FAQ category:', error);
      set({ 
        isLoading: false, 
        error: 'Failed to create FAQ category. Please try again.' 
      });
      throw error;
    }
  },

  updateCategory: async (id: string, updates: Partial<FAQCategoryFormData>) => {
    set({ isLoading: true, error: null });
    try {
      console.log('✏️ Updating FAQ category:', id);
      const updatedCategory = await API.updateFAQCategory(id, updates);
      console.log('✅ FAQ category updated successfully:', updatedCategory.id);
      
      const { categories } = get();
      const updatedCategories = categories.map(cat => cat.id === id ? updatedCategory : cat);
      set({ categories: updatedCategories, isLoading: false });
    } catch (error) {
      console.error('❌ Error updating FAQ category:', error);
      set({ 
        isLoading: false, 
        error: 'Failed to update FAQ category. Please try again.' 
      });
      throw error;
    }
  },

  deleteCategory: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🗑️ Deleting FAQ category:', id);
      await API.deleteFAQCategory(id);
      console.log('✅ FAQ category deleted successfully');
      
      const { categories, faqs } = get();
      const filteredCategories = categories.filter(cat => cat.id !== id);
      const filteredFAQs = faqs.filter(faq => faq.category_id !== id);
      set({ categories: filteredCategories, faqs: filteredFAQs, isLoading: false });
    } catch (error) {
      console.error('❌ Error deleting FAQ category:', error);
      set({ 
        isLoading: false, 
        error: 'Failed to delete FAQ category. Please try again.' 
      });
      throw error;
    }
  },

  setSelectedCategory: (categoryId: string | null) => {
    set({ selectedCategory: categoryId });
  },

  clearError: () => {
    set({ error: null });
  },

  // Getters
  getFAQsByCategory: (categoryId: string) => {
    const { faqs } = get();
    return faqs.filter(faq => faq.category_id === categoryId);
  },

  getActiveFAQs: () => {
    const { faqs } = get();
    return faqs.filter(faq => faq.is_active !== false);
  },

  getActiveCategories: () => {
    const { categories } = get();
    return categories.filter(category => category.is_active !== false);
  },

  initializeWithMockData: () => {
    console.log('🔄 Initializing FAQ store with mock data...');
    set({
      faqs: mockFAQs,
      categories: mockFAQCategories,
      isLoading: false,
      error: null
    });
    console.log('✅ FAQ store initialized with mock data');
  },
}));

export default useFAQStore;