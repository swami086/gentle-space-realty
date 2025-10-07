import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Building2, Eye, EyeOff, Link, ImageIcon } from 'lucide-react';
import { useCompanyStore } from '@/store/companyStore';
import { Company, CompanyFormData } from '@/types/company';

interface EditingCompany extends Partial<Company> {
  isNew?: boolean;
}

const CompanyManagement: React.FC = () => {
  const {
    companies,
    isLoading,
    error,
    loadCompanies,
    createCompany,
    updateCompany,
    deleteCompany,
    clearError,
    initializeWithMockData
  } = useCompanyStore();

  const [editingCompany, setEditingCompany] = useState<EditingCompany | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    const initializeData = async () => {
      if (hasInitialized) return;

      try {
        console.log('🚀 Initializing company management...');
        
        // Initialize with mock data first
        initializeWithMockData();
        
        // Then try to load from database
        await loadCompanies();
        
        setHasInitialized(true);
        console.log('✅ Company management initialized successfully');
      } catch (error) {
        console.error('❌ Error initializing company management:', error);
        setHasInitialized(true);
      }
    };

    initializeData();
  }, [hasInitialized, loadCompanies, initializeWithMockData]);

  const handleCreateCompany = () => {
    console.log('🚀 CompanyManagement: Add Company button clicked!');
    console.log('🚀 Current companies count:', companies.length);
    
    const maxOrder = Math.max(...companies.map(c => c.order || 0), 0);
    console.log('🚀 Max order calculated:', maxOrder);
    
    const newCompany = {
      isNew: true,
      name: '',
      logo: '',
      website: '',
      description: '',
      order: maxOrder + 1,
      is_active: true
    };
    
    console.log('🚀 Setting editing company:', newCompany);
    setEditingCompany(newCompany);
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany({ ...company });
  };

  const handleSaveCompany = async () => {
    console.log('💾 CompanyManagement: handleSaveCompany called');
    console.log('💾 editingCompany:', editingCompany);
    
    if (!editingCompany) {
      console.log('❌ No editing company, returning early');
      return;
    }

    try {
      const companyData: CompanyFormData = {
        name: editingCompany.name || '',
        logo: editingCompany.logo || '',
        website: editingCompany.website || '',
        description: editingCompany.description || '',
        order: editingCompany.order || 0,
        is_active: editingCompany.is_active ?? true
      };

      console.log('💾 Prepared company data:', companyData);

      if (editingCompany.isNew) {
        console.log('💾 Creating new company...');
        await createCompany(companyData);
        console.log('✅ Company created successfully!');
      } else {
        console.log('💾 Updating existing company:', editingCompany.id);
        await updateCompany(editingCompany.id!, companyData);
        console.log('✅ Company updated successfully!');
      }

      setEditingCompany(null);
      console.log('✅ Form cleared, editing completed');
    } catch (error) {
      console.error('❌ Error saving company:', error);
      // Don't clear the form on error so user can retry
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      try {
        await deleteCompany(companyId);
      } catch (error) {
        console.error('Error deleting company:', error);
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingCompany(null);
    clearError();
  };

  const sortedCompanies = [...companies].sort((a, b) => (a.order || 0) - (b.order || 0));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-primary-600" size={28} />
            Company Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage partner companies and their logos for the homepage display
          </p>
        </div>
        <button
          onClick={handleCreateCompany}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-primary-700 transition-colors"
        >
          <Plus size={18} />
          Add Company
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={clearError} className="text-red-500 hover:text-red-700">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Company List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Companies ({companies.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {isLoading && companies.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Building2 className="mx-auto mb-4 text-gray-300" size={48} />
              <p>Loading companies...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Building2 className="mx-auto mb-4 text-gray-300" size={48} />
              <p className="mb-2">No companies yet</p>
              <button
                onClick={handleCreateCompany}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Add your first company
              </button>
            </div>
          ) : (
            sortedCompanies.map((company) => (
              <div key={company.id} className="p-4">
                {editingCompany?.id === company.id ? (
                  <CompanyEditForm
                    company={editingCompany}
                    onChange={setEditingCompany}
                    onSave={handleSaveCompany}
                    onCancel={handleCancelEdit}
                    isLoading={isLoading}
                  />
                ) : (
                  <CompanyItem
                    company={company}
                    onEdit={handleEditCompany}
                    onDelete={handleDeleteCompany}
                  />
                )}
              </div>
            ))
          )}

          {/* New Company Form */}
          {(() => {
            console.log('🖥️ Render check - editingCompany:', editingCompany);
            console.log('🖥️ Render check - editingCompany?.isNew:', editingCompany?.isNew);
            return editingCompany?.isNew && (
              <div className="p-4 border-t border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Company</h3>
                <CompanyEditForm
                  company={editingCompany}
                  onChange={setEditingCompany}
                  onSave={handleSaveCompany}
                  onCancel={handleCancelEdit}
                  isLoading={isLoading}
                />
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

interface CompanyItemProps {
  company: Company;
  onEdit: (company: Company) => void;
  onDelete: (companyId: string) => void;
}

const CompanyItem: React.FC<CompanyItemProps> = ({ company, onEdit, onDelete }) => {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-4">
        {company.logo ? (
          <img
            src={company.logo}
            alt={`${company.name} logo`}
            className="w-12 h-12 object-contain rounded-lg border border-gray-200 bg-white p-1"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        ) : (
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <ImageIcon className="text-gray-400" size={24} />
          </div>
        )}
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className="text-lg font-semibold text-gray-900">
              {company.name}
            </h4>
            {company.is_active ? (
              <Eye className="text-green-500" size={16} title="Active" />
            ) : (
              <EyeOff className="text-gray-400" size={16} title="Inactive" />
            )}
          </div>
          <div className="text-sm text-gray-600 flex items-center gap-4">
            <span>Order: {company.order}</span>
            {company.website && (
              <span className="flex items-center gap-1">
                <Link size={14} />
                <a 
                  href={company.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700"
                >
                  Website
                </a>
              </span>
            )}
          </div>
          {company.description && (
            <p className="text-sm text-gray-600 mt-1">{company.description}</p>
          )}
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onEdit(company)}
          className="text-gray-600 hover:text-primary-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Edit company"
        >
          <Edit size={18} />
        </button>
        <button
          onClick={() => onDelete(company.id)}
          className="text-gray-600 hover:text-red-600 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title="Delete company"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};

interface CompanyEditFormProps {
  company: EditingCompany;
  onChange: (company: EditingCompany) => void;
  onSave: () => void;
  onCancel: () => void;
  isLoading: boolean;
}

const CompanyEditForm: React.FC<CompanyEditFormProps> = ({
  company,
  onChange,
  onSave,
  onCancel,
  isLoading
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name *
          </label>
          <input
            type="text"
            value={company.name || ''}
            onChange={(e) => onChange({ ...company, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Enter company name"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo URL *
          </label>
          <input
            type="url"
            value={company.logo || ''}
            onChange={(e) => onChange({ ...company, logo: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="https://example.com/logo.png"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Website URL
          </label>
          <input
            type="url"
            value={company.website || ''}
            onChange={(e) => onChange({ ...company, website: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="https://example.com"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Display Order
          </label>
          <input
            type="number"
            value={company.order || 0}
            onChange={(e) => onChange({ ...company, order: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            min="0"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={company.description || ''}
          onChange={(e) => onChange({ ...company, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-vertical"
          placeholder="Brief description of the company"
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id={`active-${company.id || 'new'}`}
          checked={company.is_active ?? true}
          onChange={(e) => onChange({ ...company, is_active: e.target.checked })}
          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          disabled={isLoading}
        />
        <label htmlFor={`active-${company.id || 'new'}`} className="ml-2 text-sm text-gray-700">
          Active (visible on homepage)
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !company.name || !company.logo}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          <Save size={16} />
          {isLoading ? 'Saving...' : 'Save Company'}
        </button>
      </div>
    </form>
  );
};

export default CompanyManagement;