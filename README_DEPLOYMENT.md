# ProfileSettings - Deployment & Setup Guide

## ✅ DEPLOYMENT STATUS: COMPLETE

**Live URL**: https://unity-mentorship-hub-ca76e.web.app

All systems deployed and operational:
- ✅ Firestore Rules
- ✅ Storage Rules  
- ✅ Hosting
- ✅ ProfileSettings Page

---

## 🚀 Quick Start

### Create Admin User
1. Sign up normally at the live URL
2. Go to [Firestore Console](https://console.firebase.google.com/project/unity-mentorship-hub-ca76e/firestore)
3. Find your user in `users` collection
4. Add field: `role: "admin"` or `role: "super_admin"`
5. Refresh app to see admin badge (👑 ⚡ 🛡️)

---

## 🎯 ProfileSettings Features

### Tabs
- **Account**: Name, email, phone, role-specific fields
- **Profile**: Bio, location, social links
- **Security**: Change password, delete account

### Functionality
- ✅ Profile photo upload (5MB max, images only)
- ✅ Password change (requires current password)
- ✅ Account deletion (requires password)
- ✅ Admin badge display
- ✅ Data persists to Firestore
- ✅ Loads signup data automatically

---

## 🔒 Security Rules

### Firestore
```
Users: Read (all), Write (own), Admin (all)
Mentor Apps: Read (own/admin), Write (admin)
```

### Storage
```
Profile Photos: 5MB limit, images only
Users: Upload to own folder only
Admins: Full access
```

---

## 📝 Role Hierarchy

| Role | Badge | Permissions |
|------|-------|-------------|
| Student/Professional | - | Basic user |
| Moderator | 🛡️ | Content management |
| Admin | ⚡ | User & app management |
| Super Admin | 👑 | Full system access |

---

## 🔗 Important Links

- **Live App**: https://unity-mentorship-hub-ca76e.web.app
- **Firebase Console**: https://console.firebase.google.com/project/unity-mentorship-hub-ca76e
- **Firestore**: https://console.firebase.google.com/project/unity-mentorship-hub-ca76e/firestore
- **Storage**: https://console.firebase.google.com/project/unity-mentorship-hub-ca76e/storage

---

## 🛠️ Redeploy Commands

```bash
# Build
npm run build

# Deploy everything
firebase deploy

# Deploy specific
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only storage
```

---

## ✨ Everything Works!

All ProfileSettings functionalities are operational and data persists correctly.
