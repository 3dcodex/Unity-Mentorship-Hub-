import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../src/firebase';
import { useAuth } from '../../App';
import { Role, getPermissions } from '../../src/types/roles';
import { formatDate, formatDateTime, formatRole } from '../../utils/formatters';
import LoadingSpinner from '../../components/LoadingSpinner';
import StatusBadge from '../../components/StatusBadge';
import { useToast } from '../../components/AdminToast';
import UserDetailModal from '../../components/UserDetailModal';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: any;
  lastActive: any;
  accountStatus?: string;
  verified?: boolean;
  subscriptionPlan?: string;
  phone?: string;
  location?: string;
}

const UserManagementEnhanced: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);
  const { showToast, ToastComponent } = useToast();

  useEffect(() => {
    loadAdminRole();
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, statusFilter, verifiedFilter, dateFrom, dateTo, users]);

  const loadAdminRole = async () => {
    if (!currentAdmin) return;
    await getDoc(doc(db, 'users', currentAdmin.uid));
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
      setUsers(usersData);
    } catch (error) {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;
    
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(u => u.status === statusFilter);
    }

    if (verifiedFilter !== 'all') {
      filtered = filtered.filter(u => 
        verifiedFilter === 'verified' ? u.verified === true : u.verified !== true
      );
    }

    if (dateFrom) {
      filtered = filtered.filter(u => {
        const userDate = u.createdAt?.toDate?.() || new Date(u.createdAt);
        return userDate >= new Date(dateFrom);
      });
    }

    if (dateTo) {
      filtered = filtered.filter(u => {
        const userDate = u.createdAt?.toDate?.() || new Date(u.createdAt);
        return userDate <= new Date(dateTo + 'T23:59:59');
      });
    }
    
    setFilteredUsers(filtered);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === paginatedUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(paginatedUsers.map(u => u.id)));
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleBulkSuspend = async () => {
    if (selectedUsers.size === 0) return;
    
    try {
      const promises = Array.from(selectedUsers).map(userId =>
        updateDoc(doc(db, 'users', userId), {
          status: 'suspended',
          suspendedAt: Timestamp.now(),
          suspendedBy: currentAdmin?.uid
        })
      );
      
      await Promise.all(promises);
      showToast(`${selectedUsers.size} users suspended`, 'success');
      setSelectedUsers(new Set());
      loadUsers();
    } catch (error) {
      showToast('Failed to suspend users', 'error');
    }
  };

  const handleBulkActivate = async () => {
    if (selectedUsers.size === 0) return;
    
    try {
      const promises = Array.from(selectedUsers).map(userId =>
        updateDoc(doc(db, 'users', userId), {
          status: 'active',
          suspendedAt: null,
          suspendedBy: null
        })
      );
      
      await Promise.all(promises);
      showToast(`${selectedUsers.size} users activated`, 'success');
      setSelectedUsers(new Set());
      loadUsers();
    } catch (error) {
      showToast('Failed to activate users', 'error');
    }
  };

  const handleExportUsers = () => {
    const dataToExport = selectedUsers.size > 0
      ? filteredUsers.filter(u => selectedUsers.has(u.id))
      : filteredUsers;

    const csv = [
      ['ID', 'Name', 'Email', 'Role', 'Status', 'Verified', 'Joined', 'Last Active'].join(','),
      ...dataToExport.map(u => [
        u.id,
        u.name,
        u.email,
        u.role,
        u.status,
        u.verified ? 'Yes' : 'No',
        formatDate(u.createdAt),
        formatDateTime(u.lastActive)
      ].map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    showToast('Users exported successfully', 'success');
  };

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 font-bold mt-4">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {ToastComponent}
      
      {showDetailModal && selectedUser && (
        <UserDetailModal
          userId={selectedUser.id}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedUser(null);
          }}
          onUpdate={loadUsers}
        />
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black text-gray-900">User Management</h1>
            <p className="text-gray-600 mt-2">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>
          <button
            onClick={handleExportUsers}
            className="px-6 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 flex items-center gap-2"
          >
            <span className="material-symbols-outlined">download</span>
            Export {selectedUsers.size > 0 ? `(${selectedUsers.size})` : 'All'}
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
            <input
              type="text"
              placeholder="Search name, email, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
            />
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
            >
              <option value="all">All Roles</option>
              <option value="student">Student</option>
              <option value="professional">Professional</option>
              <option value="moderator">Moderator</option>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>

            <select
              value={verifiedFilter}
              onChange={(e) => setVerifiedFilter(e.target.value)}
              className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
            >
              <option value="all">All Verification</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>

            <button
              onClick={() => {
                setSearchTerm('');
                setRoleFilter('all');
                setStatusFilter('all');
                setVerifiedFilter('all');
                setDateFrom('');
                setDateTo('');
              }}
              className="px-4 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200"
            >
              Clear Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">From Date</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">To Date</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-green-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedUsers.size > 0 && (
          <div className="bg-blue-600 text-white rounded-2xl p-4 mb-6 flex items-center justify-between">
            <p className="font-bold">{selectedUsers.size} users selected</p>
            <div className="flex gap-2">
              <button
                onClick={handleBulkActivate}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold"
              >
                Activate
              </button>
              <button
                onClick={handleBulkSuspend}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold"
              >
                Suspend
              </button>
              <button
                onClick={() => setSelectedUsers(new Set())}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-bold"
              >
                Clear Selection
              </button>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUsers.size === paginatedUsers.length && paginatedUsers.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 rounded"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">User</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Role</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Verified</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Last Active</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="w-4 h-4 rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                      {formatRole(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-6 py-4">
                    {user.verified ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        Yes
                      </span>
                    ) : (
                      <span className="text-gray-400">No</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {formatDateTime(user.lastActive)}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => {
                        setSelectedUser(user);
                        setShowDetailModal(true);
                      }}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-200"
                    >
                      View Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-gray-600">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl font-bold disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border-2 border-gray-200 rounded-xl font-bold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementEnhanced;
