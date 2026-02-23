# Support Ticket System & Enhanced Role Management

## Overview
Implemented comprehensive support ticket system with admin response capabilities, broadcast messaging, and expanded role-based access control with 10 distinct user roles.

## Features Implemented

### 1. Support Ticket System
**User Side:**
- `/help/contact` - Submit support tickets with categories (general, technical, billing, account, mentor, session, report)
- `/my-tickets` - View all submitted tickets and admin responses
- Real-time notifications when admin responds

**Admin Side:**
- `/admin/support` - Manage all support tickets
- View tickets by status (open, in_progress, resolved, closed)
- Respond to tickets with admin UID tracking
- Change ticket status
- Broadcast messages to all users

**Key Features:**
- All tickets stored in `supportTickets` collection with userId
- Admin responses tracked with adminId, adminName, message, timestamp
- Notifications sent to users when admin responds
- Support email = admin email (based on admin UID)

### 2. Broadcast Messaging
- Admins can send platform-wide announcements
- Messages sent as notifications to all users in the system
- Accessible from Support Tickets page

### 3. Enhanced Role System
**10 User Roles with Hierarchy:**
1. **Super Admin** (Level 100) - Full platform control, can assign any role
2. **Admin** (Level 80) - Can manage users and assign roles up to moderator
3. **Moderator** (Level 60) - Can manage mentors, sessions, reports, reviews
4. **Mentor** (Level 40) - Approved mentors
5. **Alumni** (Level 35) - Former students
6. **Professional** (Level 30) - Industry professionals
7. **International Student** (Level 25) - International students
8. **Domestic Student** (Level 22) - Domestic students
9. **Student** (Level 20) - General students
10. **Guest** (Level 10) - Limited access

**Role Management Rules:**
- Admins can only change roles of users with lower hierarchy levels
- Admins can only assign roles up to their maxRoleLevel
- Super Admin can assign any role including other admins
- Regular Admin can assign roles up to moderator
- All role changes tracked with admin UID

### 4. QuickChat Integration
**Fixed Issues:**
- Properly handles URL parameter `?user=userId` to open chat with specific user
- Integrated with existing messaging service
- Real-time online/offline status with green dot indicators
- Conversation persistence in Firestore

### 5. Admin Action Tracking
**All Admin Actions Logged:**
- Role changes (oldRole → newRole)
- User suspension/activation
- Support ticket responses
- Stored in `adminActions/{adminUid}_{timestamp}`
- Includes: adminId, adminEmail, action, targetUserId, details, timestamp

## File Structure

### New Files Created:
```
pages/
  ContactSupport.tsx          # User support ticket submission
  MyTickets.tsx              # User view of their tickets
  admin/
    SupportTickets.tsx       # Admin ticket management & broadcast

src/
  types/
    roles.ts                 # Role definitions and permissions
  hooks/
    usePermissions.ts        # Hook for role-based permissions
```

### Modified Files:
```
App.tsx                      # Added routes for support tickets
pages/
  QuickChat.tsx             # Fixed URL param handling
  admin/
    AdminDashboard.tsx      # Added support tickets link, role display
    UserManagement.tsx      # Enhanced with all role types
firestore.rules             # Updated with role hierarchy and support tickets
```

## Database Collections

### supportTickets
```javascript
{
  userId: string,
  userEmail: string,
  userName: string,
  subject: string,
  category: string,
  message: string,
  status: 'open' | 'in_progress' | 'resolved' | 'closed',
  createdAt: timestamp,
  updatedAt: timestamp,
  responses: [{
    adminId: string,
    adminName: string,
    message: string,
    timestamp: timestamp
  }]
}
```

### adminActions
```javascript
{
  adminId: string,
  adminEmail: string,
  action: string,
  targetUserId: string,
  details: object,
  timestamp: timestamp
}
```

## Firestore Security Rules

### Support Tickets:
- Users can read their own tickets
- Admins can read all tickets
- Users can create tickets
- Only admins can update tickets (respond)

### Role Hierarchy:
- getRoleLevel() function returns numeric level for each role
- canManageUser() checks if admin level > target user level
- Prevents lower-level admins from modifying higher-level users

## Usage Examples

### Admin Assigning Roles:
1. Navigate to `/admin/users`
2. Select user from list
3. Change role dropdown (only shows roles admin can assign)
4. Role change logged with admin UID
5. User receives notification

### User Submitting Support Ticket:
1. Navigate to `/help/contact`
2. Select category and fill form
3. Ticket created with user UID
4. Admin receives ticket in `/admin/support`
5. Admin responds
6. User receives notification and can view in `/my-tickets`

### Admin Broadcasting Message:
1. Navigate to `/admin/support`
2. Click "Broadcast Message"
3. Type announcement
4. Sends notification to all users

## Permission Matrix

| Role | Manage Users | Manage Roles | Suspend Users | Access Admin | Max Role Level |
|------|-------------|--------------|---------------|--------------|----------------|
| Super Admin | ✓ | ✓ | ✓ | ✓ | 100 |
| Admin | ✓ | ✓ | ✓ | ✓ | 80 |
| Moderator | ✗ | ✗ | ✗ | ✓ | 40 |
| All Others | ✗ | ✗ | ✗ | ✗ | 0 |

## Key Insights

1. **UID-Based Control**: All admin actions tied to admin UID for complete traceability
2. **Hierarchical Permissions**: Prevents privilege escalation attacks
3. **Flexible Role System**: 10 roles cover all user types (students, alumni, professionals)
4. **Integrated Support**: Support tickets directly linked to admin dashboard
5. **Broadcast Capability**: Platform-wide announcements to all users
6. **QuickChat Fixed**: Properly handles direct user messaging via URL params

## Next Steps

To deploy Firestore rules:
```bash
firebase deploy --only firestore:rules
```

To test:
1. Create test users with different roles
2. Test role assignment restrictions
3. Submit support tickets
4. Test admin responses
5. Test broadcast messaging
