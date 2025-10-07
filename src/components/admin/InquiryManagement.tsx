import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdminStore } from '@/store/adminStore';
import { CustomerInquiry } from '@/types/admin';
import { 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  MessageCircle, 
  Calendar,
  User,
  Building,
  Clock,
  Edit,
  CheckCircle,
  Plus,
  Trash2,
  MoreVertical,
  X,
  Save
} from 'lucide-react';

const InquiryManagement: React.FC = () => {
  const { inquiries, updateInquiry, loadInquiries, addInquiry, deleteInquiry } = useAdminStore();

  // Load inquiries on component mount
  useEffect(() => {
    const initializeInquiries = async () => {
      try {
        console.log('🔍 InquiryManagement: Component mounted');
        console.log('📊 InquiryManagement: Current inquiries count:', inquiries.length);
        
        // If no inquiries are loaded, try to load them
        if (inquiries.length === 0) {
          console.log('🔄 InquiryManagement: No inquiries found, attempting to reload...');
          
          try {
            await loadInquiries();
          } catch (error) {
            console.error('❌ InquiryManagement: Failed to reload inquiries:', error);
          }
        }
      } catch (error) {
        console.error('InquiryManagement initialization error:', error);
      }
    };

    initializeInquiries();
  }, [inquiries.length]); // FIXED: Removed loadInquiries from dependency array to prevent infinite loop
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<CustomerInquiry | null>(null);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [inquiryToDelete, setInquiryToDelete] = useState<CustomerInquiry | null>(null);

  const filteredInquiries = inquiries.filter(inquiry => {
    const matchesSearch = 
      inquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inquiry.company && inquiry.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      inquiry.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || inquiry.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleStatusUpdate = async (inquiryId: string, newStatus: CustomerInquiry['status']) => {
    try {
      console.log('🔄 InquiryManagement: Updating status for inquiry:', inquiryId, 'to:', newStatus);
      await updateInquiry(inquiryId, { status: newStatus });
    } catch (error) {
      console.error('❌ InquiryManagement: Error updating status:', error);
    }
  };

  const handlePriorityUpdate = async (inquiryId: string, newPriority: CustomerInquiry['priority']) => {
    try {
      await updateInquiry(inquiryId, { priority: newPriority });
    } catch (error) {
      console.error('❌ Error updating priority:', error);
      alert('Failed to update priority. Please try again.');
    }
  };

  const handleAddNotes = async (inquiryId: string, notes: string) => {
    try {
      await updateInquiry(inquiryId, { notes });
      setShowUpdateForm(false);
      setSelectedInquiry(null);
    } catch (error) {
      console.error('❌ Error adding notes:', error);
      alert('Failed to add notes. Please try again.');
    }
  };

  const handleCreateInquiry = async (formData: FormData) => {
    try {
      const inquiryData = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string || undefined,
        company: formData.get('company') as string || undefined,
        message: formData.get('message') as string,
        status: (formData.get('status') as CustomerInquiry['status']) || 'new',
        priority: (formData.get('priority') as CustomerInquiry['priority']) || 'medium',
        notes: formData.get('notes') as string || undefined,
        propertyTitle: formData.get('propertyTitle') as string || undefined,
      };

      await addInquiry(inquiryData);
      setShowCreateForm(false);
      console.log('✅ Inquiry created successfully');
    } catch (error) {
      console.error('❌ Error creating inquiry:', error);
      alert('Failed to create inquiry. Please try again.');
    }
  };

  const handleUpdateInquiry = async (formData: FormData) => {
    if (!selectedInquiry) return;
    
    try {
      const updates = {
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        phone: formData.get('phone') as string || undefined,
        company: formData.get('company') as string || undefined,
        message: formData.get('message') as string,
        status: formData.get('status') as CustomerInquiry['status'],
        priority: formData.get('priority') as CustomerInquiry['priority'],
        notes: formData.get('notes') as string || undefined,
        propertyTitle: formData.get('propertyTitle') as string || undefined,
      };

      await updateInquiry(selectedInquiry.id, updates);
      setShowUpdateForm(false);
      setSelectedInquiry(null);
      console.log('✅ Inquiry updated successfully');
    } catch (error) {
      console.error('❌ Error updating inquiry:', error);
      alert('Failed to update inquiry. Please try again.');
    }
  };

  const handleDeleteInquiry = async () => {
    if (!inquiryToDelete) return;
    
    try {
      await deleteInquiry(inquiryToDelete.id);
      setShowDeleteConfirm(false);
      setInquiryToDelete(null);
      console.log('✅ Inquiry deleted successfully');
    } catch (error) {
      console.error('❌ Error deleting inquiry:', error);
      alert('Failed to delete inquiry. Please try again.');
    }
  };

  const confirmDelete = (inquiry: CustomerInquiry) => {
    setInquiryToDelete(inquiry);
    setShowDeleteConfirm(true);
  };

  const getStatusColor = (status: CustomerInquiry['status']) => {
    switch (status) {
      case 'new': return 'bg-red-100 text-red-800';
      case 'contacted': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'converted': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: CustomerInquiry['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getResponseTimeColor = (hours?: number) => {
    if (!hours) return 'text-gray-500';
    if (hours <= 1) return 'text-green-600';
    if (hours <= 24) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Inquiries</h1>
          <p className="text-gray-600 mt-2">Manage and track customer inquiries</p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-primary-600 hover:bg-primary-700"
        >
          <Plus size={16} className="mr-2" />
          Add New Inquiry
        </Button>
        <div className="text-sm text-gray-600">
          {filteredInquiries.length} of {inquiries.length} inquiries
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Search by name, email, company..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="w-full lg:w-40">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="in_progress">In Progress</option>
                <option value="converted">Converted</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            
            <div className="w-full lg:w-40">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Priority</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inquiries List */}
      <div className="space-y-4">
        {filteredInquiries.map((inquiry) => (
          <Card key={inquiry.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-semibold text-gray-900">{inquiry.name}</h3>
                        <Badge className={`${getStatusColor(inquiry.status)} text-xs`}>
                          {inquiry.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={`${getPriorityColor(inquiry.priority)} text-xs`}>
                          {inquiry.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        {inquiry.company && (
                          <div className="flex items-center">
                            <Building size={14} className="mr-1" />
                            <span>{inquiry.company}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar size={14} className="mr-1" />
                          <span>{new Date(inquiry.createdAt).toLocaleDateString()}</span>
                        </div>
                        {inquiry.responseTime !== undefined && (
                          <div className="flex items-center">
                            <Clock size={14} className="mr-1" />
                            <span className={getResponseTimeColor(inquiry.responseTime)}>
                              Response: {inquiry.responseTime}h
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedInquiry(inquiry);
                          setShowUpdateForm(true);
                        }}
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => confirmDelete(inquiry)}
                      >
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {/* Property Info */}
                  {inquiry.propertyTitle && (
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm text-gray-600">Interested in:</div>
                      <div className="font-medium text-gray-900">{inquiry.propertyTitle}</div>
                    </div>
                  )}

                  {/* Requirement */}
                  <div>
                    <div className="text-sm font-medium text-gray-900 mb-2">Requirement:</div>
                    <p className="text-gray-600 text-sm leading-relaxed">{inquiry.message}</p>
                  </div>

                  {/* Notes */}
                  {inquiry.notes && (
                    <div>
                      <div className="text-sm font-medium text-gray-900 mb-2">Notes:</div>
                      <p className="text-gray-600 text-sm leading-relaxed bg-blue-50 p-3 rounded-lg">
                        {inquiry.notes}
                      </p>
                    </div>
                  )}

                  {/* Contact Actions */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-4">
                      {inquiry.email && (
                        <a
                          href={`mailto:${inquiry.email}`}
                          className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                        >
                          <Mail size={14} className="mr-1" />
                          {inquiry.email}
                        </a>
                      )}
                      {inquiry.phone && (
                        <a
                          href={`tel:${inquiry.phone}`}
                          className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                        >
                          <Phone size={14} className="mr-1" />
                          {inquiry.phone}
                        </a>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 lg:flex-row lg:space-y-0 lg:space-x-2">
                      <select
                        value={inquiry.status}
                        onChange={(e) => handleStatusUpdate(inquiry.id, e.target.value as CustomerInquiry['status'])}
                        className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 min-w-0"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="in_progress">In Progress</option>
                        <option value="converted">Converted</option>
                        <option value="closed">Closed</option>
                      </select>
                      
                      <select
                        value={inquiry.priority}
                        onChange={(e) => handlePriorityUpdate(inquiry.id, e.target.value as CustomerInquiry['priority'])}
                        className="text-sm px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 min-w-0"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>

                      {inquiry.phone && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
                          onClick={() => {
                            const message = `Hi ${inquiry.name}, thank you for your inquiry about office space. I'm from Gentle Space and would like to discuss your requirements.`;
                            const whatsappUrl = `https://wa.me/${inquiry.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
                            window.open(whatsappUrl, '_blank');
                          }}
                        >
                          <MessageCircle size={14} className="mr-1" />
                          <span className="hidden sm:inline">WhatsApp</span>
                          <span className="sm:hidden">WA</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredInquiries.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <User className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all' 
                    ? 'No inquiries found' 
                    : 'No inquiries yet'
                  }
                </h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                    ? 'Try adjusting your search criteria or filters'
                    : 'Customer inquiries will appear here when submitted'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Create New Inquiry</CardTitle>
                  <CardDescription>Add a new customer inquiry to the system</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCreateForm(false)}
                >
                  <X size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreateInquiry(new FormData(e.currentTarget));
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="create-name">Name *</Label>
                    <Input
                      id="create-name"
                      name="name"
                      required
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-email">Email *</Label>
                    <Input
                      id="create-email"
                      name="email"
                      type="email"
                      required
                      placeholder="customer@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-phone">Phone</Label>
                    <Input
                      id="create-phone"
                      name="phone"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-company">Company</Label>
                    <Input
                      id="create-company"
                      name="company"
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="create-status">Status</Label>
                    <select
                      id="create-status"
                      name="status"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="in_progress">In Progress</option>
                      <option value="converted">Converted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="create-priority">Priority</Label>
                    <select
                      id="create-priority"
                      name="priority"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="create-propertyTitle">Property Interest</Label>
                  <Input
                    id="create-propertyTitle"
                    name="propertyTitle"
                    placeholder="Property they're interested in"
                  />
                </div>
                <div>
                  <Label htmlFor="create-message">Message *</Label>
                  <Textarea
                    id="create-message"
                    name="message"
                    required
                    placeholder="Customer inquiry message..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="create-notes">Notes</Label>
                  <Textarea
                    id="create-notes"
                    name="notes"
                    placeholder="Internal notes..."
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary-600 hover:bg-primary-700">
                    <Save size={14} className="mr-2" />
                    Create Inquiry
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Update Form Modal */}
      {showUpdateForm && selectedInquiry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Edit Inquiry</CardTitle>
                  <CardDescription>Update inquiry details for {selectedInquiry.name}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowUpdateForm(false);
                    setSelectedInquiry(null);
                  }}
                >
                  <X size={16} />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateInquiry(new FormData(e.currentTarget));
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-name">Name *</Label>
                    <Input
                      id="edit-name"
                      name="name"
                      required
                      defaultValue={selectedInquiry.name}
                      placeholder="Customer name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email">Email *</Label>
                    <Input
                      id="edit-email"
                      name="email"
                      type="email"
                      required
                      defaultValue={selectedInquiry.email}
                      placeholder="customer@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-phone">Phone</Label>
                    <Input
                      id="edit-phone"
                      name="phone"
                      defaultValue={selectedInquiry.phone || ''}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-company">Company</Label>
                    <Input
                      id="edit-company"
                      name="company"
                      defaultValue={selectedInquiry.company || ''}
                      placeholder="Company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-status">Status</Label>
                    <select
                      id="edit-status"
                      name="status"
                      defaultValue={selectedInquiry.status}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="new">New</option>
                      <option value="contacted">Contacted</option>
                      <option value="in_progress">In Progress</option>
                      <option value="converted">Converted</option>
                      <option value="closed">Closed</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="edit-priority">Priority</Label>
                    <select
                      id="edit-priority"
                      name="priority"
                      defaultValue={selectedInquiry.priority}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit-propertyTitle">Property Interest</Label>
                  <Input
                    id="edit-propertyTitle"
                    name="propertyTitle"
                    defaultValue={selectedInquiry.propertyTitle || ''}
                    placeholder="Property they're interested in"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-message">Message *</Label>
                  <Textarea
                    id="edit-message"
                    name="message"
                    required
                    defaultValue={selectedInquiry.message}
                    placeholder="Customer inquiry message..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-notes">Notes</Label>
                  <Textarea
                    id="edit-notes"
                    name="notes"
                    defaultValue={selectedInquiry.notes || ''}
                    placeholder="Internal notes..."
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowUpdateForm(false);
                      setSelectedInquiry(null);
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary-600 hover:bg-primary-700">
                    <Save size={14} className="mr-2" />
                    Update Inquiry
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && inquiryToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">Confirm Delete</CardTitle>
              <CardDescription>
                Are you sure you want to delete the inquiry from {inquiryToDelete.name}?
                This action cannot be undone.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setInquiryToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteInquiry}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InquiryManagement;
