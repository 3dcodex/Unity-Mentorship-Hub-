export interface UserStory {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  userPhoto?: string;
  title: string;
  story: string;
  category: 'academic' | 'career' | 'personal' | 'mentorship';
  likes: number;
  likedBy: string[];
  comments: StoryComment[];
  status: 'pending' | 'approved' | 'featured';
  createdAt: any;
  updatedAt: any;
}

export interface StoryComment {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  text: string;
  createdAt: any;
}
