import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, where, setDoc, getDoc } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { db } from '../../src/firebase';
import { useAuth } from '../../App';
import { Role, ROLE_HIERARCHY, canChangeRole, getPermissions } from '../../src/types/roles';
import { logAdminAction, sendSystemNotification, deleteUser } from '../../services/adminService';

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

interface BillingDiagnostics {
  userDoc: Record<string, any>;
  selectedSubscription: Record<string, any> | null;
  allSubscriptionsCount: number;
  paymentSummary: {
    totalPayments: number;
    succeededPayments: number;
    totalSpent: number;
    lastPaymentAtIso: string | null;
  };
  decision: {
    hasAccess: boolean;
    reasonCode: string;
    reason: string;
    plan: string;
    status: string;
    sessionsRemaining: number;
    cycleEndIso: string | null;
  };
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
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [adminRole, setAdminRole] = useState<Role>(Role.STUDENT);
  const [permissions, setPermissions] = useState(getPermissions(Role.STUDENT));
  const [noteText, setNoteText] = useState('');
  const [noteTags, setNoteTags] = useState('');
  const [notesSavingId, setNotesSavingId] = useState<string | null>(null);
  const [resyncingUserId, setResyncingUserId] = useState<string | null>(null);
  const [showDiagnosticsModal, setShowDiagnosticsModal] = useState(false);
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false);
  const [diagnosticsError, setDiagnosticsError] = useState('');
  const [diagnosticsData, setDiagnosticsData] = useState<BillingDiagnostics | null>(null);

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

    // Send email (best-effort)
    try {
      const sendEmail = httpsCallable(getFunctions(), 'sendNotificationEmail');
      await sendEmail({ userId: selectedUser.id, templateName: 'account_suspended', reason: suspendReason });
    } catch { /* non-critical */ }
    
    setShowModal(false);
    setSuspendReason('');
    loadUsers();
  };

  const handleSaveNotes = async () => {
    if (!selectedUser || !currentAdmin) return;
    setNotesSavingId(selectedUser.id);
    const tags = noteTags.split(',').map(t => t.trim()).filter(Boolean);
    await updateDoc(doc(db, 'users', selectedUser.id), {
      adminNotes: noteText.trim(),
      adminTags: tags,
      adminNotesUpdatedBy: currentAdmin.uid,
      adminNotesUpdatedAt: new Date(),
    });
    await logAction('add_admin_notes', selectedUser.id, { tags });
    setNotesSavingId(null);
    setShowNotesModal(false);
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

    // Send email (best-effort)
    try {
      const sendEmail = httpsCallable(getFunctions(), 'sendNotificationEmail');
      await sendEmail({ userId, templateName: 'account_reactivated' });
    } catch { /* non-critical */ }
    
    loadUsers();
  };

  const handleResyncSubscription = async (targetUser: User) => {
    if (!(adminRole === Role.ADMIN || adminRole === Role.SUPER_ADMIN)) return;

    try {
      setResyncingUserId(targetUser.id);
      const callable = httpsCallable(getFunctions(), 'adminResyncUserSubscription');
      const result = await callable({ userId: targetUser.id });
      await logAction('manual_resync_subscription', targetUser.id, result.data || {});
      alert(`Subscription resync completed for ${targetUser.name}.`);
      loadUsers();
    } catch (error: any) {
      alert(`Failed to resync subscription: ${error.message || 'Unknown error'}`);
    } finally {
      setResyncingUserId(null);
    }
  };

  const normalizePlan = (rawPlan: unknown): 'starter' | 'job-ready' | 'career-accelerator' => {
    switch (rawPlan) {
      case 'starter':
      case 'free':
        return 'starter';
      case 'job-ready':
      case 'basic':
        return 'job-ready';
      case 'career-accelerator':
      case 'premium':
        return 'career-accelerator';
      default:
        return 'starter';
    }
  };

  const toDate = (value: any): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value?.toDate === 'function') return value.toDate();
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDateTime = (value: any): string => {
    const asDate = toDate(value);
    if (!asDate) return 'N/A';
    return asDate.toLocaleString();
  };

  const rankStatus = (status: unknown): number => {
    const normalized = String(status || '').toLowerCase();
    if (normalized === 'active') return 0;
    if (normalized === 'trialing') return 1;
    if (normalized === 'past_due') return 2;
    if (normalized === 'incomplete') return 3;
    if (normalized === 'unpaid') return 4;
    if (normalized === 'canceled' || normalized === 'cancelled') return 5;
    return 6;
  };

  const evaluateAccess = (userData: Record<string, any>, subscription: Record<string, any> | null) => {
    const paidLikeStatuses = new Set(['active', 'trialing']);
    const blockedPaidStatuses = new Set(['past_due', 'incomplete', 'unpaid', 'canceled', 'cancelled', 'incomplete_expired']);
    const entitlement = userData?.entitlementSnapshot || null;
    const plan = normalizePlan(subscription?.tier || entitlement?.plan || userData?.subscriptionTier || userData?.subscriptionPlan);
    const statusRaw = subscription?.status || entitlement?.status || userData?.subscriptionStatus || 'active';
    const status = String(statusRaw).toLowerCase();
    const cycleEnd = toDate(subscription?.currentPeriodEnd || entitlement?.cycleEnd || userData?.subscriptionCurrentPeriodEnd);
    const sessionsPerMonth = Number(subscription?.sessionsPerMonth || entitlement?.sessionsPerMonth || userData?.sessionsPerMonth || 1);
    const sessionsRemaining = Number(
      subscription?.sessionsRemaining ??
      entitlement?.sessionsRemaining ??
      sessionsPerMonth
    );
    const billingSetupComplete = Boolean(
      userData?.billingSetupComplete ||
      userData?.paymentMethodOnFile ||
      userData?.stripeCustomerId ||
      subscription ||
      (plan !== 'starter' && paidLikeStatuses.has(status))
    );

    if (userData?.hasFreeAccess) {
      return { hasAccess: true, reasonCode: 'admin_override', reason: 'Access granted by admin override.' };
    }
    if (!billingSetupComplete) {
      return { hasAccess: false, reasonCode: 'billing_setup_missing', reason: 'Billing setup is missing.' };
    }
    if (plan === 'starter') {
      if (sessionsRemaining <= 0) {
        return { hasAccess: false, reasonCode: 'starter_quota_exhausted', reason: 'Starter quota exhausted.' };
      }
      return { hasAccess: true, reasonCode: 'starter_ok', reason: 'Starter user can book.' };
    }
    if (!paidLikeStatuses.has(status) && !subscription) {
      return { hasAccess: false, reasonCode: 'paid_subscription_not_active', reason: 'No active paid subscription detected.' };
    }
    if (blockedPaidStatuses.has(status)) {
      return { hasAccess: false, reasonCode: 'payment_attention_required', reason: 'Subscription payment needs attention.' };
    }
    if (cycleEnd && new Date() > cycleEnd) {
      return { hasAccess: false, reasonCode: 'cycle_expired', reason: 'Billing cycle is expired.' };
    }
    if (sessionsRemaining <= 0) {
      return { hasAccess: false, reasonCode: 'paid_quota_exhausted', reason: 'Paid plan quota exhausted for cycle.' };
    }
    return { hasAccess: true, reasonCode: 'paid_ok', reason: 'Paid plan access is valid.' };
  };

  const handleOpenDiagnostics = async (targetUser: User) => {
    setSelectedUser(targetUser);
    setShowDiagnosticsModal(true);
    setDiagnosticsLoading(true);
    setDiagnosticsError('');
    setDiagnosticsData(null);

    try {
      const userRef = doc(db, 'users', targetUser.id);
      const userSnapshot = await getDoc(userRef);
      const userData = (userSnapshot.data() || {}) as Record<string, any>;

      const subscriptionsSnapshot = await getDocs(
        query(
          collection(db, 'subscriptions'),
          where('userId', '==', targetUser.id),
          limit(20)
        )
      );

      const rankedSubscriptions = subscriptionsSnapshot.docs
        .map((subDoc) => ({ id: subDoc.id, ...(subDoc.data() as Record<string, any>) }))
        .sort((a, b) => {
          if (rankStatus(a.status) !== rankStatus(b.status)) {
            return rankStatus(a.status) - rankStatus(b.status);
          }
          const aUpdated = toDate(a.updatedAt)?.getTime() || 0;
          const bUpdated = toDate(b.updatedAt)?.getTime() || 0;
          return bUpdated - aUpdated;
        });

      const selectedSubscription = rankedSubscriptions.length > 0 ? rankedSubscriptions[0] : null;
      const decision = evaluateAccess(userData, selectedSubscription);

      const paymentsSnapshot = await getDocs(
        query(
          collection(db, 'payments'),
          where('userId', '==', targetUser.id),
          limit(200)
        )
      );

      const paymentRows = paymentsSnapshot.docs.map((paymentDoc) => paymentDoc.data() as Record<string, any>);
      const succeededPayments = paymentRows.filter((payment) => String(payment.status || '').toLowerCase() === 'succeeded');
      const totalSpent = succeededPayments.reduce((sum, payment) => sum + Number(payment.totalAmount || 0), 0);
      const lastPaymentDate = succeededPayments
        .map((payment) => toDate(payment.paidAt || payment.createdAt))
        .filter((date): date is Date => Boolean(date))
        .sort((a, b) => b.getTime() - a.getTime())[0] || null;

      setDiagnosticsData({
        userDoc: userData,
        selectedSubscription,
        allSubscriptionsCount: rankedSubscriptions.length,
        paymentSummary: {
          totalPayments: paymentRows.length,
          succeededPayments: succeededPayments.length,
          totalSpent,
          lastPaymentAtIso: lastPaymentDate?.toISOString() || null,
        },
        decision: {
          ...decision,
          plan: normalizePlan(selectedSubscription?.tier || userData?.entitlementSnapshot?.plan || userData?.subscriptionTier || userData?.subscriptionPlan),
          status: String(selectedSubscription?.status || userData?.entitlementSnapshot?.status || userData?.subscriptionStatus || 'unknown'),
          sessionsRemaining: Number(selectedSubscription?.sessionsRemaining ?? userData?.entitlementSnapshot?.sessionsRemaining ?? userData?.sessionsPerMonth ?? 0),
          cycleEndIso: toDate(selectedSubscription?.currentPeriodEnd || userData?.entitlementSnapshot?.cycleEnd || userData?.subscriptionCurrentPeriodEnd)?.toISOString() || null,
        },
      });
    } catch (error: any) {
      setDiagnosticsError(error?.message || 'Failed to load diagnostics');
    } finally {
      setDiagnosticsLoading(false);
    }
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

  const canActOnUser = (targetUser: User) => {
    return ROLE_HIERARCHY[adminRole] > (ROLE_HIERARCHY[targetUser.role as Role] || 0);
  };

  const renderActionButtons = (user: User, compact = false) => (
    <div className={`flex flex-wrap gap-2 ${compact ? '' : ''}`}>
      {user.status === 'active' ? (
        <button
          onClick={() => {
            setSelectedUser(user);
            setShowModal(true);
          }}
          disabled={!permissions.canSuspendUsers || !canActOnUser(user)}
          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs sm:text-sm font-bold hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Suspend
        </button>
      ) : (
        <button
          onClick={() => handleActivateUser(user.id)}
          disabled={!permissions.canSuspendUsers || !canActOnUser(user)}
          className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs sm:text-sm font-bold hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Activate
        </button>
      )}

      {(adminRole === Role.ADMIN || adminRole === Role.SUPER_ADMIN) && (
        <button
          onClick={() => handleResyncSubscription(user)}
          disabled={resyncingUserId === user.id}
          className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-lg text-xs sm:text-sm font-bold hover:bg-indigo-200 disabled:opacity-50"
        >
          {resyncingUserId === user.id ? 'Syncing...' : 'Re-sync Billing'}
        </button>
      )}

      {(adminRole === Role.ADMIN || adminRole === Role.SUPER_ADMIN) && (
        <button
          onClick={() => handleOpenDiagnostics(user)}
          className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs sm:text-sm font-bold hover:bg-purple-200"
        >
          Diagnostics
        </button>
      )}

      {(adminRole === Role.ADMIN || adminRole === Role.SUPER_ADMIN) && (
        <button
          onClick={() => {
            setSelectedUser(user);
            setNoteText((user as any).adminNotes || '');
            setNoteTags(((user as any).adminTags || []).join(', '));
            setShowNotesModal(true);
          }}
          className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs sm:text-sm font-bold hover:bg-yellow-200"
        >
          Notes
        </button>
      )}

      {(adminRole === Role.ADMIN || adminRole === Role.SUPER_ADMIN) && (
        <button
          onClick={() => {
            setSelectedUser(user);
            setNewEmail(user.email);
            setShowEmailModal(true);
          }}
          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs sm:text-sm font-bold hover:bg-blue-200"
        >
          Change Email
        </button>
      )}

      {adminRole === Role.SUPER_ADMIN && canActOnUser(user) && (
        <button
          onClick={() => {
            setSelectedUser(user);
            setShowDeleteModal(true);
          }}
          className="px-3 py-1 bg-gray-800 text-white rounded-lg text-xs sm:text-sm font-bold hover:bg-gray-900"
        >
          Delete
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8 space-y-2">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900">User Management</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage users, billing health, and support actions across all devices.</p>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
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
          <p className="mt-3 text-xs sm:text-sm text-gray-500">Showing {filteredUsers.length} users</p>
        </div>

        <div className="space-y-4 lg:hidden">
          {filteredUsers.length === 0 && (
            <div className="bg-white rounded-2xl p-6 text-center text-gray-500 shadow-lg">No users found.</div>
          )}

          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-2xl p-4 shadow-lg border border-gray-100 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-black text-gray-900 truncate">{user.name}</p>
                  <p className="text-sm text-gray-500 truncate">{user.email}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                  user.status === 'active' ? 'bg-green-100 text-green-700' :
                  user.status === 'suspended' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {user.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-bold text-gray-500 mb-1">Role</p>
                  <select
                    value={user.role}
                    onChange={(e) => handleChangeRole(user.id, e.target.value)}
                    className={`w-full px-3 py-2 border-2 rounded-lg text-sm font-bold ${
                      user.role === 'super_admin' ? 'bg-purple-50 border-purple-300 text-purple-700' :
                      user.role === 'admin' ? 'bg-red-50 border-red-300 text-red-700' :
                      user.role === 'moderator' ? 'bg-blue-50 border-blue-300 text-blue-700' :
                      user.role === 'professional' ? 'bg-green-50 border-green-300 text-green-700' :
                      'bg-gray-50 border-gray-300 text-gray-700'
                    }`}
                    disabled={!permissions.canManageRoles || !canActOnUser(user)}
                  >
                    <option value="student">Student</option>
                    <option value="professional">Professional</option>
                    {permissions.maxRoleLevel >= 60 && <option value="moderator">Moderator</option>}
                    {permissions.maxRoleLevel >= 80 && <option value="admin">Admin</option>}
                    {permissions.maxRoleLevel >= 100 && <option value="super_admin">Super Admin</option>}
                  </select>
                </div>

                <div className="text-sm text-gray-600">
                  <p className="text-xs font-bold text-gray-500 mb-1">Joined</p>
                  <p>{user.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2">
                  <span className="text-sm font-bold text-gray-700">Mentor</span>
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
                </label>

                <label className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2">
                  <span className="text-sm font-bold text-green-700">Free Access</span>
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
                </label>
              </div>

              {renderActionButtons(user, true)}
            </div>
          ))}
        </div>

        <div className="hidden lg:block bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
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
                    {renderActionButtons(user)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
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
      {showNotesModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-black mb-2">Admin Notes</h2>
            <p className="text-gray-600 mb-4">User: {selectedUser.name}</p>
            <textarea
              placeholder="Internal admin notes (not visible to user)..."
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl mb-4 outline-none focus:border-yellow-500"
              rows={5}
            />
            <input
              type="text"
              placeholder="Tags (comma-separated): vip, at-risk, flagged..."
              value={noteTags}
              onChange={(e) => setNoteTags(e.target.value)}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl mb-4 outline-none focus:border-yellow-500"
            />
            {noteTags && (
              <div className="flex flex-wrap gap-2 mb-4">
                {noteTags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                  <span key={tag} className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold">{tag}</span>
                ))}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setShowNotesModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNotes}
                disabled={notesSavingId === selectedUser.id}
                className="flex-1 px-4 py-3 bg-yellow-500 text-white rounded-xl font-bold hover:bg-yellow-600 disabled:opacity-50"
              >
                {notesSavingId === selectedUser.id ? 'Saving...' : 'Save Notes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDiagnosticsModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-2xl font-black">Billing Diagnostics</h2>
                <p className="text-gray-600">User: {selectedUser.name} ({selectedUser.email})</p>
              </div>
              <button
                onClick={() => setShowDiagnosticsModal(false)}
                className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 font-bold"
              >
                Close
              </button>
            </div>

            {diagnosticsLoading && <p className="text-sm text-gray-600">Loading diagnostics...</p>}
            {diagnosticsError && <p className="text-sm text-red-600 font-semibold">{diagnosticsError}</p>}

            {diagnosticsData && (
              <div className="space-y-4">
                <div className="rounded-xl border border-gray-200 p-4 bg-gray-50">
                  <h3 className="font-black text-gray-900 mb-2">Access Decision</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <p><span className="font-bold">Has Access:</span> {diagnosticsData.decision.hasAccess ? 'YES' : 'NO'}</p>
                    <p><span className="font-bold">Reason Code:</span> {diagnosticsData.decision.reasonCode}</p>
                    <p><span className="font-bold">Status:</span> {diagnosticsData.decision.status}</p>
                    <p><span className="font-bold">Plan:</span> {diagnosticsData.decision.plan}</p>
                    <p><span className="font-bold">Sessions Remaining:</span> {diagnosticsData.decision.sessionsRemaining}</p>
                    <p><span className="font-bold">Cycle End:</span> {diagnosticsData.decision.cycleEndIso ? new Date(diagnosticsData.decision.cycleEndIso).toLocaleString() : 'N/A'}</p>
                  </div>
                  <p className="mt-2 text-sm"><span className="font-bold">Reason:</span> {diagnosticsData.decision.reason}</p>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <h3 className="font-black text-gray-900 mb-2">User Billing Fields</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <p><span className="font-bold">subscriptionTier:</span> {String(diagnosticsData.userDoc.subscriptionTier || 'N/A')}</p>
                    <p><span className="font-bold">subscriptionPlan:</span> {String(diagnosticsData.userDoc.subscriptionPlan || 'N/A')}</p>
                    <p><span className="font-bold">subscriptionStatus:</span> {String(diagnosticsData.userDoc.subscriptionStatus || 'N/A')}</p>
                    <p><span className="font-bold">subscriptionMentorId:</span> {String(diagnosticsData.userDoc.subscriptionMentorId || 'N/A')}</p>
                    <p><span className="font-bold">sessionsPerMonth:</span> {String(diagnosticsData.userDoc.sessionsPerMonth ?? 'N/A')}</p>
                    <p><span className="font-bold">billingSetupComplete:</span> {String(Boolean(diagnosticsData.userDoc.billingSetupComplete))}</p>
                    <p><span className="font-bold">paymentMethodOnFile:</span> {String(Boolean(diagnosticsData.userDoc.paymentMethodOnFile))}</p>
                    <p><span className="font-bold">stripeCustomerId:</span> {String(diagnosticsData.userDoc.stripeCustomerId || 'N/A')}</p>
                    <p><span className="font-bold">subscriptionCurrentPeriodStart:</span> {formatDateTime(diagnosticsData.userDoc.subscriptionCurrentPeriodStart)}</p>
                    <p><span className="font-bold">subscriptionCurrentPeriodEnd:</span> {formatDateTime(diagnosticsData.userDoc.subscriptionCurrentPeriodEnd)}</p>
                    <p><span className="font-bold">entitlementSnapshot.status:</span> {String(diagnosticsData.userDoc.entitlementSnapshot?.status || 'N/A')}</p>
                    <p><span className="font-bold">entitlementSnapshot.reasonCode:</span> {String(diagnosticsData.userDoc.entitlementSnapshot?.reasonCode || 'N/A')}</p>
                    <p><span className="font-bold">totalSpent (calculated):</span> ${diagnosticsData.paymentSummary.totalSpent.toFixed(2)}</p>
                    <p><span className="font-bold">succeededPayments:</span> {diagnosticsData.paymentSummary.succeededPayments}</p>
                    <p><span className="font-bold">allPayments:</span> {diagnosticsData.paymentSummary.totalPayments}</p>
                    <p><span className="font-bold">lastPaymentAt:</span> {diagnosticsData.paymentSummary.lastPaymentAtIso ? new Date(diagnosticsData.paymentSummary.lastPaymentAtIso).toLocaleString() : 'N/A'}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-gray-200 p-4">
                  <h3 className="font-black text-gray-900 mb-2">Selected Subscription (best match)</h3>
                  <p className="text-sm mb-2"><span className="font-bold">Found subscriptions:</span> {diagnosticsData.allSubscriptionsCount}</p>
                  {diagnosticsData.selectedSubscription ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <p><span className="font-bold">id:</span> {String(diagnosticsData.selectedSubscription.id || 'N/A')}</p>
                      <p><span className="font-bold">status:</span> {String(diagnosticsData.selectedSubscription.status || 'N/A')}</p>
                      <p><span className="font-bold">tier:</span> {String(diagnosticsData.selectedSubscription.tier || 'N/A')}</p>
                      <p><span className="font-bold">mentorId:</span> {String(diagnosticsData.selectedSubscription.mentorId || 'N/A')}</p>
                      <p><span className="font-bold">sessionsPerMonth:</span> {String(diagnosticsData.selectedSubscription.sessionsPerMonth ?? 'N/A')}</p>
                      <p><span className="font-bold">sessionsRemaining:</span> {String(diagnosticsData.selectedSubscription.sessionsRemaining ?? 'N/A')}</p>
                      <p><span className="font-bold">currentPeriodStart:</span> {formatDateTime(diagnosticsData.selectedSubscription.currentPeriodStart)}</p>
                      <p><span className="font-bold">currentPeriodEnd:</span> {formatDateTime(diagnosticsData.selectedSubscription.currentPeriodEnd)}</p>
                      <p><span className="font-bold">updatedAt:</span> {formatDateTime(diagnosticsData.selectedSubscription.updatedAt)}</p>
                      <p><span className="font-bold">stripeSubscriptionId:</span> {String(diagnosticsData.selectedSubscription.stripeSubscriptionId || 'N/A')}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No subscription document found for this user.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
