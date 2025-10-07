import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PropertyTag } from '@/types/property';
import { API } from '@/services/apiService';
import { Plus, Edit, Trash2, Save, X, Tag, Palette, Eye } from 'lucide-react';

const TagManagement: React.FC = () => {
  const [tags, setTags] = useState<PropertyTag[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<PropertyTag | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    color: '#000000',
    backgroundColor: '#f0f9ff',
    description: ''
  });

  // Predefined color combinations
  const colorPresets = [
    { name: 'Blue', color: '#1e40af', backgroundColor: '#dbeafe' },
    { name: 'Green', color: '#15803d', backgroundColor: '#dcfce7' },
    { name: 'Purple', color: '#7c3aed', backgroundColor: '#ede9fe' },
    { name: 'Red', color: '#dc2626', backgroundColor: '#fee2e2' },
    { name: 'Orange', color: '#ea580c', backgroundColor: '#fed7aa' },
    { name: 'Pink', color: '#db2777', backgroundColor: '#fce7f3' },
    { name: 'Indigo', color: '#4338ca', backgroundColor: '#e0e7ff' },
    { name: 'Yellow', color: '#ca8a04', backgroundColor: '#fef3c7' },
    { name: 'Teal', color: '#0f766e', backgroundColor: '#ccfbf1' },
    { name: 'Gray', color: '#374151', backgroundColor: '#f3f4f6' }
  ];

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      const allTags = await API.getAllTags();
      setTags(allTags);
    } catch (error) {
      console.error('Error loading tags:', error);
      alert('Failed to load tags. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      color: '#000000',
      backgroundColor: '#f0f9ff',
      description: ''
    });
    setEditingTag(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (tag: PropertyTag) => {
    setFormData({
      name: tag.name,
      color: tag.color,
      backgroundColor: tag.backgroundColor,
      description: tag.description || ''
    });
    setEditingTag(tag);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleColorPresetSelect = (preset: typeof colorPresets[0]) => {
    setFormData(prev => ({
      ...prev,
      color: preset.color,
      backgroundColor: preset.backgroundColor
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Please enter a tag name.');
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (editingTag) {
        // Update existing tag
        await API.updateTag(editingTag.id, {
          name: formData.name.trim(),
          color: formData.color,
          backgroundColor: formData.backgroundColor,
          description: formData.description.trim() || undefined
        });
        console.log('✅ Tag updated successfully');
      } else {
        // Create new tag
        await API.createTag({
          name: formData.name.trim(),
          color: formData.color,
          backgroundColor: formData.backgroundColor,
          description: formData.description.trim() || undefined
        });
        console.log('✅ Tag created successfully');
      }
      
      // Reload tags and close dialog
      await loadTags();
      closeDialog();
      
    } catch (error) {
      console.error('❌ Error saving tag:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`Failed to ${editingTag ? 'update' : 'create'} tag:\n\n${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (tag: PropertyTag) => {
    const confirmation = window.confirm(
      `Are you sure you want to delete the tag "${tag.name}"?\n\nThis action cannot be undone and will remove the tag from all properties.`
    );
    
    if (!confirmation) return;

    try {
      await API.deleteTag(tag.id);
      console.log('✅ Tag deleted successfully');
      
      // Reload tags
      await loadTags();
      
    } catch (error) {
      console.error('❌ Error deleting tag:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`Failed to delete tag:\n\n${errorMessage}`);
    }
  };

  const toggleTagStatus = async (tag: PropertyTag) => {
    try {
      await API.updateTag(tag.id, {
        isActive: !tag.isActive
      });
      console.log(`✅ Tag ${tag.isActive ? 'deactivated' : 'activated'} successfully`);
      
      // Reload tags
      await loadTags();
      
    } catch (error) {
      console.error('❌ Error updating tag status:', error);
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`Failed to update tag status:\n\n${errorMessage}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tag Management</h1>
          <p className="text-gray-600 mt-2">
            Create and manage custom tags for property categorization
          </p>
        </div>
        <Button onClick={openCreateDialog} className="bg-primary-600 hover:bg-primary-700">
          <Plus className="mr-2 h-4 w-4" />
          Create Tag
        </Button>
      </div>

      {/* Tags List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Tag className="mr-2 h-5 w-5" />
            All Tags ({tags.length})
          </CardTitle>
          <CardDescription>
            Manage custom tags that can be assigned to properties
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading tags...
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Tag className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <p>No tags created yet</p>
              <p className="text-sm">Create your first tag to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <Badge
                      className="text-sm px-3 py-1"
                      style={{
                        backgroundColor: tag.backgroundColor,
                        color: tag.color,
                        borderColor: tag.color
                      }}
                    >
                      {tag.name}
                    </Badge>
                    
                    <div className="text-sm text-gray-600">
                      {tag.description && (
                        <p className="max-w-md">{tag.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-400">
                          Created: {new Date(tag.createdAt).toLocaleDateString()}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          tag.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {tag.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleTagStatus(tag)}
                      className={tag.isActive ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}
                      title={tag.isActive ? 'Deactivate tag' : 'Activate tag'}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(tag)}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(tag)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTag ? 'Edit Tag' : 'Create New Tag'}
            </DialogTitle>
            <DialogDescription>
              {editingTag 
                ? 'Update the tag details below'
                : 'Create a new tag that can be assigned to properties'
              }
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tag Name */}
            <div>
              <Label htmlFor="tagName">Tag Name *</Label>
              <Input
                id="tagName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Premium, Pet Friendly, Newly Renovated"
                required
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="tagDescription">Description (Optional)</Label>
              <Textarea
                id="tagDescription"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of what this tag represents..."
                rows={2}
              />
            </div>

            {/* Color Configuration */}
            <div className="space-y-4">
              <Label className="flex items-center">
                <Palette className="mr-2 h-4 w-4" />
                Color Configuration
              </Label>

              {/* Color Presets */}
              <div>
                <Label className="text-sm text-gray-600">Quick Presets</Label>
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {colorPresets.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleColorPresetSelect(preset)}
                      className="p-2 rounded-lg border hover:border-gray-400 transition-colors"
                      title={preset.name}
                      style={{
                        backgroundColor: preset.backgroundColor,
                        color: preset.color,
                        borderColor: preset.color
                      }}
                    >
                      Tag
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Color Inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="textColor" className="text-sm">Text Color</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      id="textColor"
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <Input
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      placeholder="#000000"
                      className="text-sm"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="backgroundColor" className="text-sm">Background Color</Label>
                  <div className="flex items-center space-x-2">
                    <input
                      id="backgroundColor"
                      type="color"
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
                    />
                    <Input
                      value={formData.backgroundColor}
                      onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                      placeholder="#f0f9ff"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div>
                <Label className="text-sm text-gray-600">Preview</Label>
                <div className="mt-2">
                  <Badge
                    className="text-sm px-3 py-2"
                    style={{
                      backgroundColor: formData.backgroundColor,
                      color: formData.color,
                      borderColor: formData.color
                    }}
                  >
                    {formData.name || 'Tag Preview'}
                  </Badge>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" className="bg-primary-600 hover:bg-primary-700" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {editingTag ? 'Updating...' : 'Creating...'}
                  </span>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {editingTag ? 'Update Tag' : 'Create Tag'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TagManagement;