# Unity Mentorship Hub - Admin Dashboard

## Overview
Comprehensive admin dashboard for managing all aspects of the Unity Mentorship Hub platform.

## Access
Navigate to `/admin` to access the admin dashboard (requires admin role).

## Features

### 1. User Management (`/admin/users`)
- **View All Users**: Complete list with search and filters
- **Search**: By name or email
- **Filter**: By role (Student/Mentor/Admin) and status (Active/Suspended/Pending)
- **Role Management**: Change user roles dynamically
- **Suspend/Activate Users**: With reason tracking
- **User Details**: Registration date, last active, status

### 2. Mentor Approval System (`/admin/mentor-approvals`)
- **Review Applications**: View pending mentor applications
- **Verify Credentials**: Check uploaded documents and credentials
- **Approve/Reject**: With admin notes
- **Application Details**: Expertise, experience, documents
- **Quality Control**: Ensures platform quality before mentors go live

### 3. Session Management (`/admin/sessions`)
- **View All Sessions**: Upcoming, completed, cancelled, no-shows
- **Filter Options**: By date, mentor, student, payment status
- **Force Cancel**: Admin override ability
- **Session Details**: Mentor, student, date/time, payment status
- **Export**: Export session data

### 4. Payment & Billing Management (`/admin/payments`)
- **Payment Overview**: Total revenue, platform commission, pending payments
- **Transaction Monitoring**: All transactions with status tracking
- **Refund Control**: Issue manual refunds
- **Payment Status**: Track completed, pending, failed, refunded
- **Revenue Analytics**: Real-time revenue tracking

### 5. Payout Management (`/admin/payouts`)
- **View Mentor Earnings**: Track all mentor payouts
- **Payout Status**: Pending, completed, failed
- **Mark as Paid**: Complete payout requests
- **Payment Methods**: Track payout methods
- **Export Reports**: Generate payout reports

### 6. Reports & Disputes (`/admin/reports`)
- **View Reports**: Mentor misconduct, student misconduct, payment issues, session issues
- **Review Details**: Reporter, reported user, reason, description
- **Resolve Disputes**: Add admin notes and resolution
- **Close Cases**: Mark as resolved or dismissed
- **Report History**: View all resolved reports

### 7. Analytics Dashboard (`/admin/analytics`)
- **User Metrics**: Total users, new users, active mentors
- **Session Stats**: Total sessions, completed sessions
- **Revenue Tracking**: Monthly revenue, growth rate
- **Conversion Rate**: Session completion rate
- **Popular Categories**: Most booked categories
- **Growth Trends**: Visual charts and graphs

### 8. Reviews & Ratings (`/admin/reviews`)
- **View All Reviews**: Complete review history
- **Delete Reviews**: Remove inappropriate or fake reviews
- **Rating Distribution**: Monitor rating patterns
- **Spam Detection**: Identify suspicious reviews

### 9. Category Management (`/admin/categories`)
- **Manage Categories**: Programming, Career, Business, etc.
- **Add/Remove**: Create new categories or remove old ones
- **Activate/Deactivate**: Toggle category availability
- **Category Details**: Name, description, icon

### 10. Platform Settings (`/admin/settings`)
- **Commission Rate**: Set platform commission percentage
- **Session Duration**: Default session length
- **Cancellation Window**: Hours before session
- **Feature Toggles**: Enable/disable AI features, templates, promotions
- **Category Management**: Add/remove mentor categories

### 11. Notification Management (`/admin/notifications`)
- **Send Announcements**: Broadcast to all users
- **Target Audience**: All users, students only, mentors only
- **Notification Types**: Announcement, alert, promotion, update
- **Quick Templates**: Pre-built notification templates
- **Email Campaigns**: Send targeted campaigns

### 12. Security & Logs (`/admin/security`)
- **Activity Logs**: Track all admin actions
- **Login History**: Monitor user logins
- **Failed Attempts**: Track failed login attempts
- **Suspicious Activity**: Detect unusual patterns
- **Audit Trail**: Complete history of changes
- **IP Tracking**: Monitor access locations

## Database Collections

### Required Firestore Collections:
```
users/
  - id, name, email, role, status, createdAt, lastActive

mentorApplications/
  - id, userId, name, email, expertise, credentials, experience, status, appliedAt, documents, adminNotes

sessions/
  - id, mentorId, mentorName, studentId, studentName, date, time, status, paymentStatus, amount, category

transactions/
  - id, userId, userName, amount, type, status, paymentMethod, createdAt, sessionId

payouts/
  - id, mentorId, mentorName, amount, status, requestedAt, completedAt, method

reports/
  - id, reporterId, reporterName, reportedUserId, reportedUserName, type, reason, description, status, createdAt, adminNotes

reviews/
  - id, mentorId, mentorName, studentId, studentName, rating, comment, createdAt

categories/
  - id, name, description, icon, active, createdAt

notifications/
  - id, title, message, targetAudience, type, createdAt, sentBy

securityLogs/
  - id, userId, userName, action, ipAddress, timestamp, status

settings/platform/
  - commissionRate, categories, sessionDuration, cancellationWindow, features
```

## Security Considerations

1. **Role-Based Access**: Only users with admin role can access admin routes
2. **Audit Logging**: All admin actions are logged
3. **IP Tracking**: Monitor access locations
4. **Secure Actions**: Confirmation dialogs for destructive actions
5. **Data Privacy**: PII handling compliance

## Usage

### Accessing Admin Dashboard:
```typescript
// Navigate to admin dashboard
navigate('/admin');

// Access specific sections
navigate('/admin/users');
navigate('/admin/mentor-approvals');
navigate('/admin/sessions');
// etc.
```

### Admin Role Check:
Ensure users have admin role in Firestore:
```javascript
{
  role: 'admin',
  status: 'active'
}
```

## Future Enhancements

1. **Advanced Analytics**: More detailed charts and insights
2. **Bulk Actions**: Perform actions on multiple items
3. **Export Functionality**: CSV/PDF exports for all data
4. **Email Integration**: Automated email notifications
5. **Coupon Management**: Create and manage discount codes
6. **Content Moderation**: AI-powered content filtering
7. **Real-time Updates**: WebSocket integration for live data
8. **Mobile Admin App**: Native mobile admin interface

## Support

For issues or questions about the admin dashboard, contact the development team.
