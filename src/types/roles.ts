export enum Role {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  MENTOR = 'mentor',
  ALUMNI = 'alumni',
  PROFESSIONAL = 'professional',
  INTERNATIONAL_STUDENT = 'international_student',
  DOMESTIC_STUDENT = 'domestic_student',
  STUDENT = 'student',
  GUEST = 'guest'
}

export const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.SUPER_ADMIN]: 100,
  [Role.ADMIN]: 80,
  [Role.MODERATOR]: 60,
  [Role.MENTOR]: 40,
  [Role.ALUMNI]: 35,
  [Role.PROFESSIONAL]: 30,
  [Role.INTERNATIONAL_STUDENT]: 25,
  [Role.DOMESTIC_STUDENT]: 22,
  [Role.STUDENT]: 20,
  [Role.GUEST]: 10
};

export interface Permission {
  canManageUsers: boolean;
  canManageRoles: boolean;
  canManageMentors: boolean;
  canManageSessions: boolean;
  canManagePayments: boolean;
  canManagePayouts: boolean;
  canManageReports: boolean;
  canManageReviews: boolean;
  canManageCategories: boolean;
  canManageSettings: boolean;
  canViewAnalytics: boolean;
  canViewSecurityLogs: boolean;
  canSuspendUsers: boolean;
  canDeleteContent: boolean;
  canAccessAdminPanel: boolean;
  maxRoleLevel: number;
}

export const ROLE_PERMISSIONS: Record<Role, Permission> = {
  [Role.SUPER_ADMIN]: {
    canManageUsers: true,
    canManageRoles: true,
    canManageMentors: true,
    canManageSessions: true,
    canManagePayments: true,
    canManagePayouts: true,
    canManageReports: true,
    canManageReviews: true,
    canManageCategories: true,
    canManageSettings: true,
    canViewAnalytics: true,
    canViewSecurityLogs: true,
    canSuspendUsers: true,
    canDeleteContent: true,
    canAccessAdminPanel: true,
    maxRoleLevel: 100
  },
  [Role.ADMIN]: {
    canManageUsers: true,
    canManageRoles: true,
    canManageMentors: true,
    canManageSessions: true,
    canManagePayments: true,
    canManagePayouts: true,
    canManageReports: true,
    canManageReviews: true,
    canManageCategories: true,
    canManageSettings: false,
    canViewAnalytics: true,
    canViewSecurityLogs: true,
    canSuspendUsers: true,
    canDeleteContent: true,
    canAccessAdminPanel: true,
    maxRoleLevel: 80
  },
  [Role.MODERATOR]: {
    canManageUsers: false,
    canManageRoles: false,
    canManageMentors: true,
    canManageSessions: true,
    canManagePayments: false,
    canManagePayouts: false,
    canManageReports: true,
    canManageReviews: true,
    canManageCategories: false,
    canManageSettings: false,
    canViewAnalytics: false,
    canViewSecurityLogs: false,
    canSuspendUsers: false,
    canDeleteContent: true,
    canAccessAdminPanel: true,
    maxRoleLevel: 40
  },
  [Role.MENTOR]: {
    canManageUsers: false,
    canManageRoles: false,
    canManageMentors: false,
    canManageSessions: false,
    canManagePayments: false,
    canManagePayouts: false,
    canManageReports: false,
    canManageReviews: false,
    canManageCategories: false,
    canManageSettings: false,
    canViewAnalytics: false,
    canViewSecurityLogs: false,
    canSuspendUsers: false,
    canDeleteContent: false,
    canAccessAdminPanel: false,
    maxRoleLevel: 0
  },
  [Role.ALUMNI]: {
    canManageUsers: false,
    canManageRoles: false,
    canManageMentors: false,
    canManageSessions: false,
    canManagePayments: false,
    canManagePayouts: false,
    canManageReports: false,
    canManageReviews: false,
    canManageCategories: false,
    canManageSettings: false,
    canViewAnalytics: false,
    canViewSecurityLogs: false,
    canSuspendUsers: false,
    canDeleteContent: false,
    canAccessAdminPanel: false,
    maxRoleLevel: 0
  },
  [Role.PROFESSIONAL]: {
    canManageUsers: false,
    canManageRoles: false,
    canManageMentors: false,
    canManageSessions: false,
    canManagePayments: false,
    canManagePayouts: false,
    canManageReports: false,
    canManageReviews: false,
    canManageCategories: false,
    canManageSettings: false,
    canViewAnalytics: false,
    canViewSecurityLogs: false,
    canSuspendUsers: false,
    canDeleteContent: false,
    canAccessAdminPanel: false,
    maxRoleLevel: 0
  },
  [Role.INTERNATIONAL_STUDENT]: {
    canManageUsers: false,
    canManageRoles: false,
    canManageMentors: false,
    canManageSessions: false,
    canManagePayments: false,
    canManagePayouts: false,
    canManageReports: false,
    canManageReviews: false,
    canManageCategories: false,
    canManageSettings: false,
    canViewAnalytics: false,
    canViewSecurityLogs: false,
    canSuspendUsers: false,
    canDeleteContent: false,
    canAccessAdminPanel: false,
    maxRoleLevel: 0
  },
  [Role.DOMESTIC_STUDENT]: {
    canManageUsers: false,
    canManageRoles: false,
    canManageMentors: false,
    canManageSessions: false,
    canManagePayments: false,
    canManagePayouts: false,
    canManageReports: false,
    canManageReviews: false,
    canManageCategories: false,
    canManageSettings: false,
    canViewAnalytics: false,
    canViewSecurityLogs: false,
    canSuspendUsers: false,
    canDeleteContent: false,
    canAccessAdminPanel: false,
    maxRoleLevel: 0
  },
  [Role.STUDENT]: {
    canManageUsers: false,
    canManageRoles: false,
    canManageMentors: false,
    canManageSessions: false,
    canManagePayments: false,
    canManagePayouts: false,
    canManageReports: false,
    canManageReviews: false,
    canManageCategories: false,
    canManageSettings: false,
    canViewAnalytics: false,
    canViewSecurityLogs: false,
    canSuspendUsers: false,
    canDeleteContent: false,
    canAccessAdminPanel: false,
    maxRoleLevel: 0
  },
  [Role.GUEST]: {
    canManageUsers: false,
    canManageRoles: false,
    canManageMentors: false,
    canManageSessions: false,
    canManagePayments: false,
    canManagePayouts: false,
    canManageReports: false,
    canManageReviews: false,
    canManageCategories: false,
    canManageSettings: false,
    canViewAnalytics: false,
    canViewSecurityLogs: false,
    canSuspendUsers: false,
    canDeleteContent: false,
    canAccessAdminPanel: false,
    maxRoleLevel: 0
  }
};

export const canChangeRole = (adminRole: Role, targetRole: Role, newRole: Role): boolean => {
  const adminLevel = ROLE_HIERARCHY[adminRole];
  const targetLevel = ROLE_HIERARCHY[targetRole];
  const newLevel = ROLE_HIERARCHY[newRole];
  const adminPermissions = ROLE_PERMISSIONS[adminRole];
  
  return adminPermissions.canManageRoles && 
         adminLevel > targetLevel && 
         newLevel <= adminPermissions.maxRoleLevel;
};

export const getPermissions = (role: Role): Permission => {
  return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS[Role.GUEST];
};
