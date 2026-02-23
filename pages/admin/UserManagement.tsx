import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../../src/firebase';
import { useAuth } from '../../App';
import { Role, ROLE_HIERARCHY, canChangeRole, getPermissions } from '../../src/types/roles';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: any;
  lastActive: any;
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
  const [suspendReason, setSuspendReason] = useState('');
  const [adminRole, setAdminRole] = useState<Role>(Role.GUEST);
  const [permissions, setPermissions] = useState(getPermissions(Role.GUEST));

  const logAdminAction = async (action: string, targetUserId: string, details: any) => {
    if (!currentAdmin) return;
    await setDoc(doc(db, 'adminActions', `${currentAdmin.uid}_${Date.now()}`), {
      adminId: currentAdmin.uid,
      adminEmail: currentAdmin.email,
      action,
      targetUserId,
      details,
      timestamp: new Date()
    });
  };

  useEffect(() => {
    loadAdminRole();
    loadUsers();
  }, []);

  const loadAdminRole = async () => {
    if (!currentAdmin) return;
    const userDoc = await getDoc(doc(db, 'users', currentAdmin.uid));
    const role = (userDoc.data()?.role || 'guest') as Role;
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
    
    await logAdminAction('suspend_user', selectedUser.id, { reason: suspendReason });
    
    await setDoc(doc(db, 'notifications', `${selectedUser.id}_${Date.now()}`), {
      userId: selectedUser.id,
      type: 'account_suspended',
      title: 'Account Suspended',
      message: `Your account has been suspended. Reason: ${suspendReason}`,
      read: false,
      createdAt: new Date()
    });
    
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
    
    await logAdminAction('activate_user', userId, {});
    
    // Send notification to user
    await setDoc(doc(db, 'notifications', `${userId}_${Date.now()}`), {
      userId,
      type: 'account_activated',
      title: 'Account Activated',
      message: 'Your account has been reactivated. You can now access all features.',
      read: false,
      createdAt: new Date()
    });
    
    loadUsers();
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    if (!canChangeRole(adminRole, targetUser.role as Role, newRole as Role)) {
      alert('You do not have permission to change this user\'s role to ' + newRole);
      return;
    }

    await updateDoc(doc(db, 'users', userId), {
      role: newRole,
      roleChangedBy: currentAdmin?.uid,
      roleChangedAt: new Date()
    });
    
    await logAdminAction('change_role', userId, { oldRole: targetUser.role, newRole });
    
    await setDoc(doc(db, 'notifications', `${userId}_${Date.now()}`), {
      userId,
      type: 'role_changed',
      title: 'Role Updated',
      message: `Your role has been updated to ${newRole}.`,
      read: false,
      createdAt: new Date()
    });
    
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
              <option value="guest">Guest</option>
              <option value="student">Student</option>
              <option value="domestic_student">Domestic Student</option>
              <option value="international_student">International Student</option>
              <option value="professional">Professional</option>
              <option value="alumni">Alumni</option>
              <option value="mentor">Mentor</option>
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
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">User</th>
                <th className="px-6 py-4 text-left text-sm font-black text-gray-900">Role</th>
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
                      className="px-3 py-1 border-2 border-gray-200 rounded-lg text-sm font-bold"
                      disabled={!permissions.canManageRoles || ROLE_HIERARCHY[adminRole] <= ROLE_HIERARCHY[user.role as Role]}
                    >
                      <option value="guest">Guest</option>
                      <option value="student">Student</option>
                      <option value="domestic_student">Domestic Student</option>
                      <option value="international_student">International Student</option>
                      <option value="professional">Professional</option>
                      <option value="alumni">Alumni</option>
                      <option value="mentor">Mentor</option>
                      {permissions.maxRoleLevel >= 60 && <option value="moderator">Moderator</option>}
                      {permissions.maxRoleLevel >= 80 && <option value="admin">Admin</option>}
                      {permissions.maxRoleLevel >= 100 && <option value="super_admin">Super Admin</option>}
                    </select>
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
    </div>
  );
};

export default UserManagement;
