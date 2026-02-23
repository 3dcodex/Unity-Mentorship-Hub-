# Dark Theme Implementation

## Overview
Implemented a comprehensive dark theme across the UnityMentor Hub application with a toggle button that appears only in appropriate locations.

## Theme Context
- **Location**: `contexts/ThemeContext.tsx`
- **Features**:
  - Persists theme preference to localStorage (`unity_theme`)
  - Respects system preference on first load
  - Applies `dark` class to document root
  - Provides `isDark` state and `toggleTheme` function

## Toggle Button Locations

### Authenticated Pages (Layout Component)
- **Location**: Header of `components/Layout.tsx`
- **Position**: Next to notification bell, before mobile menu and profile dropdown
- **Visibility**: Always visible for logged-in users
- **Icon**: Sun icon in dark mode, moon icon in light mode

### Public Pages (PublicHeader Component)
- **Location**: Header of `components/PublicHeader.tsx`
- **Position**: Before mobile menu and login/signup buttons
- **Visibility**: Always visible on public pages (Landing, About, Login, Signup, etc.)
- **Icon**: Sun icon in dark mode, moon icon in light mode

## Updated Pages

### Core Pages
1. **Dashboard** (`pages/Dashboard.tsx`)
   - Dark background for main container
   - Dark cards with proper borders
   - Dark text colors for headings and content
   - Dark input fields for search
   - Dark mentor cards

2. **Login** (`pages/Login.tsx`)
   - Dark background
   - Dark form inputs with proper focus states
   - Dark buttons with adjusted shadows
   - Dark dividers and text

3. **Signup** (`pages/Signup.tsx`)
   - Dark background
   - Dark progress bar
   - Dark role selection cards
   - Dark tag buttons for preferences
   - Dark form inputs

4. **Landing** (`pages/Landing.tsx`)
   - Already had dark mode support
   - Uses PublicHeader with theme toggle

### Components
1. **Layout** (`components/Layout.tsx`)
   - Dark header with backdrop blur
   - Dark sidebar
   - Dark navigation items
   - Theme toggle button in header

2. **PublicHeader** (`components/PublicHeader.tsx`)
   - Dark header with backdrop blur
   - Dark navigation links
   - Theme toggle button
   - Dark mobile menu

3. **Footer** (`components/Footer.tsx`)
   - Inherits dark mode from parent pages

## Global Styles
- **File**: `styles.css`
- **Updates**:
  - Added dark mode body styles
  - Added dark mode card styles
  - Added smooth transitions for theme changes

## Color Scheme

### Light Mode
- Background: `#f7f7fa` / `bg-gray-50`
- Cards: `#fff` / `bg-white`
- Text: `#111827` / `text-gray-900`
- Borders: `#e5e7eb` / `border-gray-100`
- Primary: `#1976d2` / `bg-primary`

### Dark Mode
- Background: `#0f172a` / `bg-slate-900`
- Cards: `#1e293b` / `bg-slate-800`
- Text: `#f1f5f9` / `text-gray-100`
- Borders: `#334155` / `border-gray-700`
- Primary: `#3b82f6` / `bg-blue-600`

## Tailwind Dark Mode Classes
All components use Tailwind's `dark:` prefix for dark mode styles:
- `dark:bg-slate-900` - Dark backgrounds
- `dark:text-white` - Dark text
- `dark:border-gray-700` - Dark borders
- `dark:hover:bg-gray-700` - Dark hover states
- `dark:focus:ring-blue-500/20` - Dark focus states

## Implementation Pattern
```tsx
// Example pattern used throughout
<div className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white border-gray-100 dark:border-gray-700">
  Content
</div>
```

## Toggle Button Implementation
```tsx
<button onClick={toggleTheme} className="size-10 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center justify-center" title="Toggle dark mode">
  {isDark ? (
    <span className="material-symbols-outlined">light_mode</span>
  ) : (
    <span className="material-symbols-outlined">dark_mode</span>
  )}
</button>
```

## User Experience
- Theme preference persists across sessions
- Smooth transitions between themes (0.3s)
- System preference respected on first visit
- Toggle button accessible and clearly labeled
- Consistent dark mode across all pages

## Future Enhancements
- Add dark mode to remaining pages (Career, Resources, Community, etc.)
- Add theme transition animations
- Add high contrast mode option
- Add custom color theme options
