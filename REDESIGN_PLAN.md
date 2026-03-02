# Public Pages Redesign Plan

## Database Structure

### 1. User Stories Collection (`userStories`)
```typescript
{
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  userPhoto: string;
  title: string;
  story: string;
  category: 'academic' | 'career' | 'personal' | 'mentorship';
  likes: number;
  comments: Comment[];
  status: 'pending' | 'approved' | 'featured';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### 2. Resources Collection (`resources`)
```typescript
{
  id: string;
  title: string;
  description: string;
  category: 'financial' | 'academic' | 'career' | 'wellness' | 'dei';
  type: 'guide' | 'tool' | 'link' | 'document';
  url?: string;
  content?: string;
  tags: string[];
  featured: boolean;
  createdAt: Timestamp;
}
```

## Pages to Redesign

### 1. Landing Page (/)