import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../src/firebase';
import { useAuth } from '../../App';
import { formatDateTime } from '../../utils/formatters';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../components/AdminToast';

interface FlaggedContent {
  id: string;
  type: 'post' | 'comment' | 'message';
  contentId: string;
  content: string;
  authorId: string;
  authorName: string;
  reportedBy: string;
  reporterName: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'deleted';
  createdAt: any;
  reviewedBy?: string;
  reviewedAt?: any;
}

const ContentModeration: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [flaggedContent, setFlaggedContent] = useState<FlaggedContent[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [typeFilter, setTypeFilter] = useState<'all' | 'post' | 'comment' | 'message'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedContent, setSelectedContent] = useState<FlaggedContent | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    loadFlaggedContent();
  }, []);

  const loadFlaggedContent = async () => {
    try {
      setLoading(true);
      const moderationSnap = await getDocs(collection(db, 'moderationQueue'));
      const data = moderationSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as FlaggedContent));
      setFlaggedContent(data);
    } catch (error) {
      showToast('Failed to load flagged content', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (contentId: string) => {
    try {
      await updateDoc(doc(db, 'moderationQueue', contentId), {
        status: 'approved',
        reviewedBy: currentAdmin?.uid,
        reviewedAt: Timestamp.now()
      });

      showToast('Content approved', 'success');
      loadFlaggedContent();
    } catch (error) {
      showToast('Failed to approve content', 'error');
    }
  };

  const handleReject = async (contentId: string) => {
    try {
      await updateDoc(doc(db, 'moderationQueue', contentId), {
        status: 'rejected',
        reviewedBy: currentAdmin?.uid,
        reviewedAt: Timestamp.now()
      });

      showToast('Content rejected', 'success');
      loadFlaggedContent();
    } catch (error) {
      showToast('Failed to reject content', 'error');
    }
  };

  const handleDelete = async (item: FlaggedContent) => {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete the actual content
      const collectionName = item.type === 'post' ? 'communityPosts' : 
                            item.type === 'comment' ? 'comments' : 'messages';
      
      await deleteDoc(doc(db, collectionName, item.contentId));

      // Update moderation queue
      await updateDoc(doc(db, 'moderationQueue', item.id), {
        status: 'deleted',
        reviewedBy: currentAdmin?.uid,
        reviewedAt: Timestamp.now()
      });

      // Log admin action
      await addDoc(collection(db, 'adminActions'), {
        adminId: currentAdmin?.uid,
        adminName: currentAdmin?.email || 'Admin',
        action: 'delete_content',
        targetUserId: item.authorId,
        details: JSON.stringify({ contentType: item.type, reason: item.reason }),
        timestamp: Timestamp.now()
      });

      showToast('Content deleted successfully', 'success');
      loadFlaggedContent();
    } catch (error) {
      showToast('Failed to delete content', 'error');
    }
  };

  const filteredContent = flaggedContent.filter(item => {
    if (filter !== 'all' && item.status !== filter) return false;
    if (typeFilter !== 'all' && item.type !== typeFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 font-bold mt-4">Loading flagged content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {ToastComponent}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900">Content Moderation</h1>
            <p className="text-gray-600 mt-2">Review and moderate flagged content</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white rounded-xl px-4 py-2 shadow">
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-black text-red-600">
                {flaggedContent.filter(c => c.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
            >
              <option value="all">All Types</option>
              <option value="post">Posts</option>
              <option value="comment">Comments</option>
              <option value="message">Messages</option>
            </select>

            <button
              onClick={() => {
                setFilter('all');
                setTypeFilter('all');
              }}
              className="px-4 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="space-y-4">
          {filteredContent.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
              <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">check_circle</span>
              <p className="text-xl font-bold text-gray-600">No flagged content</p>
              <p className="text-gray-500 mt-2">All content has been reviewed</p>
            </div>
          ) : (
            filteredContent.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      item.type === 'post' ? 'bg-blue-100 text-blue-700' :
                      item.type === 'comment' ? 'bg-purple-100 text-purple-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {item.type.toUpperCase()}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-sm text-gray-500">{formatDateTime(item.createdAt)}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-gray-900">{item.content}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 font-bold">Author</p>
                    <p className="text-gray-900">{item.authorName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 font-bold">Reported By</p>
                    <p className="text-gray-900">{item.reporterName}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 font-bold">Reason</p>
                  <p className="text-gray-900">{item.reason}</p>
                </div>

                {item.status === 'pending' && (
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(item.id)}
                      className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined">check_circle</span>
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(item.id)}
                      className="px-6 py-3 bg-yellow-600 text-white rounded-xl font-bold hover:bg-yellow-700 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined">cancel</span>
                      Reject
                    </button>
                    <button
                      onClick={() => handleDelete(item)}
                      className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined">delete</span>
                      Delete Content
                    </button>
                  </div>
                )}

                {item.status !== 'pending' && item.reviewedBy && (
                  <div className="bg-blue-50 rounded-xl p-3">
                    <p className="text-sm text-blue-900">
                      Reviewed on {formatDateTime(item.reviewedAt)}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentModeration;
