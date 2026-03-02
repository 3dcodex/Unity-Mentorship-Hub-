import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../src/firebase';
import { useAuth } from '../../App';
import { Role, ROLE_HIERARCHY, canChangeRole, getPermissions } from '../../src/types/roles';
import { logAdminAction, sendSystemNotification, deleteUser } from '../../services/adminService';
import { getFunctions, httpsCallable } from 'firebase/functions';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: any;
  lastActive: any;
  accountStatus?: string; // for professionals
}

const UserManagement: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [adminRole, setAdminRole] = useState<Role>(Role.STUDENT);
  const [permissions, setPermissions] = useState(getPermissions(Role.STUDENT));

  const logAction = async (action: string, targetUserId: string, details: any) => {
    if (!currentAdmin) return;
    await logAdminAction(currentAdmin.uid, currentAdmin.email || 'Admin', action, JSON.stringify(details), targetUserId);
  };

  // Removed professional approval logic - professionals are now auto-approved

  useEffect(() => {
    loadAdminRole();
    loadUsers();
  }, []);

  const loadAdminRole = async () => {
    if (!currentAdmin) return;
    const userDoc = await getDoc(doc(db, 'users', currentAdmin.uid));
    const userRoleString = (userDoc.data()?.role || 'student') as string;
    
    // Map role string to Role enum
    let role: Role;
    switch (userRoleString.toLowerCase()) {
      case 'super_admin':
      case 'superadmin':
        role = Role.SUPER_ADMIN;
        break;
      case 'admin':
        role = Role.ADMIN;
        break;
      case 'moderator':
        role = Role.MODERATOR;
        break;
      case 'professional':
      case 'mentor':
        role = Role.PROFESSIONAL;
        break;
      default:
        role = Role.STUDENT;
    }
    
    setAdminRole(role);
    setPermissions(getPermissions(role));
  };

  useEffect(() => {
    filterUsers();
  }, [searchTerm, roleFilter, statusFilter, users]);

  const loadUsers = async () => {
    const usersSnap = await getDocs(collection(db, 'users'));
    const usersData = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    setUsers(usersData);
  };

  const filterUsers = () => {
    let filtered = users;
    
    // Hide super_admin users from non-super_admin admins
    if (adminRole !== Role.SUPER_ADMIN) {
      filtered = filtered.filter(u => u.role !== 'super_admin');
    }
    
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(u => u.status === statusFilter);
    }
    
    setFilteredUsers(filtered);
  };

  const handleChangeEmail = async () => {
    if (!selectedUser || !newEmail.trim()) return;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      alert('Please enter a valid email address');
      return;
    }

    const confirmed = confirm(`Change ${selectedUser.name}'s email from ${selectedUser.email} to ${newEmail}?`);
    if (!confirmed) return;

    try {
      const functions = getFunctions();
      const adminChangeEmail = httpsCallable(functions, 'adminChangeEmail');
      const result = await adminChangeEmail({ uid: selectedUser.id, newEmail: newEmail.trim() });
      
      alert('Email changed successfully! User will need to verify the new email.');
      setShowEmailModal(false);
      setNewEmail('');
      loadUsers();
    } catch (error: any) {
      alert(`Failed to change email: ${error.message}`);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser || !currentAdmin || adminRole !== Role.SUPER_ADMIN) return;

    const confirmed = confirm(`Are you sure you want to permanently delete ${selectedUser.name}? This action cannot be undone.`);
    if (!confirmed) return;

    const success = await deleteUser(selectedUser.id, currentAdmin.uid, currentAdmin.email || 'Admin');
    if (success) {
      setShowDeleteModal(false);
      loadUsers();
    } else {
      alert('Failed to delete user. Please try again.');
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUser || !permissions.canSuspendUsers) return;

    const targetLevel = ROLE_HIERARCHY[selectedUser.role as Role] || 0;
    const adminLevel = ROLE_HIERARCHY[adminRole];
    
    if (adminLevel <= targetLevel) {
      alert('You cannot suspend users with equal or higher role level.');
      return;
    }
    
    await updateDoc(doc(db, 'users', selectedUser.id), {
      status: 'suspended',
      suspendReason,
      suspendedAt: new Date(),
      suspendedBy: currentAdmin?.uid
    });
    
    await logAction('suspend_user', selectedUser.id, { reason: suspendReason });
    
    await sendSystemNotification(selectedUser.id, 'Account Suspended', `Your account has been suspended. Reason: ${suspendReason}`, 'warning');
    
    setShowModal(false);
    setSuspendReason('');
    loadUsers();
  };

  const handleActivateUser = async (userId: string) => {
    await updateDoc(doc(db, 'users', userId), {
      status: 'active',
      suspendReason: null,
      activatedBy: currentAdmin?.uid,
      activatedAt: new Date()
    });
    
    await logAction('activate_user', userId, {});
    
    await sendSystemNotification(userId, 'Account Activated', 'Your account has been reactivated. You can now access all features.', 'success');
    
    loadUsers();
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    if (targetUser.role === newRole) return;

    if (!canChangeRole(adminRole, targetUser.role as Role, newRole as Role)) {
      alert(`You do not have permission to change this user's role to ${newRole}`);
      return;
    }

    const roleAction = ROLE_HIERARCHY[newRole as Role] > ROLE_HIERARCHY[targetUser.role as Role] ? 'promoted' : 'demoted';
    const confirmed = confirm(`Are you sure you want to change ${targetUser.name}'s role from ${targetUser.role} to ${newRole}?`);
    if (!confirmed) return;

    await updateDoc(doc(db, 'users', userId), {
      role: newRole,
      roleChangedBy: currentAdmin?.uid,
      roleChangedAt: new Date()
    });
    
    await logAction('change_role', userId, { oldRole: targetUser.role, newRole, action: roleAction });
    
    await sendSystemNotification(userId, 'Role Updated', `Your role has been ${roleAction} to ${newRole}.`, 'info');
    
    loadUsers();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-black text-gray-900 mb-8">User Management</h1>

        <div className="bg-white rounded-2xl p-6 shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search by name or email..."
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
              {adminRole === Role.SUPER_ADMIN && <option value="super_admin">Super Admin</option>}
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
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">User</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Role</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Mentor</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Free Access</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Status</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Joined</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeRole(user.id, e.target.value)}
                      className={`px-3 py-1 border-2 rounded-lg text-sm font-bold ${
                        user.role === 'super_admin' ? 'bg-purple-50 border-purple-300 text-purple-700' :
                        user.role === 'admin' ? 'bg-red-50 border-red-300 text-red-700' :
                        user.role === 'moderator' ? 'bg-blue-50 border-blue-300 text-blue-700' :
                        user.role === 'professional' ? 'bg-green-50 border-green-300 text-green-700' :
                        'bg-gray-50 border-gray-300 text-gray-700'
                      }`}
                      disabled={!permissions.canManageRoles || ROLE_HIERARCHY[adminRole] <= ROLE_HIERARCHY[user.role as Role]}
                    >
                      <option value="student">Student</option>
                      <option value="professional">Professional</option>
                      {permissions.maxRoleLevel >= 60 && <option value="moderator">Moderator</option>}
                      {permissions.maxRoleLevel >= 80 && <option value="admin">Admin</option>}
                      {permissions.maxRoleLevel >= 100 && <option value="super_admin">Super Admin</option>}
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!(user as any).isMentor || user.role === 'professional'}
                        disabled={user.role === 'professional' || !permissions.canManageMentors}
                        onChange={async (e) => {
                          await updateDoc(doc(db, 'users', user.id), { isMentor: e.target.checked });
                          loadUsers();
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-bold">{user.role === 'professional' ? 'Auto' : 'Toggle'}</span>
                    </label>
                  </td>
                  <td className="px-6 py-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!!(user as any).hasFreeAccess}
                        disabled={!permissions.canManageUsers}
                        onChange={async (e) => {
                          await updateDoc(doc(db, 'users', user.id), { 
                            hasFreeAccess: e.target.checked,
                            freeAccessGrantedBy: currentAdmin?.uid,
                            freeAccessGrantedAt: new Date()
                          });
                          await logAction('grant_free_access', user.id, { granted: e.target.checked });
                          loadUsers();
                        }}
                        className="w-4 h-4 rounded border-gray-300"
                      />
                      <span className="text-sm font-bold text-green-600">Free</span>
                    </label>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      user.status === 'active' ? 'bg-green-100 text-green-700' :
                      user.status === 'suspended' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {user.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      {user.status === 'active' ? (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowModal(true);
                          }}
                          disabled={!permissions.canSuspendUsers || ROLE_HIERARCHY[adminRole] <= ROLE_HIERARCHY[user.role as Role]}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-sm font-bold hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivateUser(user.id)}
                          disabled={!permissions.canSuspendUsers || ROLE_HIERARCHY[adminRole] <= ROLE_HIERARCHY[user.role as Role]}
                          className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm font-bold hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Activate
                        </button>
                      )}
                      {(adminRole === Role.ADMIN || adminRole === Role.SUPER_ADMIN) && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setNewEmail(user.email);
                            setShowEmailModal(true);
                          }}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-bold hover:bg-blue-200"
                        >
                          Change Email
                        </button>
                      )}
                      {adminRole === Role.SUPER_ADMIN && ROLE_HIERARCHY[adminRole] > (ROLE_HIERARCHY[user.role as Role] || 0) && (
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                          }}
                          className="px-3 py-1 bg-gray-800 text-white rounded-lg text-sm font-bold hover:bg-gray-900"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-black mb-4">Suspend User</h2>
            <p className="text-gray-600 mb-4">Suspending: {selectedUser?.name}</p>
            <textarea
              placeholder="Reason for suspension..."
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl mb-4 outline-none focus:border-red-500"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspendUser}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
              >
                Suspend
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-black mb-4 text-red-600">Delete User</h2>
            <p className="text-gray-600 mb-2">Are you sure you want to permanently delete:</p>
            <p className="font-bold text-gray-900 mb-4">{selectedUser?.name} ({selectedUser?.email})</p>
            <p className="text-sm text-red-600 mb-4">⚠️ This action cannot be undone. All user data will be permanently removed.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteUser}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-black mb-4">Change User Email</h2>
            <p className="text-gray-600 mb-2">User: {selectedUser?.name}</p>
            <p className="text-sm text-gray-500 mb-4">Current: {selectedUser?.email}</p>
            <input
              type="email"
              placeholder="New email address"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl mb-4 outline-none focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mb-4">⚠️ User will need to verify the new email address</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowEmailModal(false);
                  setNewEmail('');
                }}
                className="flex-1 px-4 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeEmail}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
              >
                Change Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
