import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, HelpCircle, Folder, Eye, EyeOff } from 'lucide-react';
import { useFAQStore } from '@/store/faqStore';
import { FAQ, FAQCategory, FAQFormData, FAQCategoryFormData } from '@/types/faq';

interface EditingFAQ extends Partial<FAQ> {
  isNew?: boolean;
}

interface EditingCategory extends Partial<FAQCategory> {
  isNew?: boolean;
}

const FAQManagement: React.FC = () => {
  const {
    faqs,
    categories,
    isLoading,
    error,
    loadFAQs,
    loadCategories,
    createFAQ,
    updateFAQ,
    deleteFAQ,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError,
    initializeWithMockData
  } = useFAQStore();

  const [activeTab, setActiveTab] = useState<'faqs' | 'categories'>('faqs');
  const [editingFAQ, setEditingFAQ] = useState<EditingFAQ | null>(null);
  const [editingCategory, setEditingCategory] = useState<EditingCategory | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      if (hasInitialized) return;

      try {
        console.log('🚀 Initializing FAQ management...');
        
        // Initialize with mock data first
        initializeWithMockData();
        
        // Then try to load from database
        await Promise.all([
          loadFAQs(),
          loadCategories()
        ]);
        
        setHasInitialized(true);
        console.log('✅ FAQ management initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing FAQ management:', error);
        setHasInitialized(true);
      }
    };

    initializeData();
  }, [hasInitialized, loadFAQs, loadCategories, initializeWithMockData]);

  const handleCreateFAQ = () => {
    const maxOrder = Math.max(...faqs.map(f => f.order || 0), 0);
    setEditingFAQ({
      isNew: true,
      question: '',
      answer: '',
      category_id: selectedCategoryId || categories[0]?.id || '',
      order: maxOrder + 1,
      is_active: true
    });
  };

  const handleEditFAQ = (faq: FAQ) => {
    setEditingFAQ({ ...faq });
  };

  const handleSaveFAQ = async () => {
    if (!editingFAQ) return;

    try {
      const faqData: FAQFormData = {
        question: editingFAQ.question || '',
        answer: editingFAQ.answer || '',
        category_id: editingFAQ.category_id || '',
        order: editingFAQ.order || 0,
        is_active: editingFAQ.is_active ?? true
      };

      if (editingFAQ.isNew) {
        await createFAQ(faqData);
      } else {
        await updateFAQ(editingFAQ.id!, faqData);
      }

      setEditingFAQ(null);
    } catch (error) {
      console.error('Error saving FAQ:', error);
    }
  };

  const handleDeleteFAQ = async (faqId: string) => {
    if (window.confirm('Are you sure you want to delete this FAQ?')) {
      try {
        await deleteFAQ(faqId);
      } catch (error) {
        console.error('Error deleting FAQ:', error);
      }
    }
  };

  const handleCreateCategory = () => {
    const maxOrder = Math.max(...categories.map(c => c.order || 0), 0);
    setEditingCategory({
      isNew: true,
      name: '',
      order: maxOrder + 1,
      is_active: true
    });
  };

  const handleEditCategory = (category: FAQCategory) => {
    setEditingCategory({ ...category });
  };

  const handleSaveCategory = async () => {
    if (!editingCategory) return;

    try {
      const categoryData: FAQCategoryFormData = {
        name: editingCategory.name || '',
        order: editingCategory.order || 0,
        is_active: editingCategory.is_active ?? true
      };

      if (editingCategory.isNew) {
        await createCategory(categoryData);
      } else {
        await updateCategory(editingCategory.id!, categoryData);
      }

      setEditingCategory(null);
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const categoryFAQs = faqs.filter(faq => faq.category_id === categoryId);
    const confirmMessage = categoryFAQs.length > 0
      ? `This will delete the category and all ${categoryFAQs.length} FAQ(s) in it. Are you sure?`
      : 'Are you sure you want to delete this category?';

    if (window.confirm(confirmMessage)) {
      try {
        await deleteCategory(categoryId);
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };

  const filteredFAQs = selectedCategoryId 
    ? faqs.filter(faq => faq.category_id === selectedCategoryId)
    : faqs;

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || 'Unknown Category';
  };

  if (!hasInitialized && isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading FAQ management...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <HelpCircle className="h-8 w-8 text-indigo-600 mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">FAQ Management</h1>
            <p className="text-gray-600">Manage frequently asked questions and categories</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-red-800 text-sm">{error}</p>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('faqs')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'faqs'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            FAQs ({faqs.length})
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'categories'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Categories ({categories.length})
          </button>
        </div>
      </div>

      {/* FAQ Management */}
      {activeTab === 'faqs' && (
        <div className="space-y-6">
          {/* FAQ Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-4">
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500">
                {filteredFAQs.length} FAQ(s)
              </span>
            </div>
            <button
              onClick={handleCreateFAQ}
              disabled={categories.length === 0}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </button>
          </div>

          {categories.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No categories available</p>
              <p className="text-sm text-gray-500 mb-4">Create a category first to add FAQs</p>
              <button
                onClick={() => setActiveTab('categories')}
                className="text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Go to Categories →
              </button>
            </div>
          )}

          {/* FAQ List */}
          {categories.length > 0 && (
            <div className="bg-white shadow-sm rounded-lg overflow-hidden">
              {filteredFAQs.length === 0 ? (
                <div className="text-center py-12">
                  <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">
                    {selectedCategoryId ? 'No FAQs in this category' : 'No FAQs found'}
                  </p>
                  <button
                    onClick={handleCreateFAQ}
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    Create your first FAQ
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredFAQs.map((faq) => (
                    <div key={faq.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-medium text-gray-900 truncate">
                              {faq.question}
                            </h3>
                            {faq.is_active ? (
                              <Eye className="h-4 w-4 text-green-500" title="Active" />
                            ) : (
                              <EyeOff className="h-4 w-4 text-gray-400" title="Inactive" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            Category: {getCategoryName(faq.category_id)}
                          </p>
                          <p className="text-gray-700 line-clamp-3">
                            {faq.answer}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <button
                            onClick={() => handleEditFAQ(faq)}
                            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                            title="Edit FAQ"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFAQ(faq.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete FAQ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Category Management */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Category Controls */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {categories.length} categories
            </p>
            <button
              onClick={handleCreateCategory}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </button>
          </div>

          {/* Category List */}
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <Folder className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No categories found</p>
                <button
                  onClick={handleCreateCategory}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Create your first category
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {categories.map((category) => {
                  const categoryFAQCount = faqs.filter(faq => faq.category_id === category.id).length;
                  return (
                    <div key={category.id} className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                              {category.name}
                              {category.is_active ? (
                                <Eye className="h-4 w-4 text-green-500" title="Active" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-gray-400" title="Inactive" />
                              )}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {categoryFAQCount} FAQ(s) • Order: {category.order}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                            title="Edit Category"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category.id)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete Category"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FAQ Edit Modal */}
      {editingFAQ && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setEditingFAQ(null)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingFAQ.isNew ? 'Create New FAQ' : 'Edit FAQ'}
                  </h3>
                  <button
                    onClick={() => setEditingFAQ(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={editingFAQ.category_id || ''}
                      onChange={(e) => setEditingFAQ({ ...editingFAQ, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      required
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question
                    </label>
                    <input
                      type="text"
                      value={editingFAQ.question || ''}
                      onChange={(e) => setEditingFAQ({ ...editingFAQ, question: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter the FAQ question"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Answer
                    </label>
                    <textarea
                      value={editingFAQ.answer || ''}
                      onChange={(e) => setEditingFAQ({ ...editingFAQ, answer: e.target.value })}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter the FAQ answer"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order
                      </label>
                      <input
                        type="number"
                        value={editingFAQ.order || 0}
                        onChange={(e) => setEditingFAQ({ ...editingFAQ, order: parseInt(e.target.value) })}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        min="0"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="faq-active"
                        checked={editingFAQ.is_active ?? true}
                        onChange={(e) => setEditingFAQ({ ...editingFAQ, is_active: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="faq-active" className="ml-2 block text-sm text-gray-700">
                        Active
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleSaveFAQ}
                  disabled={!editingFAQ.question || !editingFAQ.answer || !editingFAQ.category_id || isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save FAQ'}
                </button>
                <button
                  onClick={() => setEditingFAQ(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Category Edit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" onClick={() => setEditingCategory(null)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingCategory.isNew ? 'Create New Category' : 'Edit Category'}
                  </h3>
                  <button
                    onClick={() => setEditingCategory(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category Name
                    </label>
                    <input
                      type="text"
                      value={editingCategory.name || ''}
                      onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter category name"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Order
                      </label>
                      <input
                        type="number"
                        value={editingCategory.order || 0}
                        onChange={(e) => setEditingCategory({ ...editingCategory, order: parseInt(e.target.value) })}
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        min="0"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="category-active"
                        checked={editingCategory.is_active ?? true}
                        onChange={(e) => setEditingCategory({ ...editingCategory, is_active: e.target.checked })}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="category-active" className="ml-2 block text-sm text-gray-700">
                        Active
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleSaveCategory}
                  disabled={!editingCategory.name || isLoading}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Saving...' : 'Save Category'}
                </button>
                <button
                  onClick={() => setEditingCategory(null)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQManagement;