# Unity Mentorship Hub - Quick Start Guide

## Prerequisites

- Node.js 18+ and npm
- Firebase project with Firestore, Auth, Storage, and Functions enabled
- Git

## Initial Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd unitymentor-hub
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env.local` and fill in your Firebase credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 3. Firebase Setup

Deploy Firestore security rules:
```bash
firebase deploy --only firestore:rules
```

Deploy Realtime Database rules:
```bash
firebase deploy --only database
```

Deploy Cloud Functions (if any):
```bash
firebase deploy --only functions
```

## Development

### Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
unitymentor-hub/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Theme, Language, Auth)
├── docs/              # Project documentation
├── functions/         # Firebase Cloud Functions
├── hooks/             # Custom React hooks
├── pages/             # Page components
│   ├── admin/        # Admin dashboard pages
│   ├── career/       # Career tools pages
│   ├── community/    # Community feature pages
│   ├── resources/    # Resource pages
│   └── support/      # Support pages
├── services/          # Business logic layer
├── src/              # Core application files
│   └── firebase.ts   # Firebase initialization
├── types.ts          # TypeScript type definitions
└── App.tsx           # Main application component
```

## Key Features

### User Roles
- **Student** - Default role, access to mentorship and resources
- **Professional** - Mentors, requires approval
- **Moderator** - Can moderate community content
- **Admin** - Full platform management access
- **Super Admin** - Highest level access

### Main Features
- User authentication and profiles
- Mentor-student matching
- Real-time chat messaging
- Session booking and management
- Career tools (resume builder, mock interviews)
- Community features (groups, feed, events)
- Admin dashboard
- Multi-language support (EN, FR, ES)
- Dark mode

## Common Tasks

### Creating a New Page

1. Create the page component in the appropriate folder:
   ```tsx
   // pages/career/NewCareerTool.tsx
   import React from 'react';
   
   const NewCareerTool: React.FC = () => {
     return <div>New Career Tool</div>;
   };
   
   export default NewCareerTool;
   ```

2. Add lazy import in `App.tsx`:
   ```tsx
   const NewCareerTool = lazy(() => import('./pages/career/NewCareerTool'));
   ```

3. Add route in `App.tsx`:
   ```tsx
   <Route path="/career/new-tool" element={<ProtectedLayout><NewCareerTool /></ProtectedLayout>} />
   ```

### Adding a New Service

1. Create service file in `services/`:
   ```typescript
   // services/myService.ts
   import { db } from '../src/firebase';
   import { errorService } from './errorService';
   
   export const myFunction = async () => {
     try {
       // Your logic here
     } catch (error) {
       errorService.handleError(error, 'myFunction');
       throw error;
     }
   };
   ```

2. Import and use in components:
   ```tsx
   import { myFunction } from '../services/myService';
   ```

### Handling Errors

Use the centralized error service:

```typescript
import { errorService } from '../services/errorService';

try {
  // Your code
} catch (error) {
  const appError = errorService.handleError(error, 'contextName');
  // Show error to user
  setErrorMessage(appError.message);
}
```

## Deployment

### Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

### Vercel

The project is configured for Vercel deployment. Connect your repository to Vercel and it will auto-deploy on push.

## Troubleshooting

### Build Errors

If you encounter TypeScript errors:
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Firebase Connection Issues

1. Verify `.env.local` has correct credentials
2. Check Firebase console for project status
3. Ensure Firestore and Auth are enabled

### Import Errors After Reorganization

If imports fail after the recent reorganization:
1. Check the new file locations in the project structure
2. Update import paths accordingly
3. Restart the dev server

## Security Notes

- Never commit `.env.local` to version control
- Keep Firebase security rules up to date
- Regularly review admin access logs
- Use environment variables for all sensitive data

## Performance Tips

- Pages are lazy-loaded automatically
- Use React.memo() for expensive components
- Implement pagination for large lists
- Monitor bundle size with `npm run build`

## Getting Help

- Check `docs/` folder for detailed documentation
- Review `PROJECT_IMPROVEMENTS.md` for recent changes
- Check Firebase console for backend issues
- Review browser console for client-side errors

## Next Steps

1. Set up your Firebase project
2. Configure environment variables
3. Deploy security rules
4. Create your first admin user
5. Start customizing the platform

For more detailed information, see the documentation in the `docs/` folder.
