import React, { useState } from 'react';
import { useTestimonialStore } from '@/store/testimonialStore';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Filter, 
  Star, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Mail, 
  Phone,
  Building,
  User,
  Calendar,
  MessageSquare,
  Trash2
} from 'lucide-react';

const TestimonialManagement: React.FC = () => {
  const { testimonials, approveTestimonial, rejectTestimonial, deleteTestimonial, pendingTestimonials } = useTestimonialStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter testimonials based on search and status
  const filteredTestimonials = testimonials.filter(testimonial => {
    const matchesSearch = 
      testimonial.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      testimonial.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || testimonial.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleApprove = async (id: string) => {
    try {
      await approveTestimonial(id, 'Admin User');
    } catch (error) {
      console.error('Failed to approve testimonial:', error);
      alert('Failed to approve testimonial. Please try again.');
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }
    
    try {
      await rejectTestimonial(id, rejectionReason, 'Admin User');
      setRejectingId(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject testimonial:', error);
      alert('Failed to reject testimonial. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTestimonial(id);
      setDeletingId(null);
    } catch (error) {
      console.error('Failed to delete testimonial:', error);
      alert('Failed to delete testimonial. Please try again.');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}
          />
        ))}
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Testimonial Management</h1>
          <p className="text-gray-600 mt-1">
            Review and manage customer testimonials
          </p>
        </div>
        
        {/* Stats */}
        <div className="flex space-x-4">
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-2 text-center">
            <div className="text-2xl font-bold text-blue-600">{testimonials.length}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-2 text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingTestimonials.length}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 px-4 py-2 text-center">
            <div className="text-2xl font-bold text-green-600">
              {testimonials.filter(t => t.status === 'approved').length}
            </div>
            <div className="text-xs text-gray-500">Approved</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search testimonials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400 w-4 h-4" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'approved' | 'rejected')}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Testimonials List */}
      <div className="space-y-4">
        {filteredTestimonials.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <MessageSquare className="mx-auto mb-4 text-gray-400" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No testimonials found</h3>
            <p className="text-gray-600">
              {searchTerm || statusFilter !== 'all' 
                ? 'No testimonials match your current filters.' 
                : 'No testimonials have been submitted yet.'}
            </p>
          </div>
        ) : (
          filteredTestimonials.map((testimonial) => (
            <div key={testimonial.id} className="bg-white rounded-lg border border-gray-200 p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 font-semibold">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {testimonial.name}
                      </h3>
                      {getStatusBadge(testimonial.status)}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center space-x-1">
                        <Building className="w-4 h-4" />
                        <span>{testimonial.company}</span>
                      </div>
                      {testimonial.role && (
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{testimonial.role}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <div className="text-right">
                  {renderStars(testimonial.rating)}
                  <div className="text-sm text-gray-600 mt-1">
                    {testimonial.rating}/5 stars
                  </div>
                </div>
              </div>

              {/* Testimonial Content */}
              <div className="mb-4">
                <blockquote className="text-gray-700 italic border-l-4 border-primary-200 pl-4">
                  "{testimonial.content}"
                </blockquote>
              </div>

              {/* Contact Information */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center space-x-1">
                  <Mail className="w-4 h-4" />
                  <span>{testimonial.email}</span>
                </div>
                {testimonial.phone && (
                  <div className="flex items-center space-x-1">
                    <Phone className="w-4 h-4" />
                    <span>{testimonial.phone}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{new Date(testimonial.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Status Information */}
              {testimonial.status === 'approved' && testimonial.approved_at && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-green-800">
                    <strong>Approved</strong> by {testimonial.approved_by} on {new Date(testimonial.approved_at).toLocaleDateString()}
                  </p>
                </div>
              )}

              {testimonial.status === 'rejected' && testimonial.rejection_reason && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-red-800">
                    <strong>Rejected</strong> by {testimonial.approved_by} on {new Date(testimonial.updated_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    <strong>Reason:</strong> {testimonial.rejection_reason}
                  </p>
                </div>
              )}

              {/* Actions */}
              {testimonial.status === 'pending' && (
                <div className="flex items-center space-x-3">
                  {rejectingId === testimonial.id ? (
                    <div className="flex-1 space-y-3">
                      <textarea
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Please provide a reason for rejection..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                        rows={2}
                      />
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleReject(testimonial.id)}
                          className="bg-red-600 hover:bg-red-700 text-white"
                          size="sm"
                        >
                          Confirm Rejection
                        </Button>
                        <Button
                          onClick={() => {
                            setRejectingId(null);
                            setRejectionReason('');
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleApprove(testimonial.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        onClick={() => setRejectingId(testimonial.id)}
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Delete Action for Approved/Rejected Testimonials */}
              {(testimonial.status === 'approved' || testimonial.status === 'rejected') && (
                <div className="flex items-center space-x-3">
                  {deletingId === testimonial.id ? (
                    <div className="flex-1 space-y-3">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800 font-medium mb-2">
                          ⚠️ Confirm Deletion
                        </p>
                        <p className="text-sm text-red-700 mb-3">
                          Are you sure you want to permanently delete this testimonial? This action cannot be undone.
                        </p>
                        <div className="flex space-x-2">
                          <Button
                            onClick={() => handleDelete(testimonial.id)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            size="sm"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Permanently
                          </Button>
                          <Button
                            onClick={() => setDeletingId(null)}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={() => setDeletingId(testimonial.id)}
                      variant="outline"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TestimonialManagement;